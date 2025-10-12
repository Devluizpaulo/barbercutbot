# 🆓 Deploy GRATUITO no Google Cloud Platform

## 💰 Google Cloud Free Tier - PARA SEMPRE GRÁTIS!

O Google Cloud oferece uma VM **gratuita permanentemente** com estas especificações:

| Item | Especificação | Custo |
|------|---------------|-------|
| **Tipo** | e2-micro | **GRÁTIS** |
| **vCPU** | 1 compartilhada | **GRÁTIS** |
| **RAM** | 1 GB | **GRÁTIS** |
| **Disco** | 30 GB HDD Standard | **GRÁTIS** |
| **Tráfego** | 1 GB/mês saída (entrada ilimitada) | **GRÁTIS** |
| **Região** | us-west1 (Oregon) | **GRÁTIS** |

**💡 Perfeito para:** 2-3 instâncias WhatsApp simultâneas com Evolution API

---

## 🚀 Deploy Passo a Passo (10 minutos)

### ✅ **Passo 1: Criar VM Gratuita**

1. **Acesse seu projeto:**
   - https://console.cloud.google.com/compute/instances?project=studio-343774762-16da7

2. **Clique em "CREATE INSTANCE"**

3. **Configure a VM GRATUITA:**

```yaml
Nome: evolution-api-free
Região: us-west1 (Oregon)  ⚠️ IMPORTANTE: Somente esta região é gratuita!
Zona: us-west1-b

Configuração da máquina:
  Série: E2
  Tipo de máquina: e2-micro (1 vCPU compartilhada, 1 GB de memória)
  💰 Custo: GRATUITO

Disco de inicialização:
  Sistema operacional: Ubuntu
  Versão: Ubuntu 22.04 LTS
  Tipo de disco: Standard persistent disk  ⚠️ IMPORTANTE: Não escolha SSD
  Tamanho: 30 GB
  💰 Custo: GRATUITO

Firewall:
  ☑ Permitir tráfego HTTP
  ☑ Permitir tráfego HTTPS
```

4. **Clique em "CREATE"**

⏱️ **Tempo de criação:** ~2 minutos

---

### ✅ **Passo 2: Configurar Firewall**

**Via Cloud Shell** (recomendado):

```bash
# Abrir Cloud Shell (ícone >_ no topo)

# Permitir Evolution API (porta 8081)
gcloud compute firewall-rules create allow-evolution-free \
  --project=studio-343774762-16da7 \
  --direction=INGRESS \
  --priority=1000 \
  --network=default \
  --action=ALLOW \
  --rules=tcp:8081 \
  --source-ranges=0.0.0.0/0 \
  --description="Evolution API - Free Tier"

# Permitir N8N (porta 5678)
gcloud compute firewall-rules create allow-n8n-free \
  --project=studio-343774762-16da7 \
  --direction=INGRESS \
  --priority=1000 \
  --network=default \
  --action=ALLOW \
  --rules=tcp:5678 \
  --source-ranges=0.0.0.0/0 \
  --description="N8N Automation - Free Tier"
```

---

### ✅ **Passo 3: Conectar via SSH**

**Opção A: SSH pelo navegador** (mais fácil)
- Na lista de VMs, clique em "SSH" ao lado de `evolution-api-free`

**Opção B: Via Cloud Shell**
```bash
gcloud compute ssh evolution-api-free \
  --zone=us-west1-b \
  --project=studio-343774762-16da7
```

---

### ✅ **Passo 4: Instalar Docker** (3 minutos)

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker (versão otimizada)
curl -fsSL https://get.docker.com | sudo sh

# Adicionar seu usuário ao grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalação
docker --version
docker-compose --version

# IMPORTANTE: Relogar para aplicar grupo docker
exit
# Conecte novamente via SSH
```

---

### ✅ **Passo 5: Obter IP Externo**

```bash
# Obter seu IP público
curl -s ifconfig.me

# Ou via gcloud
gcloud compute instances describe evolution-api-free \
  --zone=us-west1-b \
  --format='get(networkInterfaces[0].accessConfigs[0].natIP)'
```

**📝 Anote o IP!** Exemplo: `35.199.123.45`

---

### ✅ **Passo 6: Criar docker-compose.yml Otimizado**

```bash
# Criar diretório
mkdir -p ~/evolution-saas
cd ~/evolution-saas

# Salvar seu IP em variável (substitua pelo IP real)
export MY_IP=$(curl -s ifconfig.me)
echo "Seu IP: $MY_IP"

# Criar docker-compose.yml OTIMIZADO para 1GB RAM
cat > docker-compose.yml <<EOF
version: '3.9'

services:
  # Evolution API - Otimizado para Free Tier
  evolution-api:
    image: atendai/evolution-api:v2.2.2
    container_name: evolution_api
    restart: unless-stopped
    ports:
      - "8081:8080"
    environment:
      # URLs
      - SERVER_URL=http://${MY_IP}:8081
      
      # Banco SQLite (mais leve que PostgreSQL)
      - DATABASE_PROVIDER=
      - DATABASE_CONNECTION_CLIENT_NAME=evolution_free
      - DATABASE_SAVE_DATA_INSTANCE=true
      - DATABASE_SAVE_DATA_NEW_MESSAGE=true
      - DATABASE_SAVE_MESSAGE_UPDATE=false
      - DATABASE_SAVE_DATA_CONTACTS=false
      - DATABASE_SAVE_DATA_CHATS=false
      
      # API Key
      - AUTHENTICATION_API_KEY=free_tier_key_2024
      
      # Sessão
      - CONFIG_SESSION_PHONE_CLIENT=Evolution
      - CONFIG_SESSION_PHONE_NAME=Chrome
      
      # Webhook N8N
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
      - saas
    # IMPORTANTE: Limitar recursos
    mem_limit: 512m
    mem_reservation: 256m

  # N8N - Otimizado para Free Tier
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
      - WEBHOOK_URL=http://${MY_IP}:5678/
      
      # Autenticação
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=Admin123Free!
      
      # Timezone
      - GENERIC_TIMEZONE=America/Sao_Paulo
      - TZ=America/Sao_Paulo
      
      # Execuções (economizar espaço)
      - EXECUTIONS_DATA_SAVE_ON_ERROR=all
      - EXECUTIONS_DATA_SAVE_ON_SUCCESS=none
      - EXECUTIONS_DATA_PRUNE=true
      - EXECUTIONS_DATA_MAX_AGE=168
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - saas
    # IMPORTANTE: Limitar recursos
    mem_limit: 400m
    mem_reservation: 200m
    depends_on:
      - evolution-api

volumes:
  evolution_data:
    driver: local
  n8n_data:
    driver: local

networks:
  saas:
    driver: bridge
EOF

echo "✅ docker-compose.yml criado com IP: $MY_IP"
```

---

### ✅ **Passo 7: Otimizar Sistema** (Opcional mas Recomendado)

```bash
# Criar arquivo de swap (memória virtual) - Ajuda com 1GB RAM
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Tornar permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verificar swap ativo
free -h
```

---

### ✅ **Passo 8: Iniciar Serviços**

```bash
cd ~/evolution-saas

# Iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f

# Verificar status (aguarde ~30 segundos)
docker-compose ps

# Ver uso de recursos
docker stats --no-stream
```

---

## 🌐 Acessar Seus Serviços

**Evolution API:**
```
http://SEU_IP:8081
```

**N8N:**
```
http://SEU_IP:5678
Usuário: admin
Senha: Admin123Free!
```

---

## 📊 Monitorar Recursos (1GB RAM)

```bash
# Ver uso de memória
free -h

# Ver uso de recursos dos containers
docker stats

# Ver disco
df -h

# Se precisar liberar espaço
docker system prune -a
```

---

## ⚠️ Limites do Free Tier

### ✅ O Que Funciona Bem:
- 2-3 instâncias WhatsApp simultâneas
- Mensagens de texto
- Webhooks e automações N8N básicas
- Respostas automáticas

### ⚠️ Limitações:
- **Tráfego:** 1GB/mês de saída (entrada ilimitada)
  - ~1.000 mensagens com imagens por mês
  - Mensagens texto: praticamente ilimitadas
- **CPU:** Compartilhada (pode ter lentidão em horários de pico)
- **RAM:** 1GB (suficiente, mas sem folga)

### 💡 Dicas de Otimização:

1. **Economizar tráfego:**
   ```bash
   # No docker-compose.yml, já configurado:
   - DATABASE_SAVE_MESSAGE_UPDATE=false
   - DATABASE_SAVE_DATA_CONTACTS=false
   - EXECUTIONS_DATA_SAVE_ON_SUCCESS=none
   ```

2. **Limpar dados antigos regularmente:**
   ```bash
   # Executar semanalmente
   docker system prune -a
   ```

3. **Monitorar tráfego:**
   - https://console.cloud.google.com/networking/networkanalyzer?project=studio-343774762-16da7

---

## 🚀 Upgrade Quando Necessário

### Quando fazer upgrade?

- **Mais de 3 instâncias WhatsApp**
- **Tráfego > 1GB/mês**
- **Lentidão frequente**
- **Precisa de mais RAM**

### Opções de Upgrade:

**1. e2-small (2GB RAM):**
- Custo: ~$13/mês
- 2x mais RAM
- Melhor performance

**2. e2-medium (4GB RAM):**
- Custo: ~$26/mês
- 4x mais RAM
- Suporta 10+ instâncias

**Como fazer upgrade:**
```bash
# Parar VM
gcloud compute instances stop evolution-api-free --zone=us-west1-b

# Mudar tipo
gcloud compute instances set-machine-type evolution-api-free \
  --machine-type=e2-small \
  --zone=us-west1-b

# Iniciar
gcloud compute instances start evolution-api-free --zone=us-west1-b
```

---

## 🛡️ Segurança Básica

```bash
# Atualizar sistema regularmente
sudo apt update && sudo apt upgrade -y

# Configurar firewall local (ufw)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 8081/tcp
sudo ufw allow 5678/tcp
sudo ufw enable
```

---

## 💾 Backup Básico

```bash
# Criar script de backup
nano ~/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
cd ~/evolution-saas
docker-compose down
tar -czf ~/backup-$DATE.tar.gz \
  ~/evolution-saas \
  /var/lib/docker/volumes/*evolution* \
  /var/lib/docker/volumes/*n8n*
docker-compose up -d
echo "Backup criado: ~/backup-$DATE.tar.gz"
```

```bash
chmod +x ~/backup.sh

# Executar backup manual
~/backup.sh

# Agendar backup semanal (domingo 3h)
crontab -e
# Adicionar:
0 3 * * 0 ~/backup.sh
```

---

## 📈 Estatísticas de Uso Real

**Com e2-micro (1GB RAM):**

| Cenário | Performance |
|---------|-------------|
| 1 instância WhatsApp | ✅ Excelente |
| 2 instâncias WhatsApp | ✅ Bom |
| 3 instâncias WhatsApp | ⚠️ Funciona, mas próximo do limite |
| 4+ instâncias | ❌ Necessário upgrade |
| Mensagens/dia | ~500-1000 texto OK |
| N8N workflows simples | ✅ OK |
| N8N workflows complexos | ⚠️ Pode ter lentidão |

---

## 🎯 Checklist de Deploy

- [ ] VM e2-micro criada em **us-west1**
- [ ] Firewall configurado (portas 8081, 5678)
- [ ] Docker e Docker Compose instalados
- [ ] Swap de 1GB configurado
- [ ] docker-compose.yml criado com IP correto
- [ ] Containers iniciados e funcionando
- [ ] Evolution API acessível externamente
- [ ] N8N acessível externamente
- [ ] WhatsApp conectado
- [ ] Backup configurado

---

## 💡 Comandos Rápidos

```bash
# Ver status
cd ~/evolution-saas && docker-compose ps

# Ver logs
docker-compose logs -f evolution-api
docker-compose logs -f n8n

# Reiniciar
docker-compose restart

# Parar
docker-compose down

# Iniciar
docker-compose up -d

# Ver uso de recursos
docker stats --no-stream

# Limpar espaço
docker system prune -a
```

---

## 🆘 Problemas Comuns

### Container reiniciando (OOM - Out of Memory)

```bash
# Verificar logs
docker-compose logs --tail 50

# Adicionar mais swap
sudo fallocate -l 2G /swapfile2
sudo chmod 600 /swapfile2
sudo mkswap /swapfile2
sudo swapon /swapfile2

# Ou fazer upgrade da VM
```

### Lentidão

```bash
# Ver uso de CPU
top

# Limitar execuções N8N antigas
docker exec n8n n8n execute --prune
```

### Disco cheio

```bash
# Ver uso
df -h

# Limpar Docker
docker system prune -a --volumes

# Limpar logs do sistema
sudo journalctl --vacuum-time=3d
```

---

## 🎉 Resumo

**✅ Você agora tem:**
- Evolution API rodando 24/7 **GRÁTIS**
- N8N rodando 24/7 **GRÁTIS**
- 2-3 instâncias WhatsApp suportadas
- 30 GB de armazenamento
- Backup automático  

**💰 Custo Total: R$ 0,00/mês**

**🚀 Quando crescer, upgrade para e2-small por ~R$ 65/mês**

---

**📚 Próximo Passo:** Conecte seu WhatsApp e comece a automatizar!
