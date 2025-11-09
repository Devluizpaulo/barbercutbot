# 🚀 Guia de Setup: O Primeiro Administrador

Para gerenciar a plataforma, o primeiro passo é criar um usuário com a permissão de `admin`. Existem dois métodos para isso:

1.  ✅ **Automático via Interface de Setup (Recomendado)**
2.  ⚙️ **Manual via Firebase Console & Script (Alternativo)**
3.  **Post-Setup: Configurar CORS do Storage (Essencial para Uploads)**

---

## ✅ Método 1: Interface de Setup (Automático)

Este é o método mais simples e seguro. Ele só funciona se **nenhum administrador** existir no sistema.

### **Passo 1: Acesse a Página de Setup**

Com o servidor rodando (`npm run dev`), acesse a seguinte URL no seu navegador:

```
http://localhost:9002/setup
```

### **Passo 2: Preencha o Formulário**

- **Nome e Sobrenome:** Suas informações de perfil.
- **Email Administrativo:** O e-mail que você usará para acessar o painel `/cpanel`.
- **Senha:** Deve ter no mínimo 6 caracteres.

### **Passo 3: Clique em "Criar Administrador"**

O sistema executará a Cloud Function `setupAdminUser`, que realiza as seguintes ações:
1.  Verifica se já existe um admin (como uma dupla checagem de segurança).
2.  Cria o usuário no **Firebase Authentication**.
3.  Define um **Custom Claim** de `admin: true` para o usuário, garantindo acesso irrestrito nas regras de segurança.
4.  Cria um documento correspondente na coleção `users` do Firestore com `role: "admin"`.
5.  Faz o login automático do novo administrador no cliente.

Após a conclusão, você será redirecionado automaticamente para o painel de controle em `/cpanel`.

**A página `/setup` será permanentemente desabilitada após este processo.**

---

## ⚙️ Método 2: Manual (Alternativo)

Use este método se a interface de setup falhar ou se você precisar criar um admin em um ambiente de produção já existente.

### **Passo 1: Criar Usuário no Firebase Authentication**

1.  Acesse o **[Firebase Console](https://console.firebase.google.com/)** > **Authentication** > **Users**.
2.  Clique em **Add User** e preencha o e-mail e a senha.
3.  Após criar, **copie o UID** do novo usuário.

### **Passo 2: Criar Documento no Firestore**

1.  Vá para **Firestore Database** > coleção `users`.
2.  Clique em **Add Document** e cole o **UID** do usuário no campo "Document ID".
3.  Adicione os seguintes campos:
    - `id` (string): Cole o UID novamente.
    - `firstName` (string): "Admin"
    - `lastName` (string): "Sistema"
    - `email` (string): O mesmo e-mail do passo anterior.
    - `role` (string): `admin`  **<-- ⚠️ Essencial!**
    - `createdAt` (timestamp): Use o timestamp do servidor.

### **Passo 3: Adicionar Custom Claim de Admin**

Para que o usuário tenha acesso "god-mode" nas regras de segurança, é crucial definir um Custom Claim.

1.  Abra o arquivo `add-admin-claim.js` na raiz do projeto.
2.  **Cole o UID** do usuário na variável `userUid`.
3.  Certifique-se de que sua variável de ambiente `GOOGLE_APPLICATION_CREDENTIALS` está configurada corretamente (veja as instruções no arquivo).
4.  Execute o script:
    ```bash
    node add-admin-claim.js
    ```
5.  O script confirmará que o claim `{ admin: true }` foi adicionado com sucesso.

### **Passo 4: Fazer Login**

Acesse `http://localhost:9002/cpanel/login` e use as credenciais que você criou. Você será redirecionado para o painel de controle.

---

## 🌩️ Configurar CORS do Storage (Essencial para Uploads)

**⚠️ IMPORTANTE:** Para que o upload de imagens (logos, fotos de perfil) funcione, você precisa autorizar o domínio da sua aplicação a enviar arquivos para o Firebase Storage.

### **Passo 1: Instale o Google Cloud CLI**
Se você ainda não tem, [instale a ferramenta de linha de comando do Google Cloud](https://cloud.google.com/sdk/docs/install).

### **Passo 2: Faça o Login na CLI**
Abra seu terminal e execute:
```bash
gcloud auth login
```
Siga as instruções no navegador para autorizar o acesso à sua conta Google.

### **Passo 3: Configure o Projeto**
Diga à CLI qual projeto do Firebase você está usando (o ID do projeto está no `firebase.json`):
```bash
gcloud config set project barbercutbot
```

### **Passo 4: Aplique a Configuração CORS**
Execute o seguinte comando na raiz do seu projeto. Ele usará o arquivo `cors.json` que já está configurado.
```bash
npm run storage:cors
```
Este comando aplica as regras que permitem que `localhost` e seu domínio de produção (`barbercutbot.vercel.app`) enviem arquivos para o Storage.

---

## 🚨 Solução de Problemas

- **Página `/setup` mostra "Sistema já configurado"**: Significa que um documento com `role: "admin"` já existe na coleção `users`. Use o login em `/cpanel/login`.
- **"Permission Denied" após login manual**: Verifique se o Custom Claim `{ admin: true }` foi adicionado corretamente executando o script `add-admin-claim.js`. As regras de segurança priorizam o custom claim para acesso irrestrito.
- **Upload de imagem falha com erro de CORS**: Execute os passos da seção "Configurar CORS do Storage" acima.