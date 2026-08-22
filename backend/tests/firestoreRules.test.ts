import { initializeTestEnvironment, RulesTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

let testEnv: RulesTestEnvironment;

describe('Firestore Security Rules Emulator Verification Suite', () => {
  beforeAll(async () => {
    const rulesPath = path.resolve(process.cwd(), '../firestore.rules');
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');

    testEnv = await initializeTestEnvironment({
      projectId: 'sahaayak-rules-test',
      firestore: {
        rules: rulesContent,
        host: '127.0.0.1',
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();
  });

  // A. Default-deny and unauthenticated access
  describe('A. Default-Deny and Unauthenticated Access', () => {
    it('Unauthenticated read of private users/{uid} data - Denied', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      const docRef = doc(db, 'users', 'user-a');
      await assertFails(getDoc(docRef));
    });

    it('Unauthenticated write of private users/{uid} data - Denied', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      const docRef = doc(db, 'users', 'user-a');
      await assertFails(setDoc(docRef, { email: 'unauth@test.com' }));
    });

    it('Unauthenticated read/write of users/{uid}/workflowProgress/{serviceId} - Denied', async () => {
      const db = testEnv.unauthenticatedContext().firestore();
      const docRef = doc(db, 'users', 'user-a', 'workflowProgress', 'accessible-parking-permit');
      await assertFails(getDoc(docRef));
      await assertFails(setDoc(docRef, { currentStep: 1 }));
    });

    it('Unknown top-level collection/path - Denied', async () => {
      const db = testEnv.authenticatedContext('user-a').firestore();
      const docRef = doc(db, 'random-collection', 'random-doc');
      await assertFails(getDoc(docRef));
      await assertFails(setDoc(docRef, { value: 'hack' }));
    });
  });

  // B. Owner-only workflow progress
  describe('B. Owner-Only Workflow Progress', () => {
    const validProgress = {
      serviceId: 'accessible-parking-permit',
      currentStep: 0,
      status: 'NOT_STARTED',
      answers: {},
      documentStatuses: {},
      updatedAt: '2026-08-22T00:00:00Z',
    };

    it('User A reads User A’s progress document - Allowed', async () => {
      // Seed progress document using privileged Admin context (rules bypass)
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        const adminDocRef = doc(adminDb, 'users', 'user-a', 'workflowProgress', 'accessible-parking-permit');
        await setDoc(adminDocRef, validProgress);
      });

      const db = testEnv.authenticatedContext('user-a').firestore();
      const docRef = doc(db, 'users', 'user-a', 'workflowProgress', 'accessible-parking-permit');
      await assertSucceeds(getDoc(docRef));
    });

    it('User A creates valid progress for User A - Allowed', async () => {
      const db = testEnv.authenticatedContext('user-a').firestore();
      const docRef = doc(db, 'users', 'user-a', 'workflowProgress', 'accessible-parking-permit');
      await assertSucceeds(setDoc(docRef, validProgress));
    });

    it('User A updates permitted progress fields for User A - Allowed', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        const adminDocRef = doc(adminDb, 'users', 'user-a', 'workflowProgress', 'accessible-parking-permit');
        await setDoc(adminDocRef, validProgress);
      });

      const db = testEnv.authenticatedContext('user-a').firestore();
      const docRef = doc(db, 'users', 'user-a', 'workflowProgress', 'accessible-parking-permit');
      await assertSucceeds(updateDoc(docRef, {
        currentStep: 1,
        status: 'IN_PROGRESS',
        updatedAt: '2026-08-22T10:00:00Z',
      }));
    });

    it('User A reads, creates, updates, or deletes User B’s progress - Denied', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        const adminDocRef = doc(adminDb, 'users', 'user-b', 'workflowProgress', 'accessible-parking-permit');
        await setDoc(adminDocRef, validProgress);
      });

      const db = testEnv.authenticatedContext('user-a').firestore();
      const docRef = doc(db, 'users', 'user-b', 'workflowProgress', 'accessible-parking-permit');
      
      await assertFails(getDoc(docRef));
      await assertFails(setDoc(docRef, validProgress));
      await assertFails(updateDoc(docRef, { currentStep: 1 }));
      await assertFails(deleteDoc(docRef));
    });

    it('User A creates progress with serviceId mismatch in path - Denied', async () => {
      const db = testEnv.authenticatedContext('user-a').firestore();
      // Document ID is 'parking-permit' but stored serviceId field is 'accessible-parking-permit'
      const docRef = doc(db, 'users', 'user-a', 'workflowProgress', 'parking-permit');
      await assertFails(setDoc(docRef, validProgress));
    });

    it('User A adds an unapproved field - Denied', async () => {
      const db = testEnv.authenticatedContext('user-a').firestore();
      const docRef = doc(db, 'users', 'user-a', 'workflowProgress', 'accessible-parking-permit');
      await assertFails(setDoc(docRef, {
        ...validProgress,
        unapprovedField: 'hackValue',
      }));
    });

    it('User A uses an invalid status - Denied', async () => {
      const db = testEnv.authenticatedContext('user-a').firestore();
      const docRef = doc(db, 'users', 'user-a', 'workflowProgress', 'accessible-parking-permit');
      await assertFails(setDoc(docRef, {
        ...validProgress,
        status: 'INVALID_STATUS',
      }));
    });

    it('User A deletes progress - Denied by rule restriction', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        const adminDocRef = doc(adminDb, 'users', 'user-a', 'workflowProgress', 'accessible-parking-permit');
        await setDoc(adminDocRef, validProgress);
      });

      const db = testEnv.authenticatedContext('user-a').firestore();
      const docRef = doc(db, 'users', 'user-a', 'workflowProgress', 'accessible-parking-permit');
      await assertFails(deleteDoc(docRef));
    });
  });

  // C. Legacy path denial
  describe('C. Legacy Path Denial', () => {
    it('User A cannot write or read users/{uid}/answers/{anyId} - Denied', async () => {
      const db = testEnv.authenticatedContext('user-a').firestore();
      const docRef = doc(db, 'users', 'user-a', 'answers', 'name');
      await assertFails(getDoc(docRef));
      await assertFails(setDoc(docRef, { rawValue: 'legacy-answer' }));
    });

    it('User A cannot write or read users/{uid}/documents/{anyId} - Denied', async () => {
      const db = testEnv.authenticatedContext('user-a').firestore();
      const docRef = doc(db, 'users', 'user-a', 'documents', 'identity_proof');
      await assertFails(getDoc(docRef));
      await assertFails(setDoc(docRef, { status: 'COMPLETED' }));
    });
  });

  // D. Service content policy
  describe('D. Service Content Policy', () => {
    it('Client read of active service content - Allowed to Authenticated users, Denied to Unauthenticated', async () => {
      const authDb = testEnv.authenticatedContext('user-a').firestore();
      const unauthDb = testEnv.unauthenticatedContext().firestore();

      const authDocRef = doc(authDb, 'services', 'accessible-parking-permit');
      const unauthDocRef = doc(unauthDb, 'services', 'accessible-parking-permit');

      await assertSucceeds(getDoc(authDocRef));
      await assertFails(getDoc(unauthDocRef));
    });

    it('Client write/delete of service metadata - Denied', async () => {
      const db = testEnv.authenticatedContext('user-a').firestore();
      const docRef = doc(db, 'services', 'accessible-parking-permit');
      await assertFails(setDoc(docRef, { name: 'Malicious Service' }));
      await assertFails(deleteDoc(docRef));
    });

    it('Client write/delete of question/document content - Denied', async () => {
      const db = testEnv.authenticatedContext('user-a').firestore();
      const qRef = doc(db, 'services', 'accessible-parking-permit', 'questions', 'name');
      const dRef = doc(db, 'services', 'accessible-parking-permit', 'documents', 'identity_proof');

      await assertFails(setDoc(qRef, { label: 'Hacked Label' }));
      await assertFails(setDoc(dRef, { label: 'Hacked Checklist' }));
      await assertFails(deleteDoc(qRef));
      await assertFails(deleteDoc(dRef));
    });
  });

  // E. User profile policy
  describe('E. User Profile Policy', () => {
    const validProfile = {
      uid: 'user-a',
      email: 'user-a@sahaayak.org',
      preferences: {
        textSize: 'normal',
        contrast: 'normal',
        voiceSpeed: 'normal',
        voiceEnabled: false,
      },
      createdAt: '2026-08-22T00:00:00Z',
      updatedAt: '2026-08-22T00:00:00Z',
    };

    it('User A reads, creates, and updates User A’s profile - Allowed', async () => {
      const db = testEnv.authenticatedContext('user-a').firestore();
      const docRef = doc(db, 'users', 'user-a');

      await assertSucceeds(setDoc(docRef, validProfile));
      await assertSucceeds(getDoc(docRef));
      await assertSucceeds(updateDoc(docRef, {
        'preferences.textSize': 'large',
        updatedAt: '2026-08-22T12:00:00Z',
      }));
    });

    it('User A reads, creates, or updates User B’s profile - Denied', async () => {
      const db = testEnv.authenticatedContext('user-a').firestore();
      const docRef = doc(db, 'users', 'user-b');

      await assertFails(getDoc(docRef));
      await assertFails(setDoc(docRef, {
        ...validProfile,
        uid: 'user-b',
        email: 'user-b@sahaayak.org',
      }));
    });

    it('Rejection of unapproved profile fields and UID mismatches - Denied', async () => {
      const db = testEnv.authenticatedContext('user-a').firestore();
      const docRef = doc(db, 'users', 'user-a');

      // UID mismatch check
      await assertFails(setDoc(docRef, {
        ...validProfile,
        uid: 'spoofed-uid',
      }));

      // Unapproved field check
      await assertFails(setDoc(docRef, {
        ...validProfile,
        unapprovedField: 'hack',
      }));
    });

    it('User A deletes profile - Denied', async () => {
      const db = testEnv.authenticatedContext('user-a').firestore();
      const docRef = doc(db, 'users', 'user-a');
      await assertFails(deleteDoc(docRef));
    });
  });
});
