# ⚡ Deploy Rápido no Google Cloud - 10 Minutos

## 🎯 Seu Projeto GCP

**Projeto**: `studio-343774762-16da7`  
**Console**: https://console.cloud.google.com/compute/instances?project=studio-343774762-16da7

---

## 🚀 Método 1: Deploy Automático (Recomendado)

### 1. Abra o Cloud Shell

1. Acesse: https://console.cloud.google.com/compute/instances?project=studio-343774762-16da7
2. Clique no ícone **">_"** (Cloud Shell) no canto superior direito

### 2. Execute o Script de Deploy

```bash
# Baixar script
curl -sSL https://raw.githubusercontent.com/seu-usuario/seu-repo/main/scripts/deploy-gcp.sh -o deploy-gcp.sh

# Tornar executável
chmod +x deploy-gcp.sh

# Executar
./deploy-gcp.sh
```

**⏱️ Tempo total: ~5-7 minutos**

---

## 🛠️ Método 2: Deploy Manual

### Passo 1: Criar VM (2 min)

```bash
# No Cloud Shell
gcloud compute instances create n8n-evolution-server \
  --project=studio-343774762-16da7 \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=30GB \
  --boot-disk-type=pd-ssd \
  --tags=http-server,https-server
```

### Passo 2: Configurar Firewall (1 min)

```bash
# Permitir Evolution API (porta 8080)
gcloud compute firewall-rules create allow-evolution-api \
  --project=studio-343774762-16da7 \
  --allow=tcp:8080 \
  --source-ranges=0.0.0.0/0

# Permitir N8N (porta 5678)
gcloud compute firewall-rules create allow-n8n \
  --project=studio-343774762-16da7 \
  --allow=tcp:5678 \
  --source-ranges=0.0.0.0/0
```

### Passo 3: Conectar via SSH (1 min)

```bash
gcloud compute ssh n8n-evolution-server \
  --zone=us-central1-a \
  --project=studio-343774762-16da7
```

### Passo 4: Instalar Docker (3 min)

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
```

### Passo 5: Criar docker-compose.yml (2 min)

```bash
# Obter IP externo primeiro
MY_IP=$(curl -s ifconfig.me)
echo "Seu IP: $MY_IP"

# Criar arquivo
cat > docker-compose.yml <<'EOF'
version: '3.9'

services:
  evolution-api:
    image: atendai/evolution-api:v2.1.1
    container_name: evolution_api
    restart: always
    ports:
      - "8080:8080"
    environment:
      - SERVER_URL=http://SEU_IP:8080
      - DATABASE_PROVIDER=
      - AUTHENTICATION_API_KEY=gcp_key_2024
      - CONFIG_SESSION_PHONE_CLIENT=Evolution
      - WEBHOOK_GLOBAL_URL=http://n8n:5678/webhook/whatsapp
      - WEBHOOK_GLOBAL_ENABLED=true
      - LOG_LEVEL=ERROR
    volumes:
      - evolution_data:/evolution/instances
    networks:
      - net

  n8n:
    image: n8nio/n8n:latest
    container_name: n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=0.0.0.0
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=admin123
      - WEBHOOK_URL=http://SEU_IP:5678/
      - TZ=America/Sao_Paulo
    volumes:
      - n8n_data:/home/node/.n8n
    networks:
      - net

volumes:
  evolution_data:
  n8n_data:

networks:
  net:
EOF

# Substituir SEU_IP pelo IP real
sed -i "s/SEU_IP/$MY_IP/g" docker-compose.yml
```

### Passo 6: Iniciar (1 min)

```bash
docker-compose up -d
docker-compose ps
```

---

## 🌐 URLs de Acesso

Após o deploy, acesse:

```
Evolution API: http://SEU_IP:8080
N8N:          http://SEU_IP:5678
  Usuário: admin
  Senha: admin123
```

**Para descobrir seu IP:**
```bash
curl ifconfig.me
```

---

## ✅ Verificar se Está Funcionando

```bash
# Ver logs
docker-compose logs -f

# Status dos containers
docker-compose ps

# Testar Evolution API
curl http://localhost:8080

# Testar N8N
curl http://localhost:5678
```

---

## 🔧 Comandos Úteis

```bash
# Parar tudo
docker-compose down

# Reiniciar
docker-compose restart

# Ver logs específicos
docker-compose logs -f evolution-api
docker-compose logs -f n8n

# Atualizar imagens
docker-compose pull
docker-compose up -d

# Backup
sudo tar -czf backup.tar.gz \
  /var/lib/docker/volumes/*evolution* \
  /var/lib/docker/volumes/*n8n*
```

---

## 💰 Custos

**VM e2-medium**: ~$24/mês  
**30GB SSD**: ~$6/mês  
**Tráfego**: ~$12/mês  
**IP Estático**: ~$7/mês

**Total: ~$49/mês**

---

## 🎯 Próximos Passos

1. ✅ Acesse Evolution: `http://SEU_IP:8080`
2. ✅ Conecte WhatsApp (escaneie QR Code)
3. ✅ Acesse N8N: `http://SEU_IP:5678`
4. ✅ Importe workflows
5. ⏳ Configure domínio (opcional)
6. ⏳ Configure HTTPS (opcional)

---

## 🆘 Problemas Comuns

### Não consigo acessar externamente

```bash
# Verificar firewall GCP
gcloud compute firewall-rules list

# Verificar se porta está aberta
sudo netstat -tulpn | grep -E ':(8080|5678)'

# Testar internamente primeiro
curl http://localhost:8080
curl http://localhost:5678
```

### Containers não iniciam

```bash
# Ver erro
docker-compose logs

# Reiniciar Docker
sudo systemctl restart docker
docker-compose up -d
```

### Sem espaço em disco

```bash
# Ver uso
df -h

# Limpar
docker system prune -a
```

---

## 📚 Documentação Completa

Veja `docs/DEPLOY_GCP.md` para:
- Configuração de HTTPS
- Backup automatizado
- Monitoramento
- Otimização de custos
- Troubleshooting avançado

---

**🎉 Seu N8N + Evolution API rodando 24/7 no Google Cloud!**

**Suporte**: Abra uma issue ou consulte a documentação
