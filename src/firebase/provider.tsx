
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc } from 'firebase/firestore';
import { Auth, User, onIdTokenChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

type UserWithRole = User & { role?: 'admin' | 'owner' };

interface UserAuthState {
  user: UserWithRole | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: UserWithRole | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: UserWithRole | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export interface UserHookResult { 
  user: UserWithRole | null;
  isUserLoading: boolean;
  userError: Error | null;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
  });

  useEffect(() => {
    if (!auth) {
      setUserAuthState({ user: null, isUserLoading: false, userError: new Error("Auth service not provided.") });
      return;
    }

    const unsubscribe = onIdTokenChanged(
      auth,
      async (firebaseUser) => {
        // If there's no Firebase user, we are done loading.
        if (!firebaseUser) {
          setUserAuthState({ user: null, isUserLoading: false, userError: null });
          return;
        }

        // If there is a user, start the loading process. It's not finished until we get the role.
        setUserAuthState(prevState => ({ ...prevState, user: firebaseUser as UserWithRole, isUserLoading: true }));

        try {
          // Check for admin custom claim first.
          const idTokenResult = await firebaseUser.getIdTokenResult(true); // Force refresh
          const isAdmin = !!idTokenResult.claims.admin;
          
          if (isAdmin) {
             const userWithRole: UserWithRole = {
              ...firebaseUser,
              // This is a workaround to make the user object properties accessible
              ...Object.fromEntries(Object.entries(firebaseUser)),
              role: 'admin',
            };
            setUserAuthState({ user: userWithRole, isUserLoading: false, userError: null });
            return;
          }

          // If not an admin via claim, check Firestore for 'owner' role.
          const userDocRef = doc(firestore, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          
          const role = userDoc.exists() ? (userDoc.data()?.role || 'owner') : 'owner';

          const userWithRole: UserWithRole = {
            ...firebaseUser,
            ...Object.fromEntries(Object.entries(firebaseUser)),
            role: role,
          };
          
          setUserAuthState({ user: userWithRole, isUserLoading: false, userError: null });

        } catch (error) {
           console.error("FirebaseProvider: Error processing user role:", error);
           // If there's an error, default to the basic user and stop loading.
           setUserAuthState({ user: firebaseUser as UserWithRole, isUserLoading: false, userError: error as Error });
        }
      },
      (error) => {
        console.error("FirebaseProvider: onIdTokenChanged error:", error);
        setUserAuthState({ user: null, isUserLoading: false, userError: error });
      }
    );
    return () => unsubscribe();
  }, [auth, firestore]);

  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      user: userAuthState.user,
      isUserLoading: userAuthState.isUserLoading,
      userError: userAuthState.userError,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    isUserLoading: context.isUserLoading,
    userError: context.userError,
  };
};

export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

type MemoFirebase<T> = T & { __memo?: boolean };

export function useMemoFirebase<T>(factory: () => T | null, deps: DependencyList): (T & { __memo?: boolean }) | null {
    const isReady = deps.every(dep => dep !== null && dep !== undefined);

    const memoized = useMemo(() => {
        if (!isReady) {
            return null;
        }
        return factory();
    }, deps); // eslint-disable-line react-hooks/exhaustive-deps
    
    if (memoized && typeof memoized === 'object') {
        Object.defineProperty(memoized, '__memo', {
            value: true,
            writable: false,
            enumerable: false,
        });
    }

    return memoized as (T & { __memo?: boolean }) | null;
}

export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};
