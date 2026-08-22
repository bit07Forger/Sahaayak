# Backend API Operational Hardening — Sahaayak

This document outlines the operational security controls, request correlation mechanisms, sanitization logging rules, health endpoints, and CORS configurations implemented for the **Sahaayak** Express API.

---

## 1. Safe API Error Contract

All Express API errors returned to client consumers conform to a standardized error envelope schema:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "User-friendly, client-safe error message.",
    "requestId": "server-generated-correlation-id"
  }
}
```

### Supported Client-Safe Status Mappings

| HTTP Status | Code | Client-Safe Message |
| :--- | :--- | :--- |
| **400** | `VALIDATION_ERROR` | Please check the information and try again. |
| **401** | `AUTH_MISSING` | Sign in to continue. |
| **401** | `AUTH_INVALID` | Your session could not be verified. Please sign in again. |
| **403** | `AUTH_FORBIDDEN` | You do not have access to this action. |
| **404** | `NOT_FOUND` | The requested resource was not found. |
| **429** | `RATE_LIMITED` | Too many requests. Please try again later. |
| **500** | `INTERNAL_ERROR` | Something went wrong. Please try again. |

---

## 2. Request Correlation IDs & Headers

Every incoming request is tagged early using the `requestIdMiddleware` in `backend/src/middleware/hardening.ts`:
- **Server Correlation ID**: Generates a standard `crypto.randomUUID()` for every request.
- **Client-supplied ID**: If `X-Request-Id` is supplied by the client, it is capped at 100 characters and concatenated with the server correlation ID to ensure server-controlled uniqueness.
- **Header Output**: Returns the identifier value in the `X-Request-Id` HTTP response header.

---

## 3. Redacted, Structured Logging Rules

To prevent data leaks, the server log system strictly adheres to the following privacy guidelines:
- **Only Safe Metadata Logged**: The log records only `timestamp`, `level`, `requestId`, `method`, `route`, `statusCode`, `durationMs`, and `authenticated`.
- **Absolute Redaction**: Never logs Firebase ID tokens, Authorization headers, query parameter keys, request body structures, user questionnaire answers, database credentials, or internal raw error stacks.

---

## 4. Strict CORS Policy Allowlist

- **Configuration Key**: `CORS_ALLOWED_ORIGINS` (Declared as a comma-separated list of permitted origins, e.g. `CORS_ALLOWED_ORIGINS="http://localhost:5173,http://localhost:3000"`).
- **Default Origin**: Falls back to `FRONTEND_URL` if the configuration key is missing.
- **Allowed Headers**: Accepts `Authorization`, `Content-Type`, and `X-Request-Id` requests.

---

## 5. Health & Readiness Monitoring Endpoints

Both paths are public, lightweight, and require no Firebase authentication checks:
- **`GET /health`**: Confirms that the Express process can receive traffic. Returns `{ service: "sahaayak-api", status: "ok", requestId: "..." }`.
- **`GET /ready`**: Validates the presence of crucial environment configurations (e.g. `FIREBASE_PROJECT_ID` checking) without executing external network queries. Returns a `503` if missing.

---

## 6. Test Suite and Coverage

The Vitest test coverage resides in `backend/tests/operationalHardening.test.ts` and runs fully offline.
- **Command**: `npm run test` or `npm run test:backend`.
- **Exclusion Note**: All chatbot and AI configurations (like Gemini adapters, prompts, policy files, and models) are excluded from these operational changes.
