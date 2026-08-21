# Authentication Specification — Sahaayak

This document outlines the authentication and session verification design for **Sahaayak** using Firebase Authentication.

---

## 1. Interaction Flow

Authentication is managed client-side using the Firebase Web SDK. Users register, log in, and log out directly on the frontend:

```text
User ──► React Client (Vite) ──► Firebase Authentication
```

Upon successful authentication, the Firebase Client SDK caches the user session and issues session ID tokens.

---

## 2. Setup & Configuration

### 1. Client-Side Authentication Requirements
To integrate Firebase Authentication in the frontend:
- Enable the **Email/Password** sign-in provider in the Firebase Console under Build > Authentication.
- Initialize the Firebase Client SDK using variables defined in `.env`.
- Retrieve active token sessions for use in frontend states.

### 2. Security Considerations
- **No Password Hashing or bcrypt**: Password hashing and verification are managed directly by Firebase Authentication.
- **No Custom JWT Secrets**: The system relies on Firebase Identity Tokens, removing dependencies on local hashing or JWT generation algorithms.

---

## 3. Protected API Request Contract

To request protected server resources, client applications must establish session context through HTTP headers.

### 1. HTTP Request Header Format
All protected endpoints require the client to supply a current Firebase ID Token in the standard Authorization header:
```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
```
- **Bearer Token Resolution**: The frontend fetches the dynamic token at request time using the session helper (`getActiveIdToken()`).
- **Persistence Rules**: Raw token strings, refresh keys, or credentials must never be written to `localStorage`, cookies, or browser query fields.

### 2. Trusted Server Identity Context
Upon successful token validation on the backend, server controllers receive a clean verified user context injected into the request:
```typescript
interface AuthenticatedRequestUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
}
```

### 3. Server Authentication Error Reporting
When authentication fails, the server responds with standard status codes:
- **401 Unauthorized**: Missing, expired, or malformed bearer token in the `Authorization` header.
  - JSON payload: `{ "error": "Unauthorized", "message": "Missing or invalid token." }`
- **403 Forbidden**: Valid token supplied, but the authenticated user has insufficient permissions to access the resource.
  - JSON payload: `{ "error": "Forbidden", "message": "Access denied." }`
- **500 Internal Server Error**: Unexpected exception during validation, safely masked to hide stack traces.
  - JSON payload: `{ "error": "Internal Server Error", "message": "Authentication check failed." }`

