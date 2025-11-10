// Script para adicionar a permissão de superusuário (custom claim) a um usuário
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// --- INSTRUÇÕES ---
// 1. Vá para o Firebase Console > Configurações do Projeto > Contas de Serviço.
// 2. Clique em "Gerar nova chave privada" e salve o arquivo JSON.
// 3. Renomeie o arquivo para "firebase-admin.json".
// 4. Coloque este arquivo na raiz do seu projeto (no mesmo diretório deste script).
// 5. NUNCA adicione este arquivo ao seu repositório Git. (Ele já está no .gitignore).
// 6. Execute no seu terminal: `node add-admin-claim.js`

const serviceAccountPath = path.join(__dirname, 'firebase-admin.json');

if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ ERRO: Arquivo de credenciais "firebase-admin.json" não encontrado.');
    console.error('Por favor, siga as instruções no topo deste arquivo para configurá-lo.');
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Inicializa o Firebase Admin SDK com as credenciais do arquivo.
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'barbercutbot'
});

// =========================================================================
// ⚠️ UID do usuário que você criou no Firebase Auth
//    Este é o UID do usuário `admin@barbercutbot.com` que está recebendo o erro.
// =========================================================================
const userUid = 'MyKmTvy3JER3nT3BOiI36cIkF4t2'; 
// =========================================================================

async function addAdminClaim() {
    if (!userUid) {
        console.error('❌ ERRO: Por favor, edite este arquivo e adicione o UID do seu usuário administrador.');
        process.exit(1);
    }
    
    try {
        console.log(`Adicionando permissão de admin para o usuário: ${userUid}...`);

        // Define o custom claim { admin: true }
        await admin.auth().setCustomUserClaims(userUid, { admin: true });
        
        console.log('✅ Custom claim "admin" adicionado com sucesso!');
        
        // Verifica se o claim foi adicionado corretamente
        const user = await admin.auth().getUser(userUid);
        console.log('\n📋 Permissões atuais (Custom Claims):');
        console.log(user.customClaims);

        console.log('\n🎉 Processo concluído! Faça logout e login novamente no painel de controle para que as alterações tenham efeito.');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao adicionar custom claim:', error);
        process.exit(1);
    }
}

addAdminClaim();
