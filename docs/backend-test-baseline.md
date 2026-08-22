# Backend Testing Baseline & Phase 4 Verification — Sahaayak

This document outlines the testing strategy, commands, mocked dependencies, and verified schemas for the **Sahaayak** backend API.

---

## 1. Test Execution Command

To run the backend test suite:
```bash
npm run test
# or
npm run test:backend
```

---

## 2. Mocking Strategy (Offline Execution)

The backend test suite is designed to run completely **offline and sandbox-compliant**. It uses Vitest mocks to isolate modules from external services:
- **Firebase Admin Auth**: The `adminAuth` verify methods are mocked to simulate valid, invalid, expired, and unexpected network states without making calls to remote servers.
- **Cloud Firestore Client**: The `firestore` database instance is mocked using Vitest mock objects. No local emulators or cloud writes are triggered during test execution.

---

## 3. Coverage Areas

The test suite covers:
1. **Authentication Middleware (`requireFirebaseAuth`)**:
   - Handles missing `Authorization` headers.
   - Rejects malformed credentials or missing Bearer schemas.
   - Blocks invalid or expired mock tokens.
   - Injects verified `req.user` claims on successful tokens.
   - Normalizes unexpected Admin failures to safe 500 error boundaries.
   - Prevents client-supplied spoofed UIDs.
2. **Firestore Schema Persistence (`dbService`)**:
   - Asserts path construction targets the correct subcollection.
   - Validates correct default setups on first-time initialization.
   - Asserts that answers are merged without erasing document statuses.
   - Asserts that document statuses are merged without erasing answers.
3. **Static Schema Consistency & Path Exclusions**:
   - Asserts that active database and controller flows use `/workflowProgress/{serviceId}`.
   - Validates that legacy paths (such as `/answers` and `/documents` under `/users/{uid}`) are absent.
   - Asserts the absence of dependencies on the AI/Chatbot layer.

---

## 4. Verified Schema Path (Phase 4 Alignment)

- **Target Path**: `users/{uid}/workflowProgress/{serviceId}`
- **Field Mappings**: `serviceId`, `currentStep`, `status`, `answers`, `documentStatuses`

---

## 5. Exclusions & Out-of-Scope

- **Chatbot & AI Layer**: The `aiProvider.ts`, `chatbotSafety.ts`, and chatbot policies are completely outside this test scope. No AI packages are initialized, tested, or required to run this suite.
- **Manual Firestore Rules Check**: While path structures are verified programmatically, rules verification must still be verified using staging/production rules audits (`firestore.rules`) since the test runner operates entirely offline.
