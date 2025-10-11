# ⚡ Deploy Rápido - 10 Minutos

## 🚀 Deploy Automático no GCP Free Tier

### Passo 1: Criar VM (2 min)

1. Acesse: https://console.cloud.google.com/compute/instances
2. Clique em **"CREATE INSTANCE"**
3. Configure:

```
Nome: evolution-saas-prod
Região: us-west1 (Oregon)
Tipo: e2-micro (1 GB RAM)
Disco: 30 GB Standard
SO: Ubuntu 22.04 LTS
```

4. Clique em **"CREATE"**

---

### Passo 2: Conectar SSH (30 seg)

Clique no botão **"SSH"** ao lado da VM criada.

---

### Passo 3: Executar Script (7 min)

Cole e execute:

```bash
curl -sSL https://raw.githubusercontent.com/SEU_USUARIO/Barbearia-SaaS/main/saas-whatsapp-platform/scripts/deploy-gcp-free-auto.sh | bash
```

**OU se preferir ver o script antes:**

```bash
# Baixar
curl -sSL https://raw.githubusercontent.com/SEU_USUARIO/Barbearia-SaaS/main/saas-whatsapp-platform/scripts/deploy-gcp-free-auto.sh -o deploy.sh

# Ver conteúdo
cat deploy.sh

# Executar
chmod +x deploy.sh
./deploy.sh
```

**Aguarde ~7 minutos** enquanto o script:
- ✅ Instala Docker
- ✅ Configura Swap
- ✅ Configura Firewall
- ✅ Cria estrutura
- ✅ Inicia containers

---

### Passo 4: Anotar Informações (30 seg)

No final do script, você verá:

```
╔════════════════════════════════════════════════════════╗
║  ✅  DEPLOY CONCLUÍDO COM SUCESSO!                     ║
╚════════════════════════════════════════════════════════╝

IP Externo: 34.XXX.XXX.XXX

Evolution API: http://34.XXX.XXX.XXX:8080
N8N: http://34.XXX.XXX.XXX:5678
  Usuário: admin
  Senha: AbCdEf123Free!

INFO salvo em: ~/evolution-saas/INFO.txt
```

**📝 ANOTE ESTAS INFORMAÇÕES!**

---

## 🌐 Acessar Serviços

### Evolution API
```
http://SEU_IP:8080
```

### N8N
```
http://SEU_IP:5678
Usuário: admin
Senha: (a mostrada no deploy)
```

---

## 📱 Conectar WhatsApp (2 min)

1. Acesse: `http://SEU_IP:8080`
2. Clique em **"Create Instance"**
3. Nome: `minha_barbearia`
4. Integration: `WHATSAPP-BAILEYS`
5. Clique em **"Connect"**
6. Escaneie QR Code com WhatsApp
7. Aguarde status "Connected" ✅

---

## 🤖 Importar Workflows N8N (3 min)

1. Acesse: `http://SEU_IP:5678`
2. Login com as credenciais
3. Clique em **"Workflows"** → **"Add Workflow"**
4. Clique em **"..."** → **"Import from File"**
5. Importe: `01-whatsapp-message-handler.json`
6. Clique em **"Active"** para ativar

---

## 🧪 Testar (1 min)

1. Envie **"oi"** para o WhatsApp conectado
2. Deve receber:
```
👋 Olá! Bem-vindo!

Eu sou o assistente virtual da barbearia.

Como posso te ajudar hoje?

• Digite AGENDAR para marcar horário
• Digite PREÇOS para ver valores
• Digite LOCALIZAÇÃO para nosso endereço
• Digite HORÁRIOS para disponibilidade
```

---

## ✅ Pronto!

Seu SaaS WhatsApp está rodando **24/7 GRÁTIS**!

---

## 💡 Comandos Úteis

```bash
# Ver status
cd ~/evolution-saas
docker-compose ps

# Ver logs
docker-compose logs -f

# Monitor
./scripts/monitor.sh

# Backup
./scripts/backup-manual.sh

# Ver informações
cat INFO.txt
```

---

## 📚 Documentação Completa

- [DEPLOY_PRODUCAO_COMPLETO.md](DEPLOY_PRODUCAO_COMPLETO.md) - Guia detalhado
- [DEPLOY_GCP_FREE.md](DEPLOY_GCP_FREE.md) - Detalhes Free Tier
- [README.md](README.md) - Visão geral

---

## 🆘 Problemas?

### Não consigo acessar externamente

```bash
# Verificar IP
curl ifconfig.me

# Verificar firewall GCP
# Acesse: https://console.cloud.google.com/networking/firewalls/list
# Crie regras para portas 8080 e 5678 se necessário

# Verificar containers
docker-compose ps
```

### Container não está rodando

```bash
# Ver logs
docker-compose logs

# Reiniciar
cd ~/evolution-saas
docker-compose restart
```

### Esqueci a senha do N8N

```bash
# Ver senha
cd ~/evolution-saas
grep N8N_BASIC_AUTH_PASSWORD .env

# Ou ver arquivo INFO
cat INFO.txt
```

---

**🎉 Parabéns! Você agora tem um SaaS rodando grátis no Google Cloud!**

**Custo: R$ 0,00/mês** 💰

