# Development & Execution Plan — Sahaayak with AI Chatbot

This document charts the progressive phases to build, integrate, and verify the Firebase-based Sahaayak MVP with an accessibility-first AI chatbot support service.

---

## Phases Outline

### Phase 1 — Project Foundation

- **Objective:** Establish folders, configure frontend and backend environment files, write documentation guidelines, and install required client/server packages.
- **Completion Criteria:** Scaffolding is complete, environment boundaries are documented, and the build script exits cleanly.

---

### Phase 2 — Firebase Project Setup

- **Objective:** Create the Firebase project, enable Cloud Firestore and Firebase Authentication, and configure local client settings and Firestore rules.
- **Completion Criteria:** Firebase configuration variables are defined locally, `firestore.rules` exists in the root, and a non-production Firebase project is available for testing.

---

### Phase 3 — Firebase Authentication

- **Objective:** Implement client-side registration, login, active-session monitoring, logout, and protected-route behavior using the Firebase Web SDK.
- **Completion Criteria:** A user can register, sign in, refresh without losing the Firebase-managed session, access a protected route, retrieve a current ID token on demand, and sign out safely.

---

### Phase 4 — Firestore Data Model

- **Objective:** Define collections for services, questions, documents, user workflow progress, chatbot configuration, and approved chatbot knowledge. Add safe seed tooling and restrictive Firestore rules.
- **Completion Criteria:** The data model is documented, seed data can be checked and applied idempotently in a controlled environment, and unauthorized Firestore access is denied.

---

### Phase 5 — Backend/API Integration

- **Objective:** Set up Firebase Admin in Express, verify Firebase ID tokens through middleware, establish protected API contracts, and test authenticated requests.
- **Completion Criteria:** Express validates Bearer tokens through Firebase Admin, trusted user IDs are available to protected routes, and invalid or missing tokens are rejected safely.

---

### Phase 6 — Core Sahaayak Workflow

- **Objective:** Load approved service questions through the authenticated API, display one question at a time, and enable accessible Back/Next navigation with controlled intermediate values.
- **Completion Criteria:** Input screens display sequentially with loading and error states, and the core typed workflow works without depending on voice or AI.

---

### Phase 7 — Deterministic Validation

- **Objective:** Implement fixed validation rules for the agreed workflow fields in the client and protected backend logic.
- **Completion Criteria:** Required fields, formats, ranges, and readiness inputs are validated consistently; AI does not determine eligibility or validation outcomes.

---

### Phase 8 — AI Chatbot Knowledge and Safety Layer

- **Objective:** Seed approved chatbot knowledge, define the chatbot policy and refusals, configure the server-only AI provider adapter, and add limits for messages, context, and requests.
- **Completion Criteria:** The chatbot can use only approved service knowledge, no AI key is exposed in the frontend, unsafe/out-of-scope questions receive a safe fallback, and the chatbot cannot write workflow data or perform external actions.

---

### Phase 9 — AI Chatbot Service and Interface

- **Objective:** Create the protected chatbot API endpoint and an accessible frontend chat interface for explaining workflow questions, documents, and approved service information.
- **Completion Criteria:** An authenticated user can ask an in-scope question and receive a plain-language response with approved source references or a safe fallback; the chat interface is keyboard accessible and does not block the core workflow.

---

### Phase 10 — Voice Assistance Core

- **Objective:** Connect browser Speech-to-Text and Text-to-Speech APIs, and optionally use the existing server-side AI service to structure voice input for the workflow.
- **Completion Criteria:** Speech failures fall back to typing, transcribed or AI-suggested values are shown for user confirmation, and deterministic validation runs before values are used.

---

### Phase 11 — Documents and Readiness Checklist

- **Objective:** Program attachment checklists, document-status updates, and a final readiness summary.
- **Completion Criteria:** The summary clearly shows user-provided answers, available documents, missing requirements, and next official steps without claiming approval, submission, or verification.

---

### Phase 12 — Custom Accessibility Modes

- **Objective:** Implement text-size and contrast presets, clear focus/error states, reduced-motion support, and accessible behavior across workflow, voice, and chatbot screens.
- **Completion Criteria:** Accessibility settings apply throughout the application, and users can complete the core journey using keyboard and typed input alone.

---

### Phase 13 — Integration, Security, and Safety Testing

- **Objective:** Test authentication paths, Firestore rules, API authorization, workflow validation, chatbot source boundaries, prompt-injection handling, voice fallback, and accessibility journeys.
- **Completion Criteria:** The build and tests pass, tokens and secrets are absent from logs, and chatbot success, refusal, unavailable-provider, malformed-output, and adversarial-input cases behave safely.

---

### Phase 14 — Deployment

- **Objective:** Deploy the React client and Express API, configure Firebase and AI-provider secrets on the server, verify HTTPS and allowed origins, and run a final smoke test.
- **Completion Criteria:** The deployed MVP is live with verified HTTPS, server-only secrets, correct Firebase configuration, and working public and authenticated user journeys.