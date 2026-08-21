# Database Design — Sahaayak

This document outlines the database technology choices and setup requirements for **Sahaayak**.

---

## 1. Cloud Firestore

Sahaayak uses **Google Cloud Firestore** as its document-oriented database. Firestore is chosen for:
- Low-latency synchronization with frontend components.
- Seamless compatibility with Firebase Authentication sessions.
- Clean JSON-like document model configurations.

---

## 2. Setup Requirements

To configure the Firestore instance:
1. Navigate to the Google Firebase Console.
2. Select your project and click **Create Database** under the Cloud Firestore tab.
3. Configure the database in production or test mode.
4. Establish local configuration variables in `.env` mapping to the Firestore API credentials.

---

## 3. Database Rules (`firestore.rules`)

Access security is managed directly on the database level using `firestore.rules`.
- A base ruleset has been created at the root of the project to restrict public reading and writing to authenticated users, protecting user namespaces.
- Rules are deployed to Firebase using the Firebase CLI commands.

---

## 4. Database Migration Notes

Sahaayak was migrated from PostgreSQL and Prisma. Prisma migration scripts, clients, schemas, and `DATABASE_URL` environment variables are deprecated and completely removed. Cloud Firestore is now the database.
