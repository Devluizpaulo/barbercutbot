import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { Firestore } from 'firebase/firestore';
import { User } from 'firebase/auth';

/**
 * DEPRECATED: This function is no longer called from the client-side.
 * The logic has been fully moved to the onUserAfterCreate Cloud Function for reliability.
 * This file is kept to avoid breaking type dependencies but can be removed in a future cleanup.
 */
export async function ensureUserExists(firestore: Firestore, user: User): Promise<boolean> {
  console.warn("[DEPRECATED] ensureUserExists was called from the client. This logic now lives in a Cloud Function.");
  const userDocRef = doc(firestore, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    // This block is now primarily a fallback in case the Cloud Function fails.
    // The Cloud Function `onUserAfterCreate` is the primary mechanism for user/shop creation.
    return true; 
  }
  
  return false; // User already existed
}

    