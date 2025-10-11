#!/bin/bash

# =============================================
# SCRIPT DE DEPLOY NO GOOGLE CLOUD PLATFORM
# Projeto: studio-343774762-16da7
# =============================================

set -e

echo ""
echo "🚀 ========================================"
echo "🚀   DEPLOY N8N + EVOLUTION API NO GCP"
echo "🚀 ========================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variáveis
PROJECT_ID="studio-343774762-16da7"
INSTANCE_NAME="n8n-evolution-server"
ZONE="us-central1-a"
MACHINE_TYPE="e2-medium"

# Função para log
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# =============================================
# 1. VERIFICAR PRÉ-REQUISITOS
# =============================================

log "Verificando pré-requisitos..."

if ! command -v gcloud &> /dev/null; then
    error "gcloud CLI não encontrado. Instale: https://cloud.google.com/sdk/docs/install"
fi

log "✅ gcloud CLI encontrado"

# Configurar projeto
gcloud config set project $PROJECT_ID
log "✅ Projeto configurado: $PROJECT_ID"

# =============================================
# 2. CRIAR VM (se não existir)
# =============================================

log "Verificando se VM existe..."

if gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE &> /dev/null; then
    warn "VM $INSTANCE_NAME já existe"
    read -p "Deseja recriá-la? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log "Deletando VM existente..."
        gcloud compute instances delete $INSTANCE_NAME --zone=$ZONE --quiet
    else
        log "Pulando criação da VM"
    fi
fi

if ! gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE &> /dev/null; then
    log "Criando VM..."
    
    gcloud compute instances create $INSTANCE_NAME \
        --project=$PROJECT_ID \
        --zone=$ZONE \
        --machine-type=$MACHINE_TYPE \
        --network-interface=network-tier=PREMIUM,subnet=default \
        --maintenance-policy=MIGRATE \
        --provisioning-model=STANDARD \
        --scopes=https://www.googleapis.com/auth/devstorage.read_only,https://www.googleapis.com/auth/logging.write,https://www.googleapis.com/auth/monitoring.write,https://www.googleapis.com/auth/servicecontrol,https://www.googleapis.com/auth/service.management.readonly,https://www.googleapis.com/auth/trace.append \
        --tags=http-server,https-server \
        --create-disk=auto-delete=yes,boot=yes,device-name=$INSTANCE_NAME,image=projects/ubuntu-os-cloud/global/images/ubuntu-2204-jammy-v20231213,mode=rw,size=30,type=projects/$PROJECT_ID/zones/$ZONE/diskTypes/pd-ssd \
        --no-shielded-secure-boot \
        --shielded-vtpm \
        --shielded-integrity-monitoring \
        --labels=app=n8n,environment=production \
        --reservation-affinity=any
    
    log "✅ VM criada com sucesso"
else
    log "✅ VM já existe"
fi

# =============================================
# 3. CONFIGURAR FIREWALL
# =============================================

log "Configurando regras de firewall..."

# Evolution API
if ! gcloud compute firewall-rules describe allow-evolution-api &> /dev/null; then
    gcloud compute firewall-rules create allow-evolution-api \
        --project=$PROJECT_ID \
        --direction=INGRESS \
        --priority=1000 \
        --network=default \
        --action=ALLOW \
        --rules=tcp:8080 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=http-server
    log "✅ Regra firewall Evolution API criada"
else
    log "✅ Regra firewall Evolution API já existe"
fi

# N8N
if ! gcloud compute firewall-rules describe allow-n8n &> /dev/null; then
    gcloud compute firewall-rules create allow-n8n \
        --project=$PROJECT_ID \
        --direction=INGRESS \
        --priority=1000 \
        --network=default \
        --action=ALLOW \
        --rules=tcp:5678 \
        --source-ranges=0.0.0.0/0 \
        --target-tags=http-server
    log "✅ Regra firewall N8N criada"
else
    log "✅ Regra firewall N8N já existe"
fi

# =============================================
# 4. AGUARDAR VM FICAR PRONTA
# =============================================

log "Aguardando VM ficar pronta..."
sleep 30

# =============================================
# 5. INSTALAR DOCKER NA VM
# =============================================

log "Instalando Docker na VM..."

gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="
    set -e
    
    # Atualizar sistema
    sudo apt-get update
    sudo apt-get upgrade -y
    
    # Instalar Docker
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker \$USER
    
    # Instalar Docker Compose
    sudo curl -L 'https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)' -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    
    # Verificar instalação
    docker --version
    docker-compose --version
"

log "✅ Docker instalado"

# =============================================
# 6. OBTER IP EXTERNO
# =============================================

log "Obtendo IP externo da VM..."

EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME \
    --zone=$ZONE \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

log "✅ IP Externo: $EXTERNAL_IP"

# =============================================
# 7. CRIAR docker-compose.yml
# =============================================

log "Criando docker-compose.yml..."

cat > /tmp/docker-compose-gcp.yml <<EOF
version: '3.9'

services:
  evolution-api:
    image: atendai/evolution-api:v2.1.1
    container_name: evolution_api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://${EXTERNAL_IP}:8080
      - DATABASE_PROVIDER=
      - DATABASE_CONNECTION_CLIENT_NAME=evolution_gcp
      - DATABASE_SAVE_DATA_INSTANCE=true
      - DATABASE_SAVE_DATA_NEW_MESSAGE=true
      - AUTHENTICATION_API_KEY=evolution_gcp_key_2024
      - CONFIG_SESSION_PHONE_CLIENT=Evolution API
      - CONFIG_SESSION_PHONE_NAME=Chrome
      - WEBHOOK_GLOBAL_URL=http://n8n:5678/webhook/whatsapp
      - WEBHOOK_GLOBAL_ENABLED=true
      - WEBHOOK_EVENTS_MESSAGES_UPSERT=true
      - WEBHOOK_EVENTS_CONNECTION_UPDATE=true
      - LOG_LEVEL=ERROR
      - CORS_ORIGIN=*
    volumes:
      - evolution_data:/evolution/instances
    networks:
      - saas-network

  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://${EXTERNAL_IP}:5678/
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=AdminGCP2024!
      - GENERIC_TIMEZONE=America/Sao_Paulo
      - TZ=America/Sao_Paulo
      - EXECUTIONS_DATA_SAVE_ON_ERROR=all
      - EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - saas-network

volumes:
  evolution_data:
  n8n_data:

networks:
  saas-network:
    driver: bridge
EOF

log "✅ docker-compose.yml criado"

# =============================================
# 8. FAZER UPLOAD E INICIAR
# =============================================

log "Fazendo upload do docker-compose.yml..."

gcloud compute scp /tmp/docker-compose-gcp.yml $INSTANCE_NAME:~/docker-compose.yml --zone=$ZONE

log "✅ Upload concluído"

log "Iniciando containers..."

gcloud compute ssh $INSTANCE_NAME --zone=$ZONE --command="
    cd ~
    docker-compose up -d
    echo 'Aguardando containers iniciarem...'
    sleep 10
    docker-compose ps
"

log "✅ Containers iniciados"

# =============================================
# 9. RESUMO
# =============================================

echo ""
echo "🎉 ========================================"
echo "🎉   DEPLOY CONCLUÍDO COM SUCESSO!"
echo "🎉 ========================================"
echo ""

echo "📊 Informações de Acesso:"
echo ""
echo "🌐 Evolution API:"
echo "   http://${EXTERNAL_IP}:8080"
echo ""
echo "🤖 N8N Automation:"
echo "   http://${EXTERNAL_IP}:5678"
echo "   Usuário: admin"
echo "   Senha: AdminGCP2024!"
echo ""
echo "🔧 SSH para VM:"
echo "   gcloud compute ssh ${INSTANCE_NAME} --zone=${ZONE} --project=${PROJECT_ID}"
echo ""
echo "📝 Ver logs:"
echo "   gcloud compute ssh ${INSTANCE_NAME} --zone=${ZONE} --command='docker-compose logs -f'"
echo ""
echo "💰 Custo estimado: ~\$49/mês"
echo ""

# Limpar arquivo temporário
rm /tmp/docker-compose-gcp.yml

echo "✅ Deploy finalizado!"
echo ""
