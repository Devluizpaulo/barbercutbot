#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# COMANDO CORRETO - GCP FREE TIER (SEMPRE GRÁTIS)
# ═══════════════════════════════════════════════════════════════

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
    --labels=goog-ec-src=vm_add-gcloud,environment=production,app=evolution-saas \
    --reservation-affinity=any

echo ""
echo "════════════════════════════════════════════════════════"
echo "✅ VM Free Tier criada com sucesso!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "Próximos passos:"
echo "1. Aguarde 1-2 minutos para VM inicializar"
echo "2. Conecte via SSH:"
echo "   gcloud compute ssh evolution-saas-free --zone=us-west1-b --project=studio-343774762-16da7"
echo ""
echo "3. Execute o script de deploy:"
echo "   curl -sSL https://raw.githubusercontent.com/SEU_USUARIO/Barbearia-SaaS/main/saas-whatsapp-platform/scripts/deploy-gcp-free-auto.sh | bash"
echo ""

