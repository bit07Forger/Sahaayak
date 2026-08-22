# Sahaayak MVP — Backend & Chat API Integration (Steps 5 & 6)

This document records the pre-change contracts, modified backend contracts, active service key configuration, and test coverage for the Sahaayak Scholarship Backend & Chat Integration.

---

## 1. Observed Pre-Change Contracts

- **Active Service Key**: `accessible-parking-permit` (Legacy disability permit seed dataset).
- **Mounted Server Endpoints** ([`backend/src/server.ts`](file:///c:/Users/ayush/Desktop/COLLEGE%20FOLDER/Hackathon/backend/src/server.ts)): `/health`, `/ready`, `/api/auth/me`, `/api/auth/session`, `/api/auth/preferences`, `/api/services`, `/api/workflows/current`, `/api/answers/interpret`, `/api/answers/confirm`, `/api/answers/validate`, `/api/documents/checklist`, `/api/documents/update`, `/api/readiness`.
- **Chat API Status**: `POST /api/chat` was **absent** from Express routes.

---

## 2. Updated Backend Contracts

- **Active Service Key**: `scholarship-preparation`
- **Service Name**: `Scholarship Preparation`
- **Service Description**: *"A structured preparation workspace to help students organize personal details, academic background, motivation statements, and required document checklists before applying for scholarship opportunities."*
- **New Server Route**: `POST /api/chat` (Protected by `authenticateToken` middleware).

### Request Payload (`POST /api/chat`):
```json
{
  "message": "How do I prepare my motivation statement?",
  "serviceId": "scholarship-preparation"
}
```

### Response Contract (`POST /api/chat`):
```json
{
  "status": "answered",
  "message": "Sahaayak Guidance: Explain why you are applying for scholarship support and how it helps your education in your own words.",
  "sources": [
    { "label": "Scholarship Preparation Overview", "url": undefined }
  ],
  "requestId": "req-123"
}
```

---

## 3. Workflow, Document & Readiness Contract Updates

1. **Answer Validation**: Deterministic validation for scholarship keys (`fullName`, `email`, `schoolOrCollege`, `fieldOfStudy`, `studyLevel`, `academicStrengths`, `futureGoals`, `motivationStatement`, `achievements`, `additionalContext`). Validates basic shape and requiredness without judging merit or eligibility.
2. **Document Checklist**: Generic preparation items:
   - `transcript`: *Academic record or transcript — confirm what your target opportunity requires* (REQUIRED)
   - `personal_statement`: *Personal statement draft* (REQUIRED)
   - `recommendation_contact`: *Recommendation/contact details — if required by the opportunity* (OPTIONAL)
3. **Readiness Summary**:
   - Complete: `summaryStatus`: `"Preparation draft complete"`
   - Incomplete: `summaryStatus`: `"Preparation draft in progress"`
   - *Never claims eligibility, approval, submission, or verification.*

---

## 4. Test Coverage Summary

- `backend/tests/dbService.test.ts`: Updated for `scholarship-preparation` schema and progress path checks.
- `backend/tests/chatController.test.ts`: Added tests for authentication enforcement, invalid payload rejection, refusal safety checks, rate limiting, and mock success formatting.
- `backend/tests/staticSchema.test.ts`: Updated to verify core dbService remains decoupled from AI/chat modules.

---

## 5. Explicitly Deferred Items

- **Firestore Rules Emulator**: Requires a local Java SDK environment; rules remain audited and restricted.
- **Privacy-First Document OCR**: Deferred to Step 7.
