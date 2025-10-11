#!/bin/bash

# =============================================
# SCRIPT DE HEALTH CHECK AUTOMATIZADO
# Para usar com cron ou monitoramento externo
# =============================================

# Configurações
BASE_DIR="$HOME/evolution-saas"
LOG_FILE="$BASE_DIR/logs/healthcheck.log"
ALERT_EMAIL="${ALERT_EMAIL:-}"
WEBHOOK_ALERT="${WEBHOOK_ALERT:-}"

# Status codes
STATUS_OK=0
STATUS_WARNING=1
STATUS_CRITICAL=2

# Timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# =============================================
# FUNÇÕES
# =============================================

log_message() {
    echo "[$TIMESTAMP] $1" >> "$LOG_FILE"
}

send_alert() {
    local severity=$1
    local message=$2
    
    # Log
    log_message "[$severity] $message"
    
    # Email (se configurado)
    if [ -n "$ALERT_EMAIL" ]; then
        echo "$message" | mail -s "[$severity] SaaS WhatsApp Alert" "$ALERT_EMAIL" 2>/dev/null
    fi
    
    # Webhook (se configurado - ex: Slack, Discord)
    if [ -n "$WEBHOOK_ALERT" ]; then
        curl -X POST "$WEBHOOK_ALERT" \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"[$severity] $message\"}" \
            2>/dev/null
    fi
}

check_container_running() {
    local container=$1
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        return 0
    else
        return 1
    fi
}

check_container_health() {
    local container=$1
    local health=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null)
    
    if [ "$health" == "healthy" ]; then
        return 0
    elif [ -z "$health" ]; then
        # Container sem healthcheck configurado
        return 0
    else
        return 1
    fi
}

check_port_open() {
    local port=$1
    if nc -z localhost $port 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

check_memory_usage() {
    local threshold=85
    local usage=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
    
    if [ "$usage" -gt "$threshold" ]; then
        return 1
    else
        return 0
    fi
}

check_disk_usage() {
    local threshold=85
    local usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    if [ "$usage" -gt "$threshold" ]; then
        return 1
    else
        return 0
    fi
}

# =============================================
# CHECKS
# =============================================

# Criar diretório de logs
mkdir -p "$(dirname "$LOG_FILE")"

# Status geral
OVERALL_STATUS=$STATUS_OK
ISSUES=""

# Check 1: Evolution API Container
if ! check_container_running "evolution_api"; then
    OVERALL_STATUS=$STATUS_CRITICAL
    ISSUES="$ISSUES\n- Evolution API não está rodando"
    send_alert "CRITICAL" "Evolution API container parado!"
elif ! check_container_health "evolution_api"; then
    OVERALL_STATUS=$STATUS_WARNING
    ISSUES="$ISSUES\n- Evolution API unhealthy"
    send_alert "WARNING" "Evolution API container unhealthy"
fi

# Check 2: N8N Container
if ! check_container_running "n8n_automation" && ! check_container_running "n8n"; then
    OVERALL_STATUS=$STATUS_CRITICAL
    ISSUES="$ISSUES\n- N8N não está rodando"
    send_alert "CRITICAL" "N8N container parado!"
elif ! check_container_health "n8n_automation" && ! check_container_health "n8n"; then
    OVERALL_STATUS=$STATUS_WARNING
    ISSUES="$ISSUES\n- N8N unhealthy"
    send_alert "WARNING" "N8N container unhealthy"
fi

# Check 3: Portas abertas
if ! check_port_open 8080; then
    OVERALL_STATUS=$STATUS_CRITICAL
    ISSUES="$ISSUES\n- Porta 8080 (Evolution) não está respondendo"
    send_alert "CRITICAL" "Evolution API porta 8080 não responde!"
fi

if ! check_port_open 5678; then
    OVERALL_STATUS=$STATUS_CRITICAL
    ISSUES="$ISSUES\n- Porta 5678 (N8N) não está respondendo"
    send_alert "CRITICAL" "N8N porta 5678 não responde!"
fi

# Check 4: Uso de memória
if ! check_memory_usage; then
    OVERALL_STATUS=$STATUS_WARNING
    MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
    ISSUES="$ISSUES\n- Uso de memória alto: ${MEMORY_USAGE}%"
    send_alert "WARNING" "Uso de memória alto: ${MEMORY_USAGE}%"
fi

# Check 5: Uso de disco
if ! check_disk_usage; then
    OVERALL_STATUS=$STATUS_WARNING
    DISK_USAGE=$(df / | tail -1 | awk '{print $5}')
    ISSUES="$ISSUES\n- Uso de disco alto: ${DISK_USAGE}"
    send_alert "WARNING" "Uso de disco alto: ${DISK_USAGE}"
fi

# Check 6: Internet
if ! ping -c 1 google.com &> /dev/null; then
    OVERALL_STATUS=$STATUS_CRITICAL
    ISSUES="$ISSUES\n- Sem conexão com internet"
    send_alert "CRITICAL" "Servidor sem conexão com internet!"
fi

# =============================================
# RESULTADO
# =============================================

if [ $OVERALL_STATUS -eq $STATUS_OK ]; then
    log_message "[OK] Todos os serviços estão funcionando normalmente"
    echo "OK: All services healthy"
    exit 0
elif [ $OVERALL_STATUS -eq $STATUS_WARNING ]; then
    log_message "[WARNING] Problemas detectados:$ISSUES"
    echo "WARNING: Issues detected"
    echo -e "$ISSUES"
    exit 1
else
    log_message "[CRITICAL] Falhas críticas detectadas:$ISSUES"
    echo "CRITICAL: Service failures detected"
    echo -e "$ISSUES"
    
    # Tentar reiniciar automaticamente (se configurado)
    if [ "${AUTO_RESTART:-false}" == "true" ]; then
        log_message "[AUTO-RESTART] Tentando reiniciar serviços..."
        cd "$BASE_DIR"
        docker-compose restart
        sleep 30
        
        # Verificar novamente
        if check_container_running "evolution_api" && check_container_running "n8n"; then
            log_message "[AUTO-RESTART] Serviços reiniciados com sucesso"
            send_alert "INFO" "Serviços reiniciados automaticamente após falha"
            exit 0
        else
            log_message "[AUTO-RESTART] Falha ao reiniciar serviços"
            send_alert "CRITICAL" "Falha ao reiniciar serviços automaticamente!"
        fi
    fi
    
    exit 2
fi

