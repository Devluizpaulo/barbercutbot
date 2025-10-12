# 🚀 Deploy em Produção - Guia Completo

## 📋 Visão Geral

Este guia completo irá ajudá-lo a fazer o deploy da **Plataforma SaaS WhatsApp** em produção no **Google Cloud Platform Free Tier**, completamente **GRÁTIS**.

---

## 💰 Custos

| Item | Especificação | Custo Mensal |
|------|---------------|--------------|
| **VM e2-micro** | 1 vCPU, 1GB RAM, 30GB | **R$ 0,00** |
| **Tráfego** | 1GB/mês saída | **R$ 0,00** |
| **IP Externo** | 1 IP fixo | **R$ 0,00** |
| **Firebase** | Plano Spark | **R$ 0,00** |
| **TOTAL** | - | **R$ 0,00/mês** |

✅ **SEMPRE GRÁTIS** - Não expira!

---

## 🎯 Pré-Requisitos

### 1. Conta Google Cloud

1. Acesse: https://console.cloud.google.com
2. Crie uma conta (se não tiver)
3. Ative o Free Tier (exige cartão de crédito, mas **não será cobrado**)

### 2. Criar Projeto

```bash
# Acesse o console e crie um projeto
# Ou via gcloud CLI:
gcloud projects create seu-projeto-saas-whatsapp --name="SaaS WhatsApp"
gcloud config set project seu-projeto-saas-whatsapp
```

---

## 🚀 Deploy Automatizado (Recomendado)

### Método 1: Script Completo

Este método instala e configura tudo automaticamente em **~10 minutos**.

#### Passo 1: Criar VM

1. Acesse: https://console.cloud.google.com/compute/instances
2. Clique em **"CREATE INSTANCE"**
3. Configure:

```yaml
Nome: evolution-saas-prod
Região: us-west1 (Oregon)  # IMPORTANTE: Free Tier apenas nesta região
Zona: us-west1-b
Tipo de máquina: e2-micro (1 GB, 1 vCPU compartilhada)
Disco: 30 GB Standard persistent disk
Sistema: Ubuntu 22.04 LTS
Firewall: ☑ Permitir HTTP e HTTPS
```

4. Clique em **"CREATE"**

#### Passo 2: Conectar via SSH

Clique em **"SSH"** ao lado da VM criada.

#### Passo 3: Executar Script de Deploy

```bash
# Baixar o script
curl -sSL https://raw.githubusercontent.com/SEU_USUARIO/Barbearia-SaaS/main/saas-whatsapp-platform/scripts/deploy-gcp-free-auto.sh -o deploy.sh

# Tornar executável
chmod +x deploy.sh

# Executar
./deploy.sh
```

O script irá:
- ✅ Atualizar o sistema
- ✅ Instalar Docker e Docker Compose
- ✅ Configurar Swap (memória virtual)
- ✅ Configurar Firewall
- ✅ Criar estrutura de diretórios
- ✅ Gerar arquivo .env com senhas seguras
- ✅ Criar docker-compose.yml otimizado
- ✅ Iniciar containers
- ✅ Criar scripts auxiliares
- ✅ Configurar backup automático

**Tempo total: ~10 minutos**

---

## 🛠️ Deploy Manual (Passo a Passo)

### 1. Atualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git ufw htop net-tools
```

### 2. Instalar Docker

```bash
# Instalar Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar
docker --version
docker-compose --version

# IMPORTANTE: Relogar para aplicar grupo docker
exit
# Conectar novamente via SSH
```

### 3. Configurar Swap (1GB)

```bash
# Criar arquivo swap
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Tornar permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verificar
free -h
```

### 4. Configurar Firewall

```bash
# Configurar UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 8081/tcp  # Evolution API
sudo ufw allow 5678/tcp  # N8N
sudo ufw allow 80/tcp    # HTTP (futuro)
sudo ufw allow 443/tcp   # HTTPS (futuro)

# Ativar
sudo ufw --force enable

# Verificar
sudo ufw status
```

### 5. Criar Estrutura

```bash
# Criar diretórios
mkdir -p ~/evolution-saas/{logs,backups,scripts}
cd ~/evolution-saas

# Obter IP externo
MY_IP=$(curl -s ifconfig.me)
echo "Seu IP: $MY_IP"
```

### 6. Criar Arquivo .env

```bash
cat > .env <<EOF
# =============================================
# CONFIGURAÇÃO PRODUÇÃO - GCP FREE TIER
# Gerado em: $(date)
# =============================================

# URLs
SERVER_URL=http://${MY_IP}:8081
WEBHOOK_URL=http://${MY_IP}:5678

# Evolution API
AUTHENTICATION_API_KEY=$(openssl rand -base64 32)
DATABASE_PROVIDER=
DATABASE_CONNECTION_CLIENT_NAME=evolution_prod
DATABASE_SAVE_DATA_INSTANCE=true
DATABASE_SAVE_DATA_NEW_MESSAGE=true
DATABASE_SAVE_MESSAGE_UPDATE=false
DATABASE_SAVE_DATA_CONTACTS=false
DATABASE_SAVE_DATA_CHATS=false

# Session
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
N8N_BASIC_AUTH_PASSWORD=$(openssl rand -base64 16)
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

# Mostrar credenciais N8N
echo "=========================================="
echo "CREDENCIAIS N8N (ANOTE!):"
echo "Usuário: admin"
echo "Senha: $(grep N8N_BASIC_AUTH_PASSWORD .env | cut -d'=' -f2)"
echo "=========================================="
```

### 7. Criar docker-compose.yml

```bash
cat > docker-compose.yml <<'EOF'
version: '3.9'

services:
  # =============================================
  # EVOLUTION API - Otimizado para 1GB RAM
  # =============================================
  evolution-api:
    image: atendai/evolution-api:v2.2.2
    container_name: evolution_api
    restart: unless-stopped
    ports:
      - "8081:8080"
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
```

### 8. Iniciar Serviços

```bash
# Pull das imagens
docker-compose pull

# Iniciar
docker-compose up -d

# Aguardar
sleep 30

# Verificar status
docker-compose ps
docker-compose logs -f
```

---

## 🌐 Acessar Serviços

Após o deploy, acesse:

### Evolution API
```
http://SEU_IP:8081
```

### N8N Automation
```
http://SEU_IP:5678
Usuário: admin
Senha: (a que foi gerada no .env)
```

---

## 🔧 Scripts Auxiliares

Os scripts criados automaticamente:

### 1. Monitor
```bash
~/evolution-saas/scripts/monitor.sh

# Gerar relatório completo
~/evolution-saas/scripts/monitor.sh --report
```

### 2. Logs
```bash
# Logs Evolution
~/evolution-saas/scripts/logs.sh evolution

# Logs N8N
~/evolution-saas/scripts/logs.sh n8n

# Todos os logs
~/evolution-saas/scripts/logs.sh
```

### 3. Backup Manual
```bash
~/evolution-saas/scripts/backup-manual.sh
```

### 4. Restart
```bash
~/evolution-saas/scripts/restart.sh
```

### 5. Health Check
```bash
~/evolution-saas/scripts/healthcheck.sh
```

---

## 📊 Monitoramento

### Ver Uso de Recursos

```bash
# Status geral
cd ~/evolution-saas
docker-compose ps
docker stats

# Memória
free -h

# Disco
df -h

# CPU
top
```

### Logs em Tempo Real

```bash
# Evolution API
docker-compose logs -f evolution-api

# N8N
docker-compose logs -f n8n

# Ambos
docker-compose logs -f
```

---

## 💾 Backup

### Backup Automático

Configurado automaticamente para rodar **todo domingo às 3h**.

Ver logs:
```bash
cat ~/evolution-saas/logs/backup.log
```

### Backup Manual

```bash
cd ~/evolution-saas
./scripts/backup-manual.sh
```

### Restaurar Backup

```bash
# 1. Parar containers
cd ~/evolution-saas
docker-compose down

# 2. Extrair backup
sudo tar -xzf backups/backup-YYYYMMDD_HHMMSS.tar.gz -C /

# 3. Reiniciar
docker-compose up -d
```

### Download de Backup

```bash
# Do servidor para seu computador
scp usuario@SEU_IP:~/evolution-saas/backups/backup-XXXXXXX.tar.gz ./
```

---

## 🔐 Segurança

### Melhores Práticas

1. **Mudar senhas padrão**
```bash
# Editar .env e mudar:
# - AUTHENTICATION_API_KEY
# - N8N_BASIC_AUTH_PASSWORD
# - N8N_ENCRYPTION_KEY
```

2. **Configurar HTTPS** (quando tiver domínio)
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot certonly --standalone -d seu-dominio.com
```

3. **Limitar acesso SSH**
```bash
# Apenas seu IP
sudo ufw allow from SEU_IP_HOME to any port 22
```

4. **Atualizações regulares**
```bash
# Sistema
sudo apt update && sudo apt upgrade -y

# Docker images
cd ~/evolution-saas
docker-compose pull
docker-compose up -d
```

---

## 📈 Otimizações

### Para 1GB RAM

Sistema já está otimizado com:
- ✅ Limites de memória por container
- ✅ Swap de 1GB
- ✅ SQLite (mais leve que PostgreSQL)
- ✅ Logs mínimos
- ✅ Execuções N8N não salvas (sucesso)
- ✅ Limpeza automática de dados antigos

### Monitorar Performance

```bash
# Script de monitoramento
./scripts/monitor.sh
```

Se uso de RAM > 85%, considere:
1. Reiniciar containers
2. Limpar dados antigos
3. Fazer upgrade para e2-small

---

## 🆘 Troubleshooting

### Container não inicia

```bash
# Ver logs
docker-compose logs evolution-api
docker-compose logs n8n

# Verificar recursos
free -h
df -h

# Reiniciar
docker-compose restart
```

### Sem memória (OOM)

```bash
# Adicionar mais swap
sudo fallocate -l 2G /swapfile2
sudo chmod 600 /swapfile2
sudo mkswap /swapfile2
sudo swapon /swapfile2

# Ou fazer upgrade da VM
```

### Porta não acessível

```bash
# Verificar firewall
sudo ufw status

# Verificar se porta está aberta
sudo netstat -tulpn | grep -E '8081|5678'

# Testar internamente
curl http://localhost:8081
curl http://localhost:5678
```

### Disco cheio

```bash
# Ver uso
df -h

# Limpar Docker
docker system prune -a

# Limpar logs do sistema
sudo journalctl --vacuum-time=3d

# Limpar backups antigos
cd ~/evolution-saas/backups
ls -t backup-*.tar.gz | tail -n +6 | xargs rm
```

---

## 📱 Próximos Passos

### 1. Conectar WhatsApp

1. Acesse Evolution API: `http://SEU_IP:8081`
2. Clique em "Create Instance"
3. Nome: `minha_barbearia`
4. Integration: `WHATSAPP-BAILEYS`
5. Clique em "Connect"
6. Escaneie QR Code com WhatsApp
7. Aguarde status "Connected"

### 2. Configurar N8N

1. Acesse N8N: `http://SEU_IP:5678`
2. Login: `admin` / senha do .env
3. Clique em "Workflows"
4. Importe os workflows:
   - 01-whatsapp-message-handler.json
   - 02-appointment-reminder.json (a criar)
   - 03-daily-report.json (a criar)

### 3. Testar Automação

1. Envie "oi" para o WhatsApp conectado
2. Deve receber resposta automática
3. Teste outros comandos: preços, horários, agendar

### 4. Configurar Firebase (Opcional)

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar
cd ~/evolution-saas
firebase init
```

### 5. Configurar Domínio (Opcional)

Se tiver um domínio:

1. Criar registro A apontando para SEU_IP
2. Aguardar propagação DNS (5-30 min)
3. Instalar Nginx como proxy reverso
4. Configurar SSL com Certbot

---

## 🎯 Checklist de Deploy

- [ ] VM e2-micro criada em us-west1
- [ ] SSH funcionando
- [ ] Docker e Docker Compose instalados
- [ ] Swap configurado (1GB)
- [ ] Firewall configurado (portas 22, 8081, 5678)
- [ ] Estrutura de diretórios criada
- [ ] Arquivo .env configurado
- [ ] docker-compose.yml criado
- [ ] Containers iniciados e funcionando
- [ ] Evolution API acessível
- [ ] N8N acessível
- [ ] Scripts auxiliares funcionando
- [ ] Backup automático configurado
- [ ] WhatsApp conectado
- [ ] Workflows importados
- [ ] Testes funcionando

---

## 💡 Comandos Rápidos

```bash
# Status
cd ~/evolution-saas && docker-compose ps

# Logs
docker-compose logs -f

# Reiniciar
docker-compose restart

# Parar
docker-compose down

# Iniciar
docker-compose up -d

# Recursos
docker stats

# Backup
./scripts/backup-manual.sh

# Monitor
./scripts/monitor.sh
```

---

## 📚 Documentação Adicional

- [DEPLOY_GCP_FREE.md](DEPLOY_GCP_FREE.md) - Detalhes do Free Tier
- [PLANO_MIGRACAO.md](PLANO_MIGRACAO.md) - Migração para Hostinger
- [INTEGRACAO_FRONTEND.md](INTEGRACAO_FRONTEND.md) - Integrar com Frontend
- [README.md](README.md) - Visão geral do projeto

---

## 🎉 Conclusão

Parabéns! Você agora tem:

✅ Evolution API rodando 24/7 **GRÁTIS**  
✅ N8N rodando 24/7 **GRÁTIS**  
✅ 2-3 instâncias WhatsApp suportadas  
✅ 30 GB de armazenamento  
✅ Backup automático  
✅ Monitoramento configurado  
✅ Scripts auxiliares  

**💰 Custo Total: R$ 0,00/mês**

**🚀 Quando crescer, faça upgrade para e2-small por ~R$ 65/mês**

---

**Precisa de ajuda?**
- Abra uma issue no GitHub
- Consulte a documentação
- Entre em contato: seu-email@exemplo.com

**Bom negócio! 🎯**
