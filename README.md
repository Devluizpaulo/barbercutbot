# 💈 FlowCuts Pro - SaaS de Gerenciamento de Barbearias

Sistema completo de gerenciamento para barbearias com agendamentos, controle financeiro, gestão de clientes e muito mais.

## 🚀 Início Rápido

### **1. Clone o Repositório**
```bash
git clone [seu-repo-url]
cd Barbearia-SaaS
```

### **2. Instale as Dependências**
```bash
npm install
```

### **3. Configure o Firebase**
Crie um arquivo `.env.local` na raiz do projeto com suas credenciais do Firebase:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=seu-app-id
```

### **4. Deploy das Regras do Firestore**
```bash
firebase deploy --only firestore:rules
```

### **5. Inicie o Servidor**
```bash
npm run dev
```

Acesse: `http://localhost:3000`

---

## 🔧 Configuração Inicial: Criando o Primeiro Administrador (Manual)

Para ter acesso total ao sistema, o primeiro passo é criar um usuário administrador manualmente no Firebase. Siga os passos abaixo.

### **Passo 1: Criar Usuário no Firebase Authentication**

1.  Acesse o **[Firebase Console](https://console.firebase.google.com/)** e vá para o seu projeto.
2.  No menu lateral, vá para **Build > Authentication**.
3.  Clique na aba **Users** e depois em **Add user**.
4.  Preencha:
    - **Email**: `admin@flowcutspro.com` (ou um email de sua preferência).
    - **Password**: Crie uma senha segura (ex: `SenhaAdmin123!`).
5.  Clique em **Add user**.
6.  Na lista de usuários, encontre o que você acabou de criar e **copie o UID** (User ID) dele. Você precisará disso no próximo passo.

### **Passo 2: Criar Documento no Firestore com a Role de Admin**

1.  Ainda no Firebase Console, vá para **Build > Firestore Database**.
2.  Selecione (ou crie) a coleção `users`.
3.  Clique em **Add document**.
4.  No campo **Document ID**, **cole o UID** que você copiou do Authentication.
5.  Adicione os seguintes campos ao documento:
    - `id` (string): **Cole o UID novamente aqui.**
    - `firstName` (string): `Admin`
    - `lastName` (string): `Sistema`
    - `email` (string): `admin@flowcutspro.com` (o mesmo email que você usou)
    - `role` (string): `admin`  **<-- ⚠️ ESTE É O PASSO MAIS IMPORTANTE!**
    - `createdAt` (timestamp): Escolha a data e hora atuais.
6.  Clique em **Save**.

### **Passo 3: Fazer Login**

1.  Acesse a página de login administrativo: `http://localhost:3000/admin`
2.  Use o email e a senha que você acabou de criar.
3.  Você será redirecionado para o painel de controle (`/cpanel`).

**Pronto!** Agora você tem controle total sobre a plataforma e pode adicionar outros membros da equipe através do painel, se necessário.

---

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/              # Páginas de autenticação
│   │   ├── login/           # Login de usuários
│   │   ├── signup/          # Cadastro de usuários
│   │   └── admin/           # Login administrativo
│   ├── (app)/               # Páginas da aplicação (dashboard)
│   └── cpanel/              # Painel administrativo
│       └── (cpanel)/
│           ├── logs/        # Logs administrativos
│           ├── shops/       # Gerenciar lojas
│           ├── users/       # Gerenciar usuários
│           └── team/        # Equipe & acessos
├── components/              # Componentes React
│   └── ui/                  # Componentes Shadcn UI
├── lib/
│   ├── admin-logs.ts        # Sistema de logs
│   └── types.ts             # Tipos TypeScript
└── firebase/                # Configuração Firebase
    ├── config.ts
    └── provider.tsx

docs/                        # Documentação
├── PRIMEIRO-ADMIN-SETUP.md  # Guia de setup inicial
├── ADMIN-LOGS-IMPLEMENTATION.md  # Sistema de logs
└── FIRESTORE-SECURITY-LOGS.md   # Segurança dos logs

firestore.rules              # Regras de segurança
```

---

## 🎯 Principais Funcionalidades

### **Para Proprietários de Barbearias**
- ✅ Gestão completa de agendamentos
- ✅ Controle financeiro (receitas e despesas)
- ✅ Cadastro de clientes e histórico
- ✅ Gerenciamento de barbeiros
- ✅ Catálogo de serviços e produtos
- ✅ Relatórios e estatísticas
- ✅ Calendário visual de agendamentos

### **Para Administradores da Plataforma**
- 🔐 Login administrativo separado (`/admin`)
- 📊 Dashboard com métricas gerais
- 🏪 Gerenciamento de todas as lojas
- 👥 Gerenciamento de usuários
- 📋 Sistema de logs e auditoria
- ⚙️ Configurações globais da plataforma
- 🎫 Sistema de suporte (tickets)

---

## 🔐 Segurança

### **Sistema de Logs Administrativos**

Todos os acessos e ações administrativas são registrados automaticamente:

- ✅ Login bem-sucedido
- ❌ Tentativas de login falhadas
- ⚠️ Alertas de segurança
- 🚪 Logout administrativo
- ⚡ Ações administrativas importantes

**Visualizar logs:** Faça login como admin e acesse `/cpanel/logs`

### **Regras de Segurança do Firestore**

- Usuários só acessam seus próprios dados
- Proprietários só gerenciam suas lojas
- Admins têm acesso controlado e auditado
- Logs são imutáveis (não podem ser alterados/deletados)

---

## 🌐 Rotas Principais

### **Públicas**
- `/` - Página inicial (landing page)
- `/login` - Login de usuários
- `/signup` - Cadastro de novos usuários
- `/admin` - Login administrativo

### **Autenticadas (Proprietários)**
- `/dashboard/shops` - Selecionar loja
- `/dashboard/[shopId]` - Dashboard da loja
- `/dashboard/[shopId]/appointments` - Agendamentos
- `/dashboard/[shopId]/clients` - Clientes
- `/dashboard/[shopId]/finance` - Financeiro
- `/dashboard/[shopId]/barbers` - Barbeiros
- `/dashboard/[shopId]/services` - Serviços
- `/dashboard/[shopId]/products` - Produtos

### **Admin (Administradores)**
- `/cpanel` - Dashboard administrativo
- `/cpanel/shops` - Gerenciar lojas
- `/cpanel/users` - Gerenciar usuários
- `/cpanel/logs` - Logs do sistema
- `/cpanel/team` - Equipe de admins
- `/cpanel/tickets` - Suporte
- `/cpanel/documents` - Documentos legais

---

## 🛠️ Tecnologias

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **UI:** Shadcn/UI + Tailwind CSS
- **Backend:** Firebase (Auth + Firestore)
- **Validação:** Zod + React Hook Form
- **Gráficos:** Recharts
- **Datas:** date-fns
- **Ícones:** Lucide React

---

## 📚 Documentação

- **[Primeiro Admin Setup](docs/PRIMEIRO-ADMIN-SETUP.md)** - Como criar o primeiro administrador
- **[Sistema de Logs](docs/ADMIN-LOGS-IMPLEMENTATION.md)** - Implementação completa de logs
- **[Segurança dos Logs](docs/FIRESTORE-SECURITY-LOGS.md)** - Regras de segurança
- **[Estrutura do Backend](docs/backend.json)** - Schema do Firestore
- **[Regras de Segurança](docs/04-SECURITY-RULES-EXPLAINED.md)** - Explicação das regras

---

## 🧪 Testes

```bash
# Executar testes
npm run test

# Testes e2e com Playwright
npm run test:e2e
```

---

## 📦 Build e Deploy

### **Build de Produção**
```bash
npm run build
```

### **Deploy Firebase**
```bash
# Deploy completo
firebase deploy

# Apenas Firestore rules
firebase deploy --only firestore:rules

# Apenas Functions
firebase deploy --only functions

# Apenas Hosting
firebase deploy --only hosting
```

---

## 🔍 Solução de Problemas

### **Erro ao fazer login como admin**
- Verifique no Firestore se o usuário tem o campo `role` com o valor exato de `"admin"` (minúsculas).
- Verifique se o UID do documento no Firestore corresponde ao UID do usuário no Authentication.
- Limpe o cache do navegador e tente novamente.
- Verifique o console do navegador (F12) para erros.

### **"Permission Denied" no Firestore**
- Verifique se as regras do Firestore foram implantadas: `firebase deploy --only firestore:rules`
- Verifique se o usuário está autenticado com a conta correta.
- Consulte os logs do Firebase Console para mais detalhes.

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é proprietário. Todos os direitos reservados.

---

## 📞 Suporte

Para dúvidas ou problemas:
- Consulte a documentação em `/docs`
- Verifique os logs em `/cpanel/logs` (se admin)
- Abra uma issue no repositório

---

## 🎉 Créditos

Desenvolvido com ❤️ para transformar o gerenciamento de barbearias.

**Versão:** 1.0.0  
**Status:** ✅ Produção  
**Última atualização:** 12/10/2025
