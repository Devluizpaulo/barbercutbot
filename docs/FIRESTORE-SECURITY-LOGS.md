# Regras de Segurança do Firestore - Admin Logs

## Coleção: `adminLogs`

### Estrutura do Documento

```typescript
{
  id: string (auto-gerado),
  type: 'login_success' | 'login_failed' | 'logout' | 'action' | 'security_alert',
  userId?: string,
  email: string,
  action?: string,
  details?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string,
  timestamp: Timestamp,
  metadata?: {
    errorCode?: string,
    errorMessage?: string,
    reason?: string,
  }
}
```

### Regras de Segurança

Adicione estas regras ao arquivo `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // ... suas outras regras ...

    // Admin Logs - Logs são imutáveis e apenas admins podem ler.
    match /adminLogs/{logId} {
      // Qualquer usuário autenticado pode CRIAR um log.
      // Isso é necessário para registrar tentativas de login FALHAS
      // de usuários que existem no Auth mas não são admins.
      allow create: if isSignedIn();
      
      // Apenas admins podem LER os logs.
      allow read: if isAdmin();
      
      // NINGUÉM pode atualizar ou deletar logs, garantindo sua imutabilidade.
      allow update, delete: if false;
    }
  }
}
```

### Justificativa das Regras

1.  **`allow create: if isSignedIn();`**
    -   **Por quê?** Para registrar uma tentativa de login falha de um usuário não-admin, o sistema precisa de permissão para escrever no log *antes* de saber se o usuário tem a role `admin`. Permitir a criação para qualquer usuário autenticado resolve isso. O risco é mínimo, pois o conteúdo do log é gerado no backend (Cloud Function) ou no frontend com dados controlados.

2.  **`allow read: if isAdmin();`**
    -   **Por quê?** Os logs de auditoria podem conter informações sensíveis sobre a operação da plataforma. Apenas administradores devem ter a capacidade de visualizar esses registros.

3.  **`allow update, delete: if false;`**
    -   **Por quê?** Este é o pilar da **imutabilidade**. Para que um log de auditoria seja confiável, ele não pode ser alterado após sua criação. Esta regra proíbe explicitamente qualquer modificação ou exclusão, garantindo a integridade do histórico.

### Índices Necessários

Para que as consultas na página de logs do CPanel sejam performáticas, os seguintes índices compostos são recomendados no Firestore:

```json
{
  "collectionGroup": "adminLogs",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "adminLogs",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "type", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
},
{
  "collectionGroup": "adminLogs",
  "queryScope": "COLLECTION",
  "fields": [
    { "fieldPath": "email", "order": "ASCENDING" },
    { "fieldPath": "timestamp", "order": "DESCENDING" }
  ]
}
```

Sem esses índices, as operações de ordenação e filtro na coleção `adminLogs` falhariam ou seriam extremamente lentas.
