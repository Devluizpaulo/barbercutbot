#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# CRIAR VM - 100% FREE TIER (R$ 0,00/mês)
# SEM SNAPSHOTS AUTOMÁTICOS (backup via script manual)
# ═══════════════════════════════════════════════════════════════

echo "════════════════════════════════════════════════════════"
echo "🚀 Criando VM 100% FREE TIER"
echo "════════════════════════════════════════════════════════"
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
    --create-disk=auto-delete=yes,boot=yes,device-name=evolution-saas-free,image=projects/ubuntu-os-cloud/global/images/ubuntu-2204-jammy-v20251002,mode=rw,size=30,type=pd-standard \
    --no-shielded-secure-boot \
    --shielded-vtpm \
    --shielded-integrity-monitoring \
    --labels=goog-ec-src=vm_add-gcloud,environment=production,app=evolution-saas \
    --reservation-affinity=any

echo ""
echo "✅ VM criada com sucesso!"
echo ""
echo "💰 Custo: R$ 0,00/mês (Free Tier permanente)"
echo ""
echo "════════════════════════════════════════════════════════"
echo "📋 PRÓXIMOS PASSOS:"
echo "════════════════════════════════════════════════════════"
echo ""
echo "1. Conectar via SSH:"
echo "   gcloud compute ssh evolution-saas-free --zone=us-west1-b --project=studio-343774762-16da7"
echo ""
echo "2. Executar deploy:"
echo "   curl -sSL https://raw.githubusercontent.com/SEU_USER/Barbearia-SaaS/main/saas-whatsapp-platform/scripts/deploy-gcp-free-auto.sh | bash"
echo ""

