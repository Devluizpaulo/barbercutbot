// Script para adicionar a permissão de superusuário (custom claim) a um usuário
const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');

// --- INSTRUÇÕES CRÍTICAS ---
// 1. Vá para o Firebase Console > Configurações do Projeto > Contas de Serviço.
// 2. Clique no botão "Gerar nova chave privada". Um arquivo JSON será baixado.
//    (Sempre gere uma nova chave para garantir que você não está usando uma chave antiga/revogada).
// 3. Renomeie o arquivo baixado para "firebase-admin.json".
// 4. Coloque este arquivo na raiz do seu projeto (no mesmo diretório deste script).
// 5. NUNCA adicione este arquivo ao seu repositório Git. (Ele já está no .gitignore).
// 6. Execute no seu terminal: `node add-admin-claim.js`

const serviceAccountPath = path.join(__dirname, 'firebase-admin.json');
const expectedProjectId = 'barbercutbot';

if (!fs.existsSync(serviceAccountPath)) {
    console.error('❌ ERRO: Arquivo de credenciais "firebase-admin.json" não encontrado.');
    console.error('Por favor, siga as instruções no topo deste arquivo para configurá-lo.');
    process.exit(1);
}

const serviceAccount = require(serviceAccountPath);

// Validação extra para evitar usar credenciais do projeto errado
if (serviceAccount.project_id !== expectedProjectId) {
    console.error(`❌ ERRO: As credenciais no arquivo 'firebase-admin.json' pertencem ao projeto '${serviceAccount.project_id}', mas o projeto esperado é '${expectedProjectId}'.`);
    console.error('Por favor, baixe as credenciais do projeto correto.');
    process.exit(1);
}


// Inicializa o Firebase Admin SDK com as credenciais do arquivo.
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: expectedProjectId
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
