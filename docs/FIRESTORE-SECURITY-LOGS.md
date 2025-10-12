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

    // Admin Logs - Apenas administradores podem ler e escrever
    match /adminLogs/{logId} {
      // Permite criar logs (necessário para o sistema de auth)
      allow create: if request.auth != null;
      
      // Apenas admins podem ler os logs
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      
      // Nenhuma atualização ou deleção permitida (logs são imutáveis)
      allow update, delete: if false;
    }
  }
}
```

### Importante

1. **Criação de Logs**: Qualquer usuário autenticado pode criar logs (necessário para registrar tentativas de login)
2. **Leitura de Logs**: Apenas administradores podem ler os logs
3. **Logs Imutáveis**: Uma vez criados, os logs não podem ser modificados ou deletados
4. **Auditoria**: Todos os logs são permanentes para fins de auditoria

### Índices Necessários

Para melhor performance, crie estes índices no Firestore:

```javascript
// Índice para ordenação por timestamp
adminLogs: {
  timestamp: descending
}

// Índice composto para filtros por tipo e timestamp
adminLogs: {
  type: ascending,
  timestamp: descending
}

// Índice para busca por email
adminLogs: {
  email: ascending,
  timestamp: descending
}
```

### Como Criar os Índices

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Vá para **Firestore Database** > **Indexes**
3. Clique em **Create Index**
4. Configure os índices conforme indicado acima

Ou aguarde que o Firebase sugira automaticamente os índices quando você fizer as primeiras queries.

