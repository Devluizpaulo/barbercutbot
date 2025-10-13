# 🚀 SaaS Automação WhatsApp - Barbearias

## ✅ **Status: EM PRODUÇÃO**

Sistema multi-tenant de automação WhatsApp com IA para barbearias.

**Servidor:** 34.182.111.255 (GCP Free Tier)  
**Custo:** R$ 0,00/mês  
**Projeto ID:** barbercutbot

---

## 🏗️ Arquitetura

```
VM GCP (34.182.111.255)
├── Evolution API v2.2.2 :8081  ✅ (Atualizado para v2)
├── N8N :5678  ✅
└── SQLite (leve)

Firebase (barbercutbot)
├── Firestore ✅
└── Auth/Hosting (futuro)

Groq IA
└── Llama 3.1-70b ✅ (14k req/dia grátis)
```

---

## 🌐 Acessos Rápidos

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| **Evolution API** | http://34.182.111.255:8081/manager | API Key: evolution_api_key_2024 |
| **N8N** | http://34.182.111.255:5678 | admin / n8n_admin_2024 |
| **Firebase Console** | [Link](https://console.firebase.google.com/project/barbercutbot) | Conta Google |
| **Firestore** | [Link](https://console.firebase.google.com/project/barbercutbot/firestore) | Conta Google |

---

## 📁 Estrutura Organizada

```
saas-whatsapp-platform/
│
├── 📄 LEIA-ME-PRIMEIRO.md          ⭐ COMECE AQUI!
├── 📄 INDEX.md                     Índice completo
├── 📄 docs/PRODUCT_MODULES.md       ⭐ Módulos do Produto
│
├── 📖 docs/
│   ├── deploy/                     Deploy e infraestrutura
│   ├── setup/                      Configuração e schema
│   └── ...                         (outros guias)
│
├── 🤖 n8n-workflows/
│   └── 04-atendimento-completo-groq.json  ⭐ Workflow principal
│
├── 📜 scripts/
│   └── ...                         Scripts de automação
│
├── 🔥 firebase/
│   └── ...                         Configurações do Firebase
│
└── 🐳 docker-compose.yml            Config Docker produção
```

---

## ⚡ Início Rápido

### **Sistema Já Rodando:**
```
✅ VM GCP configurada
✅ Evolution API v2.2.2
✅ N8N com Groq IA
✅ Firebase integrado
✅ Custo: R$ 0,00/mês
```

### **Adicionar Nova Barbearia (10 min):**

1. **Evolution:** http://34.182.111.255:8081/manager
   - Create instance `barbershop_XXX`

2. **Firestore:** Criar documento `barberShops/barbershop_XXX`

3. **Testar:** Enviar "oi" no WhatsApp

**📖 Guia completo:** [docs/setup/02-CONFIGURACAO-BARBEARIA.md](docs/setup/02-CONFIGURACAO-BARBEARIA.md)

---

## 🤖 Módulos e Funcionalidades

Para uma visão detalhada do que foi construído e quais são os próximos passos, consulte o mapa de módulos do produto:

- **[docs/PRODUCT_MODULES.md](docs/PRODUCT_MODULES.md)** ⭐ Visão Estratégica do Produto

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

---

## 🔧 Comandos Úteis

### **SSH na VM:**
```bash
gcloud compute ssh evolution-saas-free --zone=us-west1-b --project=barbercutbot
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

**Desenvolvido para automatizar barbearias no Brasil** 🇧🇷 🚀
