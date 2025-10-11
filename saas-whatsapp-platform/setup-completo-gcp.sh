#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# SETUP COMPLETO - GCP FREE TIER
# Cria VM + Configura Firewall + Mostra Próximos Passos
# ═══════════════════════════════════════════════════════════════

set -e

PROJECT_ID="studio-343774762-16da7"
ZONE="us-west1-b"
INSTANCE_NAME="evolution-saas-free"

echo "════════════════════════════════════════════════════════"
echo "🚀 SETUP COMPLETO - GCP FREE TIER"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Projeto: $PROJECT_ID"
echo "Zona: $ZONE"
echo "Instância: $INSTANCE_NAME"
echo ""

# ═══════════════════════════════════════════════════════════════
# PASSO 1: CRIAR VM
# ═══════════════════════════════════════════════════════════════

echo "[1/3] Criando VM..."
echo ""

gcloud compute instances create $INSTANCE_NAME \
    --project=$PROJECT_ID \
    --zone=$ZONE \
    --machine-type=e2-micro \
    --network-interface=network-tier=PREMIUM,stack-type=IPV4_ONLY,subnet=default \
    --maintenance-policy=MIGRATE \
    --provisioning-model=STANDARD \
    --service-account=827336484489-compute@developer.gserviceaccount.com \
    --scopes=https://www.googleapis.com/auth/devstorage.read_only,https://www.googleapis.com/auth/logging.write,https://www.googleapis.com/auth/monitoring.write,https://www.googleapis.com/auth/service.management.readonly,https://www.googleapis.com/auth/servicecontrol,https://www.googleapis.com/auth/trace.append \
    --tags=https-server,http-server \
    --create-disk=auto-delete=yes,boot=yes,device-name=$INSTANCE_NAME,image=projects/ubuntu-os-cloud/global/images/ubuntu-2204-jammy-v20251002,mode=rw,size=30,type=pd-standard \
    --no-shielded-secure-boot \
    --shielded-vtpm \
    --shielded-integrity-monitoring \
    --labels=goog-ec-src=vm_add-gcloud,environment=production,app=evolution-saas \
    --reservation-affinity=any

echo ""
echo "✅ VM criada!"
echo ""

# Aguardar VM inicializar
echo "Aguardando VM inicializar (30 segundos)..."
sleep 30

# ═══════════════════════════════════════════════════════════════
# PASSO 2: CONFIGURAR FIREWALL
# ═══════════════════════════════════════════════════════════════

echo ""
echo "[2/3] Configurando firewall..."
echo ""

# Verificar se regras já existem
if gcloud compute firewall-rules describe allow-evolution-api --project=$PROJECT_ID &>/dev/null; then
    echo "  ✓ Regra allow-evolution-api já existe"
else
    echo "  Criando regra allow-evolution-api..."
    gcloud compute firewall-rules create allow-evolution-api \
        --project=$PROJECT_ID \
        --direction=INGRESS \
        --priority=1000 \
        --network=default \
        --action=ALLOW \
        --rules=tcp:8080 \
        --source-ranges=0.0.0.0/0 \
        --description="Evolution API - SaaS WhatsApp"
fi

if gcloud compute firewall-rules describe allow-n8n --project=$PROJECT_ID &>/dev/null; then
    echo "  ✓ Regra allow-n8n já existe"
else
    echo "  Criando regra allow-n8n..."
    gcloud compute firewall-rules create allow-n8n \
        --project=$PROJECT_ID \
        --direction=INGRESS \
        --priority=1000 \
        --network=default \
        --action=ALLOW \
        --rules=tcp:5678 \
        --source-ranges=0.0.0.0/0 \
        --description="N8N Automation - SaaS WhatsApp"
fi

echo ""
echo "✅ Firewall configurado!"
echo ""

# ═══════════════════════════════════════════════════════════════
# PASSO 3: OBTER INFORMAÇÕES
# ═══════════════════════════════════════════════════════════════

echo "[3/3] Obtendo informações..."
echo ""

EXTERNAL_IP=$(gcloud compute instances describe $INSTANCE_NAME \
    --zone=$ZONE \
    --project=$PROJECT_ID \
    --format='get(networkInterfaces[0].accessConfigs[0].natIP)')

# ═══════════════════════════════════════════════════════════════
# RESUMO FINAL
# ═══════════════════════════════════════════════════════════════

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ SETUP CONCLUÍDO COM SUCESSO!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "📋 INFORMAÇÕES DA VM:"
echo ""
echo "  Nome:        $INSTANCE_NAME"
echo "  Projeto:     $PROJECT_ID"
echo "  Zona:        $ZONE"
echo "  Tipo:        e2-micro (1 GB RAM, 1 vCPU)"
echo "  Disco:       30 GB Standard (pd-standard)"
echo "  SO:          Ubuntu 22.04 LTS"
echo "  IP Externo:  $EXTERNAL_IP"
echo ""
echo "  💰 Custo:    R$ 0,00/mês (Free Tier permanente)"
echo ""
echo "════════════════════════════════════════════════════════"
echo "🚀 PRÓXIMOS PASSOS"
echo "════════════════════════════════════════════════════════"
echo ""
echo "1️⃣  Conectar via SSH:"
echo ""
echo "    gcloud compute ssh $INSTANCE_NAME \\"
echo "        --zone=$ZONE \\"
echo "        --project=$PROJECT_ID"
echo ""
echo "2️⃣  Dentro da VM, executar deploy:"
echo ""
echo "    # Instalar git"
echo "    sudo apt update && sudo apt install -y git"
echo ""
echo "    # Clonar repositório"
echo "    git clone https://github.com/SEU_USUARIO/Barbearia-SaaS.git"
echo "    cd Barbearia-SaaS/saas-whatsapp-platform"
echo ""
echo "    # Executar script de deploy"
echo "    chmod +x scripts/deploy-gcp-free-auto.sh"
echo "    ./scripts/deploy-gcp-free-auto.sh"
echo ""
echo "    # OU executar direto (quando fizer push no GitHub):"
echo "    curl -sSL https://raw.githubusercontent.com/SEU_USUARIO/Barbearia-SaaS/main/saas-whatsapp-platform/scripts/deploy-gcp-free-auto.sh | bash"
echo ""
echo "════════════════════════════════════════════════════════"
echo "🌐 URLs DE ACESSO (após deploy):"
echo "════════════════════════════════════════════════════════"
echo ""
echo "  Evolution API:  http://$EXTERNAL_IP:8080"
echo "  N8N:            http://$EXTERNAL_IP:5678"
echo ""
echo "════════════════════════════════════════════════════════"
echo ""
echo "💾 Salve estas informações em um arquivo local!"
echo ""
echo "Comandos úteis:"
echo ""
echo "  # Ver status da VM"
echo "  gcloud compute instances describe $INSTANCE_NAME --zone=$ZONE"
echo ""
echo "  # Parar VM (economiza banda, mas não é necessário no Free Tier)"
echo "  gcloud compute instances stop $INSTANCE_NAME --zone=$ZONE"
echo ""
echo "  # Iniciar VM"
echo "  gcloud compute instances start $INSTANCE_NAME --zone=$ZONE"
echo ""
echo "  # Deletar VM"
echo "  gcloud compute instances delete $INSTANCE_NAME --zone=$ZONE"
echo ""
echo "════════════════════════════════════════════════════════"
echo "✨ Pronto para começar! Boa sorte! 🚀"
echo "════════════════════════════════════════════════════════"
echo ""

