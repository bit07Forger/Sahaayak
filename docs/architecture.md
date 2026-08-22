# System Architecture — Sahaayak

This document outlines the software design and components of the Firebase-based **Sahaayak** MVP.

---

## 1. High-Level Flow Diagram

The application consists of a React frontend client, an Express API server, Cloud Firestore for application data storage, and Firebase Authentication for session management:

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
      (Firebase SDK Auth IDs) │         │ (REST APIs)
                              ▼         ▼
                ┌────────────────┐   ┌─────────────────────┐
                │ FIREBASE AUTH  │   │    BACKEND / API    │
                │  (Identity &   │   │ Node + Express + TS │
                │   Sessions)    │   └──────────┬──────────┘
                └────────────────┘              │
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
- **Authentication**: Connects directly to the Firebase Authentication client SDK for signup, login, and session persistence.
- **Visual & Assistive Controls**:
  - Toggles Contrast Modes and Text Size presets on the HTML root element.
  - Native Web Speech API integration for local text-to-speech (TTS) read-aloud prompts and speech-to-text (STT) mic capture.

### Backend: REST API Server
- **Tech**: Express.js, TypeScript.
- **Role**: Coordinates business logic and interacts with backend data stores as the application flow progresses.

### Database & Security Configuration
- **Database**: Cloud Firestore.
- **Security Rules**: Access boundaries are enforced via `firestore.rules` deployed directly to the Firebase console.
