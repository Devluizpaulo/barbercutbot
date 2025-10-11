# 👋 LEIA-ME PRIMEIRO!

## ✅ **SEU SISTEMA JÁ ESTÁ 91% PRONTO!**

Parabéns! O deploy foi concluído com sucesso.

**VM GCP:** 34.182.111.255  
**Custo:** R$ 0,00/mês  
**Status:** ✅ Rodando

---

## ⏱️ **Faltam Apenas 7 Minutos!**

### **1️⃣ Firestore - Completar Dados (3 min)** ✅ Já Ativado!

Abra: https://console.firebase.google.com/project/studio-343774762-16da7/firestore/databases/-default-/data/~2FbarberShops~2F7AAd2xvXPzDRHdQhF89e

**Documento já existe!** Apenas complete os campos:

**Clique em "Add field" e adicione:**

```
id: 7AAd2xvXPzDRHdQhF89e
name: Barbearia Teste
ownerId: user_demo
phone: 11988887777
ativo: true

whatsapp (map):
  instanceId: 7AAd2xvXPzDRHdQhF89e
  status: disconnected
  numeroConectado: (vazio)

bot (map):
  provider: groq
  modelo: llama-3.1-70b-versatile
  temperatura: 0.7
  ativo: true
  promptPersonalizado: Você é o assistente da Barbearia Teste. Ajude com agendamentos e informações.
```

**Criar subcollection `services`:**
- Document `corte`: {name: "Corte", price: 40, duration: 30}
- Document `barba`: {name: "Barba", price: 25, duration: 20}

---

### **2️⃣ N8N - Importar Workflow (1 min)** ✅ Owner Já Criado!

Abra: http://34.182.111.255:5678

1. **Login** (owner já existe)
2. **Importar workflow:**
   - Workflows → Add Workflow → **"..."** → Import from File
   - Escolher: `n8n-workflows/04-atendimento-completo-groq.json`
   - Clicar em **"Active"** (ativar)

---

### **3️⃣ Criar Instância WhatsApp (3 min)** ✅ Barbearia Já Existe no Firestore!

**Criar no Evolution:**

Abra: http://34.182.111.255:8080/manager

1. **Create Instance**
2. **Instance Name:** `7AAd2xvXPzDRHdQhF89e` (MESMO ID do Firestore!)
3. **API Key:** `gcp_free_key_2024`
4. **Create**
5. **Connect** → Gerar QR Code
6. Escanear com WhatsApp
7. Aguardar **"Connected"** ✅

Após conectar, **atualizar Firestore:**

```
id: barbershop_teste
name: Barbearia Teste
ownerId: user_demo
phone: 11988887777
whatsapp: (map)
  instanceId: barbershop_teste
  status: disconnected
bot: (map)
  provider: groq
  modelo: llama-3.1-70b-versatile
  ativo: true
  promptPersonalizado: Você é o assistente da Barbearia Teste. Ajude com agendamentos.
ativo: true
```

4. Dentro desse documento, criar subcollection:
   - Collection: `services`
   - Document: `corte`
   - Campos: `{name: "Corte", price: 40, duration: 30}`

**B) Criar instância Evolution:**

Abra: http://34.182.111.255:8080/manager

1. **Create Instance:** `barbershop_teste`
2. **Connect** → QR Code
3. Escanear com WhatsApp
4. Aguardar **"Connected"** ✅

---

### **4️⃣ Testar (1 min)**

Enviar no WhatsApp:
```
oi
```

Deve receber resposta da IA! 🎉

---

## 📚 **Próximos Passos**

Depois de testar:

1. **Ver dados salvos:** [Firestore](https://console.firebase.google.com/project/studio-343774762-16da7/firestore)
2. **Editar workflow:** [N8N](http://34.182.111.255:5678)
3. **Adicionar mais barbearias:** [Guia](docs/setup/02-CONFIGURACAO-BARBEARIA.md)

---

## 🆘 **Precisa de Ajuda?**

- **Índice completo:** [INDEX.md](INDEX.md)
- **Status detalhado:** [STATUS_PROJETO.md](STATUS_PROJETO.md)
- **Documentação:** Pasta `/docs`

---

**🚀 Vamos lá! 9 minutos e está tudo pronto!**
