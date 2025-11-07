# 🔐 Lógica de Login na Página das Lojas

## Visão Geral

A lógica de login na página das lojas (`/dashboard/[shopId]/page.tsx`) é parte de um sistema de autenticação em camadas que garante que apenas usuários autenticados e autorizados possam acessar os dados das lojas.

## Arquitetura de Autenticação

### 1. **Layout Principal (`src/app/(app)/layout.tsx`)**

```typescript
// Verificação de autenticação no nível do layout
const { user, isUserLoading } = useUser();

useEffect(() => {
  // Se não há usuário autenticado, redireciona para login
  if (!isUserLoading && !user) {
    router.push('/login');
  }
}, [user, isUserLoading, router]);
```

**Função**: 
- ✅ **Guarda de Autenticação**: Impede acesso não autorizado
- ✅ **Redirecionamento Automático**: Envia usuários não autenticados para `/login`
- ✅ **Estado de Loading**: Mostra spinner enquanto verifica autenticação

### 2. **Página Principal do Dashboard (`src/app/(app)/dashboard/page.tsx`)**

```typescript
// Busca lojas do usuário autenticado
const userShopsQuery = useMemoFirebase(
  () => (user ? query(collection(firestore, 'barberShops'), where('ownerId', '==', user.uid)) : null),
  [firestore, user]
);

// Redirecionamento baseado nas lojas encontradas
useEffect(() => {
  if (!isLoading && shops) {
    if (shops.length > 0) {
      // Redireciona para a primeira loja
      router.push(`/dashboard/${shops[0].id}`);
    }
  }
}, [isLoading, shops, router]);
```

**Função**:
- ✅ **Busca Lojas**: Consulta Firestore por lojas do usuário (`ownerId == user.uid`)
- ✅ **Redirecionamento Inteligente**: Leva o usuário para sua primeira loja
- ✅ **Criação Automática**: Chama `ensureUserExists()` se necessário

### 3. **Página da Loja Específica (`src/app/(app)/dashboard/[shopId]/page.tsx`)**

```typescript
// Extrai o shopId da URL
const params = useParams();
const shopId = params.shopId as string;

// Busca dados específicos da loja
const financialRecordsQuery = useMemoFirebase(
  () => (user && shopId) ? collection(firestore, 'barberShops', shopId, 'financialRecords') : null,
  [firestore, shopId, user]
);
```

**Função**:
- ✅ **Acesso Específico**: Carrega dados apenas da loja selecionada
- ✅ **Segurança por Loja**: Cada consulta inclui o `shopId` na query
- ✅ **Dados Isolados**: Usuários só veem dados de suas próprias lojas

## Fluxo de Autenticação Completo

### **Passo 1: Login Inicial**
```
Usuário → /login → Firebase Auth → Token JWT
```

### **Passo 2: Verificação no Layout**
```
Layout → useUser() → Verifica Token → Redireciona se necessário
```

### **Passo 3: Busca de Lojas**
```
Dashboard → Query Firestore → Filtra por ownerId → Lista lojas do usuário
```

### **Passo 4: Acesso à Loja**
```
/dashboard/[shopId] → Verifica permissões → Carrega dados da loja
```

## Segurança Implementada

### **1. Autenticação Firebase**
- ✅ **JWT Tokens**: Verificação automática de tokens
- ✅ **Refresh Automático**: Renovação transparente de tokens
- ✅ **Logout Automático**: Expiração de sessão

### **2. Autorização Firestore**
```javascript
// Regras de segurança no Firestore
match /barberShops/{shopId} {
  allow read: if isSignedIn() && isShopOwner(shopId);
}
```

### **3. Isolamento de Dados**
- ✅ **Filtros por Usuário**: Todas as queries incluem `ownerId` ou `barberShopId`.
- ✅ **Subcoleções Seguras**: Dados organizados por loja.
- ✅ **Validação de Propriedade**: Verificação de ownership nas regras.

## Hooks de Autenticação Utilizados

### **`useUser()`**
```typescript
const { user, isUserLoading } = useUser();
```
- **user**: Objeto do usuário autenticado (null se não autenticado).
- **isUserLoading**: Estado de carregamento da autenticação.

### **`useFirestore()`**
```typescript
const firestore = useFirestore();
```
- **firestore**: Instância configurada do Firestore.
- **Autenticação**: Inclui automaticamente o token do usuário nas requisições.

### **`useCollection()`**
```typescript
const { data: shops, isLoading } = useCollection<BarberShop>(userShopsQuery);
```
- **data**: Dados carregados do Firestore.
- **isLoading**: Estado de carregamento da query.

## Tratamento de Erros

### **1. Usuário Não Autenticado**
```typescript
if (!isUserLoading && !user) {
  router.push('/login'); // Redirecionamento automático
}
```

### **2. Sem Lojas Encontradas**
```typescript
if (shops.length === 0) {
  // Chama ensureUserExists() para criar loja padrão
  await ensureUserExists(firestore, user);
}
```

### **3. Erro de Permissão**
```typescript
// Firestore automaticamente bloqueia acesso não autorizado.
// O hook useCollection captura o erro e o FirebaseErrorListener o exibe.
```

## Estados de Loading

### **1. Loading de Autenticação**
```typescript
if (isUserLoading) {
  return <LoaderCircle className="h-12 w-12 animate-spin" />;
}
```

### **2. Loading de Dados**
```typescript
if (isLoading) {
  return <Skeleton className="h-4 w-full" />;
}
```

### **3. Loading de Configuração**
```typescript
// Tela de "Configurando seu ambiente..." durante criação de loja
```

## Vantagens desta Arquitetura

-   **Segurança Robusta**: Múltiplas camadas de verificação e isolamento completo de dados.
-   **Experiência do Usuário**: Redirecionamentos automáticos, estados de loading claros e criação automática de recursos.
-   **Manutenibilidade**: Hooks reutilizáveis, lógica centralizada e separação de responsabilidades.
-   **Performance**: Queries otimizadas, cache do Firestore e carregamento sob demanda.

Esta arquitetura garante que **apenas o dono da loja** possa acessar seus dados, mantendo a segurança e a integridade do sistema.
