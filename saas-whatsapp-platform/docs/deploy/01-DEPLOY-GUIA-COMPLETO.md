# 🚀 Guia Completo de Deploy - GCP Free Tier

## ✅ **Já Está Rodando!**

Seu servidor já está configurado e funcionando:

- **VM:** evolution-saas-free (us-west1-b)
- **IP:** 34.182.111.255
- **Evolution API:** ✅ Rodando
- **N8N:** ✅ Rodando  
- **Firebase:** ✅ Configurado
- **Groq API:** ✅ Configurado

**Custo:** R$ 0,00/mês

---

## 🌐 Acessar Serviços

| Serviço | URL | Login |
|---------|-----|-------|
| Evolution Manager | http://34.182.111.255:8080/manager | - |
| N8N Automation | http://34.182.111.255:5678 | admin / Admin2024Free! |
| Firebase Console | https://console.firebase.google.com/project/flowcutspro | Google |
| GCP Console | https://console.cloud.google.com/compute/instances?project=flowcutspro | Google |

---

## 🔧 Comandos Essenciais

### **Conectar na VM:**
```bash
gcloud compute ssh evolution-saas-free --zone=us-west1-b --project=flowcutspro
```

### **Dentro da VM:**
```bash
cd ~/evolution-saas
docker-compose ps          # Status
docker-compose logs -f     # Logs
docker-compose restart     # Reiniciar
```

---

## 💡 Para Novo Deploy (Outra VM)

Se precisar criar outra VM no futuro:

1. Executar: `gcloud-create-free-tier.sh`
2. SSH na VM
3. Executar: `deploy-gcp-free-auto.sh`
4. Pronto!

---

## 📊 Especificações

- **Tipo:** e2-micro (1GB RAM, 1 vCPU)
- **Disco:** 30GB Standard
- **SO:** Ubuntu 22.04 LTS
- **Região:** us-west1-b (Oregon)
- **Custo:** R$ 0,00/mês (Free Tier permanente)

---

## 🆘 Troubleshooting

### Container reiniciando:
```bash
docker logs evolution_api
docker-compose restart
```

### Sem acesso externo:
```bash
# Verificar firewall
sudo ufw status
```

### Memória alta:
```bash
docker stats
free -h
```

---

**Documentação completa em `/docs`**
