import * as admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import type { UserRecord } from 'firebase-admin/auth';
import type { CallableRequest } from 'firebase-functions/v2/https';

admin.initializeApp();
const db = getFirestore();

// =============================================
// FUNÇÕES DE VERIFICAÇÃO E SETUP
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
export const setupAdminUser = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    const { email, password, firstName, lastName } = data;

    // Verifica se já existe algum administrador
    const usersRef = db.collection('users');
    const adminQuery = await usersRef.where('role', '==', 'admin').limit(1).get();
    
    if (!adminQuery.empty) {
        throw new functions.https.HttpsError('already-exists', 'Um administrador já existe no sistema.');
    }

    // Cria o usuário no Firebase Authentication
    let userRecord;
    try {
        userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: `${firstName} ${lastName}`,
        });
    } catch (error: any) {
        throw new functions.https.HttpsError('internal', 'Erro ao criar usuário no Firebase Auth.', error.message);
    }
    
    // Cria o documento do usuário no Firestore com a role de admin
    const userDocRef = usersRef.doc(userRecord.uid);
    try {
        await userDocRef.set({
            id: userRecord.uid,
            firstName: firstName,
            lastName: lastName,
            email: email,
            role: 'admin', // A role crucial!
            createdAt: FieldValue.serverTimestamp(),
        });
    } catch (error: any) {
        // Rollback: se falhar ao criar no Firestore, deleta do Auth para evitar inconsistência
        await admin.auth().deleteUser(userRecord.uid);
        throw new functions.https.HttpsError('internal', 'Erro ao criar documento do usuário no Firestore.', error.message);
    }

    return { success: true, userId: userRecord.uid };
});

/**
 * Cria um novo membro da equipe com role de admin ou suporte (chamado pelo CPanel).
 */
export const createAdminUser = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    // 1. Verifica se o usuário que está chamando é um admin
    if (context.auth?.token.admin !== true) {
        throw new functions.https.HttpsError('permission-denied', 'Apenas administradores podem criar novos membros da equipe.');
    }

    // 2. Valida os dados recebidos
    const { email, password, firstName, lastName, role } = data;
    if (!email || !password || !firstName || !lastName || !role) {
        throw new functions.https.HttpsError('invalid-argument', 'Todos os campos são obrigatórios.');
    }
    if (role !== 'admin' && role !== 'support') {
         throw new functions.https.HttpsError('invalid-argument', 'O perfil deve ser "admin" ou "support".');
    }

    // 3. Cria o usuário no Firebase Auth
    let userRecord;
    try {
        userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: `${firstName} ${lastName}`,
        });
    } catch (error: any) {
        throw new functions.https.HttpsError('internal', `Erro ao criar usuário no Auth: ${error.message}`);
    }

    // 4. Se a role for 'admin', adiciona a custom claim
    if (role === 'admin') {
        try {
            await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
        } catch (error: any) {
             throw new functions.https.HttpsError('internal', `Erro ao definir permissões de admin: ${error.message}`);
        }
    }
    
    // 5. Cria o documento do usuário no Firestore
    const userDocRef = db.collection('users').doc(userRecord.uid);
    try {
        await userDocRef.set({
            id: userRecord.uid,
            firstName: firstName,
            lastName: lastName,
            email: email,
            role: role,
            createdAt: FieldValue.serverTimestamp(),
        });
    } catch (error: any) {
        await admin.auth().deleteUser(userRecord.uid);
        throw new functions.https.HttpsError('internal', `Erro ao criar documento no Firestore: ${error.message}`);
    }

    return { success: true, userId: userRecord.uid, message: `Usuário ${email} criado com o perfil ${role}.` };
});


/**
 * Gatilho que é disparado quando um novo usuário se registra pelo fluxo normal.
 * Garante que cada usuário tenha um documento correspondente no Firestore.
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user: UserRecord) => {
    const userDocRef = db.collection('users').doc(user.uid);
    
    const nameParts = user.displayName?.split(' ') || ['Novo', 'Usuário'];
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    return userDocRef.set({
        id: user.uid,
        firstName: firstName,
        lastName: lastName,
        email: user.email,
        role: 'owner', // Papel padrão para auto-registro
        createdAt: FieldValue.serverTimestamp(),
    });
});
