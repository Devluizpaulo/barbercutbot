# 🚀 SaaS Automação WhatsApp - Barbearias

## ✅ **Status: EM PRODUÇÃO**

Sistema multi-tenant de automação WhatsApp com IA para barbearias.

**Servidor:** 34.182.111.255 (GCP Free Tier)  
**Custo:** R$ 0,00/mês  
**Projeto ID:** studio-343774762-16da7

---

## 🏗️ Arquitetura

```
VM GCP (34.182.111.255)
├── Evolution API v1.7.4 :8080  ✅
├── N8N :5678  ✅
└── SQLite (leve)

Firebase (studio-343774762-16da7)
├── Firestore ✅
└── Auth/Hosting (futuro)

Groq IA
└── Llama 3.1-70b ✅ (14k req/dia grátis)
```

---

## 🌐 Acessos Rápidos

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| **Evolution API** | http://34.182.111.255:8080/manager | API Key: gcp_free_key_2024 |
| **N8N** | http://34.182.111.255:5678 | admin / Admin2024Free! |
| **Firebase Console** | [Link](https://console.firebase.google.com/project/studio-343774762-16da7) | Conta Google |
| **Firestore** | [Link](https://console.firebase.google.com/project/studio-343774762-16da7/firestore) | Conta Google |

---

## 📁 Estrutura Organizada

```
saas-whatsapp-platform/
│
├── 📄 LEIA-ME-PRIMEIRO.md          ⭐ COMECE AQUI!
├── 📄 INDEX.md                     Índice completo
├── 📄 STATUS_PROJETO.md            Status detalhado
│
├── 📖 docs/
│   ├── deploy/                     Deploy e infraestrutura
│   │   ├── 01-DEPLOY-GUIA-COMPLETO.md
│   │   ├── DEPLOY_GCP_FREE.md
│   │   └── DEPLOY_PRODUCAO_COMPLETO.md
│   │
│   ├── setup/                      Configuração e schema
│   │   ├── 02-CONFIGURACAO-BARBEARIA.md  ⭐ Adicionar barbearia
│   │   ├── 03-SCHEMA-FIRESTORE.md
│   │   └── FIRESTORE_SCHEMA_FINAL.md
│   │
│   ├── 04-ACESSO-QUALQUER-PC.md    Acesso remoto
│   ├── INTEGRACAO_FRONTEND.md      Dashboard futuro
│   └── PLANO_MIGRACAO.md           Escalabilidade
│
├── 🤖 n8n-workflows/
│   └── 04-atendimento-completo-groq.json  ⭐ Workflow principal
│
├── 📜 scripts/
│   ├── deploy-gcp-free-auto.sh     Deploy automatizado
│   ├── monitor.sh                  Monitoramento
│   ├── backup-manual.sh            Backup
│   └── healthcheck.sh              Health check
│
├── 🔥 firebase/
│   ├── firebase-adminsdk.json      Service Account
│   ├── firestore.rules             Security rules
│   └── firestore.indexes.json      Índices
│
└── 🐳 docker-compose.yml            Config Docker produção
```

---

## ⚡ Início Rápido

### **Sistema Já Rodando:**
```
✅ VM GCP configurada
✅ Evolution API v1.7.4
✅ N8N com Groq IA
✅ Firebase integrado
✅ Custo: R$ 0,00/mês
```

### **Adicionar Nova Barbearia (10 min):**

1. **Evolution:** http://34.182.111.255:8080/manager
   - Create instance `barbershop_XXX`

2. **Firestore:** Criar documento `barberShops/barbershop_XXX`

3. **Testar:** Enviar "oi" no WhatsApp

**📖 Guia completo:** [docs/setup/02-CONFIGURACAO-BARBEARIA.md](docs/setup/02-CONFIGURACAO-BARBEARIA.md)

---

## 🤖 Funcionalidades

- ✅ **Atendimento com IA** (Groq - Llama 3.1-70b)
- ✅ **Multi-tenant** (múltiplas barbearias)
- ✅ **Agendamentos automáticos**
- ✅ **Salva no Firestore**
- ✅ **Cria clientes automaticamente**
- ⏳ **Dashboard Next.js** (futuro)
- ⏳ **Lembretes automáticos** (futuro)

---

## 📚 Documentação

### **Para Começar:**
- **[LEIA-ME-PRIMEIRO.md](LEIA-ME-PRIMEIRO.md)** ⭐ Próximos 9 minutos
- **[INDEX.md](INDEX.md)** - Índice de tudo

### **Deploy:**
- **[docs/deploy/01-DEPLOY-GUIA-COMPLETO.md](docs/deploy/01-DEPLOY-GUIA-COMPLETO.md)**
- **[docs/deploy/DEPLOY_GCP_FREE.md](docs/deploy/DEPLOY_GCP_FREE.md)**

### **Configuração:**
- **[docs/setup/02-CONFIGURACAO-BARBEARIA.md](docs/setup/02-CONFIGURACAO-BARBEARIA.md)** ⭐
- **[docs/setup/03-SCHEMA-FIRESTORE.md](docs/setup/03-SCHEMA-FIRESTORE.md)**

### **Gerenciamento:**
- **[docs/04-ACESSO-QUALQUER-PC.md](docs/04-ACESSO-QUALQUER-PC.md)** ⭐

---

## 💰 Custos

| Item | Valor/Mês |
|------|-----------|
| VM GCP e2-micro | R$ 0,00 (Free Tier) |
| Groq API | R$ 0,00 (14k req/dia) |
| Firebase | R$ 0,00 (Spark Plan) |
| **TOTAL** | **R$ 0,00/mês** |

**Capacidade:** 4-5 barbearias simultâneas

---

## 🔧 Comandos Úteis

### **SSH na VM:**
```bash
gcloud compute ssh evolution-saas-free --zone=us-west1-b --project=studio-343774762-16da7
```

### **Dentro da VM:**
```bash
cd ~/evolution-saas
docker-compose ps       # Ver status
docker-compose logs -f  # Ver logs em tempo real
docker-compose restart  # Reiniciar tudo
docker stats            # Uso de recursos
```

---

## 📊 Capacidade do Servidor

| Barbearias | RAM Usada | Status |
|------------|-----------|--------|
| 1-3 | ~400MB | ✅ Excelente |
| 4-5 | ~600MB | ✅ Bom |
| 6+ | >700MB | ⚠️ Upgrade necessário |

**Quando crescer:** Migrar para VPS 4GB (R$ 24/mês) - Ver [docs/PLANO_MIGRACAO.md](docs/PLANO_MIGRACAO.md)

---

## 🎯 Próximos Passos (7 minutos)

- [x] Ativar Firestore ✅
- [x] Criar owner N8N ✅
- [x] Documento Firestore criado ✅
- [ ] Completar dados da barbearia
- [ ] Importar workflow N8N
- [ ] Conectar WhatsApp
- [ ] Testar!

**📖 Ver:** [LEIA-ME-PRIMEIRO.md](LEIA-ME-PRIMEIRO.md) (guia atualizado)

---

## 🆘 Suporte

- **Documentação:** Pasta `/docs`
- **Issues:** GitHub Issues
- **Email:** seu-email@exemplo.com

---

**Desenvolvido para automatizar barbearias no Brasil** 🇧🇷 🚀
