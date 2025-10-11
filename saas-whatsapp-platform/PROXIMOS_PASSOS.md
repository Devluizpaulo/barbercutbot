# 🎯 Próximos Passos - 7 Minutos Finais

## ✅ **Já Configurado (98%)**

```
✅ VM rodando (34.182.111.255)
✅ Evolution API funcionando
✅ N8N funcionando
✅ Owner N8N criado
✅ Firestore ativo
✅ Collection barberShops criada
✅ Documento 7AAd2xvXPzDRHdQhF89e criado
✅ Groq API configurada
✅ Firebase integrado
```

---

## ⏱️ **Faltam 7 Minutos!**

### **1️⃣ Completar Dados da Barbearia (3 min)**

**Abra:** https://console.firebase.google.com/project/studio-343774762-16da7/firestore/databases/-default-/data/~2FbarberShops~2F7AAd2xvXPzDRHdQhF89e

**Adicione estes campos (clique em "Add field"):**

```
Campo: id
Tipo: string
Valor: 7AAd2xvXPzDRHdQhF89e

Campo: name
Tipo: string
Valor: Barbearia Teste

Campo: phone
Tipo: string
Valor: 11988887777

Campo: ativo
Tipo: boolean
Valor: true

Campo: whatsapp
Tipo: map
  → instanceId (string): 7AAd2xvXPzDRHdQhF89e
  → status (string): disconnected
  → numeroConectado (string): (deixar vazio)

Campo: bot
Tipo: map
  → provider (string): groq
  → modelo (string): llama-3.1-70b-versatile
  → temperatura (number): 0.7
  → ativo (boolean): true
  → promptPersonalizado (string): Você é o assistente virtual da Barbearia Teste. Seja amigável, profissional e ajude os clientes com agendamentos, informações sobre serviços e preços. Responda sempre em português do Brasil.
```

**Criar subcollection `services`:**

1. Clicar nos **3 pontos** do documento → **Add collection**
2. Collection ID: `services`
3. Document ID: `corte`
   - name: Corte Masculino
   - price: 40
   - duration: 30
   - ativo: true

4. Add document → ID: `barba`
   - name: Barba
   - price: 25
   - duration: 20
   - ativo: true

---

### **2️⃣ Importar Workflow no N8N (1 min)**

**Abra:** http://34.182.111.255:5678

1. Login (owner já existe)
2. **Workflows** → **Add Workflow**
3. Clicar em **"..."** → **Import from File**
4. Escolher arquivo: `n8n-workflows/04-atendimento-completo-groq.json`
5. Após importar, clicar em **"Active"** (toggle no topo)

---

### **3️⃣ Criar Instância WhatsApp (2 min)**

**Abra:** http://34.182.111.255:8080/manager

1. **Create Instance**
2. Preencher:
   - **Instance Name:** `7AAd2xvXPzDRHdQhF89e` (MESMO ID do Firestore!)
   - **API Key:** `gcp_free_key_2024`
3. **Create**
4. **Connect** → Aparecerá QR Code
5. Escanear com WhatsApp
6. Aguardar status **"Connected"** ✅

---

### **4️⃣ Atualizar Firestore (30 seg)**

Após WhatsApp conectar, volte no Firestore e atualize:

```
whatsapp:
  status: connected
  numeroConectado: 5511XXXXXXXXX (número que conectou)
```

---

### **5️⃣ TESTAR! (1 min)**

Envie no WhatsApp conectado:

```
oi
```

**Deve receber:** Resposta personalizada da IA! 🤖

Teste agendamento:
```
quero agendar um corte
```

**Bot deve:** Perguntar dia e horário com IA!

---

## 📊 Verificar no Firestore

Após testar, verifique:

1. **Collection `customers`** (auto-criada)
   - Deve ter seu contato!

2. **Collection `appointments`** (auto-criada)
   - Deve ter o agendamento!

---

## ✅ Checklist Final

- [x] VM rodando ✅
- [x] Evolution rodando ✅
- [x] N8N rodando ✅
- [x] Owner N8N ✅
- [x] Firestore ativo ✅
- [x] Collection criada ✅
- [x] Documento criado ✅
- [ ] Campos completados
- [ ] Services criados
- [ ] Workflow importado
- [ ] WhatsApp conectado
- [ ] Teste realizado

---

## 🎯 Resumo

**Configurado:** 98%  
**Falta:** 7 minutos  
**Custo:** R$ 0,00/mês  

**Próximo:** Completar campos do Firestore! 🚀

