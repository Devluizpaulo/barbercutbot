// IMPORTANT: This file should ONLY be imported in server-side code (Route Handlers, Server Actions, etc.)
import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
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
  const app = initializeApp({
    projectId: firebaseConfig.projectId,
    // Use default credentials in production (Firebase App Hosting)
    // Use service account in development
    ...(process.env.NODE_ENV === 'development' && process.env.GOOGLE_APPLICATION_CREDENTIALS 
      ? { credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS) }
      : {}),
  });

  return {
    app,
    firestore: getFirestore(app),
    auth: getAuth(app),
  };
}

// Export singleton instances of the services
export const { app, firestore, auth } = getFirebaseAdminServices();
