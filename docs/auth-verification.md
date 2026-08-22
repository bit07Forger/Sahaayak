# Authentication and Authorization Verification — Sahaayak

This document outlines the success/failure verification matrix, manual developer test actions, logging security standards, and CORS audits for **Phase 5: Backend/API Integration**.

---

## 1. Server Authorization Verification Matrix

The GET `/api/auth/session` endpoint and the `requireFirebaseAuth` middleware have been verified against the following access policies:

| Scenario | Tested Action / Header Config | Expected HTTP Status | Expected JSON Payload Response | Status / Result |
| :--- | :--- | :--- | :--- | :--- |
| **No Authorization Header** | Request without any `Authorization` headers. | `401 Unauthorized` | `{ "error": "Unauthorized", "message": "Missing or invalid token." }` | Verified (Mocked/Manual) |
| **Empty Bearer Header** | Header: `Authorization: Bearer ` | `401 Unauthorized` | `{ "error": "Unauthorized", "message": "Missing or invalid token." }` | Verified (Mocked/Manual) |
| **Malformed Scheme** | Header: `Authorization: Basic 12345` | `401 Unauthorized` | `{ "error": "Unauthorized", "message": "Missing or invalid token." }` | Verified (Mocked/Manual) |
| **Invalid/Expired Token** | Header: `Authorization: Bearer expired-token` | `401 Unauthorized` | `{ "error": "Unauthorized", "message": "Missing or invalid token." }` | Verified (Mocked/Manual) |
| **Spoofed UID Attempt** | Request includes body/query params carrying `uid` or `email` payload. | `200 OK` (Overrides custom parameters) | User identity context derives **solely** from the verified Firebase ID Token. | Verified (Mocked/Manual) |
| **Unexpected SDK Failure** | Firebase Admin throws connection timeout/credentials error. | `500 Internal Error` | `{ "error": "Internal Server Error", "message": "Authentication check failed." }` | Verified (Mocked/Manual) |
| **Valid Firebase ID Token** | Header: `Authorization: Bearer <VALID_TOKEN>` | `200 OK` | `{ "user": { "uid": "...", "email": "...", "emailVerified": ... } }` | Verified (Mocked/Manual) |

---

## 2. Frontend Authenticated-Request Helper Verification Matrix

The frontend API helper `request()` utility in `frontend/src/services/api.ts` behaves as follows:

| Scenario | Client Action | Expected Helper Outcome | Status / Result |
| :--- | :--- | :--- | :--- |
| **Authenticated Call** | Client triggers `getAuthenticatedSession()`. | Awaits `authPersistenceReady`, fetches fresh ID token on-demand, and sets bearer header. | Verified (Mocked/Manual) |
| **No User Logged In** | Client triggers `getAuthenticatedSession()`. | Resolves empty headers, preventing unauthenticated REST calls. | Verified (Mocked/Manual) |
| **401 Server Response** | Server rejects token. | Parses JSON error and throws a safe client-facing JavaScript `Error`. | Verified (Mocked/Manual) |
| **500 Server Response** | Server experiences unexpected crash. | Catches safe masked payload, hiding stack traces from console/user logs. | Verified (Mocked/Manual) |
| **Session Lifecycle Check** | Log out, then trigger protected call. | No token is cached or sent; blocked locally. | Verified (Mocked/Manual) |

---

## 3. CORS Security Audit

The backend server configures cross-origin security rules inside `backend/src/server.ts`:
- **Allowlist Origins**: Cross-origin requests are limited to the verified React development site `http://localhost:5173` or custom override `process.env.FRONTEND_URL`.
- **Preflight Support**: Supports standard browser preflights (allowing standard header access for `Authorization` and `Content-Type`).
- **No Wildcarding**: Broad permissive wildcards (`*`) are strictly blocked when credential transfers (`credentials: true`) are active.

---

## 4. Logging & PII Security Validation

An audit of the authentication path confirms that the following sensitive data are **completely omitted** from console outputs, browser caches, database fields, and Git commits:
1. **Plaintext Passwords**: Never processed or logged by local scripts; managed by the Firebase Authentication SDK.
2. **Access Tokens**: Not logged or stored in `localStorage` or session files. Resolved dynamically on demand.
3. **Decoded Payloads**: Only minimal identifiers (`uid`, `email`) are exported; full custom claim bodies are withheld from UI layers.
4. **Firebase Stack Traces**: Error handlers intercept database connection failures and replace them with standard non-sensitive summaries.
