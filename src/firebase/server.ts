// IMPORTANT: This file should ONLY be imported in server-side code (Route Handlers, Server Actions, etc.)
import { initializeApp, getApps, getApp, App, cert } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { firebaseConfig } from './config'; // Reuse config for project ID

// Helper function to get the initialized services
function getFirebaseAdminServices() {
  const app = getApps().length > 0 ? getApp() : initializeApp({
    credential: cert(process.env.GOOGLE_APPLICATION_CREDENTIALS || {}),
    projectId: process.env.GCP_PROJECT || firebaseConfig.projectId,
  });

  return {
    app,
    firestore: getFirestore(app),
    auth: getAuth(app),
  };
}

// Export singleton instances of the services
export const { app, firestore, auth } = getFirebaseAdminServices();
