# ⚡ Guia de Início Rápido - 15 Minutos

## 🎯 Objetivo

Ter a plataforma SaaS rodando localmente em 15 minutos com:
- ✅ Evolution API conectada ao WhatsApp
- ✅ N8N com workflows automáticos
- ✅ Firestore configurado
- ✅ Dashboard funcionando

---

## 📋 Checklist Rápida

### ✅ **Passo 1: Pré-requisitos (5 min)**

```powershell
# Verifique se tem tudo instalado
docker --version          # Deve retornar versão
docker-compose --version  # Deve retornar versão
node --version           # v18 ou superior
```

Se não tiver, instale:
- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Node.js 18+](https://nodejs.org/)

---

### ✅ **Passo 2: Inicie os Serviços (3 min)**

```powershell
# Entre na pasta do projeto
cd saas-whatsapp-platform

# Inicie tudo de uma vez
docker-compose up -d

# Aguarde ~30 segundos para os serviços iniciarem
Start-Sleep -Seconds 30

# Verifique se tudo está rodando
docker-compose ps
```

**Esperado:** Todos os serviços com status `Up`

---

### ✅ **Passo 3: Conecte WhatsApp (5 min)**

1. **Abra o Evolution Manager:**
   ```
   http://localhost:8081/manager
   ```

2. **Crie uma instância:**
   - Clique em "**Create Instance**"
   - Nome: `minha_barbearia`
   - Integration: `WHATSAPP-BAILEYS`
   - Clique em "**Create**"

3. **Conecte WhatsApp:**
   - Clique em "**Connect**" na instância criada
   - Escaneie o QR Code com WhatsApp
   - Aguarde aparecer "**Connected**" ✅

---

### ✅ **Passo 4: Teste Automação (2 min)**

1. **Envie uma mensagem** para o WhatsApp conectado:
   ```
   Oi
   ```

2. **Deve receber automaticamente:**
   ```
   👋 Olá! Bem-vindo!

   Eu sou o assistente virtual da barbearia.

   Como posso te ajudar hoje?

   • Digite AGENDAR para marcar horário
   • Digite PREÇOS para ver valores
   • Digite LOCALIZAÇÃO para nosso endereço
   • Digite HORÁRIOS para disponibilidade
   ```

3. **Teste outros comandos:**
   - `PREÇOS` → Ver tabela de preços
   - `HORÁRIOS` → Ver disponibilidade
   - `AGENDAR` → Iniciar agendamento

---

### ✅ **Passo 5: Configure Firebase (Opcional - 5 min)**

```powershell
# Instale Firebase CLI
npm install -g firebase-tools

# Entre na pasta firebase
cd firebase

# Faça login
firebase login

# Inicialize projeto
firebase init

# Selecione:
# ☑ Firestore
# ☑ Hosting
# ? Use default project? No
# ? Select project: Create new project
# ? Project name: seu-projeto-saas
```

**Configure Firestore:**
```powershell
# Deploy regras de segurança
firebase deploy --only firestore:rules

# Deploy índices
firebase deploy --only firestore:indexes
```

---

## 🎉 Pronto! Sua Plataforma Está Funcionando

### 🌐 URLs de Acesso

| Serviço | URL | Credenciais |
|---------|-----|-------------|
| **Evolution Manager** | http://localhost:8081/manager | - |
| **N8N Workflows** | http://localhost:5678 | admin / n8n_admin_2024 |
| **PostgreSQL Evolution** | localhost:5432 | evolution_admin / evolution_secure_2024 |
| **PostgreSQL N8N** | localhost:5433 | n8n_admin / n8n_secure_2024 |

---

## 🧪 Testes Rápidos

### Teste 1: Resposta Automática
```
Você → "oi"
Bot → Mensagem de boas-vindas
```

### Teste 2: Agendamento
```
Você → "agendar"
Bot → Instruções de agendamento
Você → "segunda 14h"
Bot → Confirma horário
```

### Teste 3: Preços
```
Você → "preço"
Bot → Tabela de preços completa
```

---

## 📊 Ver Logs em Tempo Real

```powershell
# Logs Evolution API
docker-compose logs -f evolution-api

# Logs N8N
docker-compose logs -f n8n-automation

# Logs de tudo
docker-compose logs -f
```

---

## 🛑 Parar Tudo

```powershell
# Parar serviços
docker-compose down

# Parar e remover volumes (limpa tudo)
docker-compose down -v
```

---

## 🔧 Problemas Comuns

### ❌ "QR Code não aparece"

```powershell
# Reinicie Evolution API
docker-compose restart evolution-api

# Veja os logs
docker-compose logs evolution-api
```

### ❌ "Bot não responde"

1. Verifique se Evolution está conectado:
   - http://localhost:8081/manager
   - Status deve ser "Connected"

2. Verifique webhook no N8N:
   - http://localhost:5678
   - Workflow "WhatsApp Message Handler" deve estar ativo

3. Teste o webhook manualmente:
```powershell
Invoke-RestMethod -Uri "http://localhost:5678/webhook/whatsapp" -Method POST -Body '{"test":"ok"}' -ContentType "application/json"
```

### ❌ "Docker não inicia"

```powershell
# Verifique se Docker está rodando
docker ps

# Reinicie Docker Desktop
# No Windows: Reinicie o Docker Desktop pela bandeja do sistema
```

---

## 🎯 Próximos Passos

1. **Personalize respostas:**
   - Edite `n8n-workflows/01-whatsapp-message-handler.json`
   - Adicione suas próprias respostas
   - Reimporte no N8N

2. **Configure Firebase:**
   - Siga o Passo 5 acima
   - Deploy do dashboard

3. **Adicione mais automações:**
   - Lembretes de agendamento
   - Confirmações automáticas
   - Relatórios diários

---

## 💡 Dicas

- **Mantenha logs abertos** enquanto testa para ver o que acontece
- **Use Evolution Manager** para debug de conexão WhatsApp
- **N8N tem UI visual** - você pode editar workflows clicando e arrastando
- **Firestore é NoSQL** - mais flexível que SQL tradicional

---

## 🆘 Precisa de Ajuda?

1. Leia a documentação completa: `README.md`
2. Veja estrutura Firestore: `docs/FIRESTORE_STRUCTURE.md`
3. Abra uma issue no GitHub
4. Email: suporte@seudominio.com

---

**🎊 Parabéns! Você tem uma plataforma SaaS de automação WhatsApp funcionando!**

Agora é hora de personalizar e escalar seu negócio! 🚀
