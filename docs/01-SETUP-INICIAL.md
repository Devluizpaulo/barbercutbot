# 🚀 Guia de Setup: O Primeiro Administrador

Para gerenciar a plataforma, o primeiro passo é criar um usuário com a permissão de `admin`. Existem dois métodos para isso:

1.  ✅ **Automático via Interface de Setup (Recomendado)**
2.  ⚙️ **Manual via Firebase Console & Script (Alternativo)**

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

Use este método se a interface de setup falhar ou se você precisar **adicionar o claim de admin a um usuário existente**.

### **Passo 1: Obtenha o UID do Usuário**

1.  Se o usuário ainda não existe, crie-o no **[Firebase Console](https://console.firebase.google.com/)** > **Authentication** > **Users**.
2.  **Copie o UID** do usuário que você deseja tornar administrador.

### **Passo 2: Atualize o Documento no Firestore (Opcional, mas recomendado)**

1.  Vá para **Firestore Database** > coleção `users`.
2.  Encontre o documento com o ID correspondente ao UID do usuário.
3.  Certifique-se de que o campo `role` está definido como `admin`. Se o campo não existir, adicione-o.

### **Passo 3: Adicionar o Custom Claim (Crucial)**

Para que o usuário tenha acesso "god-mode" nas regras de segurança, é **essencial** definir um Custom Claim.

1.  Abra o arquivo `add-admin-claim.js` na raiz do projeto.
2.  **Cole o UID** do usuário na variável `userUid`.
3.  Certifique-se de que sua variável de ambiente `GOOGLE_APPLICATION_CREDENTIALS` está configurada corretamente (veja as instruções no arquivo).
4.  Execute o script no seu terminal:
    ```bash
    node add-admin-claim.js
    ```
5.  O script confirmará que o claim `{ admin: true }` foi adicionado com sucesso.

### **Passo 4: Fazer Login**

Acesse `http://localhost:9002/cpanel/login` e use as credenciais do usuário. Você será redirecionado para o painel de controle.

---

## 🚨 Solução de Problemas

- **Página `/setup` mostra "Sistema já configurado"**: Significa que um documento com `role: "admin"` já existe na coleção `users`. Use o login em `/cpanel/login`.
- **"Permission Denied" ou "Acesso Negado" após login**: Verifique se o **Custom Claim** `{ admin: true }` foi adicionado corretamente executando o script `add-admin-claim.js`. As regras de segurança do Firestore e a lógica de login do CPanel priorizam o `custom claim` para acesso irrestrito.
- **Upload de imagem falha com erro de CORS**: Execute os passos da seção "Configurar CORS do Storage" que pode ser encontrada no README.md.
