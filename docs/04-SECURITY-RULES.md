# 🔐 Regras de Segurança do Firestore (`firestore.rules`)

As regras de segurança são a espinha dorsal da proteção de dados na plataforma. Elas são a **autoridade final** sobre quem pode ler e escrever cada pedaço de informação, garantindo a integridade e o isolamento dos dados de cada loja (multi-tenancy).

A estratégia implementada é hierárquica e otimizada para performance.

---

## 1. Funções Auxiliares (Helpers)

Para evitar repetição e aumentar a clareza, usamos funções:

-   `isSignedIn()`: Verifica se o usuário está autenticado (`request.auth != null`).
-   `isAdmin()`: A "chave mestra". Verifica se o usuário tem um Custom Claim de `admin: true` ou se seu documento em `/users` possui `role: 'admin'`. O Custom Claim é priorizado por performance.
-   `isShopOwner(shopId)`: Verifica se o UID do usuário corresponde ao `ownerId` do documento da loja (`/barberShops/{shopId}`).
-   `hasShopAccess(shopId)`: Uma função composta que retorna `true` se o usuário for o dono (`isShopOwner`) OU um membro da equipe (`isShopEmployee`).

---

## 2. A Hierarquia de Acesso

### **Nível 1: Administrador (God-Mode)**

A regra de maior prioridade concede acesso total e irrestrito aos administradores.

```javascript
match /{document=**} {
  allow read, write: if isAdmin();
}
```

-   `{document=**}`: Este é um "wildcard recursivo" que se aplica a **TODOS** os documentos em todo o banco de dados.
-   `if isAdmin()`: Se a função `isAdmin()` retornar `true`, a permissão é concedida imediatamente, e nenhuma outra regra abaixo dela é avaliada para este usuário.

### **Nível 2: Dono da Loja (`owner`) e Funcionários (`staff`)**

Para todos os outros usuários, as regras são muito mais específicas.

#### **Acesso à Loja Principal (`/barberShops/{shopId}`)**

```javascript
match /barberShops/{shopId} {
  // Apenas o dono pode criar uma loja, garantindo a associação correta.
  allow create: if request.auth.uid == request.resource.data.ownerId;
  
  // Dono ou funcionário podem ler, atualizar e deletar a loja.
  allow read, update, delete: if hasShopAccess(shopId);
}
```

#### **Acesso às Subcoleções (Appointments, Clients, etc.)**

Esta é a parte mais crítica para a performance. As regras são divididas por tipo de operação:

```javascript
match /barberShops/{shopId}/appointments/{appointmentId} {
  // ✅ GET, WRITE (operações em um único doc):
  // A regra pode fazer uma consulta extra (usando get/exists)
  // pois a performance não é impactada.
  allow get, create, update, delete: if hasShopAccess(shopId);
      
  // ❌ LIST (operações de coleção):
  // A regra NÃO PODE usar get/exists. Ela precisa ser validada
  // apenas com as informações da query.
  allow list: if isSignedIn() && 
    request.query.where[0] == 'barberShopId' && 
    request.query.where[2] == shopId;
}
```

**Por que essa diferença?**
O Firestore precisa saber se uma consulta de `list` é permitida **antes** de começar a buscar os documentos. Se a regra precisasse ler *outro* documento para cada item da lista (como `isShopOwner` faz), o custo seria proibitivo. Ao forçar a consulta do cliente a incluir `where('barberShopId', '==', shopId)`, a regra se torna extremamente rápida e eficiente.

### **Nível 3: Usuário Autenticado (Sem Loja Associada)**

Se um usuário está logado mas não é admin, nem dono, nem funcionário de uma loja específica, ele só pode:
-   Criar e gerenciar seu próprio perfil em `/users/{userId}`.
-   Criar uma nova loja.

Ele não poderá ler ou escrever em dados de lojas existentes.

### **Nível 4: Visitante (Não Autenticado)**

Se `request.auth == null`, nenhuma regra de `read` ou `write` será satisfeita (exceto para documentos explicitamente públicos, que não temos). O acesso é **negado por padrão**.

---

## 🎯 Resumo da Lógica

| Papel | Acesso | Justificativa de Segurança |
| :--- | :--- | :--- |
| **Admin** | **Total.** | Acesso irrestrito via `isAdmin()` para gerenciamento da plataforma. |
| **Dono/Funcionário** | **Total na sua loja (com restrições de `list`).** | `hasShopAccess(shopId)` garante que só membros da loja acessem seus dados. Regras de `list` otimizadas evitam erros de performance. |
| **Usuário Logado** | **Apenas seu próprio perfil `/users`.** | Isolamento total. Um usuário não pode ver dados de outros usuários ou lojas. |
| **Visitante** | **Nenhum.** | Acesso negado por padrão, protegendo todos os dados. |

Essa estrutura de regras cria um sistema seguro, isolado e performático, alinhado com as melhores práticas do Firebase para aplicações SaaS multi-tenant.
