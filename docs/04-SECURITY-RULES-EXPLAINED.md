# 🔐 Entendendo as Regras de Segurança (Firestore)

As regras de segurança do Firestore (`firestore.rules`) são a portaria do seu banco de dados. Elas definem quem pode ler, escrever ou apagar cada pedaço de informação.

A lógica implementada é baseada em dois níveis de acesso principais: **Administrador** e **Dono do Negócio**.

---

## 👑 1. Acesso de Administrador (Superusuário)

A regra mais importante é a que concede acesso total ao administrador.

```javascript
// Função que busca os dados do perfil do usuário que faz a requisição
function getUserData() {
  return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
}

match /{document=**} {
  // Se o usuário tiver a role de 'admin', permita tudo.
  allow read, write: if getUserData().role == 'admin';
}
```

**Como funciona:**

1.  `getUserData()`: Esta função busca o documento do usuário que está fazendo a requisição na coleção `users`.
2.  `match /{document=**}`: Esta é uma regra "curinga" que se aplica a **todos os documentos** do banco de dados.
3.  `if getUserData().role == 'admin'`: Antes de qualquer outra regra, o sistema verifica se o usuário tem o campo `role` igual a `'admin'`.
4.  **Resultado:** Se for um admin, a permissão é concedida imediatamente. É uma "chave mestra" que dá acesso irrestrito, resolvendo todos os erros de permissão para o painel de controle.

---

## 💈 2. Acesso do Dono do Negócio (Usuário Normal)

Para todos os outros usuários, as permissões são restritivas e baseadas na propriedade.

### Perfil do Usuário

```javascript
match /users/{userId} {
  // Um usuário só pode ler e modificar seu próprio perfil.
  allow read, write: if request.auth.uid == userId;
}
```

**Como funciona:** Um usuário só pode acessar o documento em `/users/` se o ID do documento for o mesmo que o seu próprio ID de autenticação (`request.auth.uid`).

### Lojas (Barber Shops)

```javascript
match /barberShops/{shopId} {
  // Qualquer usuário autenticado pode criar uma nova loja.
  allow create: if request.auth != null;

  // Um usuário só pode ler, atualizar ou apagar uma loja se ele for o dono.
  // A regra verifica se o 'ownerId' da loja é igual ao ID do usuário.
  allow read, update, delete: if resource.data.ownerId == request.auth.uid;

  // ... regras para subcoleções ...
}
```

**Como funciona:**

*   **Criação:** Qualquer um que tenha feito login pode criar uma `barberShop`.
*   **Gerenciamento:** Para ler ou alterar uma loja existente, o sistema verifica se o `ownerId` salvo na loja é o mesmo do usuário que está fazendo a requisição.

### Dados Dentro da Loja (Agendamentos, Clientes, etc.)

```javascript
match /barberShops/{shopId} {
  // ...

  // Para qualquer subcoleção dentro de uma loja
  match /{collection}/{docId} {
    // Permita ler ou escrever apenas se o usuário for o dono da loja-mãe.
    allow read, write: if isOwner(shopId);
  }
}

// Função auxiliar que verifica a propriedade da loja
function isOwner(shopId) {
  return isAuthenticated() && get(/databases/$(database)/documents/barberShops/$(shopId)).data.ownerId == request.auth.uid;
}
```

**Como funciona:**

*   Para acessar qualquer dado dentro de `barberShops/{shopId}/...` (como um agendamento ou um cliente), a função `isOwner(shopId)` é chamada.
*   Ela busca os dados da loja (`barberShop`) e verifica se o `ownerId` dela corresponde ao ID do usuário.
*   Isso garante que o Dono A não possa ver os clientes do Dono B, e vice-versa.

---

## 🚫 3. Acesso de Visitantes (Não Autenticados)

Se um usuário não estiver autenticado (`request.auth == null`), nenhuma das regras acima será satisfeita (exceto, teoricamente, a leitura de documentos públicos, que não temos). Portanto, o acesso é negado por padrão.

## 🎯 Resumo da Lógica

| Papel | O que pode fazer? | Exemplo |
| :--- | :--- | :--- |
| **Administrador** | **TUDO.** Acesso irrestrito a todas as coleções. | Ver o dashboard do CPanel, editar qualquer loja, listar todos os usuários. |
| **Dono de Loja** | Gerenciar **APENAS** sua própria loja e seus dados internos. | Ver seu próprio dashboard, adicionar seus clientes, gerenciar seus agendamentos. |
| **Visitante** | **NADA.** Não pode ler nem escrever dados. | - |

Esta arquitetura garante a segurança e o isolamento dos dados de cada cliente (multi-tenant), enquanto oferece ao administrador o poder necessário para gerenciar toda a plataforma.
