// IMPORTANT: This file should ONLY be imported in server-side code (Route Handlers, Server Actions, etc.)
import { initializeApp, getApps, getApp, App, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { firebaseConfig } from './config';

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
  // Prefer Application Default Credentials. In development, set the env var
  // GOOGLE_APPLICATION_CREDENTIALS to the path of your service account JSON.
  // In production (Cloud), the environment provides credentials automatically.
  const app = initializeApp({
    projectId: firebaseConfig.projectId,
    credential: applicationDefault(),
  });

  return {
    app,
    firestore: getFirestore(app),
    auth: getAuth(app),
  };
}

// Export singleton instances of the services
export const { app, firestore, auth } = getFirebaseAdminServices();
