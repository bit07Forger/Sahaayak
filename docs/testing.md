# Testing & Verification Guide — Sahaayak

This document outlines tests and assertions to verify the reliability, security, and accessibility of the Firebase-based Sahaayak application.

---

## 1. Authentication Scenarios

### Firebase SDK Client Signups
- **Check**: Register an account with an empty password or malformed email address using the frontend form.
- **Expected Outcome**: Firebase Authentication client SDK triggers error validation alerts, which are displayed in the form.
- **Check**: Register a duplicate email address.
- **Expected Outcome**: Firebase returns an email-already-in-use error, which is caught and displayed by the UI context.

### Token-Protected API Routes
- **Check**: Call `/api/auth/me` or `/api/workflows/current` without the Bearer token in the `Authorization` header.
- **Expected Outcome**: Server blocks request and returns HTTP `401 Unauthorized`.
- **Check**: Send a malformed or expired token header.
- **Expected Outcome**: Server verifies the token against `firebase-admin`, rejects the credentials, and returns HTTP `403 Forbidden`.

---

## 2. Firestore Collection Scenarios

### First-Time Profile Creation
- **Check**: Authenticate a new user UID and invoke the `/api/auth/me` endpoint.
- **Expected Outcome**: The backend verify token check succeeds, identifies that `/users/{uid}` does not exist in Firestore, and seeds default profile settings and workflow progress records.

### Answer & Progress Storage
- **Check**: Confirm step 1 response.
- **Expected Outcome**: Backend writes to `/users/{uid}/answers/{key}` in Firestore and updates `progress.currentStep` inside the user profile document.

---

## 3. Security Boundary Controls

### User Directory Isolation
- **Check**: User A attempts to request or write to `/users/userB_uid` collections.
- **Expected Outcome**: Firestore Security Rules intercept the request and fail with a permission-denied error.

### Server Account Safety
- **Check**: Search frontend static code build outputs.
- **Expected Outcome**: Firebase Admin service account keys and environment parameters are omitted from client code.
