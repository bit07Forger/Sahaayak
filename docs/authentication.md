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
