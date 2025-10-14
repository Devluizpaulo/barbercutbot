// Script para adicionar a permissão de superusuário (custom claim) a um usuário
const admin = require('firebase-admin');

// INSTRUÇÕES:
// 1. Vá para o Firebase Console > Project Settings > Service accounts
// 2. Clique em "Generate new private key" e salve o arquivo JSON no seu computador.
// 3. NÃO adicione este arquivo ao seu repositório Git.
// 4. Defina a variável de ambiente GOOGLE_APPLICATION_CREDENTIALS para o caminho deste arquivo.
//    Ex (Linux/macOS): export GOOGLE_APPLICATION_CREDENTIALS="/home/user/Downloads/my-project-firebase-adminsdk.json"
//    Ex (Windows): set GOOGLE_APPLICATION_CREDENTIALS="C:\Users\user\Downloads\my-project-firebase-adminsdk.json"

// Inicializa o Firebase Admin SDK. Ele usará as credenciais da variável de ambiente.
admin.initializeApp({
    projectId: 'barbercutbot'
});

// =========================================================================
// ⚠️ ALTERE AQUI: Cole o UID do usuário que você criou no Firebase Auth
// =========================================================================
const userUid = 'MyKmTvy3JER3nT3BOiI36cIkF4t2'; 
// =========================================================================

async function addAdminClaim() {
    if (!userUid) {
        console.error('❌ ERRO: Por favor, edite este arquivo e adicione o UID do seu usuário administrador.');
        process.exit(1);
    }
    
    try {
        // Define o custom claim { admin: true }
        await admin.auth().setCustomUserClaims(userUid, { admin: true });
        
        console.log('✅ Custom claim "admin" adicionado com sucesso!');
        console.log(`\nUID do Usuário: ${userUid}`);
        
        // Verifica se o claim foi adicionado corretamente
        const user = await admin.auth().getUser(userUid);
        console.log('\n📋 Permissões atuais (Custom Claims):');
        console.log(user.customClaims);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao adicionar custom claim:', error);
        process.exit(1);
    }
}

addAdminClaim();
