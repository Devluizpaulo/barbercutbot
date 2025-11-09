
'use client';

import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { User } from 'firebase/auth';

/**
 * Cria uma loja padrão para um usuário
 */
export async function createInitialShopAndUser(firestore: Firestore, user: User, shopName: string): Promise<string> {
    const batch = writeBatch(firestore);
    
    const userDocRef = doc(firestore, "users", user.uid);
    const shopDocRef = doc(collection(firestore, 'barberShops'));

    const nameParts = user.displayName?.split(' ') || ['Novo', 'Usuário'];
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    batch.set(userDocRef, {
      id: user.uid,
      firstName: firstName,
      lastName: lastName,
      email: user.email,
      role: 'owner',
      createdAt: serverTimestamp(),
    });
    
    batch.set(shopDocRef, {
      id: shopDocRef.id,
      name: shopName, // Usa o nome fornecido no cadastro
      ownerId: user.uid,
      status: 'active',
      isSetupComplete: false, // Inicia como falso para forçar o onboarding
      createdAt: serverTimestamp(),
    });

    await batch.commit();
    return shopDocRef.id;
}


/**
 * Verifica se o usuário tem lojas criadas
 */
async function userHasShops(firestore: Firestore, userId: string): Promise<boolean> {
  try {
    const shopsQuery = query(
      collection(firestore, 'barberShops'),
      where('ownerId', '==', userId)
    );
    const shopsSnapshot = await getDocs(shopsQuery);
    return !shopsSnapshot.empty;
  } catch (error) {
    console.error('[Auth] Erro ao verificar lojas do usuário:', error);
    return false;
  }
}

/**
 * Cria ou verifica a existência de um usuário no Firestore após login
 * Também cria uma loja padrão se o usuário for novo ou se não tiver lojas
 * @param firestore Instância do Firestore
 * @param user Usuário autenticado do Firebase Auth
 * @returns Promise<boolean> - true se o usuário foi criado, false se já existia
 */
export async function ensureUserExists(firestore: Firestore, user: User): Promise<boolean> {
  const userDocRef = doc(firestore, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    console.log('[Auth] Criando usuário no DB (ensureUserExists - fallback):', user.uid, user.email);
    
    try {
      // Esta função agora é principalmente um fallback de segurança.
      // A criação principal acontece no fluxo de signup.
      await createInitialShopAndUser(firestore, user, "Meu Negócio");
      
      return true; // Usuário foi criado
    } catch (error) {
      console.error('[Auth] Erro ao criar usuário/loja no fallback:', error);
      throw error;
    }
  } else {
    console.log('[Auth] Usuário já existe:', user.uid);
    
    // Verificar se o usuário tem lojas, se não tiver, criar uma.
    const hasShops = await userHasShops(firestore, user.uid);
    if (!hasShops) {
      console.log('[Auth] Usuário não tem lojas, criando loja padrão de fallback...');
      try {
        await createInitialShopAndUser(firestore, user, "Meu Negócio");
      } catch (error) {
        console.error('[Auth] Erro ao criar loja para usuário existente:', error);
      }
    } else {
      console.log('[Auth] Usuário já tem lojas');
    }
  }
  
  return false; // Usuário já existia
}
