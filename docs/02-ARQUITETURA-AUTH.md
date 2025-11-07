# 🔐 Arquitetura de Autenticação e Roteamento

A arquitetura de autenticação e roteamento do sistema é projetada para ser robusta, segura e proporcionar uma experiência de usuário fluida. Ela se baseia em **Route Groups** e **Layouts** do Next.js para controlar o acesso e renderizar a interface correta para cada tipo de usuário.

---

##  fluxo de Autenticação

1.  **Acesso Inicial**: O usuário acessa a aplicação.
2.  **`FirebaseClientProvider`**: No `RootLayout` (`src/app/layout.tsx`), este provedor inicializa o Firebase no lado do cliente.
3.  **`FirebaseProvider`**: Este provedor determina o estado de autenticação do usuário (`user`, `isUserLoading`). Ele escuta mudanças no estado de autenticação e, crucialmente, busca a `role` do usuário (seja do Custom Claim `admin` ou do documento no Firestore) e a anexa ao objeto `user`.
4.  **Decisão de Roteamento**: Com base no estado (`user`, `isUserLoading`, `role`), os layouts de cada seção decidem o que fazer.

---

## Estrutura de Layouts

### 1. **`src/app/(auth)/layout.tsx`**

-   **Responsabilidade**: Gerenciar as páginas de autenticação (`/login`, `/signup`, `/setup`).
-   **Lógica Principal**:
    -   Se `isUserLoading` for `true` ou se `user` já existir, exibe uma tela de carregamento (`LoaderCircle`). Isso evita que um usuário já logado veja a tela de login novamente antes de ser redirecionado.
    -   Se `isUserLoading` for `false` e `user` for `null`, renderiza a página filha (o formulário de login ou cadastro).
    -   **Importante**: Este layout **não redireciona mais o usuário**. Ele apenas "segura" a tela enquanto o layout principal (`(app)/layout.tsx` ou `cpanel/layout.tsx`) assume o controle do redirecionamento.

### 2. **`src/app/(app)/layout.tsx`** (Dashboard do Dono da Loja)

-   **Responsabilidade**: Proteger e renderizar o painel do dono da loja.
-   **Lógica Principal**:
    1.  **Verificação de Acesso**: Usa o hook `useUser()`.
    2.  Se `isUserLoading` for `true`, exibe uma tela de carregamento.
    3.  Se `!user` (não há usuário), redireciona para `/login`.
    4.  Se `user.role === 'admin'`, redireciona para `/cpanel` (um admin não deve estar aqui).
    5.  Se `user.role === 'owner'`, renderiza a `AppNav` e o conteúdo da página.
    6.  **Gerenciamento do `shopId`**: Extrai o ID da loja da URL e o passa para a `AppNav`, permitindo que a navegação seja contextual à loja selecionada.

### 3. **`src/app/cpanel/layout.tsx`** (Painel do Administrador)

-   **Responsabilidade**: Proteger e renderizar o painel de administração (`/cpanel`).
-   **Lógica Principal**:
    1.  **Verificação de Acesso**: Usa o hook `useUser()`.
    2.  Se `isUserLoading` for `true`, exibe uma tela de carregamento.
    3.  Se `!user`, redireciona para `/cpanel/login`.
    4.  Se `user.role !== 'admin'`, redireciona para `/dashboard` (um usuário normal não pode acessar o CPanel).
    5.  Se `user.role === 'admin'`, renderiza a `CPanelNav` e o conteúdo da página, envolvendo-o no `CPanelProvider` para fornecer dados globais (lojas, usuários) às páginas filhas.

---

## 🎯 Vantagens desta Arquitetura

-   **Ponto Único de Verdade (Single Source of Truth)**: O `FirebaseProvider` é o único responsável por determinar o estado de autenticação e a `role` do usuário.
-   **Separação de Responsabilidades (SoC)**: Cada layout tem uma única responsabilidade clara: o layout `(auth)` mostra formulários de login, enquanto os layouts `(app)` e `cpanel` protegem suas respectivas seções.
-   **Fluxo de Carregamento Explícito**: O usuário sempre vê uma tela de carregamento durante as verificações, evitando "flashes" de conteúdo não autorizado (FOUC - Flash of Unauthenticated Content).
-   **Segurança em Camadas**: O roteamento no lado do cliente é a primeira linha de defesa, enquanto as **Regras do Firestore** no backend são a garantia final de que nenhum dado será acessado indevidamente.
-   **Manutenibilidade**: A lógica de redirecionamento é centralizada e previsível, facilitando a depuração e a adição de novas rotas protegidas no futuro.
