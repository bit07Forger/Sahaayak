import * as admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (admin.apps.length === 0) {
  if (projectId && clientEmail && privateKey) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
    console.log('Firebase Admin initialized with custom service account credentials.');
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      console.log('Firebase Admin initialized with default application credentials.');
    } catch {
      admin.initializeApp({
        projectId: projectId || 'sahaayak-dev',
      });
      console.warn('Firebase Admin initialized in local fallback/emulator mode.');
    }
  }
}

export const auth = admin.auth();
export const firestore = admin.firestore();
export default admin;
