
import * as admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError, CallableRequest } from 'firebase-functions/v2/https';
import { onUserAfterCreate } from 'firebase-functions/v2/identity';
import type { UserRecord } from 'firebase-admin/auth';

admin.initializeApp();
const db = getFirestore();

// =============================================
// FUNÇÕES AUXILIARES DE SEGURANÇA
// =============================================

/**
 * Verifica se um usuário tem a role de 'admin' no Firestore.
 * @param {string | undefined} uid O UID do usuário a ser verificado.
 * @returns {Promise<boolean>} True se o usuário for admin, false caso contrário.
 */
async function isAdmin(uid: string | undefined): Promise<boolean> {
    if (!uid) {
        return false;
    }
    try {
        const userDoc = await db.collection('users').doc(uid).get();
        return userDoc.exists && userDoc.data()?.role === 'admin';
    } catch (error) {
        console.error(`Erro ao verificar permissão de admin para UID: ${uid}`, error);
        return false;
    }
}


// =============================================
// FUNÇÕES DE SETUP E GERENCIAMENTO
// =============================================

/**
 * Verifica se já existe um usuário com a role de 'admin'.
 * Chamada pela página /setup para decidir se o formulário deve ser exibido.
 */
export const checkAdminExists = onCall(async (request: CallableRequest) => {
    try {
        const usersRef = db.collection('users');
        const adminQuery = await usersRef.where('role', '==', 'admin').limit(1).get();
        return { adminExists: !adminQuery.empty };
    } catch (error) {
        console.error("Error in checkAdminExists:", error);
        throw new HttpsError('internal', 'Falha ao verificar a existência de administradores.');
    }
});

/**
 * Cria o primeiro usuário administrador.
 * Esta função só pode ser executada se NENHUM administrador existir.
 */
export const setupAdminUser = onCall(async (request: CallableRequest) => {
    const { email, password, firstName, lastName } = request.data;

    if (!email || !password || !firstName || !lastName) {
        throw new HttpsError('invalid-argument', 'Email, senha, nome e sobrenome são obrigatórios.');
    }

    const usersRef = db.collection('users');
    const adminQuery = await usersRef.where('role', '==', 'admin').limit(1).get();
    
    if (!adminQuery.empty) {
        throw new HttpsError('already-exists', 'Um administrador já existe no sistema.');
    }

    let userRecord;
    try {
        userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: `${firstName} ${lastName}`,
        });
        
        await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });

        const userDocRef = usersRef.doc(userRecord.uid);
        await userDocRef.set({
            id: userRecord.uid,
            firstName,
            lastName,
            email,
            role: 'admin',
            createdAt: FieldValue.serverTimestamp(),
        });
        
        return { success: true, userId: userRecord.uid };

    } catch (error: any) {
        if (userRecord) {
            await admin.auth().deleteUser(userRecord.uid);
        }
        console.error("Error in setupAdminUser:", error);
        throw new HttpsError('internal', `Erro ao configurar admin: ${error.message}`);
    }
});


/**
 * Cria um novo membro da equipe com role de admin ou suporte (chamado pelo CPanel).
 */
export const createAdminUser = onCall(async (request: CallableRequest) => {
    if (!request.auth || !await isAdmin(request.auth?.uid)) {
        throw new HttpsError('permission-denied', 'Apenas administradores podem criar novos membros da equipe.');
    }

    const { email, password, firstName, lastName, role } = request.data;
    if (!email || !password || !firstName || !lastName || !role) {
        throw new HttpsError('invalid-argument', 'Todos os campos são obrigatórios.');
    }
    if (role !== 'admin' && role !== 'support') {
         throw new HttpsError('invalid-argument', 'O perfil deve ser "admin" ou "support".');
    }

    let userRecord;
    try {
        userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: `${firstName} ${lastName}`,
        });
        
        if (role === 'admin') {
            await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
        }
    
        const userDocRef = db.collection('users').doc(userRecord.uid);
        await userDocRef.set({
            id: userRecord.uid,
            firstName,
            lastName,
            email,
            role,
            createdAt: FieldValue.serverTimestamp(),
        });
        
        return { success: true, userId: userRecord.uid, message: `Usuário ${email} criado com o perfil ${role}.` };

    } catch (error: any) {
        if (userRecord) {
            await admin.auth().deleteUser(userRecord.uid);
        }
        console.error("Error in createAdminUser:", error);
        throw new HttpsError('internal', `Erro ao criar usuário: ${error.message}`);
    }
});


/**
 * Gatilho que é disparado quando um novo usuário se registra pelo fluxo normal.
 * Garante que cada usuário tenha um documento correspondente no Firestore e uma loja padrão.
 */
export const onusercreate = onUserAfterCreate(async (event): Promise<void> => {
    const user = event.data; // The user object from the event.
    const userDocRef = db.collection('users').doc(user.uid);
    
    // Check if a document for this user already exists (e.g., created by admin setup).
    const userDoc = await userDocRef.get();
    if (userDoc.exists) {
        console.log(`Document for user ${user.uid} already exists. Skipping creation.`);
        return;
    }
    
    const batch = db.batch();
    
    // 1. Create the user's document
    const nameParts = user.displayName?.split(' ') || [];
    const firstName = nameParts.shift() || 'Novo';
    const lastName = nameParts.join(' ') || 'Usuário';

    batch.set(userDocRef, {
        id: user.uid,
        firstName: firstName,
        lastName: lastName,
        email: user.email,
        role: 'owner',
        createdAt: FieldValue.serverTimestamp(),
    });

    // 2. Create a default shop for the new user
    const newShopRef = db.collection('barberShops').doc();
    batch.set(newShopRef, {
        id: newShopRef.id,
        name: `Meu Negócio`,
        ownerId: user.uid,
        status: 'active',
        createdAt: FieldValue.serverTimestamp(),
    });

    try {
        await batch.commit();
        console.log(`User ${user.uid} and their default shop ${newShopRef.id} created successfully.`);
    } catch (error) {
        console.error(`Error creating user document and shop for ${user.uid}:`, error);
        // Optional: Add more robust error handling, like sending an alert.
    }
});