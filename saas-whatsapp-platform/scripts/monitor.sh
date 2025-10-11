#!/bin/bash

# =============================================
# SCRIPT DE MONITORAMENTO
# Plataforma SaaS WhatsApp - GCP Free Tier
# =============================================

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Diretório base
BASE_DIR="$HOME/evolution-saas"
LOG_DIR="$BASE_DIR/logs"
mkdir -p "$LOG_DIR"

# Data e hora
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DATE=$(date '+%Y%m%d')

# =============================================
# FUNÇÕES
# =============================================

# Banner
print_banner() {
    echo ""
    echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║    MONITOR - SaaS WhatsApp Platform    ║${NC}"
    echo -e "${CYAN}║         $(date '+%Y-%m-%d %H:%M:%S')          ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
    echo ""
}

# Verificar se container está rodando
check_container() {
    local container=$1
    if docker ps --format '{{.Names}}' | grep -q "^${container}$"; then
        return 0
    else
        return 1
    fi
}

# Verificar health do container
check_health() {
    local container=$1
    local health=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null)
    
    if [ "$health" == "healthy" ]; then
        return 0
    else
        return 1
    fi
}

# Verificar uso de recursos
check_resources() {
    echo -e "${YELLOW}📊 USO DE RECURSOS${NC}"
    echo ""
    
    # Memória
    echo -e "${BLUE}Memória:${NC}"
    free -h | grep -E 'Mem|Swap' | awk '{printf "  %-10s %10s / %10s (%s usado)\n", $1, $3, $2, ($3/$2*100)}'
    echo ""
    
    # Disco
    echo -e "${BLUE}Disco:${NC}"
    df -h / | tail -1 | awk '{printf "  Usado: %s / %s (%s)\n", $3, $2, $5}'
    echo ""
    
    # Containers
    echo -e "${BLUE}Containers:${NC}"
    docker stats --no-stream --format "  {{.Name}}: CPU {{.CPUPerc}} | RAM {{.MemUsage}}" | head -2
    echo ""
}

# Verificar conexão de rede
check_network() {
    echo -e "${YELLOW}🌐 CONECTIVIDADE${NC}"
    echo ""
    
    # Internet
    if ping -c 1 google.com &> /dev/null; then
        echo -e "  ${GREEN}✓${NC} Internet: OK"
    else
        echo -e "  ${RED}✗${NC} Internet: FALHA"
        return 1
    fi
    
    # Evolution API
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200\|401"; then
        echo -e "  ${GREEN}✓${NC} Evolution API (8080): OK"
    else
        echo -e "  ${RED}✗${NC} Evolution API (8080): FALHA"
        return 1
    fi
    
    # N8N
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:5678 | grep -q "200\|401"; then
        echo -e "  ${GREEN}✓${NC} N8N (5678): OK"
    else
        echo -e "  ${RED}✗${NC} N8N (5678): FALHA"
        return 1
    fi
    
    echo ""
    return 0
}

# Verificar logs de erro
check_errors() {
    echo -e "${YELLOW}⚠️  ERROS RECENTES (últimas 24h)${NC}"
    echo ""
    
    # Evolution API errors
    local evolution_errors=$(docker logs evolution_api --since 24h 2>&1 | grep -i "error\|fatal\|exception" | wc -l)
    if [ "$evolution_errors" -gt 10 ]; then
        echo -e "  ${RED}⚠${NC}  Evolution API: $evolution_errors erros"
    else
        echo -e "  ${GREEN}✓${NC} Evolution API: $evolution_errors erros"
    fi
    
    # N8N errors
    local n8n_errors=$(docker logs n8n_automation --since 24h 2>&1 | grep -i "error\|fatal\|exception" | wc -l)
    if [ "$n8n_errors" -gt 10 ]; then
        echo -e "  ${RED}⚠${NC}  N8N: $n8n_errors erros"
    else
        echo -e "  ${GREEN}✓${NC} N8N: $n8n_errors erros"
    fi
    
    echo ""
}

# Gerar relatório completo
generate_report() {
    local report_file="$LOG_DIR/health-report-${DATE}.log"
    
    {
        echo "========================================"
        echo "RELATÓRIO DE SAÚDE DO SISTEMA"
        echo "Data: $TIMESTAMP"
        echo "========================================"
        echo ""
        
        echo "CONTAINERS:"
        docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
        echo ""
        
        echo "RECURSOS:"
        echo "Memória:"
        free -h
        echo ""
        echo "Disco:"
        df -h
        echo ""
        echo "Containers:"
        docker stats --no-stream
        echo ""
        
        echo "CONECTIVIDADE:"
        echo "Internet: $(ping -c 1 google.com &> /dev/null && echo 'OK' || echo 'FALHA')"
        echo "Evolution API: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)"
        echo "N8N: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:5678)"
        echo ""
        
        echo "ERROS (últimas 24h):"
        echo "Evolution API:"
        docker logs evolution_api --since 24h 2>&1 | grep -i "error\|fatal\|exception" | tail -5
        echo ""
        echo "N8N:"
        docker logs n8n_automation --since 24h 2>&1 | grep -i "error\|fatal\|exception" | tail -5
        echo ""
        
    } > "$report_file"
    
    echo -e "${GREEN}✓${NC} Relatório salvo: $report_file"
}

# =============================================
# MAIN
# =============================================

# Verificar se está no diretório correto
if [ ! -d "$BASE_DIR" ]; then
    echo -e "${RED}Erro: Diretório $BASE_DIR não encontrado${NC}"
    exit 1
fi

cd "$BASE_DIR"

# Banner
print_banner

# Status dos containers
echo -e "${YELLOW}🐳 STATUS DOS CONTAINERS${NC}"
echo ""

if check_container "evolution_api"; then
    if check_health "evolution_api"; then
        echo -e "  ${GREEN}✓${NC} Evolution API: ${GREEN}Running & Healthy${NC}"
    else
        echo -e "  ${YELLOW}⚠${NC}  Evolution API: ${YELLOW}Running (Unhealthy)${NC}"
    fi
else
    echo -e "  ${RED}✗${NC} Evolution API: ${RED}Stopped${NC}"
fi

if check_container "n8n_automation" || check_container "n8n"; then
    container_name=$(check_container "n8n_automation" && echo "n8n_automation" || echo "n8n")
    if check_health "$container_name"; then
        echo -e "  ${GREEN}✓${NC} N8N: ${GREEN}Running & Healthy${NC}"
    else
        echo -e "  ${YELLOW}⚠${NC}  N8N: ${YELLOW}Running (Unhealthy)${NC}"
    fi
else
    echo -e "  ${RED}✗${NC} N8N: ${RED}Stopped${NC}"
fi

echo ""

# Recursos
check_resources

# Conectividade
check_network
network_status=$?

# Erros
check_errors

# Gerar relatório
if [ "$1" == "--report" ]; then
    generate_report
fi

# Verificar se precisa reiniciar
if [ $network_status -ne 0 ]; then
    echo -e "${YELLOW}⚠️  ATENÇÃO: Problemas de conectividade detectados${NC}"
    echo ""
    read -p "Deseja reiniciar os serviços? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo ""
        echo -e "${CYAN}Reiniciando serviços...${NC}"
        docker-compose restart
        sleep 10
        echo -e "${GREEN}✓${NC} Serviços reiniciados"
        echo ""
        echo "Execute o monitor novamente para verificar:"
        echo "./scripts/monitor.sh"
    fi
fi

# Alerta de recursos
RAM_PERCENT=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100}')
if [ "$RAM_PERCENT" -gt 85 ]; then
    echo -e "${RED}⚠️  ALERTA: Uso de RAM acima de 85% ($RAM_PERCENT%)${NC}"
    echo "   Considere reiniciar os containers ou fazer upgrade"
    echo ""
fi

DISK_PERCENT=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_PERCENT" -gt 85 ]; then
    echo -e "${RED}⚠️  ALERTA: Disco acima de 85% ($DISK_PERCENT%)${NC}"
    echo "   Execute: docker system prune -a"
    echo ""
fi

# Footer
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${CYAN} Monitoramento completo!${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""
echo "Comandos úteis:"
echo -e "  ${GREEN}./scripts/monitor.sh --report${NC}  - Gerar relatório completo"
echo -e "  ${GREEN}./scripts/logs.sh evolution${NC}    - Ver logs Evolution"
echo -e "  ${GREEN}./scripts/logs.sh n8n${NC}          - Ver logs N8N"
echo -e "  ${GREEN}./scripts/restart.sh${NC}           - Reiniciar serviços"
echo ""

