# Database Design — Sahaayak

This document outlines the document and collection layout in **Cloud Firestore** for the Sahaayak application.

---

## 1. Firestore Collection Map

Sahaayak models user parameters, workflows, and answer profiles using nested documents and subcollections in Cloud Firestore:

```text
/services/
  └── {serviceId} (e.g. accessible-parking-permit)
        ├── name (String)
        ├── description (String)
        ├── /questions/
        │     └── {questionKey} (order, label, type, description)
        └── /documents/
              └── {documentKey} (label, description, type)

/users/
  └── {uid} (email, createdAt, preferences, progress)
        ├── /answers/
        │     └── {questionKey} (rawValue, interpretedValue, isConfirmed, updatedAt)
        └── /documents/
              └── {documentKey} (status, updatedAt)
```

---

## 2. Collection Layouts

### 1. services
Tracks metadata for workflows.
- `/services/accessible-parking-permit`
  - `name`: "Accessible Parking Permit"
  - `description`: Overview description text.

### 2. questions (subcollection under services)
Stores workflow sequential inputs.
- `/services/{serviceId}/questions/{questionKey}` (e.g., `/questions/dob`)
  - `key` (String): Unique key.
  - `label` (String): E.g., "What is your date of birth?"
  - `type` (String): text, date, boolean, number.
  - `description` (String): Explanatory help string.
  - `order` (Integer): Incremental order sequence.

### 3. documents (subcollection under services)
Stores checklist attachments metadata.
- `/services/{serviceId}/documents/{documentKey}` (e.g., `/documents/identity_proof`)
  - `key` (String)
  - `label` (String)
  - `description` (String)
  - `type` (String): REQUIRED, OPTIONAL

### 4. users
Stores user details, preferences, and step status.
- `/users/{uid}`
  - `id`: Firebase Auth User UID.
  - `email`: Profile email.
  - `createdAt`: ISO Timestamp.
  - `preferences`:
    - `textSize`: normal, large, xlarge.
    - `contrast`: normal, high.
    - `voiceSpeed`: slow, normal, fast.
    - `voiceEnabled`: boolean.
  - `progress`:
    - `currentStep`: Integer index.
    - `status`: NOT_STARTED, IN_PROGRESS, COMPLETED.
    - `updatedAt`: ISO Timestamp.

### 5. answers (subcollection under users)
Stores confirmed answers.
- `/users/{uid}/answers/{questionKey}`
  - `rawValue` (String): Raw transcription or typed text.
  - `interpretedValue` (String): Structured processed parameter.
  - `isConfirmed` (Boolean): Locked true.
  - `updatedAt`: ISO Timestamp.

### 6. documents (subcollection under users)
Tracks file status details.
- `/users/{uid}/documents/{documentKey}`
  - `status` (String): MISSING, COMPLETED.
  - `updatedAt`: ISO Timestamp.

---

## 3. Database Migration Notes

Sahaayak was migrated from PostgreSQL and Prisma. Prisma migration scripts, clients, schemas, and `DATABASE_URL` environment variables are deprecated and completely removed.
Cloud Firestore is now the single database.
