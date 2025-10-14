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

## Problemas Adicionais Encontrados

Após a implementação inicial, foram identificados dois problemas adicionais:

### 4. **Erro de Cross-Origin-Opener-Policy**
O popup do Google Auth estava sendo bloqueado por políticas de segurança do navegador.

### 5. **Erro de Permissões do Firestore**
Usuários não conseguiam listar suas próprias lojas (`barberShops`) devido a regras restritivas.

## Soluções Adicionais Implementadas

### 4. **Configuração do Google Auth Provider**

Adicionadas configurações para resolver problemas de CORS:

```typescript
const provider = new GoogleAuthProvider();

// Configure the provider to handle CORS properly
provider.addScope('email');
provider.addScope('profile');
provider.setCustomParameters({
  prompt: 'select_account'
});
```

### 5. **Headers CORS no Next.js**

Configurado `next.config.mjs` para permitir popups:

```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Cross-Origin-Opener-Policy',
          value: 'same-origin-allow-popups',
        },
        {
          key: 'Cross-Origin-Embedder-Policy',
          value: 'unsafe-none',
        },
      ],
    },
  ];
}
```

### 6. **Regras do Firestore para Listagem**

Adicionada regra para permitir listagem de lojas próprias:

```javascript
// Allow users to list their own shops (needed for dashboard/shops page)
match /barberShops {
  allow list: if isSignedIn() && request.query.where.ownerId == request.auth.uid;
}
```

### 7. **Criação Automática de Loja Padrão**

Atualizada função `ensureUserExists()` para criar também uma loja padrão:

```typescript
// 2. Criar uma loja padrão para o usuário
const shopRef = await addDoc(collection(firestore, 'barberShops'), {
  name: `Meu Negócio`,
  ownerId: user.uid,
  status: 'active',
  createdAt: serverTimestamp(),
});
```

## Resultado Final

✅ **Login com Google funciona corretamente**
✅ **Usuários são criados na coleção `users`**
✅ **Lojas padrão são criadas automaticamente**
✅ **Permissões do Firestore funcionam corretamente**
✅ **Problemas de CORS resolvidos**
✅ **Implementação consistente entre login e signup**
✅ **Regras de segurança mantidas**
✅ **Código reutilizável e manutenível**

## Arquivos Modificados

1. `firestore.rules` - Correção das regras de segurança + regra de listagem
2. `src/lib/google-auth-utils.ts` - Função utilitária + criação de loja padrão
3. `src/app/(auth)/login/page.tsx` - Implementação padronizada + configuração CORS
4. `src/app/(auth)/signup/page.tsx` - Implementação padronizada + configuração CORS
5. `next.config.mjs` - Headers CORS para popups
6. `docs/GOOGLE-AUTH-FIX.md` - Documentação completa da correção

## Teste

Para testar a correção completa:

1. Faça logout se estiver logado
2. Tente fazer login com uma conta Google que nunca foi usada no sistema
3. Verifique se o usuário aparece na coleção `users` do Firestore
4. Verifique se uma loja padrão foi criada na coleção `barberShops`
5. Confirme se o usuário consegue acessar o dashboard normalmente
6. Teste se não há mais erros de CORS no console
