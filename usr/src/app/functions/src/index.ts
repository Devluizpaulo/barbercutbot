
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';
import { DocumentSnapshot } from 'firebase-functions/v1/firestore';
import { EventContext } from 'firebase-functions/v1';

// Initialize the Admin SDK
admin.initializeApp();

/**
 * Callable Cloud Function to check if an admin user already exists.
 * This can be called by unauthenticated clients on the setup page.
 */
export const checkAdminExists = functions.https.onCall(async (data, context) => {
    try {
        const usersRef = admin.firestore().collection('users');
        const adminQuery = usersRef.where('role', '==', 'admin').limit(1);
        const adminSnapshot = await adminQuery.get();
        return { adminExists: !adminSnapshot.empty };
    } catch (error) {
        console.error("Error checking for admin user:", error);
        throw new functions.https.HttpsError('internal', 'Could not check for admin existence.');
    }
});


/**
 * Callable Cloud Function to create a new user with an admin role.
 * Only authenticated admins can call this function.
 */
export const createAdminUser = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
    // 1. Authentication Check: Ensure the user calling the function is an admin.
    if (!context.auth || context.auth.token.admin !== true) {
        throw new functions.https.HttpsError(
            'permission-denied',
            'Only administrators can create new admin users.'
        );
    }

    const { email, password, firstName, lastName, role } = data;

    // 2. Input Validation
    if (!email || !password || !firstName || !lastName || !role) {
        throw new functions.https.HttpsError(
            'invalid-argument',
            'Missing required fields: email, password, firstName, lastName, role.'
        );
    }

    try {
        // 3. Create user in Firebase Authentication
        const userRecord = await admin.auth().createUser({
            email: email,
            password: password,
            displayName: `${firstName} ${lastName}`,
        });
        
        // 4. Set Custom Claim
        if (role === 'admin') {
            await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
        }
        
        // 5. Create user document in Firestore
        const userDocRef = admin.firestore().collection('users').doc(userRecord.uid);
        await userDocRef.set({
            id: userRecord.uid,
            firstName,
            lastName,
            email,
            role, // 'admin' or 'support'
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        return {
            uid: userRecord.uid,
            message: `Successfully created user ${email} with role ${role}.`
        };

    } catch (error: any) {
        console.error("Error creating admin user:", error);
        // Propagate specific auth errors to the client
        if (error.code && error.code.startsWith('auth/')) {
             throw new functions.https.HttpsError('invalid-argument', error.message);
        }
        throw new functions.https.HttpsError('internal', 'An internal error occurred.');
    }
});

/**
 * Cloud Function that triggers when a new user document is created.
 * If the document indicates an 'owner' role, it ensures no admin claim is present.
 * This function primarily serves as a safeguard and for non-admin user creation flows.
 */
export const onUserCreateSetRole = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snapshot: DocumentSnapshot, context: EventContext) => {
    const userData = snapshot.data();
    const userId = context.params.userId;

    console.log(`User document created for UID: ${userId}`, userData);

    // This handles the standard signup flow for shop owners.
    if (userData && userData.role === 'owner') {
      try {
        // Ensure no admin claim is set for regular owners.
        await admin.auth().setCustomUserClaims(userId, { admin: false });
        console.log(`Successfully ensured no admin claim for owner: ${userId}`);
      } catch (error) {
        console.error(`Error setting claims for owner: ${userId}`, error);
      }
    }
    
    // The admin creation flow is now handled by the `createAdminUser` callable function,
    // so we don't need to explicitly handle the 'admin' role here. This function
    // now focuses on the standard user signup path.
  });
