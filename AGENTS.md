# Sahaayak — Firebase Development & Architecture Rules

This document defines the architecture standards, configuration guidelines, and security policies for all future development on **Sahaayak**. All developers and coding agents must strictly adhere to these rules.

---

## 1. Project Architecture

The Sahaayak MVP has migrated from custom database adapters and ORMs to a modern cloud-native backend:
- **Database**: Firebase Cloud Firestore
- **Authentication**: Firebase Authentication (Client-side signup/login, session handling)
- **Backend Admin Operations**: Firebase Admin SDK (Used exclusively on secure server-side components for verification/administrative operations)

### System Flow
```text
Frontend (React client)
  ↓
Firebase Authentication (User sessions, email/password validation)
  ↓
REST API Backend (Express middleware using Firebase Admin token verification)
  ↓
Cloud Firestore (Relational collections: Users, Preferences, Progress, Answers, DocumentStatuses)
```

> [!IMPORTANT]
> **No Custom ORMs or Engines**: Do not reintroduce Prisma, PostgreSQL, custom SQL adapters, SQLite, or other database systems. Preserve the Cloud Firestore and Firebase Auth architecture.

---

## 2. Configuration & Credentials Management

- **Zero Secret Commits**: Never hardcode Firebase API keys, Admin private keys, service account credentials, or JSON files in source code.
- **Environment Isolation**:
  - **Frontend Client**: Store configuration keys in variables prefixed with `VITE_` (e.g., `VITE_FIREBASE_API_KEY`).
  - **Backend Server**: Initialize Firebase Admin using secure server-side environment variables (e.g., `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`).
- **Dotenv Management**:
  - Keep `.env.example` updated with any newly introduced variables.
  - Ensure `.env` is listed in `.gitignore` and never committed to version control.
- **Initialization Reuse**: Do not initialize Firebase in multiple files. Reuse the unified initialization modules on both the client and server.

---

## 3. Firestore Database Standards

- **Clean Data Access**: Keep database logic out of UI components. Route all Firestore operations through service, repository, or adapter classes.
- **Document Model Constraints**:
  - Treat collection names, document keys, and field types as database contracts.
  - Before modifying a document schema, search the codebase for all occurrences of reads, writes, validation schemas, and queries.
  - Do not create duplicate collections for the same data entity.
  - Validate data models and schema models before writing to Firestore.
- **Query Optimization**:
  - Design queries within Firestore limitations (e.g., limits on array-contains, inequality filters, or missing indexes).
  - Minimize read and write operations.
  - Use server timestamps (`serverTimestamp()`) for audit logs and creation fields.
  - Handle missing documents, failed fetches, and offline state anomalies gracefully without breaking the user experience.
- **No Credentials Storage**: Under no circumstances should passwords, plaintext tokens, or private client keys be stored in Firestore document fields.

---

## 4. Firebase Authentication Guidelines

- **No Hashing Libraries**: Do not implement custom hashing mechanisms (e.g., bcrypt, PBKDF2) for user passwords. Password hashing is managed automatically by Firebase Authentication.
- **No Duplicate Sessions**: Do not maintain parallel custom JWT validation schemes. Rely strictly on Firebase Auth token structures.
- **Verify on Server-Side**:
  - Never trust user identity claims supplied only by the client request payload.
  - Authenticated API endpoints must extract ID tokens from HTTP Authorization headers (`Bearer <token>`) and verify them using `firebase-admin` auth verification.
- **Security Scope**: Protect user-specific folders and routes. Ensure that one authenticated user cannot query or modify another user's progress state or answers.

---

## 5. Frontend Client Rules

- **Shared Client Instance**: Use the single exported Firebase client configuration. Do not duplicate calls to `initializeApp()`.
- **Clean UI Boundaries**: Keep presentation-only layouts clean from database references. Map queries to custom hook state or context structures.
- **Manage Real-time Listeners**:
  - Avoid unnecessary real-time listeners (`onSnapshot`) where simple, one-time fetches are sufficient.
  - Always clean up and unsubscribe from listeners inside component unmount lifecycles (`useEffect` return cleanup).
- **Environment Isolation**: Never import `firebase-admin` or reference admin service accounts inside frontend files.

---

## 6. Backend API Rules

- **Server-Only SDK**: Import and use `firebase-admin` exclusively on the backend.
- **Secure Token Interceptor**: Check incoming request authorization using a middleware that wraps `admin.auth().verifyIdToken(token)`.
- **Defensive Auditing**:
  - Validate all client request payloads before executing writes on collections.
  - Log failures, but never print or log raw auth tokens, passwords, private keys, or sensitive customer details.
  - Return consistent REST HTTP error codes (e.g., 401 for expired token, 403 for unauthorized access, 404 for missing document).

---

## 7. Security Policies

- **Restricted Access Rules**: Never use open write rules (e.g., `allow read, write: if true`) in production environments.
- **Least Privilege Access**: Apply rules restricting document actions based on request auth status and ownership (e.g., `request.auth.uid == resource.data.userId`).
- **Audit Cadence**:
  - Inspect and update Firestore Security Rules (`firestore.rules`) whenever document fields or collections change.
  - Test blocked actions alongside allowed actions.

---

## 8. Dependencies Management

- **Targeted Dependencies**: Use only the standard `firebase` client SDK on the frontend, and `firebase-admin` on the backend.
- **No Legacy Libraries**: Do not add Prisma, `@prisma/client`, `pg`, `bcryptjs`, `jsonwebtoken` (unless required for legacy JWT checks), or MongoDB packages.
- **Lock Verification**: Always run `npm install` and verify package lock integrity when altering dependencies. Remove any legacy packages that are no longer referenced in source code.

---

## 9. Code Organization

Structure Firebase integration according to these specific locations:
- **Client Configuration**: `frontend/src/services/firebase.ts` (Initializes client SDK, exports Auth and Firestore instances)
- **Client Context Providers**: `frontend/src/contexts/AuthContext.tsx` (Binds authentication state to UI render cycles)
- **Backend Initializer**: `backend/src/services/firebaseAdmin.ts` (Initializes admin SDK with service accounts/env keys)
- **Backend Middleware**: `backend/src/middleware/auth.ts` (Validates header bearer tokens against Admin Auth service)

---

## 10. Testing Protocols

Before deploying code updates, verify:
1. **Auth Paths**: Successful signup, login, session retention across page reloads, and logout triggers.
2. **Access Isolation**: Verify that requesting database documents belonging to other user IDs returns permission errors.
3. **Fail-Safes**: Ensure that UI screens handle network failures, unauthenticated states, and empty Firestore collections gracefully.
4. **No Production Keys**: Verify that no test assertions or mock suites run using production project credentials.

---

## 11. Legacy Reference Rules

- Prisma and PostgreSQL are considered legacy technologies for Sahaayak. Do not insert or update Prisma schema files, database migrations, or Postgres drivers.
- If a document or comments block contains mentions of PostgreSQL or Prisma, label it clearly as `[LEGACY]` or `[DEPRECATED]` to prevent architectural confusion.
