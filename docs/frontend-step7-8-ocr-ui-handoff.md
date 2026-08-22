# Sahaayak MVP — Frontend OCR Assist & UI Refinement Handoff (Steps 7 & 8)

This document records the architectural design, privacy boundaries, OCR data lifecycle, UI visual refinements, and test results for Steps 7 and 8 of the Sahaayak Scholarship Preparation frontend.

---

## 1. Privacy-First Browser-Only OCR Scope

- **Supported Document Type**: User-created academic preparation summary or scholarship-preparation note only.
- **Dependency Used**: `tesseract.js` (Executes 100% locally in the browser via WebAssembly and Web Workers).
- **Explicitly Rejected Documents**:
  - Government ID Cards (Aadhaar, Passport, Driver License, Voter ID, PAN Card)
  - Financial Records (Bank Statements, Credit/Debit Cards, Tax Returns)
  - Medical Certificates or Records with National Identity Numbers
- **Data Lifecycle**:
  - Image binary and extracted strings are kept strictly in component state during the active session.
  - Image preview Object URLs are revoked immediately after completion or cancellation.
  - Workers are terminated after execution to free system memory.
  - Zero network uploads: Image files, extracted text, and candidates are **never** sent to backend servers, Firestore, analytics, AI APIs, or third-party storage.

---

## 2. Extractable Non-Sensitive Fields & Candidate Suggestions

When a user scans a valid preparation note, the system parses text lines for non-sensitive fields:
- `schoolOrCollege`
- `fieldOfStudy`
- `studyLevel`
- `academicStrengths`

### Review & Decision Rules:
- Candidates are displayed on a review screen with explicit buttons: `Use this suggestion`, `Edit before using`, `Skip`, and `Clear scan data`.
- Suggestions do **not** alter form fields automatically. Clicking `Use this suggestion` populates the form input in React memory, which the user can edit or adjust at any time.

---

## 3. Visual & UI Refinements (Step 8)

- **Quiet Wayfinding System**: Maintained warm parchment background surfaces, deep indigo typography, saffron active indicators, and sage reassurance panels.
- **Home-to-Form Journey**:
  - Prominent primary CTA: **Prepare a scholarship application**.
  - Visible secondary option: **Other application preparation**.
  - Accessible Read Aloud, High Contrast, and Text Scaling preference controls.
  - Dynamic route wayfinding rail updating from *Start* → *Your profile* → *Application details* → *Documents* → *Readiness summary*.
- **Ask Sahaayak Panel**: Non-blocking guidance panel connected to the protected `POST /api/chat` backend route. Plain-text rendering, boundary warnings, and source citations.

---

## 4. Verification & Build Results

1. **Backend Unit Tests**: `npm test` passed 35/35 unit tests (exit code `0`).
2. **Frontend Production Build**: `npm run build` compiled successfully in `frontend/dist/` (exit code `0`).
3. **Git Format Check**: `git diff --check` passed with zero trailing whitespace warnings (exit code `0`).

---

## 5. Deliberately Deferred Capabilities

- **Server-Side OCR / File Upload**: Excluded by design for student privacy.
- **Camera Capture & Multi-Page Scanning**: Deferred to future native/PWA releases.
- **Firestore Rules Emulator**: Deferred pending local Java SDK emulator setup.
