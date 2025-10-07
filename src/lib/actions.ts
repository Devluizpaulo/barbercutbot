
'use server';

import { revalidatePath } from 'next/cache';
import { doc, updateDoc, getFirestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase'; // Assuming this initializes admin or a server-side instance

// This function needs a server-side context to run.
// We are simulating this with a regular function for now,
// but for a real app, you'd use Firebase Admin SDK here.
async function getDb() {
  // On the server, you would initialize Firebase Admin
  // For now, we'll assume a client-like initialization for simplicity
  const { firestore } = initializeFirebase();
  return firestore;
}

export async function updateAppointmentStatus(
  shopId: string,
  appointmentId: string,
  status: 'completed' | 'cancelled'
) {
  if (!shopId || !appointmentId) {
    return { success: false, error: 'Shop ID and Appointment ID are required.' };
  }

  try {
    const db = await getDb();
    const appointmentRef = doc(
      db,
      'barberShops',
      shopId,
      'appointments',
      appointmentId
    );
    await updateDoc(appointmentRef, { status: status });

    // Revalidate the path to trigger a data refresh on the client
    revalidatePath(`/dashboard/${shopId}/appointments`);

    return { success: true };
  } catch (error: any) {
    console.error('Error updating appointment status:', error);
    return { success: false, error: error.message || 'An unknown error occurred.' };
  }
}
