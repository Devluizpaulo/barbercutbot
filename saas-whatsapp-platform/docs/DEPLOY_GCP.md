# 🚀 Deploy N8N + Evolution API no Google Cloud Platform

## 📋 Informações do Projeto

- **Projeto GCP**: `studio-343774762-16da7`
- **Console**: https://console.cloud.google.com/compute/instances?project=studio-343774762-16da7

---

## 🎯 Arquitetura de Deploy

```
Google Cloud Platform (GCP)
├── Compute Engine (VM)
│   ├── N8N Automation
│   ├── Evolution API
│   ├── PostgreSQL (opcional)
│   └── Redis (opcional)
│
└── Cloud Firestore
    └── Dados da aplicação
```

---

## 🚀 Passo a Passo - Deploy na VM

### 1️⃣ Criar VM no Compute Engine

1. **Acesse o Console GCP:**
   - https://console.cloud.google.com/compute/instances?project=studio-343774762-16da7

2. **Clique em "CREATE INSTANCE"**

3. **Configure a VM:**

```yaml
Nome: n8n-evolution-server
Região: us-central1 (ou southamerica-east1 para Brasil)
Zona: us-central1-a (ou southamerica-east1-a)

Tipo de máquina:
  Série: E2
  Tipo: e2-medium (2 vCPUs, 4 GB RAM)
  Custo estimado: ~$24/mês

Disco de inicialização:
  Sistema operacional: Ubuntu
  Versão: Ubuntu 22.04 LTS
  Tipo de disco de inicialização: SSD Persistente
  Tamanho: 30 GB

Firewall:
  ☑ Permitir tráfego HTTP
  ☑ Permitir tráfego HTTPS
```

4. **Clique em "CREATE"**

---

### 2️⃣ Conectar via SSH

**Opção A: Cloud Shell (Recomendado)**
```bash
# No Cloud Shell do GCP
gcloud compute ssh n8n-evolution-server --project=studio-343774762-16da7 --zone=us-central1-a
```

**Opção B: SSH direto pelo navegador**
- Clique no botão "SSH" ao lado da sua VM

---

### 3️⃣ Instalar Docker na VM

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalação
docker --version
docker-compose --version

# Relogar para aplicar grupo docker
exit
# Conecte novamente via SSH
```

---

### 4️⃣ Criar Estrutura de Arquivos

```bash
# Criar diretório do projeto
mkdir -p ~/saas-platform
cd ~/saas-platform

# Criar docker-compose.yml
nano docker-compose.yml
```

**Cole este conteúdo:**

```yaml
version: '3.9'

services:
  # Evolution API
  evolution-api:
    image: atendai/evolution-api:v2.1.1
    container_name: evolution_api
    restart: always
    ports:
      - "8080:8080"
    environment:
      # URLs
      - SERVER_URL=http://SEU_IP_EXTERNO:8080
      
      # Banco de Dados (SQLite local)
      - DATABASE_PROVIDER=
      - DATABASE_CONNECTION_CLIENT_NAME=evolution_gcp
      - DATABASE_SAVE_DATA_INSTANCE=true
      - DATABASE_SAVE_DATA_NEW_MESSAGE=true
      - DATABASE_SAVE_MESSAGE_UPDATE=true
      
      # API Key
      - AUTHENTICATION_API_KEY=sua_chave_secreta_gcp_2024
      
      # Sessão
      - CONFIG_SESSION_PHONE_CLIENT=Evolution API
      - CONFIG_SESSION_PHONE_NAME=Chrome
      
      # Webhook para N8N
      - WEBHOOK_GLOBAL_URL=http://n8n:5678/webhook/whatsapp
      - WEBHOOK_GLOBAL_ENABLED=true
      - WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false
      
      # Eventos
      - WEBHOOK_EVENTS_QRCODE_UPDATED=true
      - WEBHOOK_EVENTS_MESSAGES_UPSERT=true
      - WEBHOOK_EVENTS_MESSAGES_UPDATE=true
      - WEBHOOK_EVENTS_SEND_MESSAGE=true
      - WEBHOOK_EVENTS_CONNECTION_UPDATE=true
      
      # Logs
      - LOG_LEVEL=ERROR
      - LOG_COLOR=true
      
      # CORS
      - CORS_ORIGIN=*
      - CORS_METHODS=GET,POST,PUT,DELETE
      - CORS_CREDENTIALS=true
    volumes:
      - evolution_data:/evolution/instances
    networks:
      - saas-network

  # N8N
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      # URLs
      - N8N_HOST=0.0.0.0
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - WEBHOOK_URL=http://SEU_IP_EXTERNO:5678/
      
      # Autenticação
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=SuaSenhaSegura2024!
      
      # Timezone
      - GENERIC_TIMEZONE=America/Sao_Paulo
      - TZ=America/Sao_Paulo
      
      # Execuções
      - EXECUTIONS_DATA_SAVE_ON_ERROR=all
      - EXECUTIONS_DATA_SAVE_ON_SUCCESS=all
      
      # Encryption
      - N8N_ENCRYPTION_KEY=sua_chave_encriptacao_gcp_2024
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - saas-network
    depends_on:
      - evolution-api

volumes:
  evolution_data:
    driver: local
  n8n_data:
    driver: local

networks:
  saas-network:
    driver: bridge
```

**Salvar:** `Ctrl+O`, `Enter`, `Ctrl+X`

---

### 5️⃣ Obter IP Externo da VM

```bash
# Obter IP externo
curl -s ifconfig.me
# ou
curl -s icanhazip.com
```

**Anote o IP!** Exemplo: `34.123.45.67`

---

### 6️⃣ Atualizar docker-compose.yml com o IP

```bash
# Editar arquivo
nano docker-compose.yml

# Substituir "SEU_IP_EXTERNO" pelo IP obtido
# Exemplo: http://34.123.45.67:8080
```

---

### 7️⃣ Configurar Firewall do GCP

**Via Console:**
1. Acesse: https://console.cloud.google.com/networking/firewalls/list?project=studio-343774762-16da7
2. Clique em "CREATE FIREWALL RULE"

**Regra 1: Evolution API (porta 8080)**
```yaml
Nome: allow-evolution-api
Destinos: Todas as instâncias na rede
Filtro de origem: Intervalos de IP
Intervalos de IP de origem: 0.0.0.0/0
Protocolos e portas: tcp:8080
```

**Regra 2: N8N (porta 5678)**
```yaml
Nome: allow-n8n
Destinos: Todas as instâncias na rede
Filtro de origem: Intervalos de IP
Intervalos de IP de origem: 0.0.0.0/0
Protocolos e portas: tcp:5678
```

**Via Cloud Shell:**
```bash
# Criar regras de firewall
gcloud compute firewall-rules create allow-evolution-api \
    --project=studio-343774762-16da7 \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:8080 \
    --source-ranges=0.0.0.0/0

gcloud compute firewall-rules create allow-n8n \
    --project=studio-343774762-16da7 \
    --direction=INGRESS \
    --priority=1000 \
    --network=default \
    --action=ALLOW \
    --rules=tcp:5678 \
    --source-ranges=0.0.0.0/0
```

---

### 8️⃣ Iniciar os Serviços

```bash
# Dentro do diretório ~/saas-platform
cd ~/saas-platform

# Iniciar containers
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs
docker-compose logs -f
```

---

### 9️⃣ Acessar os Serviços

**Evolution API:**
```
http://SEU_IP_EXTERNO:8080
```

**N8N:**
```
http://SEU_IP_EXTERNO:5678
Usuário: admin
Senha: SuaSenhaSegura2024!
```

---

## 🔐 Configurar HTTPS (Opcional mas Recomendado)

### Opção 1: Cloudflare Tunnel (Grátis)

```bash
# Instalar Cloudflare Tunnel
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb

# Autenticar
cloudflared tunnel login

# Criar tunnel
cloudflared tunnel create saas-platform

# Configurar rotas
cloudflared tunnel route dns saas-platform n8n.seudominio.com
cloudflared tunnel route dns saas-platform evolution.seudominio.com

# Criar config
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

**Conteúdo do config.yml:**
```yaml
tunnel: SEU_TUNNEL_ID
credentials-file: /home/usuario/.cloudflared/SEU_TUNNEL_ID.json

ingress:
  - hostname: n8n.seudominio.com
    service: http://localhost:5678
  - hostname: evolution.seudominio.com
    service: http://localhost:8080
  - service: http_status:404
```

```bash
# Iniciar tunnel
cloudflared tunnel run saas-platform
```

### Opção 2: Nginx + Let's Encrypt

```bash
# Instalar Nginx e Certbot
sudo apt install nginx certbot python3-certbot-nginx -y

# Configurar Nginx
sudo nano /etc/nginx/sites-available/saas-platform
```

```nginx
server {
    listen 80;
    server_name n8n.seudominio.com;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

server {
    listen 80;
    server_name evolution.seudominio.com;

    location / {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/saas-platform /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Obter certificados SSL
sudo certbot --nginx -d n8n.seudominio.com -d evolution.seudominio.com
```

---

## 💰 Custos Estimados GCP

### VM e2-medium (2 vCPUs, 4 GB RAM)

| Item | Custo Mensal | Custo Anual |
|------|--------------|-------------|
| VM e2-medium | ~$24 | ~$288 |
| 30 GB SSD Persistente | ~$6 | ~$72 |
| Tráfego de rede (100GB) | ~$12 | ~$144 |
| IP Externo Estático | ~$7 | ~$84 |
| **TOTAL** | **~$49/mês** | **~$588/ano** |

### Otimização de Custos

1. **Use preemptible VMs** (70% desconto)
   - Custo: ~$15/mês
   - Limitação: VM pode ser desligada a qualquer momento

2. **Committed Use Discounts**
   - Compromisso de 1 ano: 25% desconto
   - Compromisso de 3 anos: 52% desconto

3. **Cloud Run (alternativa)**
   - Pague apenas pelo uso
   - Escala automaticamente
   - Custo: ~$10-30/mês

---

## 📊 Monitoramento

### Configurar Logging

```bash
# Ver logs em tempo real
docker-compose logs -f

# Ver logs específicos
docker-compose logs -f n8n
docker-compose logs -f evolution-api
```

### Configurar Alertas no GCP

1. Acesse: https://console.cloud.google.com/monitoring/alerting?project=studio-343774762-16da7
2. Crie alertas para:
   - CPU > 80%
   - Memória > 90%
   - Disco > 85%

---

## 🔄 Backup e Recuperação

### Backup Manual

```bash
# Parar containers
docker-compose down

# Backup volumes
sudo tar -czf backup-$(date +%Y%m%d).tar.gz \
  /var/lib/docker/volumes/saas-platform_evolution_data \
  /var/lib/docker/volumes/saas-platform_n8n_data

# Upload para Cloud Storage
gsutil cp backup-*.tar.gz gs://seu-bucket-backup/
```

### Backup Automatizado

```bash
# Criar script de backup
nano ~/backup.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_$DATE.tar.gz"

cd ~/saas-platform
docker-compose down

sudo tar -czf /tmp/$BACKUP_FILE \
  /var/lib/docker/volumes/saas-platform_evolution_data \
  /var/lib/docker/volumes/saas-platform_n8n_data

gsutil cp /tmp/$BACKUP_FILE gs://seu-bucket-backup/

docker-compose up -d

# Limpar backups antigos (manter últimos 7 dias)
gsutil ls gs://seu-bucket-backup/ | head -n -7 | xargs -r gsutil rm

rm /tmp/$BACKUP_FILE
```

```bash
# Tornar executável
chmod +x ~/backup.sh

# Agendar backup diário (3h da manhã)
crontab -e
# Adicionar linha:
0 3 * * * ~/backup.sh >> ~/backup.log 2>&1
```

---

## 🚀 Comandos Úteis

```bash
# Status dos containers
docker-compose ps

# Logs em tempo real
docker-compose logs -f

# Reiniciar serviços
docker-compose restart

# Parar tudo
docker-compose down

# Atualizar imagens
docker-compose pull
docker-compose up -d

# Limpar recursos não usados
docker system prune -a

# Ver uso de recursos
docker stats

# Entrar no container
docker exec -it n8n /bin/sh
docker exec -it evolution_api /bin/bash
```

---

## 🎯 Próximos Passos

1. ✅ **VM criada e configurada**
2. ✅ **Docker instalado**
3. ✅ **Serviços rodando**
4. ✅ **Firewall configurado**
5. ⏳ **Configurar domínio e HTTPS**
6. ⏳ **Conectar WhatsApp**
7. ⏳ **Importar workflows N8N**
8. ⏳ **Integrar com Firestore**

---

## 🆘 Troubleshooting

### Problema: Containers não iniciam

```bash
# Ver logs de erro
docker-compose logs

# Verificar portas em uso
sudo netstat -tulpn | grep -E ':(8080|5678)'

# Reiniciar Docker
sudo systemctl restart docker
```

### Problema: Não consigo acessar externamente

```bash
# Verificar firewall GCP
gcloud compute firewall-rules list --project=studio-343774762-16da7

# Verificar se portas estão escutando
sudo netstat -tulpn | grep -E ':(8080|5678)'

# Testar conexão interna
curl http://localhost:8080
curl http://localhost:5678
```

### Problema: Sem espaço em disco

```bash
# Ver uso de disco
df -h

# Limpar Docker
docker system prune -a --volumes

# Aumentar disco da VM (via console GCP)
```

---

## 📚 Recursos Úteis

- **Documentação GCP**: https://cloud.google.com/compute/docs
- **Evolution API**: https://doc.evolution-api.com
- **N8N Docs**: https://docs.n8n.io
- **Docker Compose**: https://docs.docker.com/compose/

---

**🎉 Seu N8N + Evolution API estará rodando 24/7 no Google Cloud!**
