# Firestore Security Rules Emulator Tests — Sahaayak

This document outlines the testing strategy, commands, path-level checks, and security rule assertions configured for the **Sahaayak** Firestore Security Rules.

---

## 1. Test Execution Command

To execute the local Firestore Security Rules unit test suite:
```bash
npm run test:rules
```
- **Execution Workflow**: This launches a local Firestore Emulator instance under the test project ID `sahaayak-rules-test`, runs the Vitest rules test suite, and tears down the emulator when finished.
- **Offline Assurance**: Runs entirely locally. No remote Firebase project configurations, real environment variables, tokens, or credentials are required.

---

## 2. JDK 21+ Emulator Execution Requirement

> [!WARNING]
> **Java JDK 21+ Required**: The latest Firebase emulator CLI requires JDK 21 or higher to be installed on the host operating system. If you run the command and encounter `Error: firebase-tools no longer supports Java version before 21`, please upgrade your local JDK instance.

---

## 3. Tested Collection Policies

The unit test suite validates access rules defined in the root [`firestore.rules`](file:///c:/Users/ayush/Desktop/COLLEGE%20FOLDER/Hackathon/firestore.rules):

### A. Default-Deny Catch-All
- Unauthenticated reads/writes to any collection are denied.
- Authenticated requests to unknown collections are blocked.

### B. User Profiles (`users/{uid}`)
- Authenticated users can create, read, and update only their own profile document.
- Users are blocked from writing or reading other users' profile files.
- Strictly validates profile field keys (`uid`, `email`, `preferences`, `createdAt`, `updatedAt`).
- Blocked from deleting profile documents.

### C. Workflow Progress (`users/{uid}/workflowProgress/{serviceId}`)
- Owner-only access: Allowed only if the authenticated client’s `uid` matches the document path segment.
- Cross-user access is denied for reads, creations, updates, and deletes.
- Strictly validates fields: `serviceId`, `currentStep`, `status`, `answers`, `documentStatuses`, `updatedAt`.
- Deletions are denied (`allow delete: if false;`).

### D. Legacy Path Denials
- Client reads or writes targeting `/users/{uid}/answers/{anyId}` or `/users/{uid}/documents/{anyId}` are denied for all users.

### E. Service Content Policy (`services/{serviceId}`)
- Read-only by authenticated users.
- Public/unauthenticated reads are denied.
- Client writes (create, update, delete) to service metadata or question/document subcollections are denied.

---

## 4. Excluded Chatbot Paths

Chatbot path rules (such as `services/{serviceId}/chatConfig` and `services/{serviceId}/chatKnowledge`) are handled on their respective branches and are not tested in this baseline security run.
