# Phase 5 API Handoff — Sahaayak

This document outlines the API foundation and integration rules for Phase 6 workflow and Firestore operations.

---

## 1. Protected Request Rules & Header Standard
- All authenticated endpoints must verify requests using a current Firebase ID Token.
- Format:
  ```http
  Authorization: Bearer <FIREBASE_ID_TOKEN>
  ```
- **Handoff Rule**: Phase 6 must reuse the existing middleware (`requireFirebaseAuth`) and frontend request utility rather than parsing token headers or manually caching session tokens.

---

## 2. API Base URL Sources
- **Frontend Source**: `import.meta.env.VITE_API_URL` (defaults to `http://localhost:5000/api` locally).
- **Backend Port**: Configured via the `PORT` environment variable (defaults to `5000` locally).

---

## 3. Trusted Identity Context (Server-side)
Upon verification, the middleware injects the validated user context into the request:
```typescript
interface AuthenticatedRequestUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
}
```
Available to downstream route controllers under `req.user` (or `req.userId` / `req.userEmail` for legacy handlers).

---

## 4. Protected Session Endpoint
- **Method**: `GET`
- **Path**: `/api/auth/session`
- **Success Response (200 OK)**:
  ```json
  {
    "user": {
      "uid": "verified-firebase-uid",
      "email": "user@example.com",
      "emailVerified": true
    }
  }
  ```
- **Error Responses**:
  - `401 Unauthorized`: Missing, invalid, or expired tokens.
  - `500 Internal Server Error`: Unexpected Firebase SDK database or connection failures.

---

## 5. Frontend Helper & Execution
- **Helper Name**: `request<T>(endpoint: string, options: RequestInit = {})` in `frontend/src/services/api.ts`.
- **Usage**:
  ```typescript
  // Dynamically fetches the current token and sends the request:
  const data = await request<ServiceWorkflow>('/workflows/current');
  ```

---

## 6. Required Environment Variables
- **Client/Frontend**:
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_APP_ID`
  - `VITE_API_URL`
- **Server/Backend**:
  - `PORT`
  - `FRONTEND_URL`
  - `FIREBASE_PROJECT_ID`
  - `FIREBASE_CLIENT_EMAIL`
  - `FIREBASE_PRIVATE_KEY`
  - `GEMINI_API_KEY`
  - `USE_MOCK_AI`

---

## 7. Intentional Exclusions (Out of Scope for Phase 5)
- No Firestore workflow/seeding execution in endpoint handlers.
- No question navigation or answer storage routes.
- No AI analysis integration or voice processing hooks.
- No deployment deployment scripts.

---

## 8. Phase 6 Boundary
- Phase 6 is authorized to begin implementing the core workflow engine, reading service collections, saving progress details in the database under `users/{uid}/workflowProgress`, and calculating permit readiness summaries using this validated API foundation.
