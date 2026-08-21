# Authentication Specification — Sahaayak

This document outlines the authentication and session verification design for **Sahaayak** using Firebase Authentication.

---

## 1. Interaction Flow

Authentication is managed client-side using the Firebase Web SDK. The backend verifies the session using the server-side `firebase-admin` SDK:

```text
User ──► React Client ──► Firebase Auth (Client Login)
              │
              ├─► Receives Firebase ID Token
              │
              ▼ (REST Header: Bearer Token)
         Express API Server
              │
              ├─► admin.auth().verifyIdToken(token)
              │
              ▼
         Decodes UID ──► Performs Authorized Operations
```

---

## 2. Token Exchange & Validation

### 1. Client-Side Authentication
When a user registers or logs in, the React frontend executes Firebase SDK calls directly:
- **Register**: `createUserWithEmailAndPassword(auth, email, password)`
- **Login**: `signInWithEmailAndPassword(auth, email, password)`
- **Logout**: `signOut(auth)`

On authorization change (`onAuthStateChanged`), the client fetches the Firebase ID Token:
```typescript
const idToken = await firebaseUser.getIdToken();
localStorage.setItem('sahaayak_token', idToken);
```

### 2. Backend Route Verification Middleware
When protected routes are requested, the Bearer token is extracted from the `Authorization` header and verified against the Firebase Admin SDK:

```typescript
import { Request, Response, NextFunction } from 'express';
import { auth } from '../services/firebaseAdmin';

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Access token required.' });

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired Firebase session token.' });
  }
}
```

---

## 3. Security Considerations
- **No Password Hashing or bcrypt**: Password validation, hashing algorithms, and verification flows are managed by Google Firebase Authentication.
- **No Custom JWT Secrets**: The session is validated cryptographically using Firebase public keys. Custom token generation libraries (like `jsonwebtoken`) have been removed from dependencies.
- **Least Privilege Access**: The decoded `req.userId` UID is verified against the Firestore user collection parameters (`/users/{uid}`) to ensure users can only modify their own workflow progress and answers.
