
'use client';

import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, getDocs, writeBatch, limit, FieldValue, addDoc, Timestamp } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';
import type { User } from 'firebase/auth';
import type { BarberShop, UserProfile } from './types';
import { addDays } from 'date-fns';


/**
 * Creates the initial user profile and barber shop documents in a single transaction.
 * This is the primary function called during sign-up.
 * @param firestore Firestore instance.
 * @param user The newly created Firebase Auth user.
 * @param shopName The name for the new barber shop.
 * @returns The ID of the newly created shop.
 */
export async function createInitialShopAndUser(firestore: Firestore, user: User, shopName: string): Promise<string> {
    const batch = writeBatch(firestore);
    
    const userDocRef = doc(firestore, "users", user.uid);
    const shopDocRef = doc(collection(firestore, 'barberShops'));

    // Try to parse first and last name from displayName
    const nameParts = user.displayName?.split(' ') || [];
    const firstName = nameParts.shift() || 'Novo';
    const lastName = nameParts.join(' ') || 'Usuário';

    // 1. Create the UserProfile document
    const userProfile: Omit<UserProfile, 'createdAt'> = {
      id: user.uid,
      firstName,
      lastName,
      email: user.email!,
      role: 'owner',
    };
    batch.set(userDocRef, { ...userProfile, createdAt: serverTimestamp() });
    
    // 2. Create the BarberShop document with a 14-day trial
    const trialEndDate = addDays(new Date(), 14);
    const shopData: Partial<BarberShop> = {
      id: shopDocRef.id,
      name: shopName,
      ownerId: user.uid,
      status: 'active',
      isSetupComplete: true, 
      createdAt: serverTimestamp() as Timestamp,
      subscription: {
        plan: 'pro',
        status: 'trialing',
        currentPeriodEnd: Timestamp.fromDate(trialEndDate),
      },
    };
    batch.set(shopDocRef, shopData);

    // 3. Commit the transaction
    await batch.commit();
    
    console.log(`[Auth] User ${user.uid} and Shop ${shopDocRef.id} created with 14-day trial.`);
    return shopDocRef.id;
}


/**
 * A fallback function to ensure a user exists and has a shop.
 * This should ideally not be needed if the signup flow is robust.
 * It's kept as a safety net.
 */
export async function ensureUserExists(firestore: Firestore, user: User): Promise<boolean> {
  const userDocRef = doc(firestore, "users", user.uid);
  
  try {
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        console.warn('[Auth Fallback] User document not found. Creating user and shop.');
        await createInitialShopAndUser(firestore, user, "Minha Barbearia (Padrão)");
        return true; // A new user/shop was created.
    }

    // User exists, now check if they have a shop.
    const shopsQuery = query(collection(firestore, 'barberShops'), where('ownerId', '==', user.uid), limit(1));
    const shopsSnapshot = await getDocs(shopsQuery);
    
    if (shopsSnapshot.empty) {
        console.warn('[Auth Fallback] User exists but has no shop. Creating default shop.');
        const trialEndDate = addDays(new Date(), 14);
        const shopDocRef = doc(collection(firestore, 'barberShops'));
        await setDoc(shopDocRef, {
            id: shopDocRef.id,
            name: "Minha Barbearia (Padrão)",
            ownerId: user.uid,
            status: 'active',
            isSetupComplete: true, 
            createdAt: serverTimestamp(),
            subscription: {
                plan: 'pro',
                status: 'trialing',
                currentPeriodEnd: Timestamp.fromDate(trialEndDate),
            },
        });
    }

    return false; // User already existed.

  } catch (error) {
    console.error("[Auth Fallback] Critical error in ensureUserExists:", error);
    // Returning false to prevent potential loops if this function itself errors.
    return false;
  }
}
