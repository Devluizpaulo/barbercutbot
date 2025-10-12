import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize the Admin SDK
admin.initializeApp();

/**
 * Cloud Function that triggers when a new document is created in the 'users' collection.
 * If the user document has `role: 'admin'`, it sets a custom claim on the user's auth token.
 */
export const onUserCreateSetAdminClaim = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snapshot, context) => {
    const userData = snapshot.data();
    const userId = context.params.userId;

    // Log the creation event for auditing
    console.log(`User document created for UID: ${userId}`, userData);

    // Check if the 'role' field is set to 'admin'
    if (userData && userData.role === 'admin') {
      try {
        // Set the custom claim { admin: true } on the user
        await admin.auth().setCustomUserClaims(userId, { admin: true });
        console.log(`Successfully set admin claim for user: ${userId}`);
      } catch (error) {
        console.error(`Error setting custom claim for user: ${userId}`, error);
      }
    }
  });
