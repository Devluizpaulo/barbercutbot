# 🗄️ Estrutura de Dados - Firestore

## 📊 Coleções Principais

### 1. `users` (Usuários da Plataforma)

```javascript
users/{userId}
{
  uid: string,                    // ID do Firebase Auth
  email: string,                  // Email do usuário
  name: string,                   // Nome completo
  phone: string,                  // Telefone
  businessName: string,           // Nome do negócio (ex: "Barbearia do João")
  businessType: string,           // Tipo de negócio (barbershop, clinic, etc)
  
  // Plano e Limites
  plan: {
    type: string,                 // 'starter', 'pro', 'premium'
    price: number,                // Preço mensal em R$
    messagesLimit: number,        // Limite de mensagens (600, 2000, 5000)
    messagesUsed: number,         // Mensagens usadas no mês
    resetDate: timestamp,         // Data de reset do contador
    startDate: timestamp,         // Data de início do plano
    status: string                // 'active', 'suspended', 'cancelled'
  },
  
  // Configurações
  settings: {
    timezone: string,             // 'America/Sao_Paulo'
    autoReply: boolean,           // Resposta automática ativa
    businessHours: {
      start: string,              // '08:00'
      end: string,                // '18:00'
      daysOfWeek: array           // [1,2,3,4,5,6] (segunda a sábado)
    },
    notifications: {
      email: boolean,
      whatsapp: boolean
    }
  },
  
  // Metadados
  role: string,                   // 'user', 'admin'
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp,
  lastLoginAt: timestamp
}
```

**Subcoleções:**

#### `users/{userId}/whatsapp_instances/{instanceId}`

```javascript
{
  instanceId: string,             // ID único da instância
  instanceName: string,           // Nome da instância (ex: "Principal")
  phoneNumber: string,            // Número WhatsApp conectado
  isConnected: boolean,
  connectionStatus: string,       // 'connected', 'disconnected', 'connecting'
  qrCodeUrl: string,             // URL do QR Code (temporário)
  qrCodeExpiration: timestamp,
  lastActivity: timestamp,
  
  // Estatísticas
  stats: {
    totalMessagesSent: number,
    totalMessagesReceived: number,
    lastMessageAt: timestamp
  },
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

#### `users/{userId}/appointments/{appointmentId}`

```javascript
{
  appointmentId: string,
  
  // Cliente
  customer: {
    name: string,
    phone: string,
    email: string
  },
  
  // Agendamento
  service: string,                // 'Corte', 'Barba', 'Corte + Barba'
  servicePrice: number,           // Preço do serviço
  appointmentDate: timestamp,     // Data e hora do agendamento
  duration: number,               // Duração em minutos
  
  // Status
  status: string,                 // 'pending', 'confirmed', 'completed', 'cancelled', 'no-show'
  confirmationSentAt: timestamp,
  reminderSentAt: timestamp,
  
  // Notas
  notes: string,
  internalNotes: string,
  
  // Origem
  source: string,                 // 'whatsapp', 'manual', 'web'
  instanceId: string,             // Instância WhatsApp que criou
  
  createdAt: timestamp,
  updatedAt: timestamp,
  completedAt: timestamp
}
```

#### `users/{userId}/messages/{messageId}`

```javascript
{
  messageId: string,
  
  // Origem
  instanceId: string,
  direction: string,              // 'sent', 'received'
  
  // Conteúdo
  messageType: string,            // 'text', 'image', 'audio', 'video', 'document'
  content: string,
  mediaUrl: string,               // Se for mídia
  
  // Destinatário/Remetente
  contactPhone: string,
  contactName: string,
  
  // Status
  status: string,                 // 'sent', 'delivered', 'read', 'failed'
  
  // Custo e Controle
  cost: number,                   // Custo da mensagem (para controle)
  countedInLimit: boolean,        // Se conta no limite do plano
  
  // Metadados
  sentAt: timestamp,
  deliveredAt: timestamp,
  readAt: timestamp,
  
  // Automação
  isAutomated: boolean,
  automationTrigger: string,      // 'appointment_reminder', 'welcome', etc
  n8nExecutionId: string          // ID da execução N8N (se aplicável)
}
```

#### `users/{userId}/statistics/{period}`

```javascript
// period pode ser: 'daily_2024-10-10', 'monthly_2024-10', 'yearly_2024'
{
  period: string,
  periodType: string,             // 'daily', 'monthly', 'yearly'
  
  // Mensagens
  messages: {
    sent: number,
    received: number,
    automated: number,
    cost: number
  },
  
  // Agendamentos
  appointments: {
    total: number,
    confirmed: number,
    completed: number,
    cancelled: number,
    noShow: number
  },
  
  // Financeiro (se aplicável)
  revenue: number,
  
  // Metadados
  calculatedAt: timestamp
}
```

---

### 2. `plans` (Planos Disponíveis)

```javascript
plans/{planId}
{
  planId: string,                 // 'starter', 'pro', 'premium'
  name: string,                   // 'Plano Starter'
  price: number,                  // 149.00
  currency: string,               // 'BRL'
  
  // Limites
  limits: {
    messages: number,             // 600
    instances: number,            // 1
    users: number                 // 1
  },
  
  // Recursos
  features: array,                // ['Mensagens automáticas', 'Agendamentos', ...]
  
  // Disponibilidade
  isActive: boolean,
  isPublic: boolean,
  
  // Stripe
  stripeProductId: string,
  stripePriceId: string,
  
  createdAt: timestamp,
  updatedAt: timestamp
}
```

---

### 3. `webhooks_log` (Log de Webhooks Recebidos)

```javascript
webhooks_log/{logId}
{
  logId: string,
  
  // Origem
  source: string,                 // 'evolution', 'n8n', 'stripe'
  eventType: string,              // 'MESSAGES_UPSERT', 'CONNECTION_UPDATE', etc
  
  // Dados
  payload: object,                // Payload completo do webhook
  
  // Processamento
  processed: boolean,
  processedAt: timestamp,
  error: string,                  // Se houver erro
  
  // Metadados
  userId: string,                 // Usuário relacionado (se aplicável)
  instanceId: string,             // Instância relacionada (se aplicável)
  receivedAt: timestamp
}
```

---

### 4. `system_settings` (Configurações do Sistema)

```javascript
system_settings/{settingId}
{
  settingKey: string,
  settingValue: any,
  description: string,
  updatedBy: string,              // userId do admin
  updatedAt: timestamp
}
```

---

## 🔍 Índices Compostos (já configurados em firestore.indexes.json)

1. **Mensagens por usuário e data:**
   - `userId` (ASC) + `sentAt` (DESC)

2. **Agendamentos por usuário e data:**
   - `userId` (ASC) + `appointmentDate` (ASC)

3. **Agendamentos por status:**
   - `userId` (ASC) + `status` (ASC) + `appointmentDate` (ASC)

4. **Instâncias conectadas:**
   - `userId` (ASC) + `isConnected` (ASC)

5. **Mensagens por tipo:**
   - `userId` (ASC) + `messageType` (ASC) + `sentAt` (DESC)

---

## 📈 Exemplo de Query

### Buscar agendamentos do dia

```javascript
const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const appointmentsRef = db
  .collection('users')
  .doc(userId)
  .collection('appointments');

const todayAppointments = await appointmentsRef
  .where('appointmentDate', '>=', today)
  .where('appointmentDate', '<', tomorrow)
  .where('status', '==', 'confirmed')
  .orderBy('appointmentDate', 'asc')
  .get();
```

### Contar mensagens do mês

```javascript
const firstDayOfMonth = new Date();
firstDayOfMonth.setDate(1);
firstDayOfMonth.setHours(0, 0, 0, 0);

const messagesRef = db
  .collection('users')
  .doc(userId)
  .collection('messages');

const monthMessages = await messagesRef
  .where('sentAt', '>=', firstDayOfMonth)
  .where('direction', '==', 'sent')
  .where('countedInLimit', '==', true)
  .get();

const messageCount = monthMessages.size;
```

---

## 🔐 Segurança

- ✅ Regras de segurança configuradas em `firestore.rules`
- ✅ Usuários só podem acessar seus próprios dados
- ✅ Admins têm acesso total
- ✅ Logs de webhooks são read-only para admins
- ✅ Estatísticas são geradas apenas por Cloud Functions

---

## 💡 Próximos Passos

1. Configurar Firebase Authentication
2. Criar Cloud Functions para:
   - Processar webhooks
   - Gerar estatísticas
   - Reset mensal de contadores
   - Envio de notificações
3. Integrar com N8N via HTTP requests
4. Implementar dashboard no Next.js
