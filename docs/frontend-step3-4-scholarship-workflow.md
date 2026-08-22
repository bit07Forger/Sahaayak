# Sahaayak MVP — Frontend Scholarship Workflow (Steps 3 & 4)

This document describes the in-memory, template-driven scholarship preparation workflow implemented in Steps 3 and 4 of the Sahaayak frontend.

---

## 1. Overview & Data Model

To provide a calm, structured preparation experience without requiring early backend persistence or risk of unvalidated claims, the frontend introduces a typed template model:

- **`ApplicationTemplate`**: Defines a complete preparation flow (ID, title, description, status notice, and sections array).
- **`ApplicationSection`**: Defines a logical group of questions (ID, title, description, and ordered questions array).
- **`ApplicationQuestion`**: Configures an individual field (ID, label, helper text, type, required status, autocomplete, and optional options).
- **`DraftAnswers`**: In-memory React state mapping question IDs to string values (`Record<string, string>`).

---

## 2. In-Memory Draft Scope

- **Session Isolation**: Draft responses are maintained exclusively in component state during the active session.
- **No Unsanctioned Persistence**: Draft answers are **not** written to `localStorage`, `sessionStorage`, cookies, query parameters, or backend database endpoints in this phase.
- **No False Claims**: User copy explicitly emphasizes that the flow generates a **preparation draft only**. It makes no claims regarding eligibility, funding availability, submission, or verification.

---

## 3. Configured Application Templates

1. **Scholarship Application Preparation (`scholarship-prep`)**:
   - **Your Profile**: Full legal name, email, educational institution, intended field of study.
   - **Your Academic Direction**: Current study level, academic strengths, educational and career goals.
   - **Your Application Statement**: Motivation statement and optional extracurricular/achievement list.
   - **Support Context**: Optional space for personal context. (Excludes sensitive financial, banking, or national identity numbers).

2. **Other Application Preparation (`other-prep`)**:
   - **General Contact & Purpose**: Basic contact info, program category selection, and general statement of need.

---

## 4. Wayfinding & Form Controls

- **Application Selection**: User chooses between the available preparation flows via clear action cards.
- **Navigation & Editing**: `Back` and `Continue` controls preserve all in-memory answers across step transitions.
- **Validation**: Required fields trigger accessible error messages, aria-live announcements, and focus management to the first invalid field.
- **Review & Start Over**: A grouped review screen allows direct editing of any section and provides an accessible confirmation step before clearing the draft.

---

## 5. Future Backend Integration Roadmap

When the backend scholarship database schema and API contracts are finalized:
- In-memory `DraftAnswers` state will synchronize with the server's `workflowProgress/{serviceId}` Firestore document via protected API endpoints (`/answers/confirm`, `/answers/validate`).
- Backend readiness summary rules will evaluate section completion and determine document requirements.
