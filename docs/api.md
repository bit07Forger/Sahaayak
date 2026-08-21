# REST API Interface Specification — Sahaayak

This document outlines the API endpoints, input structures, and return types for the Sahaayak backend using Firebase ID Token authorization.

---

## 1. Authentication & Session

Authentication (signup, login, logout) is managed directly on the frontend using the Firebase Web SDK. Authenticated API requests must send the ID Token inside request headers:
```http
Authorization: Bearer <FIREBASE_ID_TOKEN>
```

### GET `/api/auth/me`
- **Description**: Synchronizes session status, fetches user profile preferences and progress from Firestore. If the user document does not exist (first-time login), it creates it.
- **Headers**: `Authorization: Bearer <ID_TOKEN>`
- **Response (200 OK)**:
  ```json
  {
    "user": {
      "id": "firebase-uid-abc12345",
      "email": "user@example.com",
      "preferences": {
        "textSize": "normal",
        "contrast": "normal",
        "voiceSpeed": "normal",
        "voiceEnabled": false
      },
      "progress": {
        "currentStep": 0,
        "status": "NOT_STARTED",
        "updatedAt": "2026-08-21T18:00:00.000Z"
      }
    }
  }
  ```

### POST `/api/auth/preferences`
- **Description**: Updates user accessibility settings in Firestore.
- **Headers**: `Authorization: Bearer <ID_TOKEN>`
- **Request Body**:
  ```json
  {
    "textSize": "large",
    "contrast": "high",
    "voiceSpeed": "slow",
    "voiceEnabled": true
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "preferences": { ... }
  }
  ```

---

## 2. Service & Workflow Endpoints

### GET `/api/services`
- **Description**: Returns the active services.
- **Headers**: `Authorization: Bearer <ID_TOKEN>`
- **Response (200 OK)**:
  ```json
  [
    {
      "id": "accessible-parking-permit",
      "key": "accessible-parking-permit",
      "name": "Accessible Parking Permit",
      "description": "Parking permit for citizens with qualified mobility impairments."
    }
  ]
  ```

### GET `/api/workflows/current`
- **Description**: Fetches workflow questions and the user's progress.
- **Headers**: `Authorization: Bearer <ID_TOKEN>`
- **Response (200 OK)**:
  ```json
  {
    "service": {
      "id": "accessible-parking-permit",
      "key": "accessible-parking-permit",
      "name": "Accessible Parking Permit",
      "description": "A permit that allows individuals with certified mobility impairments..."
    },
    "currentStep": 0,
    "status": "IN_PROGRESS",
    "questions": [
      {
        "key": "name",
        "label": "What is your full legal name?",
        "type": "text",
        "description": "Speak or type your name exactly as it appears on your government identification card.",
        "order": 1
      }
    ],
    "answers": {
      "name": {
        "questionId": "name",
        "rawValue": "John Doe",
        "interpretedValue": "John Doe",
        "isConfirmed": true
      }
    }
  }
  ```

---

## 3. Answer Processing & AI

### POST `/api/answers/interpret`
- **Description**: Evaluates raw audio/speech text and returns structured properties using Gemini AI (or mock rule backup).
- **Headers**: `Authorization: Bearer <ID_TOKEN>`
- **Request Body**:
  ```json
  {
    "questionKey": "dob",
    "rawInput": "I was born on July eleventh nineteen eighty"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "interpretedValue": "1980-07-11"
  }
  ```

### POST `/api/answers/confirm`
- **Description**: Submits the final edited or confirmed answer, saves it to `/users/{uid}/answers/{key}` in Firestore, and updates progress step indexes.
- **Headers**: `Authorization: Bearer <ID_TOKEN>`
- **Request Body**:
  ```json
  {
    "questionKey": "dob",
    "rawValue": "I was born on July eleventh nineteen eighty",
    "interpretedValue": "1980-07-11"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "nextStep": 2,
    "workflowStatus": "IN_PROGRESS"
  }
  ```

---

## 4. Document Checklists & Readiness

### GET `/api/documents/checklist`
- **Description**: Fetches document checklist status from `/users/{uid}/documents` in Firestore.
- **Headers**: `Authorization: Bearer <ID_TOKEN>`
- **Response (200 OK)**:
  ```json
  [
    {
      "key": "identity_proof",
      "label": "Proof of Identity",
      "description": "Drivers license or Passport copy.",
      "type": "REQUIRED",
      "status": "MISSING"
    }
  ]
  ```

### POST `/api/documents/update`
- **Description**: Updates upload or verification status in Firestore.
- **Headers**: `Authorization: Bearer <ID_TOKEN>`
- **Request Body**:
  ```json
  {
    "documentKey": "identity_proof",
    "status": "COMPLETED"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Document status updated."
  }
  ```

### GET `/api/readiness`
- **Description**: Computes completeness percentages and checks missing parameters.
- **Headers**: `Authorization: Bearer <ID_TOKEN>`
- **Response (200 OK)**:
  ```json
  {
    "isReady": false,
    "completedQuestionsCount": 1,
    "totalQuestionsCount": 6,
    "missingQuestions": [
      { "key": "dob", "label": "What is your date of birth?" }
    ],
    "missingDocuments": [
      { "key": "medical_certificate", "label": "Medical Certification Form" }
    ],
    "summaryStatus": "More information required"
  }
  ```
