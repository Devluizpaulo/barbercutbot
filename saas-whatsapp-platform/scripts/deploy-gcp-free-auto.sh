#!/bin/bash

# =============================================
# DEPLOY AUTOMATIZADO - GCP FREE TIER
# Plataforma SaaS WhatsApp
# =============================================

set -e  # Parar em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Banner
echo ""
echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  DEPLOY GCP FREE TIER - AUTOMÁTICO    ║${NC}"
echo -e "${CYAN}║  Plataforma SaaS WhatsApp              ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

# =============================================
# VERIFICAÇÕES INICIAIS
# =============================================
echo -e "${YELLOW}[1/10] Verificando ambiente...${NC}"

# Verificar se está rodando no Ubuntu/Debian
if [[ ! -f /etc/lsb-release ]] && [[ ! -f /etc/debian_version ]]; then
    echo -e "${RED}❌ Este script requer Ubuntu ou Debian${NC}"
    exit 1
fi

# Verificar conexão com internet
if ! ping -c 1 google.com &> /dev/null; then
    echo -e "${RED}❌ Sem conexão com internet${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Ambiente verificado${NC}"

# =============================================
# OBTER INFORMAÇÕES
# =============================================
echo ""
echo -e "${YELLOW}[2/10] Obtendo informações do servidor...${NC}"

# Obter IP externo
EXTERNAL_IP=$(curl -s ifconfig.me)
if [ -z "$EXTERNAL_IP" ]; then
    EXTERNAL_IP=$(curl -s api.ipify.org)
fi

echo -e "   IP Externo: ${GREEN}${EXTERNAL_IP}${NC}"

# Obter IP interno
INTERNAL_IP=$(hostname -I | awk '{print $1}')
echo -e "   IP Interno: ${GREEN}${INTERNAL_IP}${NC}"

# Verificar RAM disponível
TOTAL_RAM=$(free -m | awk 'NR==2{printf "%.0f", $2/1024}')
echo -e "   RAM Total: ${GREEN}${TOTAL_RAM} GB${NC}"

if [ "$TOTAL_RAM" -lt 1 ]; then
    echo -e "${RED}⚠️  Aviso: RAM inferior a 1GB. Performance pode ser limitada.${NC}"
fi

# =============================================
# ATUALIZAR SISTEMA
# =============================================
echo ""
echo -e "${YELLOW}[3/10] Atualizando sistema...${NC}"

sudo apt update -qq
sudo apt upgrade -y -qq
sudo apt install -y curl wget git ufw htop net-tools

echo -e "${GREEN}✅ Sistema atualizado${NC}"

# =============================================
# INSTALAR DOCKER
# =============================================
echo ""
echo -e "${YELLOW}[4/10] Instalando Docker...${NC}"

if ! command -v docker &> /dev/null; then
    echo "   Instalando Docker..."
    curl -fsSL https://get.docker.com | sudo sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}✅ Docker instalado${NC}"
else
    echo -e "${GREEN}✅ Docker já está instalado${NC}"
fi

# Verificar versão
DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
echo -e "   Versão: ${GREEN}${DOCKER_VERSION}${NC}"

# =============================================
# INSTALAR DOCKER COMPOSE
# =============================================
echo ""
echo -e "${YELLOW}[5/10] Instalando Docker Compose...${NC}"

if ! command -v docker-compose &> /dev/null; then
    echo "   Instalando Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    echo -e "${GREEN}✅ Docker Compose instalado${NC}"
else
    echo -e "${GREEN}✅ Docker Compose já está instalado${NC}"
fi

# Verificar versão
COMPOSE_VERSION=$(docker-compose --version | awk '{print $4}' | sed 's/,//')
echo -e "   Versão: ${GREEN}${COMPOSE_VERSION}${NC}"

# =============================================
# CONFIGURAR SWAP (1GB)
# =============================================
echo ""
echo -e "${YELLOW}[6/10] Configurando Swap (memória virtual)...${NC}"

if [ ! -f /swapfile ]; then
    echo "   Criando arquivo swap de 1GB..."
    sudo fallocate -l 1G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    
    # Tornar permanente
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi
    
    echo -e "${GREEN}✅ Swap configurado (1GB)${NC}"
else
    echo -e "${GREEN}✅ Swap já existe${NC}"
fi

# Mostrar status
free -h | grep -E 'Mem|Swap'

# =============================================
# CONFIGURAR FIREWALL
# =============================================
echo ""
echo -e "${YELLOW}[7/10] Configurando Firewall...${NC}"

# Resetar regras
sudo ufw --force reset

# Configurar regras básicas
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH
sudo ufw allow ssh
sudo ufw allow 22/tcp

# Permitir Evolution API
sudo ufw allow 8080/tcp

# Permitir N8N
sudo ufw allow 5678/tcp

# Permitir HTTP/HTTPS (futuro)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Ativar firewall
echo "y" | sudo ufw enable

echo -e "${GREEN}✅ Firewall configurado${NC}"
echo "   Portas abertas: 22, 80, 443, 5678, 8080"

# =============================================
# CRIAR ESTRUTURA DE DIRETÓRIOS
# =============================================
echo ""
echo -e "${YELLOW}[8/10] Criando estrutura de diretórios...${NC}"

# Criar diretório principal
mkdir -p ~/evolution-saas
cd ~/evolution-saas

# Criar subdiretórios
mkdir -p logs backups scripts

echo -e "${GREEN}✅ Estrutura criada em ~/evolution-saas${NC}"

# =============================================
# CRIAR ARQUIVO .ENV
# =============================================
echo ""
echo -e "${YELLOW}[9/10] Criando arquivo de configuração (.env)...${NC}"

cat > .env <<EOF
# =============================================
# CONFIGURAÇÃO PRODUÇÃO - GCP FREE TIER
# Gerado em: $(date)
# =============================================

# URLs (usando IP externo)
SERVER_URL=http://${EXTERNAL_IP}:8080
WEBHOOK_URL=http://${EXTERNAL_IP}:5678

# Evolution API
AUTHENTICATION_API_KEY=gcp_free_$(date +%s | sha256sum | base64 | head -c 32)
DATABASE_PROVIDER=
DATABASE_CONNECTION_CLIENT_NAME=evolution_free_tier
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=false
DATABASE_SAVE_DATA_CONTACTS=false
DATABASE_SAVE_DATA_CHATS=false

# Sessão
CONFIG_SESSION_PHONE_CLIENT=Evolution
CONFIG_SESSION_PHONE_NAME=Chrome

# Webhook N8N
WEBHOOK_GLOBAL_URL=http://n8n:5678/webhook/whatsapp
WEBHOOK_GLOBAL_ENABLED=true
WEBHOOK_EVENTS_MESSAGES_UPSERT=true
WEBHOOK_EVENTS_CONNECTION_UPDATE=true
WEBHOOK_EVENTS_MESSAGES_SET=false
WEBHOOK_EVENTS_MESSAGES_UPDATE=false
WEBHOOK_EVENTS_MESSAGES_DELETE=false
WEBHOOK_EVENTS_SEND_MESSAGE=false
WEBHOOK_EVENTS_CONTACTS_SET=false
WEBHOOK_EVENTS_CONTACTS_UPSERT=false
WEBHOOK_EVENTS_CONTACTS_UPDATE=false
WEBHOOK_EVENTS_PRESENCE_UPDATE=false
WEBHOOK_EVENTS_CHATS_SET=false
WEBHOOK_EVENTS_CHATS_UPSERT=false
WEBHOOK_EVENTS_CHATS_UPDATE=false
WEBHOOK_EVENTS_CHATS_DELETE=false
WEBHOOK_EVENTS_GROUPS_UPSERT=false
WEBHOOK_EVENTS_GROUPS_UPDATE=false
WEBHOOK_EVENTS_GROUP_PARTICIPANTS_UPDATE=false
WEBHOOK_EVENTS_CALL=false

# Logs (mínimos para economizar recursos)
LOG_LEVEL=ERROR
LOG_COLOR=false
LOG_BAILEYS=error

# CORS
CORS_ORIGIN=*
CORS_METHODS=GET,POST,PUT,DELETE
CORS_CREDENTIALS=true

# N8N
N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=Admin$(date +%s | sha256sum | base64 | head -c 8)Free!
N8N_HOST=0.0.0.0
N8N_PORT=5678
N8N_PROTOCOL=http
GENERIC_TIMEZONE=America/Sao_Paulo
TZ=America/Sao_Paulo
N8N_ENCRYPTION_KEY=n8n_$(date +%s | sha256sum | base64 | head -c 32)
EXECUTIONS_DATA_SAVE_ON_ERROR=all
EXECUTIONS_DATA_SAVE_ON_SUCCESS=none
EXECUTIONS_DATA_PRUNE=true
EXECUTIONS_DATA_MAX_AGE=168
EOF

echo -e "${GREEN}✅ Arquivo .env criado${NC}"

# Mostrar credenciais N8N
N8N_PASSWORD=$(grep N8N_BASIC_AUTH_PASSWORD .env | cut -d'=' -f2)
echo ""
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${CYAN}   CREDENCIAIS N8N (ANOTE!)${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "   Usuário: ${GREEN}admin${NC}"
echo -e "   Senha: ${GREEN}${N8N_PASSWORD}${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""

# =============================================
# CRIAR DOCKER-COMPOSE OTIMIZADO
# =============================================
echo ""
echo -e "${YELLOW}[10/10] Criando docker-compose.yml otimizado...${NC}"

cat > docker-compose.yml <<'EOF'
version: '3.9'

services:
  # =============================================
  # EVOLUTION API - Otimizado para 1GB RAM
  # =============================================
  evolution-api:
    image: atendai/evolution-api:v2.1.1
    container_name: evolution_api
    restart: unless-stopped
    ports:
      - "8080:8080"
    env_file:
      - .env
    volumes:
      - evolution_data:/evolution/instances
      - ./logs:/evolution/logs
    networks:
      - saas
    # Limites de recursos (importante!)
    mem_limit: 512m
    mem_reservation: 256m
    cpus: 0.5
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # =============================================
  # N8N - Otimizado para 1GB RAM
  # =============================================
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: unless-stopped
    ports:
      - "5678:5678"
    env_file:
      - .env
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - saas
    # Limites de recursos (importante!)
    mem_limit: 400m
    mem_reservation: 200m
    cpus: 0.5
    depends_on:
      evolution-api:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--spider", "-q", "http://localhost:5678"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

volumes:
  evolution_data:
    driver: local
  n8n_data:
    driver: local

networks:
  saas:
    driver: bridge
EOF

echo -e "${GREEN}✅ docker-compose.yml criado${NC}"

# =============================================
# INICIAR CONTAINERS
# =============================================
echo ""
echo -e "${YELLOW}Iniciando containers...${NC}"
echo ""

# Pull das imagens
echo "Baixando imagens Docker..."
docker-compose pull

echo ""
echo "Iniciando serviços..."
docker-compose up -d

echo ""
echo "Aguardando serviços ficarem prontos..."
sleep 30

# Verificar status
docker-compose ps

echo ""
echo -e "${GREEN}✅ Containers iniciados!${NC}"

# =============================================
# CRIAR SCRIPTS AUXILIARES
# =============================================
echo ""
echo -e "${YELLOW}Criando scripts auxiliares...${NC}"

# Script de logs
cat > scripts/logs.sh <<'LOGSCRIPT'
#!/bin/bash
cd ~/evolution-saas
if [ "$1" == "evolution" ]; then
    docker-compose logs -f evolution-api
elif [ "$1" == "n8n" ]; then
    docker-compose logs -f n8n
else
    docker-compose logs -f
fi
LOGSCRIPT
chmod +x scripts/logs.sh

# Script de status
cat > scripts/status.sh <<'STATUSSCRIPT'
#!/bin/bash
cd ~/evolution-saas
echo "=== Status dos Containers ==="
docker-compose ps
echo ""
echo "=== Uso de Recursos ==="
docker stats --no-stream
echo ""
echo "=== Uso de Disco ==="
df -h | grep -E '^Filesystem|/$'
echo ""
echo "=== Uso de Memória ==="
free -h
STATUSSCRIPT
chmod +x scripts/status.sh

# Script de backup
cat > scripts/backup.sh <<'BACKUPSCRIPT'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=~/evolution-saas/backups
mkdir -p $BACKUP_DIR

echo "Criando backup..."
cd ~/evolution-saas
docker-compose down
tar -czf $BACKUP_DIR/backup-${DATE}.tar.gz \
    ~/evolution-saas \
    /var/lib/docker/volumes/*evolution* \
    /var/lib/docker/volumes/*n8n* 2>/dev/null
docker-compose up -d

echo "Backup criado: $BACKUP_DIR/backup-${DATE}.tar.gz"

# Manter apenas últimos 5 backups
cd $BACKUP_DIR
ls -t backup-*.tar.gz | tail -n +6 | xargs -r rm
BACKUPSCRIPT
chmod +x scripts/backup.sh

# Script de reiniciar
cat > scripts/restart.sh <<'RESTARTSCRIPT'
#!/bin/bash
cd ~/evolution-saas
echo "Reiniciando serviços..."
docker-compose restart
sleep 10
docker-compose ps
RESTARTSCRIPT
chmod +x scripts/restart.sh

echo -e "${GREEN}✅ Scripts auxiliares criados${NC}"

# =============================================
# CONFIGURAR CRON PARA BACKUP SEMANAL
# =============================================
echo ""
echo -e "${YELLOW}Configurando backup automático semanal...${NC}"

# Adicionar ao cron (domingo às 3h)
CRON_CMD="0 3 * * 0 ~/evolution-saas/scripts/backup.sh >> ~/evolution-saas/logs/backup.log 2>&1"
(crontab -l 2>/dev/null | grep -v "backup.sh"; echo "$CRON_CMD") | crontab -

echo -e "${GREEN}✅ Backup automático configurado (Domingo 3h)${NC}"

# =============================================
# RESUMO FINAL
# =============================================
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                        ║${NC}"
echo -e "${CYAN}║  ✅  DEPLOY CONCLUÍDO COM SUCESSO!                     ║${NC}"
echo -e "${CYAN}║                                                        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}📊 INFORMAÇÕES DO SERVIDOR:${NC}"
echo -e "   IP Externo: ${GREEN}${EXTERNAL_IP}${NC}"
echo -e "   RAM Total: ${GREEN}${TOTAL_RAM} GB${NC}"
echo -e "   Diretório: ${GREEN}~/evolution-saas${NC}"
echo ""

echo -e "${YELLOW}🌐 URLs DE ACESSO:${NC}"
echo ""
echo -e "   ${BLUE}Evolution API:${NC}"
echo -e "   http://${EXTERNAL_IP}:8080"
echo ""
echo -e "   ${BLUE}N8N Automation:${NC}"
echo -e "   http://${EXTERNAL_IP}:5678"
echo -e "   Usuário: ${GREEN}admin${NC}"
echo -e "   Senha: ${GREEN}${N8N_PASSWORD}${NC}"
echo ""

echo -e "${YELLOW}📁 SCRIPTS DISPONÍVEIS:${NC}"
echo -e "   ${GREEN}~/evolution-saas/scripts/status.sh${NC}  - Ver status"
echo -e "   ${GREEN}~/evolution-saas/scripts/logs.sh${NC}    - Ver logs"
echo -e "   ${GREEN}~/evolution-saas/scripts/backup.sh${NC}  - Fazer backup"
echo -e "   ${GREEN}~/evolution-saas/scripts/restart.sh${NC} - Reiniciar tudo"
echo ""

echo -e "${YELLOW}💡 COMANDOS ÚTEIS:${NC}"
echo -e "   ${GREEN}cd ~/evolution-saas${NC}              - Ir para diretório"
echo -e "   ${GREEN}docker-compose ps${NC}                - Status containers"
echo -e "   ${GREEN}docker-compose logs -f${NC}           - Ver logs em tempo real"
echo -e "   ${GREEN}docker-compose restart${NC}           - Reiniciar serviços"
echo -e "   ${GREEN}docker stats${NC}                     - Uso de recursos"
echo ""

echo -e "${YELLOW}🔥 PRÓXIMOS PASSOS:${NC}"
echo ""
echo -e "   1. ${CYAN}Conectar WhatsApp:${NC}"
echo -e "      Acesse: http://${EXTERNAL_IP}:8080"
echo -e "      Crie uma instância e escaneie o QR Code"
echo ""
echo -e "   2. ${CYAN}Configurar N8N:${NC}"
echo -e "      Acesse: http://${EXTERNAL_IP}:5678"
echo -e "      Importe os workflows do diretório n8n-workflows/"
echo ""
echo -e "   3. ${CYAN}Testar Automação:${NC}"
echo -e "      Envie uma mensagem 'oi' para o WhatsApp"
echo -e "      Deve receber resposta automática"
echo ""

echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo -e "   - ${RED}Anote as credenciais do N8N${NC}"
echo -e "   - Backup automático todo domingo às 3h"
echo -e "   - Monitore recursos: ${GREEN}~/evolution-saas/scripts/status.sh${NC}"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✨ Seu SaaS WhatsApp está rodando 24/7 GRÁTIS no GCP! ✨${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""

# Salvar informações em arquivo
cat > ~/evolution-saas/INFO.txt <<INFOFILE
╔════════════════════════════════════════════════════════╗
║  INFORMAÇÕES DO DEPLOY - $(date)
╚════════════════════════════════════════════════════════╝

IP EXTERNO: ${EXTERNAL_IP}
IP INTERNO: ${INTERNAL_IP}
RAM TOTAL: ${TOTAL_RAM} GB

URLS:
- Evolution API: http://${EXTERNAL_IP}:8080
- N8N: http://${EXTERNAL_IP}:5678

CREDENCIAIS N8N:
- Usuário: admin
- Senha: ${N8N_PASSWORD}

DIRETÓRIOS:
- Principal: ~/evolution-saas
- Logs: ~/evolution-saas/logs
- Backups: ~/evolution-saas/backups
- Scripts: ~/evolution-saas/scripts

SCRIPTS:
- Status: ~/evolution-saas/scripts/status.sh
- Logs: ~/evolution-saas/scripts/logs.sh
- Backup: ~/evolution-saas/scripts/backup.sh
- Restart: ~/evolution-saas/scripts/restart.sh

BACKUP AUTOMÁTICO:
- Frequência: Domingo 3h
- Local: ~/evolution-saas/backups/
- Retenção: Últimos 5 backups

COMANDOS ÚTEIS:
cd ~/evolution-saas
docker-compose ps
docker-compose logs -f
docker-compose restart
docker stats
INFOFILE

echo -e "${CYAN}📄 Informações salvas em: ${GREEN}~/evolution-saas/INFO.txt${NC}"
echo ""

