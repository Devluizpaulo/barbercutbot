#!/bin/bash

# =============================================
# SCRIPT DE DEPLOY GRATUITO NO GCP
# Free Tier: e2-micro (1GB RAM) em us-west1
# Custo: R$ 0,00/mês
# =============================================

set -e

echo ""
echo "🆓 ========================================"
echo "🆓   DEPLOY GRATUITO NO GOOGLE CLOUD"
echo "🆓   Free Tier Forever - e2-micro"
echo "🆓 ========================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variáveis do Free Tier
PROJECT_ID="studio-343774762-16da7"
INSTANCE_NAME="evolution-api-free"
ZONE="us-west1-b"
REGION="us-west1"
MACHINE_TYPE="e2-micro"  # FREE TIER!
DISK_SIZE="30GB"
DISK_TYPE="pd-standard"  # FREE TIER (não SSD)

# Funções de log
log() {
    echo -e "${GREEN}[✓]${NC} $1"
}

info() {
    echo -e "${CYAN}[ℹ]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

error() {
    echo -e "${RED}[✗]${NC} $1"
    exit 1
}

# =============================================
# 1. VERIFICAR GCLOUD
# =============================================

info "Verificando gcloud CLI..."

if ! command -v gcloud &> /dev/null; then
    error "gcloud CLI não encontrado. Instale: https://cloud.google.com/sdk/docs/install"
fi

log "gcloud CLI encontrado"

# Configurar projeto
gcloud config set project $PROJECT_ID
log "Projeto configurado: $PROJECT_ID"

# =============================================
# 2. VERIFICAR/CRIAR VM
# =============================================

info "Verificando VM..."

if gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE &> /dev/null; then
    warn "VM $INSTANCE_NAME já existe"
    echo ""
    read -p "Deseja recriá-la? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        info "Deletando VM existente..."
        gcloud compute instances delete $INSTANCE_NAME --zone=$ZONE --quiet
        log "VM deletada"
    else
        info "Mantendo VM existente"
        SKIP_VM=true
    fi
fi

if [[ ! $SKIP_VM ]]; then
    info "Criando VM FREE TIER (e2-micro)..."
    echo ""
    warn "💰 Esta VM é GRATUITA para sempre!"
    warn "📍 Região: us-west1 (Oregon) - única região gratuita"
    echo ""
    
    gcloud compute instances create $INSTANCE_NAME \
        --project=$PROJECT_ID \
        --zone=$ZONE \
        --machine-type=$MACHINE_TYPE \
        --network-interface=network-tier=PREMIUM,stack-type=IPV4_ONLY,subnet=default \
        --maintenance-policy=MIGRATE \
        --provisioning-model=STANDARD \
        --scopes=https://www.googleapis.com/auth/devstorage.read_only,https://www.googleapis.com/auth/logging.write,https://www.googleapis.com/auth/monitoring.write,https://www.googleapis.com/auth/servicecontrol,https://www.googleapis.com/auth/service.management.readonly,https://www.googleapis.com/auth/trace.append \
        --tags=http-server,https-server \
        --create-disk=auto-delete=yes,boot=yes,device-name=$INSTANCE_NAME,image=projects/ubuntu-os-cloud/global/images/ubuntu-2204-jammy-v20240319,mode=rw,size=30,type=projects/$PROJECT_ID/zones/$ZONE/diskTypes/$DISK_TYPE \
        --no-shielded-secure-boot \
        --shielded-vtpm \
        --shielded-integrity-monitoring \
        --labels=tier=free,app=evolution,environment=production \
        --reservation-affinity=any
    
    log "VM criada com sucesso (FREE TIER)"
fi

# =============================================
# 3. CONFIGURAR FIREWALL
# =============================================

info "Configurando firewall..."

# Evolution API (8080)
if ! gcloud compute firewall-rules describe allow-evolution-free &> /dev/null; then
    gcloud compute firewall-rules create allow-evolution-free \
        --project=$PROJECT_ID \
        --direction=INGRESS \
        --priority=1000 \
        --network=default \
        --action=ALLOW \
        --rules=tcp:8080 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=http-server \
        --description="Evolution API - Free Tier"
    log "Firewall Evolution API criado"
else
    log "Firewall Evolution API já existe"
fi

# N8N (5678)
if ! gcloud compute firewall-rules describe allow-n8n-free &> /dev/null; then
    gcloud compute firewall-rules create allow-n8n-free \
        --project=$PROJECT_ID \
        --direction=INGRESS \
        --priority=1000 \
        --network=default \
        --action=ALLOW \
        --rules=tcp:5678 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=http-server \
        --description="N8N Automation - Free Tier"
    log "Firewall N8N criado"
else
    log "Firewall N8N já existe"
fi

# =============================================
# 4. AGUARDAR VM
# =============================================

if [[ ! $SKIP_VM ]]; then
    info "Aguardando VM ficar pronta..."
    sleep 30
fi

# =============================================
# 5. INSTALAR DOCKER
# =============================================

info "Instalando Docker na VM..."

gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="
    set -e
    
    echo '📦 Atualizando sistema...'
    sudo apt-get update -qq
    sudo apt-get upgrade -y -qq
    
    echo '🐋 Instalando Docker...'
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker \$USER
    
    echo '🔧 Instalando Docker Compose...'
    sudo curl -L 'https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)' -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    echo '💾 Criando SWAP de 1GB...'
    sudo fallocate -l 1G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    
    echo '✅ Docker instalado'
    docker --version
    docker-compose --version
" || error "Falha ao instalar Docker"

log "Docker instalado com sucesso"

# =============================================
# 6. OBTER IP EXTERNO
# =============================================

info "Obtendo IP externo..."

EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME \
    --zone=$ZONE \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

log "IP Externo: $EXTERNAL_IP"

# =============================================
# 7. CRIAR DOCKER-COMPOSE OTIMIZADO
# =============================================

info "Criando docker-compose.yml otimizado..."

cat > /tmp/docker-compose-free.yml <<EOF
version: '3.9'

services:
  # Evolution API - Otimizado para 1GB RAM
  evolution-api:
    image: atendai/evolution-api:v2.1.1
    container_name: evolution_api
    restart: unless-stopped
    ports:
      - "8080:8080"
    environment:
      # URLs
      - SERVER_URL=http://${EXTERNAL_IP}:8080
      
      # SQLite (mais leve)
      - DATABASE_PROVIDER=
      - DATABASE_CONNECTION_CLIENT_NAME=evolution_free
      - DATABASE_SAVE_DATA_INSTANCE=true
      - DATABASE_SAVE_DATA_NEW_MESSAGE=true
      - DATABASE_SAVE_MESSAGE_UPDATE=false
      - DATABASE_SAVE_DATA_CONTACTS=false
      - DATABASE_SAVE_DATA_CHATS=false
      
      # Autenticação
      - AUTHENTICATION_API_KEY=free_tier_key_2024
      
      # Sessão
      - CONFIG_SESSION_PHONE_CLIENT=Evolution
      - CONFIG_SESSION_PHONE_NAME=Chrome
      
      # Webhook
      - WEBHOOK_GLOBAL_URL=http://n8n:5678/webhook/whatsapp
      - WEBHOOK_GLOBAL_ENABLED=true
      - WEBHOOK_EVENTS_MESSAGES_UPSERT=true
      - WEBHOOK_EVENTS_CONNECTION_UPDATE=true
      
      # Logs mínimos
      - LOG_LEVEL=ERROR
      - LOG_COLOR=false
      - LOG_BAILEYS=error
      
      # CORS
      - CORS_ORIGIN=*
    volumes:
      - evolution_data:/evolution/instances
    networks:
      - net
    # Limitar recursos
    mem_limit: 512m
    mem_reservation: 256m
    cpus: 0.5

  # N8N - Otimizado para 1GB RAM
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      # URLs
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://${EXTERNAL_IP}:5678/
      
      # Autenticação
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=Free2024!
      
      # Timezone
      - GENERIC_TIMEZONE=America/Sao_Paulo
      - TZ=America/Sao_Paulo
      
      # Economizar espaço
      - EXECUTIONS_DATA_SAVE_ON_ERROR=all
      - EXECUTIONS_DATA_SAVE_ON_SUCCESS=none
      - EXECUTIONS_DATA_PRUNE=true
      - EXECUTIONS_DATA_MAX_AGE=168
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - net
    # Limitar recursos
    mem_limit: 400m
    mem_reservation: 200m
    cpus: 0.5
    depends_on:
      - evolution-api

volumes:
  evolution_data:
  n8n_data:

networks:
  net:
    driver: bridge
EOF

log "docker-compose.yml criado"

# =============================================
# 8. FAZER UPLOAD E INICIAR
# =============================================

info "Fazendo upload do docker-compose.yml..."

gcloud compute scp /tmp/docker-compose-free.yml $INSTANCE_NAME:~/docker-compose.yml --zone=$ZONE

log "Upload concluído"

info "Iniciando containers..."

gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="
    cd ~
    
    echo '🚀 Iniciando containers...'
    docker-compose up -d
    
    echo '⏳ Aguardando inicialização...'
    sleep 15
    
    echo ''
    echo '📊 Status dos containers:'
    docker-compose ps
    
    echo ''
    echo '💾 Uso de recursos:'
    free -h
    echo ''
    docker stats --no-stream
"

log "Containers iniciados"

# =============================================
# 9. RESUMO FINAL
# =============================================

echo ""
echo "🎉 ========================================"
echo "🎉   DEPLOY CONCLUÍDO COM SUCESSO!"
echo "🎉   FREE TIER - R\$ 0,00/mês"
echo "🎉 ========================================"
echo ""

echo -e "${CYAN}📊 Especificações da VM:${NC}"
echo "  💻 Tipo: e2-micro (FREE TIER)"
echo "  🧠 RAM: 1 GB"
echo "  ⚡ vCPU: 1 compartilhada"
echo "  💾 Disco: 30 GB HDD"
echo "  📍 Região: us-west1 (Oregon)"
echo "  💰 Custo: GRÁTIS PARA SEMPRE!"
echo ""

echo -e "${CYAN}🌐 URLs de Acesso:${NC}"
echo ""
echo "  📱 Evolution API:"
echo "     http://${EXTERNAL_IP}:8080"
echo ""
echo "  🤖 N8N Automation:"
echo "     http://${EXTERNAL_IP}:5678"
echo "     Usuário: admin"
echo "     Senha: Free2024!"
echo ""

echo -e "${CYAN}🔧 Comandos Úteis:${NC}"
echo ""
echo "  SSH para VM:"
echo "     gcloud compute ssh ${INSTANCE_NAME} --zone=${ZONE}"
echo ""
echo "  Ver logs:"
echo "     gcloud compute ssh ${INSTANCE_NAME} --zone=${ZONE} --command='docker-compose logs -f'"
echo ""
echo "  Status:"
echo "     gcloud compute ssh ${INSTANCE_NAME} --zone=${ZONE} --command='docker-compose ps'"
echo ""

echo -e "${YELLOW}⚠️  Limites do Free Tier:${NC}"
echo "  • 1 GB RAM (suficiente para 2-3 instâncias WhatsApp)"
echo "  • 1 GB/mês tráfego de saída (~1000 mensagens com imagem)"
echo "  • CPU compartilhada (pode ter lentidão em pico)"
echo "  • Mensagens texto: praticamente ilimitadas"
echo ""

echo -e "${GREEN}💡 Próximos Passos:${NC}"
echo "  1. Acesse Evolution API e conecte WhatsApp"
echo "  2. Acesse N8N e importe workflows"
echo "  3. Monitore uso de recursos regularmente"
echo "  4. Faça upgrade se precisar de mais capacidade"
echo ""

echo -e "${CYAN}📚 Documentação:${NC}"
echo "  • Guia completo: DEPLOY_GCP_FREE.md"
echo "  • Troubleshooting: docs/DEPLOY_GCP.md"
echo ""

# Limpar arquivo temporário
rm /tmp/docker-compose-free.yml

echo -e "${GREEN}✅ Deploy finalizado com sucesso!${NC}"
echo ""
