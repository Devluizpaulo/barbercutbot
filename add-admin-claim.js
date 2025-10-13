// Script temporário para adicionar custom claim ao usuário admin
const admin = require('firebase-admin');

// Inicializar Firebase Admin com projectId
admin.initializeApp({
    projectId: 'barbercutbot'
});

const userUid = 'flbDsSvGODZUHIQsrWosBJufvD93';

async function addAdminClaim() {
    try {
        // Definir custom claim
        await admin.auth().setCustomUserClaims(userUid, { admin: true });
        
        console.log('✅ Custom claim "admin" adicionado com sucesso!');
        console.log(`UID: ${userUid}`);
        
        // Verificar o claim
        const user = await admin.auth().getUser(userUid);
        console.log('\n📋 Custom Claims atuais:');
        console.log(user.customClaims);
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao adicionar custom claim:', error);
        process.exit(1);
    }
}

addAdminClaim();

