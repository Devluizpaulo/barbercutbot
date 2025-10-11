#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# COMANDO COMPLETO - 100% FREE TIER (R$ 0,00/mês)
# Plataforma SaaS WhatsApp - Google Cloud Platform
# ═══════════════════════════════════════════════════════════════

set -e

echo "════════════════════════════════════════════════════════"
echo "🚀 Criando VM 100% FREE TIER no Google Cloud"
echo "════════════════════════════════════════════════════════"
echo ""

# ═══════════════════════════════════════════════════════════════
# PASSO 1: CRIAR VM (100% GRÁTIS)
# ═══════════════════════════════════════════════════════════════

echo "📦 Criando VM e2-micro em us-west1-b..."
echo ""

gcloud compute instances create evolution-saas-free \
    --project=studio-343774762-16da7 \
    --zone=us-west1-b \
    --machine-type=e2-micro \
    --network-interface=network-tier=PREMIUM,stack-type=IPV4_ONLY,subnet=default \
    --maintenance-policy=MIGRATE \
    --provisioning-model=STANDARD \
    --service-account=827336484489-compute@developer.gserviceaccount.com \
    --scopes=https://www.googleapis.com/auth/devstorage.read_only,https://www.googleapis.com/auth/logging.write,https://www.googleapis.com/auth/monitoring.write,https://www.googleapis.com/auth/service.management.readonly,https://www.googleapis.com/auth/servicecontrol,https://www.googleapis.com/auth/trace.append \
    --tags=https-server,http-server \
    --create-disk=auto-delete=yes,boot=yes,device-name=evolution-saas-free,image=projects/ubuntu-os-cloud/global/images/ubuntu-2204-jammy-v20241004,mode=rw,size=30,type=pd-standard \
    --no-shielded-secure-boot \
    --shielded-vtpm \
    --shielded-integrity-monitoring \
    --labels=goog-ec-src=vm_add-gcloud,environment=production,app=evolution-saas,tier=free \
    --reservation-affinity=any

echo ""
echo "✅ VM criada com sucesso!"
echo ""

# ═══════════════════════════════════════════════════════════════
# PASSO 2: CONFIGURAR FIREWALL
# ═══════════════════════════════════════════════════════════════

echo "🔥 Configurando regras de firewall..."
echo ""

# Verificar se regra já existe antes de criar
if ! gcloud compute firewall-rules describe allow-evolution-api --project=studio-343774762-16da7 &>/dev/null; then
    echo "   Criando regra: allow-evolution-api (porta 8080)"
    gcloud compute firewall-rules create allow-evolution-api \
        --project=studio-343774762-16da7 \
        --direction=INGRESS \
        --priority=1000 \
        --network=default \
        --action=ALLOW \
        --rules=tcp:8080 \
        --source-ranges=0.0.0.0/0 \
        --description="Evolution API - SaaS WhatsApp"
else
    echo "   ✓ Regra allow-evolution-api já existe"
fi

if ! gcloud compute firewall-rules describe allow-n8n --project=studio-343774762-16da7 &>/dev/null; then
    echo "   Criando regra: allow-n8n (porta 5678)"
    gcloud compute firewall-rules create allow-n8n \
        --project=studio-343774762-16da7 \
        --direction=INGRESS \
        --priority=1000 \
        --network=default \
        --action=ALLOW \
        --rules=tcp:5678 \
        --source-ranges=0.0.0.0/0 \
        --description="N8N Automation - SaaS WhatsApp"
else
    echo "   ✓ Regra allow-n8n já existe"
fi

echo ""
echo "✅ Firewall configurado!"
echo ""

# ═══════════════════════════════════════════════════════════════
# PASSO 3: OBTER INFORMAÇÕES
# ═══════════════════════════════════════════════════════════════

echo "📊 Obtendo informações da VM..."
echo ""

# Obter IP externo
EXTERNAL_IP=$(gcloud compute instances describe evolution-saas-free \
    --zone=us-west1-b \
    --project=studio-343774762-16da7 \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

echo "════════════════════════════════════════════════════════"
echo "✅ VM 100% FREE TIER CRIADA COM SUCESSO!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📋 INFORMAÇÕES DA VM:"
echo ""
echo "   Nome:        evolution-saas-free"
echo "   Zona:        us-west1-b"
echo "   Tipo:        e2-micro (1 GB RAM, 1 vCPU)"
echo "   Disco:       30 GB Standard (pd-standard)"
echo "   SO:          Ubuntu 22.04 LTS"
echo "   IP Externo:  ${EXTERNAL_IP}"
echo ""
echo "   💰 Custo Mensal: R$ 0,00 (Free Tier permanente)"
echo ""
echo "════════════════════════════════════════════════════════"
echo "🚀 PRÓXIMOS PASSOS"
echo "════════════════════════════════════════════════════════"
echo ""
echo "1️⃣  Aguarde 1-2 minutos para VM inicializar"
echo ""
echo "2️⃣  Conecte via SSH:"
echo ""
echo "    gcloud compute ssh evolution-saas-free \\"
echo "        --zone=us-west1-b \\"
echo "        --project=studio-343774762-16da7"
echo ""
echo "3️⃣  Execute o script de deploy automatizado:"
echo ""
echo "    curl -sSL https://raw.githubusercontent.com/SEU_USUARIO/Barbearia-SaaS/main/saas-whatsapp-platform/scripts/deploy-gcp-free-auto.sh | bash"
echo ""
echo "    OU clone o repositório e execute:"
echo ""
echo "    git clone https://github.com/SEU_USUARIO/Barbearia-SaaS.git"
echo "    cd Barbearia-SaaS/saas-whatsapp-platform"
echo "    chmod +x scripts/deploy-gcp-free-auto.sh"
echo "    ./scripts/deploy-gcp-free-auto.sh"
echo ""
echo "════════════════════════════════════════════════════════"
echo "🌐 URLs DE ACESSO (após deploy):"
echo "════════════════════════════════════════════════════════"
echo ""
echo "   Evolution API:  http://${EXTERNAL_IP}:8080"
echo "   N8N:            http://${EXTERNAL_IP}:5678"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""
echo "💡 DICA: Salve estas informações!"
echo ""
echo "   Copie e cole em um arquivo local:"
echo "   - IP Externo: ${EXTERNAL_IP}"
echo "   - Zona: us-west1-b"
echo "   - Projeto: studio-343774762-16da7"
echo ""
echo "════════════════════════════════════════════════════════"
echo "✨ Pronto! Agora é só conectar e fazer o deploy!"
echo "════════════════════════════════════════════════════════"
echo ""

