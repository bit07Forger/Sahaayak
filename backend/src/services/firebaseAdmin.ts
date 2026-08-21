import admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// Fail safely if the target Firebase Project ID is missing
if (!projectId) {
  throw new Error('Firebase Admin initialization failed: Missing environment variable "FIREBASE_PROJECT_ID".');
}

let adminApp: admin.app.App;

if (admin.apps.length === 0) {
  try {
    if (clientEmail && privateKey) {
      adminApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      console.log(`Firebase Admin initialized successfully for project "${projectId}" using custom service account credentials.`);
    } else {
      // Fallback to Application Default Credentials (ADC) or local emulator configuration
      adminApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId,
      });
      console.log(`Firebase Admin initialized successfully for project "${projectId}" using Application Default Credentials.`);
    }
  } catch (err: any) {
    // Fail safely during startup with a concise message that never prints keys, tokens, or credentials
    throw new Error(`Firebase Admin initialization failed for project "${projectId}". Details: ${err.message}`);
  }
} else {
  adminApp = admin.apps[0]!;
}

// Exports for compatibility with existing database code and new Phase 5 specifications
export const auth = admin.auth(adminApp);
export const firestore = admin.firestore(adminApp);
export const adminAuth = auth;
export const adminDb = firestore;
export { adminApp };

export default admin;
