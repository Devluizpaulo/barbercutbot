# 💈 BarberCut Bot - SaaS para Barbearias

Uma plataforma SaaS completa para gerenciamento de barbearias, construída com Next.js, Firebase e Stripe. O sistema oferece agendamentos, CRM, controle financeiro e um painel administrativo robusto.

---

## 🚀 Início Rápido

### **1. Instale as Dependências**
```bash
npm install
```

### **2. Configure as Variáveis de Ambiente**
Crie um arquivo `.env.local` na raiz do projeto. As credenciais do Firebase e da Stripe são essenciais.

```env
# Firebase Admin (Necessário para rodar o script de setup local)
# Baixe o arquivo JSON no Console do Firebase > Config. do Projeto > Contas de Serviço
# E cole o CONTEÚDO do JSON aqui.
GOOGLE_APPLICATION_CREDENTIALS='{ "type": "service_account", ... }'

# Chaves da Stripe (Obtenha em dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# URL base para webhooks e redirecionamentos
NEXT_PUBLIC_BASE_URL=http://localhost:9002

# Chave de API da Gemini (para o chatbot com IA)
GEMINI_API_KEY=AIza...
```

### **3. Inicie o Servidor de Desenvolvimento**
```bash
npm run dev
```

Acesse a aplicação em `http://localhost:9002`.

### **4. Setup do Primeiro Administrador**
Acesse `http://localhost:9002/setup` para criar o primeiro usuário com perfil de `admin`. **Esta página só funciona se nenhum administrador existir no sistema.**

---

## 📁 Estrutura do Projeto

A arquitetura utiliza o App Router do Next.js com Route Groups para organizar as seções da aplicação.

```
src/
├── app/
│   ├── (app)/                  # Rotas do Dashboard do Cliente (Dono da Loja)
│   │   ├── dashboard/
│   │   │   ├── [shopId]/       # Painel específico da loja
│   │   │   └── page.tsx        # Página de redirecionamento para a loja do usuário
│   │   └── layout.tsx          # Layout principal do app (com sidebar, etc.)
│   ├── (auth)/                 # Rotas de Autenticação (Login, Cadastro)
│   │   ├── login/
│   │   └── signup/
│   ├── cpanel/                 # Rotas do Painel Administrativo (Superusuário)
│   │   ├── (cpanel)/           # Grupo de rotas com layout de admin
│   │   │   ├── layout.tsx      # Layout do CPanel
│   │   │   ├── page.tsx        # Dashboard do Admin
│   │   │   └── ... (shops, users, etc.)
│   │   └── login/              # Página de login específica para admins
│   ├── api/                    # Rotas de API (ex: webhooks)
│   └── layout.tsx              # Layout raiz da aplicação
├── components/                 # Componentes React (UI e lógicos)
├── firebase/                   # Configuração e hooks do Firebase
├── hooks/                      # Hooks customizados
├── lib/                        # Funções utilitárias, tipos, etc.
└── functions/                  # Cloud Functions for Firebase
    └── src/
        └── index.ts            # Funções de backend (ex: criar admin)

docs/                           # Documentação técnica
firestore.rules                 # Regras de Segurança do Firestore
```

---

## 🎯 Arquitetura e Funcionalidades

### **Frontend**
- **Framework:** Next.js 15 (App Router)
- **UI:** Shadcn/UI + Tailwind CSS
- **Estado Global:** React Context para o Firebase (`useUser`, `useCPanel`)
- **Formulários:** Zod + React Hook Form
- **Gráficos:** Recharts

### **Backend & Infraestrutura**
- **Autenticação:** Firebase Authentication (Email/Senha, Google, Custom Claims)
- **Banco de Dados:** Firestore (NoSQL)
- **Backend Logic:** Cloud Functions for Firebase (TypeScript)
- **Pagamentos:** Stripe (Subscriptions & Webhooks)
- **IA (Chatbot):** Genkit (Google AI Studio)
- **Deployment:** Vercel / Firebase App Hosting

### **Lógica de Acesso**
- **Administrador (`admin`):** Acesso total ao `/cpanel` para gerenciar lojas, usuários e configurações da plataforma.
- **Dono de Loja (`owner`):** Acesso ao `/dashboard/[shopId]` para gerenciar seu próprio negócio.
- **Não autenticado:** Acesso apenas às páginas de marketing e autenticação.

---

## 🔐 Segurança

### **Regras do Firestore (`firestore.rules`)**
- **Acesso de Admin:** Um `match /{document=**}` concede acesso irrestrito a administradores (verificados via Custom Claim ou `role` no documento do usuário).
- **Isolamento de Tenant (Multi-Tenancy):** Donos de loja (`owner`) só podem ler e escrever nos documentos de sua própria loja (`isShopOwner(shopId)`).
- **Otimização para Listagem:** Regras de `list` exigem que as consultas do frontend incluam filtros específicos (ex: `where('ownerId', '==', request.auth.uid)`), garantindo performance e segurança.
- **Imutabilidade de Logs:** A coleção `adminLogs` permite apenas criação (`allow create`), tornando os registros de auditoria imutáveis.

### **Tratamento de Erros de Permissão**
- **`FirestorePermissionError`:** Um erro customizado que é lançado quando uma operação no Firestore falha por permissão.
- **`error-emitter`:** Um event emitter global que captura esses erros.
- **`FirebaseErrorListener`:** Um componente no layout raiz que "ouve" os eventos e lança o erro para a overlay de desenvolvimento do Next.js, facilitando a depuração.

---

## 📚 Documentação Técnica

Para detalhes aprofundados sobre a implementação, consulte a pasta `/docs`:

- **[01-SETUP-INICIAL.md](./docs/01-SETUP-INICIAL.md)**: Guia completo para configurar o primeiro administrador.
- **[02-ARQUITETURA-AUTH.md](./docs/02-ARQUITETURA-AUTH.md)**: Explicação detalhada do fluxo de autenticação e layouts.
- **[03-CRUD-LOGIC.md](./docs/03-CRUD-LOGIC.md)**: Detalhes sobre a estratégia de leitura e escrita de dados.
- **[04-SECURITY-RULES.md](./docs/04-SECURITY-RULES.md)**: Análise das regras de segurança do Firestore.
- **[05-ADMIN-LOGS.md](./docs/05-ADMIN-LOGS.md)**: Implementação do sistema de logs de auditoria.
- **[06-PAGAMENTOS-STRIPE.md](./docs/06-PAGAMENTOS-STRIPE.md)**: Fluxo de operação da integração com a Stripe.

---

## 🤝 Contribuindo

1. Faça um Fork do projeto.
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`).
3. Faça commit de suas mudanças (`git commit -m 'Adiciona NovaFuncionalidade'`).
4. Dê push para a branch (`git push origin feature/NovaFuncionalidade`).
5. Abra um Pull Request.

---

**Versão:** 1.0.0  
**Status:** ✅ Produção
