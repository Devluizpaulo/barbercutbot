# 📋 Arquitetura de Logs Administrativos

Este documento detalha a implementação do sistema de logs de auditoria, focado em registrar acessos e ações críticas no painel de controle (`/cpanel`).

---

## 1. Objetivos

-   **Rastreabilidade:** Registrar todas as tentativas de login administrativo (sucesso e falha).
-   **Segurança:** Gerar alertas para atividades suspeitas (ex: acesso ao `/cpanel` por não-admins).
-   **Auditoria:** Manter um histórico imutável de ações importantes realizadas por administradores.
-   **Imutabilidade:** Garantir que, uma vez escritos, os logs não possam ser alterados ou excluídos.

---

## 2. Estrutura do Documento de Log

Os logs são armazenados na coleção `adminLogs`. Cada documento representa um evento e segue a interface `AdminLog`:

```typescript
interface AdminLog {
  id?: string;
  type: 'login_success' | 'login_failed' | 'security_alert' | 'logout' | 'action';
  userId?: string;          // UID do usuário, se autenticado
  email: string;             // Email usado na tentativa de acesso
  action?: string;           // Descrição textual da ação
  details?: Record<string, any>; // Dados contextuais (ex: ID do alvo, browser info)
  userAgent?: string;        // User-Agent do navegador
  timestamp: Timestamp;      // Timestamp do servidor
  metadata?: {
    reason?: string;         // Motivo da falha ou alerta
    errorCode?: string;      // Código de erro do Firebase Auth
    errorMessage?: string;   // Mensagem de erro
  };
}
```

---

## 3. Implementação

### **Lógica Central (`src/lib/admin-logs.ts`)**

-   **`logAdminAction`**: Função base que recebe um objeto de log, adiciona `userAgent` e `timestamp`, e o salva na coleção `adminLogs`.
-   **Funções Helper**: Funções como `logLoginSuccess`, `logLoginFailed`, e `logSecurityAlert` abstraem a criação do objeto de log, tornando o uso no código mais limpo e padronizado.
-   **`getBrowserInfo()`**: Coleta informações não-identificáveis do navegador (linguagem, plataforma, fuso horário) para adicionar contexto aos logs de segurança.

### **Integração na Aplicação**

-   **`src/app/cpanel/login/page.tsx`**: Este é o principal ponto de integração.
    -   **Sucesso**: Após o `signInWithEmailAndPassword` e a verificação da `role` de admin, `logLoginSuccess` é chamado.
    -   **Falha (Credenciais)**: No bloco `catch` de uma tentativa de login falha, `logLoginFailed` é chamado, registrando o email e o motivo.
    -   **Falha (Permissão)**: Se o login é bem-sucedido mas o usuário **não é admin**, `logSecurityAlert` é chamado antes de deslogar o usuário, registrando uma tentativa de acesso indevido.

---

## 4. Regras de Segurança (`firestore.rules`)

As regras para a coleção `adminLogs` são cruciais para a integridade do sistema.

```javascript
match /adminLogs/{logId} {
  // Qualquer usuário autenticado pode criar um log.
  // Isso é necessário para registrar tentativas de login FALHAS,
  // onde o usuário pode se autenticar brevemente mas não tem a role de admin.
  allow create: if isSignedIn();
  
  // Apenas administradores podem LER os logs.
  allow read: if isAdmin();
  
  // NINGUÉM pode atualizar ou deletar logs, garantindo sua imutabilidade.
  allow update, delete: if false;
}
```

-   **`allow create: if isSignedIn()`**: Permite que o sistema registre falhas de login de usuários que conseguiram se autenticar mas não são admins.
-   **`allow read: if isAdmin()`**: Garante que apenas a equipe administrativa possa visualizar os registros de auditoria.
-   **`allow update, delete: if false;`**: Torna a coleção **append-only** (somente adição). Uma vez que um log é escrito, ele não pode ser modificado, o que é fundamental para a validade da auditoria.

---

## 5. Visualização no CPanel

-   **`src/app/cpanel/(cpanel)/logs/page.tsx`**: A interface para visualização dos logs.
    -   **Consulta:** Usa o hook `useCollection` com `orderBy('timestamp', 'desc')` para buscar os logs mais recentes.
    -   **Filtragem:** Permite filtrar os logs por tipo (`login_success`, `security_alert`, etc.) e buscar por texto (email, ação).
    -   **Visualização:** Usa badges coloridos e ícones para diferenciar rapidamente os tipos de log, facilitando a identificação de eventos críticos.
    -   **Estatísticas:** Cards no topo da página mostram um resumo quantitativo dos tipos de eventos.

Este sistema cria um ciclo de auditoria completo, desde o registro seguro e imutável dos eventos até uma interface clara para análise por parte dos administradores.
