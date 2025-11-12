# ⚙️ Guia de Integração: Painel de Administração Externo

Este documento é um guia técnico para desenvolvedores que desejam construir um painel de administração externo ("Super Admin") para gerenciar a plataforma BarberCut Bot. Ele detalha como se autenticar, obter autorização e interagir com o backend do sistema.

---

## 1. Visão Geral da Arquitetura

O BarberCut Bot é construído sobre o Firebase. O acesso e a manipulação de dados são controlados por três pilares:

1.  **Firebase Authentication:** Gerencia a identidade dos usuários.
2.  **Cloud Firestore:** Armazena todos os dados da aplicação (lojas, usuários, etc.).
3.  **Cloud Functions:** Fornecem uma API de backend segura para operações críticas (ex: criar ou deletar um usuário).
4.  **Regras de Segurança do Firestore:** A "portaria" que valida cada leitura e escrita no banco de dados.

O acesso de superusuário é concedido através de um **Custom Claim** do Firebase Authentication.

---

## 2. Configuração do Projeto Externo

Seu novo painel de administração (seja ele Next.js, Vue, etc.) precisará se conectar ao mesmo projeto Firebase do BarberCut Bot.

1.  **Instale o SDK do Firebase:**
    ```bash
    npm install firebase
    ```

2.  **Inicialize o Firebase:** Use a mesma configuração do Firebase do projeto BarberCut Bot. Crie um arquivo para inicialização:

    ```javascript
    // Exemplo: src/firebase/config.js
    import { initializeApp, getApps } from 'firebase/app';
    import { getAuth } from 'firebase/auth';
    import { getFirestore } from 'firebase/firestore';
    import { getFunctions, httpsCallable } from 'firebase/functions';

    const firebaseConfig = {
      // Cole aqui o objeto de configuração do seu projeto Firebase
      apiKey: "...",
      authDomain: "...",
      projectId: "barbercutbot",
      // ...
    };

    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

    export const auth = getAuth(app);
    export const firestore = getFirestore(app);
    export const functions = getFunctions(app, 'us-central1');

    // Helper para chamar as funções
    export const callFunction = (name, data) => httpsCallable(functions, name)(data);
    ```

---

## 3. Autenticação e Autorização (O Passo Mais Importante)

Para que seu painel externo tenha acesso "god-mode", o usuário logado **precisa** ser um administrador com o `custom claim` `{ admin: true }`.

### Fluxo de Login do Administrador

1.  **Login com Email e Senha:** Utilize a função `signInWithEmailAndPassword` do SDK do Firebase para autenticar o usuário administrador (ex: `admin@barbercutbot.com`).

    ```javascript
    import { signInWithEmailAndPassword } from 'firebase/auth';
    import { auth } from './firebase/config';

    async function loginAdmin(email, password) {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    }
    ```

2.  **Verificação do Custom Claim:** Após o login, é **crucial** verificar se o token do usuário contém o `claim` de administrador. Sem ele, as regras de segurança do Firestore bloquearão todas as operações.

    ```javascript
    async function checkAdminPermissions(firebaseUser) {
      // O `true` força a atualização do token para pegar os claims mais recentes.
      const idTokenResult = await firebaseUser.getIdTokenResult(true);
      
      const isAdmin = !!idTokenResult.claims.admin;

      if (!isAdmin) {
        throw new Error('Acesso negado. A conta não possui privilégios de administrador.');
      }
      
      console.log('Acesso de administrador confirmado!');
      return true;
    }
    ```

**Observação:** Se um administrador for criado, mas o `claim` não for definido, utilize o script `add-admin-claim.js` no projeto BarberCut Bot para corrigi-lo manualmente.

---

## 4. Operações de Leitura (Read)

Com um usuário administrador autenticado, você pode fazer consultas diretas ao Firestore para ler qualquer dado da plataforma, pois a regra `if isAdmin()` nas regras de segurança irá permitir.

### Exemplos:

-   **Listar todas as lojas:**
    ```javascript
    import { collection, getDocs } from 'firebase/firestore';
    import { firestore } from './firebase/config';

    async function getAllShops() {
      const shopsRef = collection(firestore, 'barberShops');
      const snapshot = await getDocs(shopsRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    ```

-   **Listar todos os usuários:**
    ```javascript
    async function getAllUsers() {
      const usersRef = collection(firestore, 'users');
      const snapshot = await getDocs(usersRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
    ```

---

## 5. Operações de Escrita (Create, Update, Delete)

Para modificar dados (criar, atualizar ou deletar usuários, por exemplo), a abordagem mais segura e recomendada é **utilizar as Cloud Functions existentes** como uma API de backend.

Isso centraliza a lógica de negócio e as trilhas de auditoria, em vez de replicá-las no seu novo painel.

### Funções Disponíveis:

-   `createAdminUser(data)`: Cria um novo membro da equipe (admin/support).
    -   **Parâmetros (`data`):** `{ firstName, lastName, email, password, role: 'admin' | 'support' }`

-   `updateUserRole(data)`: Atualiza o nome e o perfil de qualquer usuário.
    -   **Parâmetros (`data`):** `{ uid, firstName, lastName, role: 'admin' | 'owner' | 'support' | 'staff' }`

-   `deleteUser(data)`: Deleta um usuário do Authentication e do Firestore.
    -   **Parâmetros (`data`):** `{ uid }`

### Exemplo de Uso:

```javascript
import { callFunction } from './firebase/config';

// Exemplo: Atualizando um usuário para se tornar um 'support'
async function updateUserToSupport(userId) {
  try {
    const result = await callFunction('updateUserRole', {
      uid: userId,
      role: 'support' // Apenas o `role` é obrigatório além do `uid`
    });
    console.log('Usuário atualizado com sucesso:', result.data);
  } catch (error) {
    console.error('Falha ao atualizar usuário:', error);
    // Trate o erro, exiba uma mensagem para o usuário
  }
}

// Exemplo: Deletando um usuário
async function removeUser(userId) {
   try {
    await callFunction('deleteUser', { uid: userId });
    console.log('Usuário removido com sucesso');
  } catch (error) {
    console.error('Falha ao remover usuário:', error);
  }
}
```

Ao seguir este guia, seu painel de administração externo poderá interagir de forma segura e eficaz com o backend do BarberCut Bot, proporcionando uma experiência de gerenciamento centralizada e poderosa.