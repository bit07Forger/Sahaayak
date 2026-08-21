# Deployment Specification — Sahaayak

This document outlines environment settings and deployment configurations for the Firebase-based Sahaayak application.

---

## 1. Hosting Providers

- **Frontend Client**: Vercel.
- **Backend API**: Render or Railway.
- **Database & Auth**: Google Firebase console.

---

## 2. Environment Variables

### Frontend Environment Variables (Vercel)
Define these properties on the Vercel dashboard to configure the Firebase Web Client:
```env
VITE_API_URL="https://sahaayak-backend.onrender.com"
VITE_FIREBASE_API_KEY="AIzaSy..."
VITE_FIREBASE_AUTH_DOMAIN="sahaayak-prod.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="sahaayak-prod"
VITE_FIREBASE_STORAGE_BUCKET="sahaayak-prod.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="1234567890"
VITE_FIREBASE_APP_ID="1:1234567890:web:1234567890"
```

---

## 3. Firebase Console Configuration

Ensure the following features are enabled in the Google Firebase Console:
1. **Firebase Authentication**: Enable the **Email/Password** sign-in provider.
2. **Cloud Firestore**:
   - Create database in production or test mode.
   - Deploy `firestore.rules` rules to block unauthorized public access.

To deploy security rules from the terminal:
```bash
# Install Firebase CLI globally if required
npm install -g firebase-tools

# Login and verify project
firebase login
firebase use --add

# Deploy security rules
firebase deploy --only firestore:rules
```
