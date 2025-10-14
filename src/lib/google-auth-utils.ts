import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { User } from 'firebase/auth';

/**
 * Cria ou verifica a existência de um usuário no Firestore após login com Google
 * Também cria uma loja padrão se o usuário for novo
 * @param firestore Instância do Firestore
 * @param user Usuário autenticado do Firebase Auth
 * @returns Promise<boolean> - true se o usuário foi criado, false se já existia
 */
export async function ensureUserExists(firestore: Firestore, user: User): Promise<boolean> {
  const userDocRef = doc(firestore, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    const nameParts = user.displayName?.split(' ') || ['Novo', 'Usuário'];
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    // 1. Criar o documento do usuário
    await setDoc(userDocRef, {
      id: user.uid,
      firstName: firstName,
      lastName: lastName,
      email: user.email,
      role: 'owner',
      createdAt: serverTimestamp(),
    });

    // 2. Criar uma loja padrão para o usuário
    const shopRef = await addDoc(collection(firestore, 'barberShops'), {
      name: `Meu Negócio`,
      ownerId: user.uid,
      status: 'active',
      createdAt: serverTimestamp(),
    });

    // 3. Atualizar o documento da loja com o ID gerado
    await setDoc(shopRef, {
      id: shopRef.id,
    }, { merge: true });
    
    return true; // Usuário foi criado
  }
  
  return false; // Usuário já existia
}
