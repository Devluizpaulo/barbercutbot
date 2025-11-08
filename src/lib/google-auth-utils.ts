
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { User } from 'firebase/auth';

/**
 * Cria uma loja padrão para um usuário
 */
async function createDefaultShop(firestore: Firestore, user: User): Promise<string> {
  console.log('[Google Auth] Criando loja padrão para:', user.uid);
  
  const shopRef = doc(collection(firestore, 'barberShops'));
  
  await setDoc(shopRef, {
    id: shopRef.id,
    name: `Meu Negócio`,
    ownerId: user.uid,
    status: 'active',
    isSetupComplete: false, // Adiciona o novo campo
    createdAt: serverTimestamp(),
  });
  console.log('[Google Auth] Loja criada com setDoc, ID:', shopRef.id);
  
  return shopRef.id;
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
    console.error('[Google Auth] Erro ao verificar lojas do usuário:', error);
    return false;
  }
}

/**
 * Cria ou verifica a existência de um usuário no Firestore após login com Google
 * Também cria uma loja padrão se o usuário for novo ou se não tiver lojas
 * @param firestore Instância do Firestore
 * @param user Usuário autenticado do Firebase Auth
 * @returns Promise<boolean> - true se o usuário foi criado, false se já existia
 */
export async function ensureUserExists(firestore: Firestore, user: User): Promise<boolean> {
  const userDocRef = doc(firestore, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    console.log('[Google Auth] Criando usuário:', user.uid, user.email);
    
    const nameParts = user.displayName?.split(' ') || ['Novo', 'Usuário'];
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    try {
      // 1. Criar o documento do usuário
      await setDoc(userDocRef, {
        id: user.uid,
        firstName: firstName,
        lastName: lastName,
        email: user.email,
        role: 'owner',
        createdAt: serverTimestamp(),
      });
      console.log('[Google Auth] Usuário criado com sucesso');

      // 2. Criar uma loja padrão para o usuário
      const shopId = await createDefaultShop(firestore, user);
      console.log('[Google Auth] Loja padrão criada com sucesso:', shopId);
      
      return true; // Usuário foi criado
    } catch (error) {
      console.error('[Google Auth] Erro ao criar usuário/loja:', error);
      throw error; // Re-throw para que o erro seja tratado no componente
    }
  } else {
    console.log('[Google Auth] Usuário já existe:', user.uid);
    
    // Verificar se o usuário tem lojas, se não tiver, criar uma
    const hasShops = await userHasShops(firestore, user.uid);
    if (!hasShops) {
      console.log('[Google Auth] Usuário não tem lojas, criando loja padrão...');
      try {
        const shopId = await createDefaultShop(firestore, user);
        console.log('[Google Auth] Loja padrão criada para usuário existente:', shopId);
      } catch (error) {
        console.error('[Google Auth] Erro ao criar loja para usuário existente:', error);
      }
    } else {
      console.log('[Google Auth] Usuário já tem lojas');
    }
  }
  
  return false; // Usuário já existia
}
