# 💈 Configuração de Nova Barbearia

## 🎯 Tempo Total: ~10 minutos por barbearia

---

## ✅ Passo 1: Criar Instância WhatsApp (3 min)

**Acessar:** http://34.182.111.255:8080/manager

1. **Create Instance**
2. Nome: `barbershop_001` (ID único)
3. API Key: `gcp_free_key_2024`
4. **Connect** → QR Code
5. Cliente escaneia
6. Aguardar **"Connected"** ✅

---

## ✅ Passo 2: Criar no Firestore (5 min)

**Acessar:** https://console.firebase.google.com/project/iaflowcutspro/firestore

**Collection:** `barberShops`  
**Document:** `barbershop_001`

**Template:**
```javascript
{
  "id": "barbershop_001",
  "name": "Barbearia Teste",
  "ownerId": "user_demo",
  "phone": "11988887777",
  "whatsapp": {
    "instanceId": "barbershop_001",
    "status": "connected"
  },
  "bot": {
    "provider": "groq",
    "modelo": "llama-3.1-70b-versatile",
    "ativo": true,
    "promptPersonalizado": "Você é o assistente da Barbearia. Ajude com agendamentos."
  }
}
```

**Subcollection `services`:**
- Document `corte`: {name: "Corte", price: 40, duration: 30}
- Document `barba`: {name: "Barba", price: 25, duration: 20}

---

## ✅ Passo 3: Testar (2 min)

Enviar "oi" no WhatsApp → Deve receber resposta da IA!

---

**Pronto! Barbearia configurada!** ✅
