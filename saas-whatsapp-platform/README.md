# 🚀 Plataforma SaaS - Automação WhatsApp + Firebase

## 📋 Visão Geral

Sistema completo de automação WhatsApp para barbearias e prestadores de serviços, integrado com **Firebase Hosting + Firestore** para dashboard de clientes e gestão de dados.

## 🏗️ Arquitetura

```
┌──────────────────────────────────────────────────────────────┐
│                    FIREBASE ECOSYSTEM                         │
│  ┌────────────────┐         ┌──────────────────┐            │
│  │  Firebase Auth │         │    Firestore     │            │
│  │  (Autenticação)│◄────────┤  (Banco NoSQL)   │            │
│  └────────────────┘         └──────────────────┘            │
│          │                            ▲                       │
│          ▼                            │                       │
│  ┌────────────────────────────────────┴──────────┐          │
│  │     Firebase Hosting (Dashboard Next.js)      │          │
│  └───────────────────────────────────────────────┘          │
└──────────────────────────────────────────────────────────────┘
                            │
                            │ Webhooks & API Calls
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                   DOCKER CONTAINERS                           │
│                                                               │
│  ┌────────────────┐    ┌─────────────────┐                  │
│  │   Evolution    │◄───┤   N8N Workflows │                  │
│  │   API (WhatsApp│    │   (Automações)  │                  │
│  └────────────────┘    └─────────────────┘                  │
│         │                       │                             │
│         ▼                       ▼                             │
│  ┌────────────────────────────────────┐                     │
│  │     PostgreSQL + Redis             │                     │
│  └────────────────────────────────────┘                     │
└──────────────────────────────────────────────────────────────┘
```

## 📁 Estrutura do Projeto

```
saas-whatsapp-platform/
│
├── 📂 firebase/                    # Configurações Firebase
│   ├── firestore.rules            # Regras de segurança Firestore
│   ├── firestore.indexes.json     # Índices otimizados
│   └── firebase.json               # Config geral do Firebase
│
├── 📂 frontend-dashboard/          # Dashboard Next.js
│   ├── src/
│   │   ├── pages/                 # Páginas Next.js
│   │   ├── components/            # Componentes React
│   │   ├── hooks/                 # Custom hooks
│   │   ├── services/              # Serviços Firebase
│   │   └── styles/                # Estilos Tailwind
│   ├── public/
│   └── package.json
│
├── 📂 n8n-workflows/               # Workflows N8N
│   ├── 01-whatsapp-message-handler.json
│   ├── 02-appointment-reminder.json
│   ├── 03-daily-report.json
│   └── 04-message-counter.json
│
├── 📂 database/                    # Scripts PostgreSQL
│   └── init.sql
│
├── 📂 docs/                        # Documentação
│   ├── FIRESTORE_STRUCTURE.md     # Estrutura de dados Firestore
│   ├── API_INTEGRATION.md         # Guia de integração
│   └── DEPLOYMENT.md              # Guia de deploy
│
├── 📂 scripts/                     # Scripts utilitários
│   ├── setup.ps1                  # Setup inicial
│   ├── deploy-firebase.ps1        # Deploy Firebase
│   └── backup.ps1                 # Backup de dados
│
├── 📂 backend/                     # (Opcional) Backend Node.js
│   └── functions/                 # Cloud Functions
│
├── docker-compose.yml              # Orquestração Docker
└── README.md                       # Este arquivo
```

## 🚀 Instalação e Configuração

### 1. Pré-requisitos

```bash
# Docker e Docker Compose
docker --version
docker-compose --version

# Node.js 18+
node --version

# Firebase CLI
npm install -g firebase-tools
firebase --version
```

### 2. Clone e Configure

```bash
# Clone o repositório
cd saas-whatsapp-platform

# Configure Firebase
cd firebase
firebase login
firebase init
# Selecione: Firestore, Hosting

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais
```

### 3. Inicie os Serviços Docker

```bash
# Inicie Evolution API + N8N + Bancos de Dados
docker-compose up -d

# Verifique status
docker-compose ps

# Veja logs
docker-compose logs -f
```

### 4. Configure Dashboard Firebase

```bash
cd frontend-dashboard

# Instale dependências
npm install

# Configure Firebase no projeto
# Edite src/config/firebase.js com suas credenciais

# Execute em desenvolvimento
npm run dev

# Build para produção
npm run build

# Deploy no Firebase Hosting
npm run deploy
```

## 🌐 URLs de Acesso

| Serviço | URL Local | Produção |
|---------|-----------|----------|
| **Dashboard** | http://localhost:3000 | https://seu-projeto.web.app |
| **Evolution Manager** | http://localhost:8081/manager | - |
| **N8N Automation** | http://localhost:5678 | - |
| **Firebase Console** | - | https://console.firebase.google.com |

## 🔑 Credenciais Padrão

```
Evolution API Key: evolution_api_key_2024
N8N Admin: admin / n8n_admin_2024
```

## 📊 Planos e Preços

| Plano | Preço/Mês | Mensagens | Recursos |
|-------|-----------|-----------|----------|
| **Starter** | R$ 149 | 600 | Básico, 1 instância |
| **Pro** | R$ 249 | 2.000 | Dashboard completo, relatórios |
| **Premium** | R$ 399 | 5.000 | Chatbot personalizado, API |

## 🔧 Estrutura de Dados Firestore

### Coleções Principais

```javascript
users/{userId}
  ├── whatsapp_instances/{instanceId}
  ├── appointments/{appointmentId}
  ├── messages/{messageId}
  └── statistics/{period}

plans/{planId}
webhooks_log/{logId}
system_settings/{settingId}
```

📖 **Documentação completa:** `docs/FIRESTORE_STRUCTURE.md`

## 🤖 Workflows N8N

### 1. WhatsApp Message Handler
- Recebe mensagens via webhook
- Analisa conteúdo e gera resposta automática
- Salva logs no Firestore
- Envia resposta ao cliente

### 2. Appointment Reminder
- Envia lembretes 1 hora antes do agendamento
- Atualiza status no Firestore
- Contabiliza mensagens no limite

### 3. Daily Report
- Gera relatório diário de uso
- Envia para admin via email/WhatsApp
- Atualiza estatísticas no Firestore

### 4. Message Counter
- Monitora uso de mensagens
- Alerta quando próximo do limite
- Reset automático mensal

## 📱 Fluxo de Uso (Cliente Final)

```
1. Cliente envia "OI" no WhatsApp
   ↓
2. Evolution API recebe mensagem
   ↓
3. Webhook dispara N8N workflow
   ↓
4. N8N analisa mensagem e gera resposta
   ↓
5. Resposta automática é enviada
   ↓
6. Tudo é registrado no Firestore
   ↓
7. Dashboard do cliente atualiza em tempo real
```

## 💻 Desenvolvimento do Dashboard

```bash
cd frontend-dashboard

# Estrutura de páginas
src/pages/
  ├── index.tsx              # Home / Login
  ├── dashboard.tsx          # Dashboard principal
  ├── messages.tsx           # Histórico de mensagens
  ├── appointments.tsx       # Agendamentos
  ├── statistics.tsx         # Relatórios
  ├── settings.tsx           # Configurações
  └── billing.tsx            # Faturamento

# Componentes principais
src/components/
  ├── Layout/                # Layout padrão
  ├── Sidebar/               # Navegação
  ├── MessageList/           # Lista de mensagens
  ├── AppointmentCalendar/   # Calendário
  ├── StatsCard/             # Cards de estatísticas
  └── InstanceStatus/        # Status WhatsApp
```

## 🔐 Segurança

### Firebase Rules
- ✅ Usuários só acessam seus próprios dados
- ✅ Autenticação obrigatória
- ✅ Validação de roles (admin/user)
- ✅ Logs imutáveis

### API Keys
- Evolution API protegida por API Key
- N8N com autenticação básica
- Webhooks com validação de origem

## 📈 Monitoramento

### Firebase Console
- Uso de leitura/escrita Firestore
- Autenticações ativas
- Erros e performance

### Docker Logs
```bash
# Logs Evolution API
docker-compose logs -f evolution-api

# Logs N8N
docker-compose logs -f n8n-automation
```

## 🚀 Deploy Produção

### 1. Firebase Hosting

```bash
cd frontend-dashboard
npm run build
firebase deploy --only hosting
```

### 2. Docker em VPS

```bash
# Em servidor Linux (Ubuntu/Debian)
# 1. Instale Docker e Docker Compose
# 2. Clone o repositório
# 3. Configure variáveis de ambiente
# 4. Execute docker-compose up -d

# Com domínio customizado
# Configure nginx como proxy reverso
# Instale SSL com Let's Encrypt
```

### 3. Firestore & Authentication

```bash
# Deploy regras Firestore
firebase deploy --only firestore:rules

# Deploy índices
firebase deploy --only firestore:indexes
```

## 💰 Custos Estimados

### Por Cliente

| Serviço | Custo Mensal | Observação |
|---------|--------------|------------|
| VPS (Contabo 2GB) | R$ 60-80 | Evolution + N8N |
| Firebase (Spark) | R$ 0-30 | Até 50k leituras/dia |
| Domínio + SSL | R$ 20 | Anual ~R$ 240 |
| **Total** | **R$ 80-130** | Por cliente |

### Margem de Lucro

- **Starter (R$ 149)**: ~55% margem
- **Pro (R$ 249)**: ~65% margem
- **Premium (R$ 399)**: ~75% margem

## 📚 Próximos Passos

### Fase 1: MVP (Atual)
- [x] Estrutura Docker
- [x] Evolution API integrada
- [x] N8N workflows básicos
- [x] Estrutura Firestore
- [ ] Dashboard Next.js

### Fase 2: Automações
- [ ] Lembretes de agendamento
- [ ] Confirmação automática
- [ ] Relatórios diários
- [ ] Reset mensal de contadores

### Fase 3: Pagamentos
- [ ] Integração Stripe/PagSeguro
- [ ] Cobrança recorrente
- [ ] Gestão de assinaturas
- [ ] Webhooks de pagamento

### Fase 4: Escalabilidade
- [ ] Multi-tenancy
- [ ] API pública
- [ ] Webhooks customizáveis
- [ ] White-label

## 🤝 Suporte

- **Documentação**: `docs/`
- **Issues**: GitHub Issues
- **Email**: suporte@seudominio.com

## 📄 Licença

MIT License

---

**Desenvolvido com ❤️ para automatizar negócios locais no Brasil**

🎯 **Objetivo**: Democratizar automação WhatsApp de qualidade para PMEs
