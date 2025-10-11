# 🎯 Guia de Deploy - SaaS WhatsApp Platform

## 📚 Documentos Disponíveis

Este projeto possui documentação completa para deploy em produção:

### 🚀 Guias de Deploy

1. **[DEPLOY_QUICK_START.md](DEPLOY_QUICK_START.md)** ⚡
   - Deploy rápido em 10 minutos
   - Passo a passo resumido
   - **Recomendado para começar!**

2. **[DEPLOY_PRODUCAO_COMPLETO.md](DEPLOY_PRODUCAO_COMPLETO.md)** 📖
   - Guia completo e detalhado
   - Inclui troubleshooting
   - Configurações avançadas
   - **Leia para entender tudo**

3. **[DEPLOY_GCP_FREE.md](DEPLOY_GCP_FREE.md)** 💰
   - Foco no Free Tier do GCP
   - Otimizações para 1GB RAM
   - Limites e capacidades

4. **[PLANO_MIGRACAO.md](PLANO_MIGRACAO.md)** 📈
   - Estratégia de crescimento
   - Migração GCP → Hostinger
   - ROI e projeções

---

## 🛠️ Arquivos de Configuração

### Docker

- **docker-compose.yml** - Para desenvolvimento local
- **docker-compose.production.yml** - Otimizado para produção (1GB RAM)
- **docker-compose.simple.yml** - Versão simplificada

### Variáveis de Ambiente

- **env.example** - Exemplo para desenvolvimento
- **env.production.template** - Template para produção

---

## 📜 Scripts Automatizados

Todos os scripts estão em `/scripts/`:

### 1. Deploy Automatizado
```bash
./scripts/deploy-gcp-free-auto.sh
```
- Instala tudo automaticamente
- Configura ambiente completo
- Gera senhas seguras
- **Tempo: ~10 minutos**

### 2. Monitoramento
```bash
./scripts/monitor.sh
./scripts/monitor.sh --report  # Gerar relatório
```
- Status dos containers
- Uso de recursos (CPU, RAM, Disco)
- Conectividade
- Erros recentes

### 3. Backup Manual
```bash
./scripts/backup-manual.sh
```
- Backup completo do sistema
- Para containers temporariamente
- Mantém últimos 5 backups

### 4. Health Check
```bash
./scripts/healthcheck.sh
```
- Verifica saúde do sistema
- Pode ser usado com cron
- Suporta alertas (email/webhook)

### 5. Logs
```bash
./scripts/logs.sh evolution  # Evolution API
./scripts/logs.sh n8n        # N8N
./scripts/logs.sh            # Todos
```

### 6. Restart
```bash
./scripts/restart.sh
```
- Reinicia todos os serviços
- Verifica status após reiniciar

---

## ⚡ Deploy Rápido (TL;DR)

### Opção 1: Deploy Automatizado

```bash
# 1. Criar VM no GCP Free Tier
#    - e2-micro (1GB RAM)
#    - us-west1 (Oregon)
#    - Ubuntu 22.04 LTS

# 2. Conectar via SSH

# 3. Executar:
curl -sSL https://raw.githubusercontent.com/SEU_USER/Barbearia-SaaS/main/saas-whatsapp-platform/scripts/deploy-gcp-free-auto.sh | bash

# Pronto! 🎉
```

### Opção 2: Deploy Manual

```bash
# 1. Instalar Docker
curl -fsSL https://get.docker.com | sudo sh

# 2. Clonar repositório
git clone https://github.com/SEU_USER/Barbearia-SaaS.git
cd Barbearia-SaaS/saas-whatsapp-platform

# 3. Configurar .env
cp env.production.template .env
nano .env  # Editar com seu IP

# 4. Iniciar
docker-compose -f docker-compose.production.yml up -d
```

---

## 🌐 URLs de Acesso

Após o deploy, acesse:

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| **Evolution API** | http://SEU_IP:8080 | - |
| **N8N** | http://SEU_IP:5678 | admin / (senha gerada) |

---

## 💰 Custos

### GCP Free Tier
- **VM e2-micro**: R$ 0,00/mês (sempre grátis)
- **Tráfego**: 1GB/mês grátis
- **Disco**: 30GB grátis
- **Total**: **R$ 0,00/mês** 🎉

### Quando Crescer (Hostinger)
- **VPS 1 (4GB)**: R$ 24/mês (10-15 clientes)
- **VPS 2 (8GB)**: R$ 48/mês (20-30 clientes)

---

## 📊 Capacidades

### GCP Free Tier (1GB RAM)
- ✅ 2-3 instâncias WhatsApp
- ✅ 500-1000 mensagens/dia
- ✅ Workflows N8N básicos
- ✅ Perfeito para MVP e testes

### Hostinger VPS 1 (4GB RAM)
- ✅ 10-15 instâncias WhatsApp
- ✅ 5.000+ mensagens/dia
- ✅ Workflows N8N complexos
- ✅ Produção com múltiplos clientes

---

## 🔧 Comandos Essenciais

```bash
# Ir para diretório
cd ~/evolution-saas

# Status
docker-compose ps

# Logs em tempo real
docker-compose logs -f

# Recursos
docker stats

# Reiniciar
docker-compose restart

# Parar
docker-compose down

# Iniciar
docker-compose up -d

# Monitor completo
./scripts/monitor.sh

# Backup
./scripts/backup-manual.sh
```

---

## 📱 Configuração Inicial

### 1. Conectar WhatsApp
1. Acesse Evolution API: `http://SEU_IP:8080`
2. Create Instance → `minha_barbearia`
3. Escaneie QR Code
4. Aguarde "Connected"

### 2. Configurar N8N
1. Acesse N8N: `http://SEU_IP:5678`
2. Login com credenciais
3. Import workflows:
   - `01-whatsapp-message-handler.json`

### 3. Testar
1. Envie "oi" no WhatsApp
2. Deve receber resposta automática

---

## 🆘 Problemas Comuns

### Container não inicia
```bash
docker-compose logs
docker-compose restart
```

### Sem acesso externo
```bash
# Verificar firewall GCP
# Console → VPC Network → Firewall
# Adicionar regras para 8080 e 5678
```

### Memória insuficiente
```bash
# Adicionar swap
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

### Disco cheio
```bash
docker system prune -a
sudo journalctl --vacuum-time=3d
```

---

## 📈 Monitoramento

### Health Check Automatizado

Configure cron para executar a cada 5 minutos:

```bash
# Editar crontab
crontab -e

# Adicionar:
*/5 * * * * ~/evolution-saas/scripts/healthcheck.sh >> ~/evolution-saas/logs/healthcheck.log 2>&1
```

### Alertas (Opcional)

Configure no arquivo `.env`:

```bash
ALERT_EMAIL=seu-email@exemplo.com
WEBHOOK_ALERT=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
AUTO_RESTART=true
```

---

## 🔐 Segurança

### Checklist
- [ ] Senhas fortes no `.env`
- [ ] Firewall configurado (UFW)
- [ ] Backup automático ativo
- [ ] Logs sendo monitorados
- [ ] Health check configurado
- [ ] Sistema atualizado regularmente

### Atualizar Sistema
```bash
# Semanal
sudo apt update && sudo apt upgrade -y
docker-compose pull
docker-compose up -d
```

---

## 🎯 Próximos Passos

1. ✅ **Deploy** - Seguir DEPLOY_QUICK_START.md
2. ✅ **Configurar** - Conectar WhatsApp e N8N
3. ✅ **Testar** - Validar automações
4. 📱 **Clientes Piloto** - 2-3 clientes gratuitos
5. 💰 **Monetizar** - Captar primeiros clientes pagantes
6. 📈 **Escalar** - Migrar para Hostinger quando crescer

---

## 📚 Estrutura de Documentos

```
saas-whatsapp-platform/
├── 📄 DEPLOY_README.md              ← Você está aqui
├── ⚡ DEPLOY_QUICK_START.md         ← Comece por aqui!
├── 📖 DEPLOY_PRODUCAO_COMPLETO.md   ← Guia completo
├── 💰 DEPLOY_GCP_FREE.md            ← Detalhes Free Tier
├── 📈 PLANO_MIGRACAO.md             ← Crescimento
├── 🔗 INTEGRACAO_FRONTEND.md        ← Integração
├── 📋 PROJECT_SUMMARY.md            ← Visão geral
└── 📜 README.md                     ← README principal
```

---

## 💡 Dicas

1. **Comece pelo DEPLOY_QUICK_START.md** - Deploy em 10 minutos
2. **Use o script automatizado** - Evita erros manuais
3. **Monitore recursos** - GCP Free Tier tem 1GB RAM
4. **Faça backups regulares** - Backup automático já configurado
5. **Documente senhas** - Anote credenciais do `.env`
6. **Teste localmente primeiro** - Use docker-compose.yml normal

---

## 🎉 Conclusão

Você tem tudo pronto para:

✅ Deploy em produção **GRÁTIS** no GCP  
✅ Sistema otimizado para 1GB RAM  
✅ Scripts automatizados  
✅ Monitoramento configurado  
✅ Backup automático  
✅ Documentação completa  

**Custo: R$ 0,00/mês** 💰

**Próximo passo:** [DEPLOY_QUICK_START.md](DEPLOY_QUICK_START.md) 🚀

---

**Precisa de ajuda?**
- 📧 Email: seu-email@exemplo.com
- 💬 Issues: GitHub Issues
- 📖 Docs: Leia os arquivos `.md`

**Bom deploy! 🎯**

