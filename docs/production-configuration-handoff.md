# Sahaayak — Production Configuration & Deployment Handoff

This document provides the exact non-secret configuration parameters, environment requirements, and owner actions required to deploy the Sahaayak MVP to production.

---

## 1. Environment & Architecture Overview

Sahaayak uses a decoupled architecture with client-side Firebase Authentication and a token-verified Express backend:
- **Frontend Client**: Static Single-Page Application (SPA) hosted on HTTPS (e.g. Vercel, Firebase Hosting).
- **Backend API**: Node.js Express server hosted on HTTPS (e.g. Railway, Render, Cloud Run).
- **Database & Auth**: Cloud Firestore and Firebase Authentication.

---

## 2. Frontend Hosting Build Environment Variables

Configure the following environment variables in your frontend hosting platform build settings (e.g. Vercel / Firebase App Hosting Dashboard).

> **IMPORTANT**: Frontend environment variables are embedded into static JavaScript bundles at build time. The frontend **must be rebuilt** after setting or updating any variable.

```env
# Backend API Base URL (HTTPS only, includes /api path prefix)
VITE_API_URL="https://<backend-domain>/api"

# Firebase Web Client Credentials (Public client configuration)
VITE_FIREBASE_API_KEY="<your-firebase-web-api-key>"
VITE_FIREBASE_AUTH_DOMAIN="<your-project-id>.firebaseapp.com"
VITE_FIREBASE_PROJECT_ID="<your-firebase-project-id>"
VITE_FIREBASE_STORAGE_BUCKET="<your-project-id>.appspot.com"
VITE_FIREBASE_MESSAGING_SENDER_ID="<your-messaging-sender-id>"
VITE_FIREBASE_APP_ID="<your-firebase-app-id>"
```

> [!WARNING]
> **Zero Secret Leaks**: Never place Gemini API keys, Firebase Admin private keys, or service account JSON values in frontend environment variables (`VITE_*`). Gemini AI invocation is strictly server-side.

---

## 3. Backend Hosting Environment Variables

Configure the following environment variables in your backend hosting platform process settings (e.g. Railway / Render / Cloud Run Secret Manager):

```env
# Server Port & Binding
PORT=5000

# CORS Allowed Frontend Origin (Exact HTTPS domain, no trailing slash, no wildcard *)
CORS_ALLOWED_ORIGINS="https://<frontend-domain>"
FRONTEND_URL="https://<frontend-domain>"

# Firebase Admin SDK Credentials (Server-only service account)
FIREBASE_PROJECT_ID="<your-firebase-project-id>"
FIREBASE_CLIENT_EMAIL="<your-service-account-client-email>"
FIREBASE_PRIVATE_KEY="<your-service-account-private-key>"

# Optional AI Provider Configuration (Gemini API)
# Optional for this release. If omitted, the protected chat endpoint safely returns
# plain-text fallback guidance with exit status 'unavailable' without crashing.
GEMINI_API_KEY="<your-gemini-api-key>"

# Mock AI Mode Flag (Set to "false" in production when GEMINI_API_KEY is supplied)
USE_MOCK_AI="false"
```

---

## 4. Required Owner Console Actions Before Deployment

### Action A — Firebase Authentication Authorized Domains
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your Sahaayak project.
3. Navigate to **Authentication** → **Settings** → **Authorized domains**.
4. Click **Add domain** and enter your final production frontend domain: `https://<frontend-domain>`.
5. Save changes. (Without this step, Firebase Auth will reject sign-in attempts from your deployed domain).

### Action B — Exact CORS Origin Configuration
1. In your backend hosting dashboard (Railway / Render / Cloud Run), set `CORS_ALLOWED_ORIGINS` to `https://<frontend-domain>`.
2. Confirm no wildcard (`*`), comma-separated guesses, or `http://localhost` origins are enabled in production settings.

---

## 5. Post-Deployment Smoke Test Protocol

After completing deployment and environment configuration, perform this non-sensitive manual verification:

1. **Authentication Flow**:
   - Navigate to `https://<frontend-domain>`.
   - Sign in with a test account.
   - Refresh the page and confirm the session is retained via Firebase Auth persistence.
   - Click **Logout** and confirm clean redirection to the entry screen.

2. **Language Localization**:
   - Click the top-right header language dropdown (`English ▾` / `ಕನ್ನಡ ▾`).
   - Switch to **ಕನ್ನಡ**.
   - Confirm interface copy translates cleanly into Kannada script without glyph clipping.
   - Refresh and verify language choice persists (`sahaayak-locale`).

3. **Scholarship Questionnaire & Review**:
   - Click **Prepare a scholarship application**.
   - Fill representative non-sensitive sample answers (`fullName`, `email`, `schoolOrCollege`).
   - Navigate **Back** and **Continue** between sections.
   - Confirm answers are retained in review mode.

4. **Document Checklist & Readiness**:
   - Verify checklist items display generic preparation language (`transcript`, `personal_statement`).
   - Verify readiness summary reports preparation progress only (`Preparation draft complete`).

5. **Ask Sahaayak Chat Assistant**:
   - Send a question in the chat panel.
   - Confirm the assistant responds with either safe plain-text guidance with approved sources, or the truthful fallback:
     *"The chatbot service is temporarily unavailable. You can complete the guided questions manually using the standard inputs on the screen."*
   - Confirm form fields are **never** automatically mutated by chat responses.

6. **Network & Security Verification**:
   - Open Browser Developer Tools → **Network** tab.
   - Verify all API requests target `https://<backend-domain>/api/...` over HTTPS.
   - Confirm 0 CORS errors, 0 mixed-content warnings, and 0 `localhost` fallback requests occur.
