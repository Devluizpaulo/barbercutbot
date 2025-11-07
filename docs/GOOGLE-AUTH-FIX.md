# ✅ Lógica de Login/Cadastro com Provedor Google

A integração com o "Sign in with Google" requer um fluxo cuidadoso para garantir que o usuário seja criado tanto no Firebase Authentication quanto na coleção `users` do Firestore, além de ter sua primeira loja (`barberShop`) configurada.

---

## 1. Problema Original

O login com Google criava um usuário no Firebase Auth, mas o documento correspondente no Firestore (`/users/{uid}`) não era criado. Isso acontecia porque:
1.  As regras de segurança iniciais eram muito restritivas e bloqueavam a criação de documentos na coleção `users`.
2.  Não havia uma lógica clara no frontend para garantir a criação desse documento após um login bem-sucedido com Google.

---

## 2. A Solução: `ensureUserExists`

A solução foi centralizar a lógica pós-login em uma função utilitária chamada `ensureUserExists` em `src/lib/google-auth-utils.ts`.

### **Como Funciona:**

Esta função é chamada **sempre** que um usuário faz login (seja via Google, seja via email/senha).

1.  **Recebe o `user`**: A função recebe o objeto `user` do Firebase Auth.
2.  **Verifica o Firestore**: Ela tenta buscar um documento em `/users/{user.uid}`.
3.  **Cenário 1: Usuário NÃO Existe (`!userDoc.exists()`)**
    -   Isso significa que é o primeiro login deste usuário no sistema.
    -   **Ação 1: Criar Documento do Usuário**: Cria um novo documento em `/users/{user.uid}` com os dados do perfil (nome, email) e define sua `role` como `'owner'`.
    -   **Ação 2: Criar Loja Padrão**: Chama a função `createDefaultShop`, que cria um novo documento na coleção `/barberShops` associado a este `ownerId`.
    -   **Retorno**: Retorna `true`, indicando que um novo usuário foi configurado.

4.  **Cenário 2: Usuário JÁ Existe (`userDoc.exists()`)**
    -   Isso significa que é um login de um usuário que está retornando.
    -   **Ação de Verificação**: O código chama `userHasShops()` para garantir que, caso algo tenha dado errado no passado, o usuário tenha pelo menos uma loja. Se não tiver, ele cria a loja padrão mesmo para um usuário existente.
    -   **Retorno**: Retorna `false`, indicando que o usuário já existia.

### **Código Chave (`ensureUserExists`)**

```typescript
// src/lib/google-auth-utils.ts

export async function ensureUserExists(firestore: Firestore, user: User): Promise<boolean> {
  const userDocRef = doc(firestore, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    // 1. Criar o documento do usuário
    await setDoc(userDocRef, { /* ...dados do usuário... */, role: 'owner' });

    // 2. Criar uma loja padrão para o novo usuário
    await createDefaultShop(firestore, user);
    
    return true; // Novo usuário criado
  }

  // Verificação de segurança para usuários existentes
  const hasShops = await userHasShops(firestore, user.uid);
  if (!hasShops) {
    await createDefaultShop(firestore, user);
  }
  
  return false; // Usuário já existia
}
```

---

## 3. Integração no Frontend

As páginas de login (`login/page.tsx`) e cadastro (`signup/page.tsx`) foram atualizadas para usar esta função.

### **Fluxo no `handleGoogleSignIn`:**

```typescript
// src/app/(auth)/login/page.tsx

const handleGoogleSignIn = async () => {
  // 1. Tenta fazer login com o popup do Google
  await signInWithPopup(auth, provider);

  if (auth.currentUser) {
    // 2. Chama a função para garantir que o usuário e a loja existam
    const wasCreated = await ensureUserExists(firestore, auth.currentUser);
    
    // 3. Exibe uma mensagem de boas-vindas se for um novo usuário
    if (wasCreated) {
      toast({ title: "Bem-vindo(a)!", description: "Sua conta e sua loja foram criadas!" });
    }
  }

  // 4. Redireciona para o dashboard (o AuthLayout cuidará disso)
  router.push('/dashboard');
};
```

---

## 4. Correções Adicionais

-   **Regras do Firestore:** A regra para `/users/{userId}` foi ajustada para permitir que um usuário crie seu próprio documento (`allow create: if request.auth.uid == userId;`).
-   **Criação de Loja:** A função `createDefaultShop` foi tornada mais robusta, usando `addDoc` com um fallback para `setDoc` para evitar erros de permissão em cenários de borda.
-   **Experiência do Usuário:** O `dashboard/page.tsx` agora tem uma lógica de "bootstrapping" que detecta se um usuário está sem loja e aciona a criação, garantindo que ninguém fique "preso" sem um destino.

Este fluxo garante que, independentemente do método de autenticação, todo usuário do tipo `owner` terá um documento de perfil válido e pelo menos uma loja para gerenciar, proporcionando uma experiência de onboarding robusta e sem falhas.
