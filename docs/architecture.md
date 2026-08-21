# System Architecture — Sahaayak

This document outlines the software design and components of the Firebase-based **Sahaayak** MVP.

---

## 1. High-Level Flow Diagram

The application consists of a decoupled React frontend client, an Express API server, Cloud Firestore for application data storage, and Firebase Authentication for session management:

```text
                        ┌─────────────────────┐
                        │        USER         │
                        └──────────┬──────────┘
                                   │
                                   ▼
                        ┌─────────────────────┐
                        │ ACCESSIBLE FRONTEND │
                        │ React + TypeScript  │
                        └─────┬─────────┬─────┘
                              │         │
      (Firebase SDK Auth IDs) │         │ (REST APIs + ID Bearer Token)
                              ▼         ▼
                ┌────────────────┐   ┌─────────────────────┐
                │ FIREBASE AUTH  │   │    BACKEND / API    │
                │  (Identity &   │   │ Node + Express + TS │
                │   Sessions)    │   ├─────────────────────┤
                └────────────────┘   │ - Token verification│
                                     │ - Validation Engine │
                                     │ - AI Parser Service │
                                     └──────────┬──────────┘
                                                │
                                    ┌───────────▼───┐
                                    │   FIRESTORE   │
                                    │  (Data Store) │
                                    └───────────────┘
```

---

## 2. Core Components

### Frontend: Accessible Web Client
- **Tech**: React 18, Vite, TypeScript, Tailwind CSS, Firebase Web SDK (`firebase/auth`, `firebase/firestore`).
- **Authentication**: Connects directly to the Firebase Authentication client SDK for signup, login, and session persistence. Firebase ID tokens are fetched dynamically and attached to outgoing API requests.
- **Visual & Assistive Controls**:
  - Toggles Contrast Modes and Text Size presets on the HTML root element.
  - Native Web Speech API integration for local text-to-speech (TTS) read-aloud prompts and speech-to-text (STT) mic capture.

### Backend: REST API Server
- **Tech**: Express.js, TypeScript, `firebase-admin` SDK.
- **Token Verification Middleware**: Intercepts requests, extracts Firebase ID tokens, and validates them using the server-side `firebase-admin.auth().verifyIdToken(token)` method. Decoded UIDs serve as the source of truth for identity claims.
- **Workflow & Answer Services**: Persist step data, confirmed values, and checklists to user Firestore directories (`/users/{uid}/answers/*`).
- **Validation Engine**: Hardcoded backend regex checks run on inputs before saving to protect database sanity.

### Relational Firestore Structure
Data is modeled inside Firestore document paths:
1. `users/{uid}`: Storing UIDs, profile emails, accessibility preferences, and overall workflow step progress.
2. `users/{uid}/answers/{questionKey}`: Storing user-confirmed responses.
3. `users/{uid}/documents/{documentKey}`: Tracking document completeness checklist parameters.
