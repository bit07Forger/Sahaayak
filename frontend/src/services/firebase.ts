import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const appId = import.meta.env.VITE_FIREBASE_APP_ID;

// Fail safely with a clear dev-time error if required configuration is missing
if (!apiKey || !authDomain || !projectId) {
  throw new Error(
    'Firebase configuration error: Missing required VITE_FIREBASE_* environment variables. ' +
    'Please verify that your local .env is loaded and contains active configuration values.'
  );
}

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

// Singleton Firebase App pattern to prevent duplicate initialization during hot reloads
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const firestore = getFirestore(app);

// Configure local browser session persistence and export the promise for future authentication operations
export const authPersistenceReady = setPersistence(auth, browserLocalPersistence)
  .then(() => {
    console.log('Firebase Auth persistence successfully set to browserLocalPersistence.');
  })
  .catch((error) => {
    console.error('Failed to configure Firebase Auth persistence:', error);
  });

export default app;
