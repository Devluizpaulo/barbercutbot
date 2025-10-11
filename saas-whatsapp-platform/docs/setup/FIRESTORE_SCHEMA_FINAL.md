# 🗄️ Schema Firestore Final - SaaS Barbearia

## 📊 Estrutura Completa (Baseada no Schema Fornecido)

Integrando o schema profissional com as necessidades de automação WhatsApp + IA.

---

## 🏗️ **Estrutura de Collections**

```
firestore/
├── users/{userId}                                    # Usuários da plataforma
├── barberShops/{barberShopId}                       # Barbearias (tenants)
│   ├── customers/{customerId}                       # Clientes da barbearia
│   ├── barbers/{barberId}                          # Barbeiros
│   ├── appointments/{appointmentId}                # Agendamentos
│   ├── services/{serviceId}                        # Serviços oferecidos
│   ├── suppliers/{supplierId}                      # Fornecedores
│   └── financialRecords/{recordId}                 # Registros financeiros
└── conversations/{conversationId}                   # Conversas WhatsApp (global)
```

---

## 📋 **Schema Completo Adaptado**

### **1. users/{userId}**

```javascript
{
  "id": "user_123",                      // Firebase UID
  "firstName": "João",
  "lastName": "Silva",
  "email": "joao@email.com",
  "phone": "11999999999",
  "role": "owner",                       // owner, admin, barber
  "createdAt": timestamp,
  "lastLogin": timestamp
}
```

---

### **2. barberShops/{barberShopId}**

```javascript
{
  // Schema Original
  "id": "barbershop_001",
  "name": "Barbearia Premium SP",
  "ownerId": "user_123",                 // FK para users
  "address": "Rua Augusta, 1234 - São Paulo, SP",
  "phone": "11988887777",
  "email": "contato@premium.com",
  
  // Extensões para Automação WhatsApp + IA
  "slug": "premium-sp",
  "logo": "https://...",
  
  // WhatsApp Integration
  "whatsapp": {
    "instanceId": "barbershop_001",      // Igual ao barberShopId
    "numeroConectado": "5511988887777",
    "status": "connected",               // connected, disconnected
    "qrCode": "",
    "ultimaConexao": timestamp
  },
  
  // Bot IA Configuration
  "bot": {
    "provider": "groq",                  // groq, gemini
    "modelo": "llama-3.1-70b-versatile",
    "temperatura": 0.7,
    "maxTokens": 500,
    "ativo": true,
    "promptPersonalizado": "Você é o assistente virtual da Barbearia Premium SP..."
  },
  
  // Business Hours
  "horarioFuncionamento": {
    "segunda": { "inicio": "08:00", "fim": "18:00", "ativo": true },
    "terca": { "inicio": "08:00", "fim": "18:00", "ativo": true },
    "quarta": { "inicio": "08:00", "fim": "18:00", "ativo": true },
    "quinta": { "inicio": "08:00", "fim": "18:00", "ativo": true },
    "sexta": { "inicio": "08:00", "fim": "18:00", "ativo": true },
    "sabado": { "inicio": "08:00", "fim": "14:00", "ativo": true },
    "domingo": { "ativo": false }
  },
  
  // Subscription Plan
  "plano": {
    "tipo": "pro",                       // starter, pro, premium
    "valor": 249,
    "limiteMensagens": 2000,
    "mensagensUsadas": 0,
    "limiteTokensIA": 100000,
    "tokensUsados": 0,
    "status": "ativo",                   // ativo, suspenso, cancelado
    "proximoPagamento": timestamp
  },
  
  // Metadados
  "ativo": true,
  "criadoEm": timestamp,
  "atualizadoEm": timestamp
}
```

---

### **3. barberShops/{barberShopId}/customers/{customerId}**

```javascript
{
  // Schema Original
  "id": "customer_001",
  "barberShopId": "barbershop_001",      // Denormalizado
  "firstName": "Carlos",
  "lastName": "Santos",
  "phone": "11988776655",
  "email": "carlos@email.com",
  "notes": "Prefere corte degradê",
  
  // Extensões WhatsApp
  "whatsappPhone": "5511988776655",      // Com código país
  "ultimoAgendamento": timestamp,
  "totalAgendamentos": 15,
  "clienteDesde": timestamp,
  "tags": ["vip", "fidelizado"]
}
```

---

### **4. barberShops/{barberShopId}/barbers/{barberId}**

```javascript
{
  // Schema Original
  "id": "barber_001",
  "barberShopId": "barbershop_001",
  "firstName": "Pedro",
  "lastName": "Oliveira",
  "phone": "11977665544",
  "email": "pedro@premium.com",
  "bio": "Especialista em cortes modernos",
  
  // Extensões
  "foto": "https://...",
  "especialidades": ["corte", "barba", "pigmentacao"],
  "avaliacaoMedia": 4.8,
  "totalAvaliacoes": 127,
  "ativo": true
}
```

---

### **5. barberShops/{barberShopId}/appointments/{appointmentId}**

```javascript
{
  // Schema Original
  "id": "appointment_001",
  "barberShopId": "barbershop_001",      // Denormalizado
  "customerId": "customer_001",          // FK
  "barberId": "barber_001",              // FK
  "startTime": "2025-10-15T14:00:00Z",   // ISO 8601
  "endTime": "2025-10-15T14:45:00Z",
  "serviceIds": ["service_corte_barba"],  // Array de FKs
  "notes": "Cliente quer degradê alto",
  
  // Extensões para Automação
  "status": "confirmado",                // pendente, confirmado, concluido, cancelado, falta
  "origem": "whatsapp_bot",              // whatsapp_bot, dashboard, manual
  "conversationId": "conv_001",          // FK para conversations
  
  // Notificações
  "confirmacaoEnviada": true,
  "confirmacaoEnviadaEm": timestamp,
  "lembreteEnviado": false,
  "lembreteEnviadoEm": null,
  
  // Valores (calculado dos serviços)
  "valorTotal": 60,
  "valorPago": 0,
  "formaPagamento": "",                  // dinheiro, pix, cartao
  
  // Metadados
  "criadoEm": timestamp,
  "atualizadoEm": timestamp,
  "criadoPor": "bot",                    // bot, user, customer
  "canceladoEm": null,
  "motivoCancelamento": ""
}
```

---

### **6. barberShops/{barberShopId}/services/{serviceId}**

```javascript
{
  // Schema Original
  "id": "service_corte",
  "barberShopId": "barbershop_001",
  "name": "Corte Masculino",
  "description": "Corte moderno com acabamento profissional",
  "price": 40,
  "duration": 30,                        // minutos
  
  // Extensões
  "ativo": true,
  "popular": false,
  "categoria": "cabelo",                 // cabelo, barba, combo, outros
  "ordem": 1,                            // Para ordenação na exibição
  "imagemUrl": "https://..."
}
```

---

### **7. barberShops/{barberShopId}/suppliers/{supplierId}**

```javascript
{
  // Schema Original
  "id": "supplier_001",
  "barberShopId": "barbershop_001",
  "name": "Distribuidora Alpha",
  "contactPerson": "Maria Silva",
  "phone": "11955554444",
  "category": "Produtos de Cabelo",
  "notes": "Entrega toda segunda-feira",
  
  // Extensões
  "email": "contato@alpha.com",
  "cnpj": "12.345.678/0001-90",
  "endereco": "Rua Fornecedores, 456",
  "ativo": true
}
```

---

### **8. barberShops/{barberShopId}/financialRecords/{recordId}**

```javascript
{
  // Schema Original
  "id": "record_001",
  "barberShopId": "barbershop_001",
  "date": "2025-10-15T10:30:00Z",
  "type": "income",                      // income, expense
  "description": "Corte + Barba - Carlos Santos",
  "amount": 60,
  "category": "Venda de Serviço",
  
  // Income specific
  "paymentMethod": "Pix",                // Dinheiro, Cartão, Pix
  
  // Expense specific
  "isRecurring": false,
  
  // Extensões
  "appointmentId": "appointment_001",     // Relacionado ao agendamento
  "customerId": "customer_001",
  "status": "pago",                      // pendente, pago, cancelado
  "comprovante": "https://...",
  "criadoEm": timestamp
}
```

---

### **9. conversations/{conversationId}** (Nova - Para WhatsApp)

```javascript
{
  "id": "conv_001",
  "barberShopId": "barbershop_001",
  "customerId": "customer_001",
  "customerPhone": "5511988776655",
  "customerName": "Carlos Santos",
  
  // Histórico de Mensagens
  "mensagens": [
    {
      "id": "msg_001",
      "de": "customer",                  // customer, bot, barber
      "texto": "Quero agendar um corte",
      "timestamp": timestamp,
      "lida": true
    },
    {
      "id": "msg_002",
      "de": "bot",
      "texto": "Claro! Que dia você prefere?",
      "timestamp": timestamp,
      "iaProvider": "groq",
      "iaModelo": "llama-3.1-70b",
      "tokensUsados": 85
    }
  ],
  
  // Contexto da Conversa (para IA)
  "contexto": {
    "estaAgendando": true,
    "servicoInteresse": "corte",
    "dataDesejada": "2025-10-15",
    "horarioDesejado": "14:00",
    "appointmentId": "appointment_001"   // Quando confirmado
  },
  
  // Stats
  "totalMensagens": 15,
  "ultimaMensagem": timestamp,
  "iniciadaEm": timestamp,
  "status": "ativa"                      // ativa, finalizada, abandonada
}
```

---

## 🔗 **Relacionamentos (ERD)**

```
User (1) ──────── (N) BarberShop
                        │
                        ├── (N) Customer
                        ├── (N) Barber
                        ├── (N) Service
                        ├── (N) Supplier
                        ├── (N) FinancialRecord
                        └── (N) Appointment
                                  │
                                  ├── (FK) customerId → Customer
                                  ├── (FK) barberId → Barber
                                  └── (N:N) serviceIds → Services
```

---

## 🔐 **Firestore Security Rules**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper functions
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    function ownsBarberShop(barberShopId) {
      return isAuthenticated() && 
             get(/databases/$(database)/documents/barberShops/$(barberShopId)).data.ownerId == request.auth.uid;
    }
    
    // Users
    match /users/{userId} {
      allow read: if isOwner(userId);
      allow write: if isOwner(userId);
    }
    
    // Barber Shops
    match /barberShops/{barberShopId} {
      allow read: if ownsBarberShop(barberShopId);
      allow create: if isAuthenticated();
      allow update: if ownsBarberShop(barberShopId);
      allow delete: if ownsBarberShop(barberShopId);
      
      // Customers
      match /customers/{customerId} {
        allow read, write: if ownsBarberShop(barberShopId);
      }
      
      // Barbers
      match /barbers/{barberId} {
        allow read, write: if ownsBarberShop(barberShopId);
      }
      
      // Appointments
      match /appointments/{appointmentId} {
        allow read, write: if ownsBarberShop(barberShopId);
      }
      
      // Services
      match /services/{serviceId} {
        allow read, write: if ownsBarberShop(barberShopId);
      }
      
      // Suppliers
      match /suppliers/{supplierId} {
        allow read, write: if ownsBarberShop(barberShopId);
      }
      
      // Financial Records
      match /financialRecords/{recordId} {
        allow read, write: if ownsBarberShop(barberShopId);
      }
    }
    
    // Conversations (N8N precisa acesso)
    match /conversations/{conversationId} {
      allow read, write: if true;  // N8N service account
    }
  }
}
```

---

## 🤖 **Integração com N8N/WhatsApp**

### **Workflow Atualizado:**

1. Cliente envia mensagem WhatsApp
2. N8N busca `barberShops/{instanceId}`
3. N8N busca ou cria `customers` (pelo telefone)
4. N8N busca ou cria `conversations`
5. IA processa com contexto completo
6. Se agendar: Cria `appointments`
7. Se pagar: Cria `financialRecords`

---

## 📊 **Índices Compostos Necessários**

```javascript
// firestore.indexes.json
{
  "indexes": [
    {
      "collectionGroup": "appointments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "barberShopId", "order": "ASCENDING" },
        { "fieldPath": "startTime", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "appointments",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "barberShopId", "order": "ASCENDING" },
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "startTime", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "customers",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "barberShopId", "order": "ASCENDING" },
        { "fieldPath": "phone", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "financialRecords",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "barberShopId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 🎯 **Exemplo de Dados Completo**

### **Barbearia:**
```javascript
barberShops/barbershop_premium_sp
```

### **Serviços:**
```javascript
barberShops/barbershop_premium_sp/services/corte
barberShops/barbershop_premium_sp/services/barba
barberShops/barbershop_premium_sp/services/corte_barba
```

### **Cliente:**
```javascript
barberShops/barbershop_premium_sp/customers/customer_carlos
```

### **Agendamento:**
```javascript
barberShops/barbershop_premium_sp/appointments/appt_20251015_1400
{
  "customerId": "customer_carlos",
  "barberId": "barber_pedro",
  "serviceIds": ["corte_barba"],
  "startTime": "2025-10-15T14:00:00Z",
  "endTime": "2025-10-15T14:45:00Z",
  "status": "confirmado",
  "origem": "whatsapp_bot"
}
```

### **Registro Financeiro (Criado após conclusão):**
```javascript
barberShops/barbershop_premium_sp/financialRecords/record_20251015_001
{
  "type": "income",
  "appointmentId": "appt_20251015_1400",
  "customerId": "customer_carlos",
  "amount": 60,
  "paymentMethod": "Pix",
  "category": "Venda de Serviço"
}
```

---

## 💡 **Benefícios Deste Schema**

✅ **Multi-tenant por design** - Dados isolados por barbearia  
✅ **Relacionamentos claros** - FKs bem definidas  
✅ **Denormalização inteligente** - barberShopId em subcoleções  
✅ **Segurança** - Rules baseadas em ownership  
✅ **Escalável** - Estrutura hierárquica eficiente  
✅ **Completo** - Cobre todos os casos de uso  

---

## 🚀 **Próximo Passo**

Vou criar:
1. ✅ Workflow N8N atualizado para esse schema
2. ✅ Script de criação de barbearia completa
3. ✅ Exemplos de queries
4. ✅ Regras de segurança prontas

**Quer que eu crie tudo isso agora?** 🎯

