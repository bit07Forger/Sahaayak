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
VITE_API_URL="your-backend-api-url"
VITE_FIREBASE_API_KEY="your-firebase-web-api-key"
VITE_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="your-project-id"
VITE_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
VITE_FIREBASE_APP_ID="your-app-id"
```

> [!NOTE]
> Store real local values in a Git-ignored `.env` file and configure deployment values through the hosting environment. Do not commit real configuration values to example or documentation files.

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
