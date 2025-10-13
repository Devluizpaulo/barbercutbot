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

## 🔧 Configuração Inicial do Sistema

### **Criar o Primeiro Administrador**

Existem 2 formas de criar o primeiro admin:

#### **Opção A: Interface de Setup (Recomendado) ✨**

1. Acesse: `http://localhost:3000/setup`
2. Preencha o formulário com seus dados
3. Clique em "Criar Administrador"
4. Pronto! Você será redirecionado para o painel admin

#### **Opção B: Manual via Firebase Console**

1. Crie usuário no **Firebase Authentication**
2. Crie documento na coleção `users` no **Firestore** com:
   ```json
   {
     "id": "[UID do usuário]",
     "firstName": "Admin",
     "lastName": "Sistema",
     "email": "admin@flowcutspro.com",
     "role": "admin",  // ⚠️ IMPORTANTE!
     "createdAt": "[timestamp]"
   }
   ```
3. Faça login em `/admin`

📖 **Documentação completa:** [docs/PRIMEIRO-ADMIN-SETUP.md](docs/PRIMEIRO-ADMIN-SETUP.md)

---

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── (auth)/              # Páginas de autenticação
│   │   ├── login/           # Login de usuários
│   │   ├── signup/          # Cadastro de usuários
│   │   ├── admin/           # Login administrativo
│   │   └── setup/           # Configuração inicial
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
- `/setup` - Configuração inicial (só quando não há admins)

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

### **Não consigo criar o primeiro admin**
- Verifique se as regras do Firestore estão implantadas
- Tente usar o método manual via Firebase Console
- Consulte: [docs/PRIMEIRO-ADMIN-SETUP.md](docs/PRIMEIRO-ADMIN-SETUP.md)

### **Erro ao fazer login**
- Verifique se o usuário tem `role: "admin"` no Firestore
- Limpe o cache do navegador
- Verifique o console (F12) para erros

### **"Permission Denied" no Firestore**
- Verifique se as regras foram implantadas: `firebase deploy --only firestore:rules`
- Verifique se o usuário está autenticado
- Consulte os logs do Firebase Console

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

---

## ⚡ Quick Start Checklist

- [ ] Clonar repositório
- [ ] Instalar dependências (`npm install`)
- [ ] Configurar `.env.local` com credenciais Firebase
- [ ] Deploy das regras (`firebase deploy --only firestore:rules`)
- [ ] Iniciar servidor (`npm run dev`)
- [ ] Acessar `/setup` e criar primeiro admin
- [ ] Fazer login em `/admin`
- [ ] Explorar o painel `/cpanel`

🚀 **Pronto para começar!**
