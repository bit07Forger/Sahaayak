# Database Design — Sahaayak

This document outlines the database technology choices and collection layout in **Cloud Firestore** for the Sahaayak application.

---

## 1. Cloud Firestore

Sahaayak uses **Google Cloud Firestore** as its document-oriented database. Firestore is chosen for:
- Low-latency synchronization with frontend components.
- Seamless compatibility with Firebase Authentication sessions.
- Clean JSON-like document model configurations.

---

## 2. Collection Layouts & Path Structures

Firestore data is structured across five major collections:

```text
/services/{serviceId}
  ├── name (String)
  ├── description (String)
  ├── /questions/{questionId} (label, type, description, order)
  └── /documents/{documentId} (label, description, type)

/users/{uid}
  ├── email (String)
  ├── preferences (Map: textSize, contrast, voiceSpeed, voiceEnabled)
  └── /workflowProgress/{serviceId} (currentStep, status, answers, documentStatuses)
```

### 1. services
Tracks metadata for public navigators.
- **Path**: `services/{serviceId}` (e.g. `services/accessible-parking-permit`)
- **Fields**:
  - `name`: "Accessible Parking Permit"
  - `description`: Service overview description.
  - `createdAt`: ISO 8601 string.
  - `updatedAt`: ISO 8601 string.

### 2. questions (subcollection under services)
Stores workflow inputs sequentially.
- **Path**: `services/{serviceId}/questions/{questionId}` (e.g. `services/accessible-parking-permit/questions/dob`)
- **Fields**:
  - `label`: Question string (e.g., "What is your date of birth?")
  - `type`: text, date, boolean, or number.
  - `description`: Explanatory help string.
  - `order`: Incremental order sequence (integer).

### 3. documents (subcollection under services)
Stores checklist attachments metadata.
- **Path**: `services/{serviceId}/documents/{documentId}` (e.g. `services/accessible-parking-permit/documents/identity_proof`)
- **Fields**:
  - `label`: Document category name (e.g. "Proof of Identity").
  - `description`: Description of acceptable files.
  - `type`: REQUIRED or OPTIONAL.

### 4. users
Stores user details and accessibility preferences.
- **Path**: `users/{uid}`
- **Fields**:
  - `uid`: Matches Firebase Auth UID.
  - `email`: User account email.
  - `preferences`:
    - `textSize`: normal, large, or xlarge.
    - `contrast`: normal or high.
    - `voiceSpeed`: slow, normal, or fast.
    - `voiceEnabled`: boolean.
  - `createdAt`: ISO 8601 string.
  - `updatedAt`: ISO 8601 string.

### 5. workflowProgress (subcollection under users)
Tracks workflow progression status and user answers.
- **Path**: `users/{uid}/workflowProgress/{serviceId}` (e.g. `users/some-uid/workflowProgress/accessible-parking-permit`)
- **Fields**:
  - `currentStep`: Integer index.
  - `status`: NOT_STARTED, IN_PROGRESS, or COMPLETED.
  - `answers`: Map of user answers keyed by `questionId`:
    - `rawValue`: Raw spoken/written string.
    - `interpretedValue`: Structured parsed value.
    - `isConfirmed`: Locked validation state.
    - `updatedAt`: ISO 8601 string.
  - `documentStatuses`: Map of user checklist statuses keyed by `documentId`:
    - `status`: MISSING or COMPLETED.
    - `updatedAt`: ISO 8601 string.
  - `updatedAt`: ISO 8601 string.

---

## 3. Database Rules (`firestore.rules`)

Access security is managed directly on the database level using `firestore.rules`.
- A base ruleset has been created at the root of the project to restrict public reading and writing to authenticated users, protecting user namespaces.
- Rules are deployed to Firebase using the Firebase CLI commands.

---

## 4. Database Migration Notes

Sahaayak was migrated from PostgreSQL and Prisma. Prisma migration scripts, clients, schemas, and `DATABASE_URL` environment variables are deprecated and completely removed. Cloud Firestore is now the database.

---

## 5. Administrative Seeder Tool

An administrative Node-based seeder script is provided at `backend/scripts/seed.mjs` to populate workflow metadata safely.

### 1. Controlled Execution Boundaries
- The seeder is strictly a **privileged administrative tool** meant for development and CI scripts. It **never** runs inside the web browser or as a public API route.
- It is non-destructive by default: it skips existing records and only writes missing records. To update existing records, an explicit `--force` flag must be supplied. It will **never** delete user progress files.

### 2. Acquiring Firebase Admin Credentials
To seed a project locally or in CI:
1. Log in to the Google Firebase Console.
2. Go to **Project Settings** > **Service accounts**.
3. Click **Generate new private key** and download the service account JSON file.
4. Set the path to the JSON file inside your local system environment variables as `GOOGLE_APPLICATION_CREDENTIALS`, or populate the `.env` variables `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` locally.
5. **CRITICAL SECURITY RULE**: Never check in your service account JSON file or key variables to source control. They are protected under the `.gitignore` exclusions list.

### 3. Command Usage
Run commands from the `backend/` folder:
- **Dry-run Mode** (Reports planned inserts without modifying Firestore):
  ```bash
  npm run seed:services:dry-run
  ```
- **Apply Mode** (Applies writes to Firestore):
  ```bash
  npm run seed:services:apply
  ```
- **Force Apply Mode** (Overwrites existing seed definitions):
  ```bash
  npm run seed:services:apply -- --force
  ```

