#!/bin/bash

# =============================================
# SCRIPT DE BACKUP MANUAL
# Plataforma SaaS WhatsApp - GCP Free Tier
# =============================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Variáveis
BASE_DIR="$HOME/evolution-saas"
BACKUP_DIR="$BASE_DIR/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup-${DATE}.tar.gz"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_FILE"

# =============================================
# INÍCIO
# =============================================

echo ""
echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║        BACKUP MANUAL - INICIANDO       ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

# Verificar se diretório existe
if [ ! -d "$BASE_DIR" ]; then
    echo -e "${RED}❌ Diretório $BASE_DIR não encontrado${NC}"
    exit 1
fi

cd "$BASE_DIR"

# Criar diretório de backup
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}📦 Preparando backup...${NC}"
echo ""

# Mostrar tamanho atual
echo "Calculando tamanho..."
TOTAL_SIZE=$(du -sh "$BASE_DIR" | awk '{print $1}')
DOCKER_SIZE=$(sudo du -sh /var/lib/docker/volumes/*evolution* /var/lib/docker/volumes/*n8n* 2>/dev/null | awk '{sum+=$1} END {print sum}')

echo -e "  Diretório base: ${GREEN}$TOTAL_SIZE${NC}"
echo -e "  Volumes Docker: ${GREEN}${DOCKER_SIZE}${NC}"
echo ""

# Confirmar
read -p "Continuar com o backup? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo -e "${YELLOW}Backup cancelado${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}⏸️  Parando containers...${NC}"

# Parar containers
docker-compose down

echo -e "${GREEN}✓${NC} Containers parados"
echo ""

# Fazer backup
echo -e "${YELLOW}💾 Criando arquivo de backup...${NC}"
echo "   Isso pode levar alguns minutos..."
echo ""

# Criar arquivo tar.gz
sudo tar -czf "$BACKUP_PATH" \
    --exclude='*.log' \
    --exclude='backups/*.tar.gz' \
    "$BASE_DIR" \
    /var/lib/docker/volumes/*evolution* \
    /var/lib/docker/volumes/*n8n* \
    2>/dev/null || true

# Ajustar permissões
sudo chown $USER:$USER "$BACKUP_PATH"

# Verificar se backup foi criado
if [ -f "$BACKUP_PATH" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_PATH" | awk '{print $1}')
    echo -e "${GREEN}✓${NC} Backup criado com sucesso!"
    echo -e "   Arquivo: ${GREEN}$BACKUP_FILE${NC}"
    echo -e "   Tamanho: ${GREEN}$BACKUP_SIZE${NC}"
    echo -e "   Local: ${GREEN}$BACKUP_DIR${NC}"
else
    echo -e "${RED}❌ Erro ao criar backup${NC}"
    docker-compose up -d
    exit 1
fi

echo ""

# Reiniciar containers
echo -e "${YELLOW}▶️  Reiniciando containers...${NC}"
docker-compose up -d

echo -e "${GREEN}✓${NC} Containers iniciados"
echo ""

# Aguardar containers ficarem prontos
echo "Aguardando containers ficarem prontos..."
sleep 15

# Verificar status
echo ""
docker-compose ps
echo ""

# Limpar backups antigos
echo -e "${YELLOW}🧹 Limpando backups antigos...${NC}"

# Manter apenas últimos 5 backups
cd "$BACKUP_DIR"
BACKUP_COUNT=$(ls -1 backup-*.tar.gz 2>/dev/null | wc -l)

if [ "$BACKUP_COUNT" -gt 5 ]; then
    REMOVE_COUNT=$((BACKUP_COUNT - 5))
    echo "   Removendo $REMOVE_COUNT backup(s) antigo(s)..."
    ls -t backup-*.tar.gz | tail -n +6 | xargs rm -f
    echo -e "   ${GREEN}✓${NC} Backups antigos removidos"
else
    echo -e "   ${GREEN}✓${NC} $BACKUP_COUNT backup(s) mantido(s)"
fi

echo ""

# Listar backups disponíveis
echo -e "${CYAN}📂 Backups disponíveis:${NC}"
echo ""
ls -lh backup-*.tar.gz | awk '{printf "   %s %s - %s\n", $9, $6" "$7, $5}'
echo ""

# Resumo
echo -e "${CYAN}╔════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║       BACKUP CONCLUÍDO COM SUCESSO     ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════╝${NC}"
echo ""

echo -e "${YELLOW}📝 INFORMAÇÕES:${NC}"
echo -e "   Arquivo: ${GREEN}$BACKUP_FILE${NC}"
echo -e "   Tamanho: ${GREEN}$BACKUP_SIZE${NC}"
echo -e "   Data: ${GREEN}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
echo ""

echo -e "${YELLOW}💡 PARA RESTAURAR:${NC}"
echo ""
echo -e "   1. Parar containers:"
echo -e "      ${GREEN}cd ~/evolution-saas && docker-compose down${NC}"
echo ""
echo -e "   2. Extrair backup:"
echo -e "      ${GREEN}sudo tar -xzf $BACKUP_PATH -C /${NC}"
echo ""
echo -e "   3. Reiniciar:"
echo -e "      ${GREEN}docker-compose up -d${NC}"
echo ""

# Sugerir download
echo -e "${YELLOW}💾 DOWNLOAD DO BACKUP:${NC}"
echo ""
echo "   Para baixar o backup para seu computador:"
echo ""
echo -e "   ${GREEN}scp usuario@SEU_IP:$BACKUP_PATH ./${NC}"
echo ""
echo "   Ou use o Google Cloud Console para download"
echo ""

