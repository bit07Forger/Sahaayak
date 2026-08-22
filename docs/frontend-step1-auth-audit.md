# Sahaayak MVP — Frontend Auth Audit (Step 1)

This document records the audit of the frontend-backend integration contract, the authentication boundaries, and the plan for implementing the authentication entry experience.

---

## 1. Authentication State Source & Available Methods

- **Authentication State Source:**
  - Managed via the Firebase Client SDK using the `auth` instance exported from [`firebase.ts`](file:///c:/Users/ayush/Desktop/COLLEGE%20FOLDER/Hackathon/frontend/src/services/firebase.ts).
  - The authentication context [`AuthContext.tsx`](file:///c:/Users/ayush/Desktop/COLLEGE%20FOLDER/Hackathon/frontend/src/contexts/AuthContext.tsx) listens to session and token changes reactively using `onIdTokenChanged(auth, callback)`.

- **Available Auth Methods:**
  - **Login:** `signInWithEmailAndPassword(auth, email, password)` via the `login` function.
  - **Registration:** `createUserWithEmailAndPassword(auth, email, password)` via the `register` function.
  - **Logout:** `signOut(auth)` via the `logout` function.

---

## 2. API Token Attachment Mechanism

- **Attachment Process:**
  - The API client in [`api.ts`](file:///c:/Users/ayush/Desktop/COLLEGE%20FOLDER/Hackathon/frontend/src/services/api.ts) calls `getAuthHeader()`, which waits for Firebase auth persistence to be ready (`authPersistenceReady`) and retrieves the current user's ID token dynamically:
    ```typescript
    const token = await currentUser.getIdToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
    ```
  - This header is automatically merged into the request options using:
    ```typescript
    const headers = {
      'Content-Type': 'application/json',
      ...authHeader,
      ...options.headers
    };
    ```
  - **Token Integrity:** The token is never stored in `localStorage` or `sessionStorage` manually; it is retrieved dynamically on demand directly from the Firebase Auth client SDK.

---

## 3. Files Selected for Step 1

1. **[`docs/frontend-step1-auth-audit.md`](file:///c:/Users/ayush/Desktop/COLLEGE%20FOLDER/Hackathon/docs/frontend-step1-auth-audit.md):**
   - This tracked audit file.
2. **[`frontend/index.html`](file:///c:/Users/ayush/Desktop/COLLEGE%20FOLDER/Hackathon/frontend/index.html):**
   - Updates the page title and adds links to Google Fonts for **Atkinson Hyperlegible** and **Fraunces**.
3. **[`frontend/src/index.css`](file:///c:/Users/ayush/Desktop/COLLEGE%20FOLDER/Hackathon/frontend/src/index.css):**
   - Sets up the Quiet Wayfinding color palette variables (`--surface-page`, `--surface-panel`, `--ink-primary`, `--ink-secondary`, `--brand-saffron`, `--status-success`, `--status-warning`, `--status-error`, `--border-subtle`).
   - Implements high-contrast overrides and custom font styling.
4. **[`frontend/src/App.tsx`](file:///c:/Users/ayush/Desktop/COLLEGE%20FOLDER/Hackathon/frontend/src/App.tsx):**
   - Rewrites and cleans up the view rendering to enforce the Auth Gate.
   - When signed out, it presents only the **Sahaayak — Scholarship Preparation** entry screen.
   - When signed in, it displays the protected **Scholarship Workspace — Coming Next** placeholder view.
   - When loading, it shows a clean, accessible loading page.

---

## 4. Product-Content & API Limitations

- **Backend Seed Data Context:**
  - The backend seed data currently refers to the **Accessible Parking Permit** service. The actual guided scholarship preparation data is not yet live or loaded.
  - The entry/welcome page will specifically present the **Scholarship Preparation** brand text, while stating that the guided workflow will be introduced in the next phase.

---

## 5. Local Environment Prerequisites

- **Environment Configuration:**
  - A local `.env` file (copied from `.env.example`) must contain valid `VITE_FIREBASE_*` credentials for client-side authentication.
  - The `VITE_API_URL` should point to `http://localhost:5000/api` to connect to the backend server.
  - No credentials, API keys, or private files are hardcoded in the source code.
