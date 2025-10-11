# 🗄️ Schema Firestore - Completo

## 📊 Estrutura (baseado no schema profissional fornecido)

```
/users/{userId}
/barberShops/{barberShopId}
  ├── /customers/{customerId}
  ├── /barbers/{barberId}
  ├── /appointments/{appointmentId}
  ├── /services/{serviceId}
  ├── /suppliers/{supplierId}
  └── /financialRecords/{recordId}
```

---

## 📋 Documentos Principais

### **barberShops/{barberShopId}**
```javascript
{
  "id": "barbershop_001",
  "name": "Barbearia Premium",
  "ownerId": "user_123",
  "address": "Rua Exemplo, 123",
  "phone": "11988887777",
  "whatsapp": {
    "instanceId": "barbershop_001",
    "numeroConectado": "5511988887777",
    "status": "connected"
  },
  "bot": {
    "provider": "groq",
    "modelo": "llama-3.1-70b-versatile",
    "promptPersonalizado": "..."
  }
}
```

### **appointments/{appointmentId}**
```javascript
{
  "barberShopId": "barbershop_001",
  "customerId": "customer_001",
  "barberId": "barber_001",
  "startTime": "2025-10-15T14:00:00Z",
  "serviceIds": ["service_corte"],
  "status": "confirmado",
  "origem": "whatsapp_bot"
}
```

### **customers/{customerId}**
```javascript
{
  "barberShopId": "barbershop_001",
  "firstName": "Carlos",
  "lastName": "Santos",
  "phone": "11988776655"
}
```

---

**Ver schema completo:** FIRESTORE_SCHEMA_FINAL.md

