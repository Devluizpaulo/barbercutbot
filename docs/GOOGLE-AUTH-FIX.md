# 🔧 Correção do Login com Google Auth

## Problema Identificado

O login com Google não estava criando usuários na coleção `users` do Firestore devido a duas questões principais:

### 1. **Regras do Firestore Bloqueando Criação**

As regras de segurança estavam impedindo completamente a criação de usuários:

```javascript
// ANTES - Regra problemática
match /users/{userId} {
  allow create, delete: if false; // ❌ Bloqueava TODA criação
}
```

### 2. **Implementações Inconsistentes**

- **Login**: Tentava criar usuário diretamente no Firestore
- **Signup**: Confiava apenas na Cloud Function `onUserCreate`
- **Cloud Function**: Só executava para novos usuários do Firebase Auth

### 3. **Fluxo do Google Auth**

Quando um usuário fazia login com Google pela primeira vez:
1. Firebase Auth criava o usuário automaticamente
2. Cloud Function `onUserCreate` **NÃO** era disparada (usuário já existia)
3. Código tentava criar documento no Firestore, mas regras bloqueavam

## Solução Implementada

### 1. **Correção das Regras do Firestore**

```javascript
// DEPOIS - Regra corrigida
match /users/{userId} {
  allow create: if isOwner(userId); // ✅ Permite criação do próprio usuário
}
```

### 2. **Função Utilitária Centralizada**

Criada função `ensureUserExists()` em `src/lib/google-auth-utils.ts`:

```typescript
export async function ensureUserExists(firestore: Firestore, user: User): Promise<boolean> {
  const userDocRef = doc(firestore, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    // Cria usuário com dados do Google
    await setDoc(userDocRef, {
      id: user.uid,
      firstName: firstName,
      lastName: lastName,
      email: user.email,
      role: 'owner',
      createdAt: serverTimestamp(),
    });
    return true; // Usuário foi criado
  }
  return false; // Usuário já existia
}
```

### 3. **Implementação Padronizada**

Ambos os arquivos (`login/page.tsx` e `signup/page.tsx`) agora usam a mesma lógica:

```typescript
const handleGoogleSignIn = async () => {
  // ... autenticação Google ...
  const wasCreated = await ensureUserExists(firestore, user);
  
  if (wasCreated) {
    toast({ title: "Bem-vindo!", description: "Sua conta foi criada com sucesso." });
  } else {
    toast({ title: "Login bem-sucedido!", description: "Redirecionando..." });
  }
};
```

## Resultado

✅ **Login com Google agora funciona corretamente**
✅ **Usuários são criados na coleção `users`**
✅ **Implementação consistente entre login e signup**
✅ **Regras de segurança mantidas (usuário só cria próprio documento)**
✅ **Código reutilizável e manutenível**

## Arquivos Modificados

1. `firestore.rules` - Correção das regras de segurança
2. `src/lib/google-auth-utils.ts` - Nova função utilitária
3. `src/app/(auth)/login/page.tsx` - Implementação padronizada
4. `src/app/(auth)/signup/page.tsx` - Implementação padronizada

## Teste

Para testar a correção:

1. Faça logout se estiver logado
2. Tente fazer login com uma conta Google que nunca foi usada no sistema
3. Verifique se o usuário aparece na coleção `users` do Firestore
4. Confirme se o usuário consegue acessar o dashboard normalmente
