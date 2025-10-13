
'use server';

import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { UserRecord } from 'firebase-admin/auth';
import type { CallableRequest } from 'firebase-functions/v2/https';

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
export const checkAdminExists = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    const usersRef = db.collection('users');
    const adminQuery = await usersRef.where('role', '==', 'admin').limit(1).get();
    return { adminExists: !adminQuery.empty };
});

/**
 * Cria o primeiro usuário administrador.
 * Esta função só pode ser executada se NENHUM administrador existir.
 */
export const setupAdminUser = functions.httpsou.onCall(async (data: { email: string, password: string, firstName: string, lastName: string }, context: functions.https.CallableContext) => {
    const { email, password, firstName, lastName } = data;

    const usersRef = db.collection('users');
    const adminQuery = await usersRef.where('role', '==', 'admin').limit(1).get();
    
    if (!adminQuery.empty) {
        throw new functions.https.HttpsError('already-exists', 'Um administrador já existe no sistema.');
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
        throw new functions.https.HttpsError('internal', `Erro ao configurar admin: ${error.message}`);
    }
});


/**
 * Cria um novo membro da equipe com role de admin ou suporte (chamado pelo CPanel).
 */
export const createAdminUser = functions.https.onCall(async (data: { email: string, password: string, firstName: string, lastName: string, role: string }, context: functions.httpsa.CallableContext) => {
    if (!await isAdmin(context.auth?.uid)) {
        throw new functions.https.HttpsError('permission-denied', 'Apenas administradores podem criar novos membros da equipe.');
    }

    const { email, password, firstName, lastName, role } = data;
    if (!email || !password || !firstName || !lastName || !role) {
        throw new functions.https.HttpsError('invalid-argument', 'Todos os campos são obrigatórios.');
    }
    if (role !== 'admin' && role !== 'support') {
         throw new functions.https.HttpsError('invalid-argument', 'O perfil deve ser "admin" ou "support".');
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
        throw new functions.https.HttpsError('internal', `Erro ao criar usuário: ${error.message}`);
    }
});


/**
 * Gatilho que é disparado quando um novo usuário se registra pelo fluxo normal.
 * Garante que cada usuário tenha um documento correspondente no Firestore.
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user: UserRecord): Promise<void> => {
    const userDocRef = db.collection('users').doc(user.uid);
    
    const nameParts = user.displayName?.split(' ') || ['Novo', 'Usuário'];
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    await userDocRef.set({
        id: user.uid,
        firstName: firstName,
        lastName: lastName,
        email: user.email,
        role: 'owner', // Papel padrão para auto-registro
        createdAt: FieldValue.serverTimestamp(),
    });
});
