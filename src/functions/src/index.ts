
import * as admin from 'firebase-admin';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { onCall, HttpsError, type CallableRequest } from 'firebase-functions/v2/https';

admin.initializeApp();
const db = getFirestore();

// =============================================
// CORS Configuration
// =============================================
const corsOptions = {
    cors: [
        'http://localhost:3000', 
        'http://localhost:9002', 
        'https://barbercutbot.vercel.app', 
        'https://barbercutbot.web.app', 
        'https://barbercutbot.firebaseapp.com'
    ]
};

// =============================================
// FUNÇÕES AUXILIARES DE SEGURANÇA
// =============================================

async function isAdmin(uid: string | undefined): Promise<boolean> {
    if (!uid) return false;
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

export const checkAdminExists = onCall({ region: 'us-central1', ...corsOptions }, async (request: CallableRequest) => {
    try {
        const usersRef = db.collection('users');
        const adminQuery = await usersRef.where('role', '==', 'admin').limit(1).get();
        return { adminExists: !adminQuery.empty };
    } catch (error) {
        console.error("Error in checkAdminExists:", error);
        throw new HttpsError('internal', 'Falha ao verificar a existência de administradores.');
    }
});

export const updateUserRole = onCall({ region: 'us-central1', ...corsOptions }, async (request: CallableRequest) => {
    if (!request.auth || !await isAdmin(request.auth?.uid)) {
        throw new HttpsError('permission-denied', 'Apenas administradores podem atualizar usuários.');
    }

    const { uid, firstName, lastName, role } = request.data || {};

    if (!uid) throw new HttpsError('invalid-argument', 'uid é obrigatório.');
    if (!role || !['admin', 'support', 'owner', 'staff'].includes(role)) {
        throw new HttpsError('invalid-argument', 'role inválida.');
    }

    try {
        const userDocRef = db.collection('users').doc(uid);
        const updatePayload: Record<string, any> = { role };
        if (typeof firstName === 'string') updatePayload.firstName = firstName;
        if (typeof lastName === 'string') updatePayload.lastName = lastName;
        await userDocRef.update(updatePayload);

        if (role === 'admin') {
            await admin.auth().setCustomUserClaims(uid, { admin: true });
        } else {
            await admin.auth().setCustomUserClaims(uid, {});
        }

        await admin.auth().revokeRefreshTokens(uid);
        return { success: true };
    } catch (error: any) {
        console.error('Error in updateUserRole:', error);
        throw new HttpsError('internal', `Falha ao atualizar usuário: ${error.message}`);
    }
});

export const deleteUser = onCall({ region: 'us-central1', ...corsOptions }, async (request: CallableRequest) => {
    if (!request.auth || !await isAdmin(request.auth?.uid)) {
        throw new HttpsError('permission-denied', 'Apenas administradores podem remover usuários.');
    }
    const { uid } = request.data;
    if (!uid) throw new HttpsError('invalid-argument', 'uid é obrigatório para remover um usuário.');

    try {
        // Delete from Firestore
        await db.collection('users').doc(uid).delete();
        // Delete from Firebase Auth
        await admin.auth().deleteUser(uid);
        return { success: true, message: `Usuário ${uid} removido com sucesso.` };
    } catch (error: any) {
        console.error('Error deleting user:', error);
        throw new HttpsError('internal', `Falha ao remover usuário: ${error.message}`);
    }
});

export const setupAdminUser = onCall({ region: 'us-central1', ...corsOptions }, async (request: CallableRequest) => {
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
        userRecord = await admin.auth().createUser({ email, password, displayName: `${firstName} ${lastName}` });
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
        if (userRecord) await admin.auth().deleteUser(userRecord.uid);
        console.error("Error in setupAdminUser:", error);
        throw new HttpsError('internal', `Erro ao configurar admin: ${error.message}`);
    }
});

export const createAdminUser = onCall({ region: 'us-central1', ...corsOptions }, async (request: CallableRequest) => {
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
        userRecord = await admin.auth().createUser({ email, password, displayName: `${firstName} ${lastName}` });
        
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
        if (userRecord) await admin.auth().deleteUser(userRecord.uid);
        console.error("Error in createAdminUser:", error);
        throw new HttpsError('internal', `Erro ao criar usuário: ${error.message}`);
    }
});
