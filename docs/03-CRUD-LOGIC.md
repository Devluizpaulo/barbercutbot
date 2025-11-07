# 💾 Lógica de Dados: Leitura e Escrita (CRUD)

A arquitetura de manipulação de dados (CRUD - Create, Read, Update, Delete) foi projetada com foco em três pilares: **performance da UI**, **consistência de dados** e **depuração clara de erros**.

---

## 1. Leitura de Dados (`Read`)

-   **Ferramentas Principais**: Hooks `useCollection` e `useDoc` de `src/firebase/firestore/`.
-   **Estratégia**: **Tempo Real (Real-time).**
    -   Esses hooks utilizam a função `onSnapshot` do Firebase. Em vez de buscar dados apenas uma vez, eles abrem um "canal" de comunicação com o Firestore.
    -   Qualquer alteração no banco de dados (um novo agendamento, um cliente atualizado) é enviada pelo servidor e reflete na interface **automaticamente**, sem a necessidade de o usuário recarregar a página.
-   **Otimização de Performance**:
    -   **`useMemoFirebase`**: Para prevenir que as consultas ao Firestore sejam recriadas a cada renderização do componente (o que causaria loops infinitos e custos excessivos), todas as queries são envolvidas por este hook. Ele garante que a consulta só seja refeita se suas dependências (ex: `shopId`, `userId`) realmente mudarem.

---

## 2. Escrita de Dados (`Create`, `Update`, `Delete`)

-   **Ferramentas Principais**: Funções `setDocumentNonBlocking`, `addDocumentNonBlocking`, etc., de `src/firebase/non-blocking-updates.tsx`.
-   **Estratégia**: **Escrita Otimista e Não-Bloqueante (Optimistic UI).**
    -   **O que é?** Quando o usuário clica em "Salvar", a aplicação **não espera** (`await`) a confirmação do Firebase.
    1.  A função de escrita (ex: `setDocumentNonBlocking`) é chamada.
    2.  Ela dispara a operação para o Firebase e **imediatamente retorna**, liberando a UI.
    3.  A biblioteca do Firebase atualiza o **cache local** primeiro. Como os hooks `useCollection`/`useDoc` leem a partir desse cache, a interface (uma tabela, um formulário) é atualizada instantaneamente, dando a sensação de uma aplicação extremamente rápida.
    4.  Em segundo plano, o SDK do Firebase gerencia a sincronização com o servidor.
-   **Vantagem**: A experiência do usuário é fluida e instantânea. Ele não vê "spinners" de carregamento a cada salvamento. A aplicação continua responsiva mesmo com conexões de internet lentas.

---

## 3. Tratamento de Erros de Permissão

Este é um dos pontos mais críticos e robustos da arquitetura.

-   **Como Funciona**: O que acontece se uma escrita otimista falhar no servidor por falta de permissão?
    1.  Cada função `...NonBlocking` possui um bloco `.catch()`.
    2.  Se o Firestore nega a escrita, o erro é capturado.
    3.  Uma instância de `FirestorePermissionError` (`src/firebase/errors.ts`) é criada. Este erro customizado formata a falha em um JSON detalhado, espelhando o objeto `request` das regras de segurança. Ele inclui o `path`, a `operação` e os `dados` da requisição negada.
    4.  Este erro contextual é publicado globalmente através do `errorEmitter` (`src/firebase/error-emitter.ts`).
    5.  O componente `<FirebaseErrorListener />`, que reside no layout raiz, "ouve" esse evento e **lança o erro**.
    6.  O **Error Overlay** do Next.js captura este erro lançado e o exibe de forma clara para o desenvolvedor, mostrando exatamente qual operação foi negada e por quê.

-   **Vantagem**: Em vez de `console.log` genéricos, temos um sistema de depuração de permissões que nos diz com precisão cirúrgica onde o problema está, acelerando drasticamente o desenvolvimento e a correção de bugs relacionados a regras de segurança.

---

## Resumo da Estratégia

| Operação | Estratégia | Ferramenta Principal | Vantagem Principal |
| :--- | :--- | :--- | :--- |
| **Leitura (Read)** | Tempo Real | `useCollection`, `useDoc` | UI sempre sincronizada com o banco de dados. |
| **Escrita (C/U/D)** | Otimista / Não-Bloqueante | `...NonBlocking` funcs | Interface ultra-rápida, sem spinners de espera. |
| **Erros** | Centralizada e Contextual | `errorEmitter` | Depuração de permissões clara e eficiente. |

Essa arquitetura garante que a aplicação seja rápida para o usuário final e, ao mesmo tempo, transparente e fácil de depurar para o desenvolvedor.
