# Development & Execution Plan — Sahaayak

This document charts the progressive phases to build, integrate, and verify the Firebase-based Sahaayak MVP.

---

## Phases Outline

### Phase 1 — Project Foundation
- **Objective**: Establish folders, configure environment files, write documentation guidelines, and run backend package setup.
- **Completion Criteria**: Scaffolding complete, build script exits cleanly.

### Phase 2 — Firebase Project Setup
- **Objective**: Create the Firebase project, enable Cloud Firestore and Firebase Authentication, and download client configurations.
- **Completion Criteria**: Config variables defined inside local `.env` and `firestore.rules` created in root.

### Phase 3 — Firebase Authentication
- **Objective**: Implement client-side registration and login using the Firebase Web SDK. Validate and check token sessions.
- **Completion Criteria**: Token loaded inside localStorage on active session change.

### Phase 4 — Firestore Data Model
- **Objective**: Set up the database collections structure. Implement seed triggers that populate services, questions, and documents.
- **Completion Criteria**: Startup check seeds Firestore collections if missing.

### Phase 5 — Backend/API Integration
- **Objective**: Write Express token verification middleware using `admin.auth().verifyIdToken()`.
- **Completion Criteria**: Request authorization headers validated against Firebase Admin.

### Phase 6 — Core Sahaayak Workflow
- **Objective**: Setup question loading from Firestore and enable navigation between questions.
- **Completion Criteria**: Input screens display sequentially, storing intermediate values.

### Phase 7 — Deterministic Validation
- **Objective**: Implement hardcoded regex validation rules for the 6 workflow fields.
- **Completion Criteria**: Age requirements (DOB >= 18) and licensures validated on backend.

### Phase 8 — AI & Voice Core
- **Objective**: Connect Speech-to-Text and Text-to-Speech browser APIs, and set up backend Gemini parsing.
- **Completion Criteria**: Transcriptions parsed to structured data, prompting a validation confirmation dialog before save.

### Phase 9 — Documents & Readiness Checklist
- **Objective**: Program checklists and status updates for attachment requirements.
- **Completion Criteria**: Summary page resolves user answers and missing documents.

### Phase 10 — Custom Accessibility Modes
- **Objective**: Implement text size and contrast presets bound to user documents configurations.
- **Completion Criteria**: Settings panels toggle size and contrast parameters.

### Phase 11 — Integration & Testing
- **Objective**: Run validation checks against auth paths, Firestore writes, and speech fallback triggers.
- **Completion Criteria**: Clean build and error-free demo runs.

### Phase 12 — Deployment
- **Objective**: Deploy React client to Vercel and Express to Render.
- **Completion Criteria**: Live deployment running with verified HTTPS connections.
