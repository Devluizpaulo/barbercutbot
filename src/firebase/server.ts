// IMPORTANT: This file should ONLY be imported in server-side code (Route Handlers, Server Actions, etc.)
import { initializeApp, getApps, getApp, App, applicationDefault, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { firebaseConfig } from './config';
import { env } from '@/lib/env';

// Helper function to get the initialized services
function getFirebaseAdminServices() {
  if (getApps().length > 0) {
    const app = getApp();
    return {
      app,
      firestore: getFirestore(app),
      auth: getAuth(app),
    };
  }

  // Initialize Firebase Admin
  const credsJson = env().GOOGLE_APPLICATION_CREDENTIALS;
  
  const app = initializeApp({
    projectId: firebaseConfig.projectId,
    // If credsJson is available (as a stringified JSON), parse and use it.
    // Otherwise, fall back to Application Default Credentials for environments like Cloud Run.
    credential: credsJson ? cert(JSON.parse(credsJson)) : applicationDefault(),
  });

  return {
    app,
    firestore: getFirestore(app),
    auth: getAuth(app),
  };
}

// Export singleton instances of the services
export const { app, firestore, auth } = getFirebaseAdminServices();
