import { firestore } from './firebaseAdmin';
import { WorkflowProgressDoc } from '../types/firestore';

// Local templates for initialization & fallbacks
export interface Question {
  key: string;
  label: string;
  type: string;
  description: string;
  order: number;
}

export interface DocumentDef {
  key: string;
  label: string;
  description: string;
  type: string; // REQUIRED, OPTIONAL
}

export interface Service {
  key: string;
  name: string;
  description: string;
  questions: Question[];
  documents: DocumentDef[];
}

export const ACTIVE_SERVICE: Service = {
  key: 'accessible-parking-permit',
  name: 'Accessible Parking Permit',
  description: 'A permit that allows individuals with certified mobility impairments to park in designated accessible spaces close to building entrances.',
  questions: [
    {
      key: 'name',
      label: 'What is your full legal name?',
      type: 'text',
      description: 'Speak or type your name exactly as it appears on your government identification card.',
      order: 1,
    },
    {
      key: 'dob',
      label: 'What is your date of birth?',
      type: 'date',
      description: 'State or select your birthday. You must be at least 18 years old to apply.',
      order: 2,
    },
    {
      key: 'has_impairment',
      label: 'Do you have a qualified medical mobility limitation?',
      type: 'boolean',
      description: 'Say "Yes" or select Yes if a certified physician has diagnosed you with a mobility-limiting condition.',
      order: 3,
    },
    {
      key: 'doctor_name',
      label: "What is your certifying physician's name?",
      type: 'text',
      description: 'Enter the name of the licensed doctor who will sign your medical evaluation form.',
      order: 4,
    },
    {
      key: 'doctor_license',
      label: "What is your physician's medical license number?",
      type: 'text',
      description: "Enter your doctor's official registration or license number (typically 6-10 characters).",
      order: 5,
    },
    {
      key: 'vehicle_plate',
      label: "What is your vehicle plate number? (Answer 'None' if passenger)",
      type: 'text',
      description: 'Input your license plate number, or say "None" if you will be using this permit as a passenger in other vehicles.',
      order: 6,
    },
  ],
  documents: [
    {
      key: 'identity_proof',
      label: 'Proof of Identity',
      description: 'A scanned copy or clear photo of your Government Driver License, Passport, or State ID.',
      type: 'REQUIRED',
    },
    {
      key: 'medical_certificate',
      label: 'Medical Certification Form',
      description: 'The physical Accessible Parking application form filled and signed by your physician within the last 6 months.',
      type: 'REQUIRED',
    },
    {
      key: 'vehicle_registration',
      label: 'Vehicle Registration Copy',
      description: 'Current registration certificate for the primary vehicle associated with this permit. (Optional for passengers).',
      type: 'OPTIONAL',
    },
  ],
};

// Seeding Firestore on startup if empty
export async function initializeFirestoreData() {
  const seedFlag = process.env.SEED_DEMO_DATA;
  if (seedFlag !== 'true') {
    console.log('Auto demo seeding disabled by environment flag (SEED_DEMO_DATA is not "true").');
    return;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || 'unknown-project';
  const isProduction = projectId.includes('prod') || process.env.NODE_ENV === 'production';
  const hasOverride = process.env.FORCE_PRODUCTION_SEED === 'true';

  if (isProduction && !hasOverride) {
    console.warn(`Auto demo seeding skipped: Refusing to seed on production database project "${projectId}" without explicit FORCE_PRODUCTION_SEED="true" override.`);
    return;
  }

  try {
    const serviceRef = firestore.collection('services').doc(ACTIVE_SERVICE.key);
    const doc = await serviceRef.get();
    if (!doc.exists) {
      console.log(`[Auto Seed] Seeding service "${ACTIVE_SERVICE.key}" in Firestore project "${projectId}"...`);
      await serviceRef.set({
        name: ACTIVE_SERVICE.name,
        description: ACTIVE_SERVICE.description,
      });

      // Seeding questions
      const qBatch = firestore.batch();
      ACTIVE_SERVICE.questions.forEach((q) => {
        const qRef = serviceRef.collection('questions').doc(q.key);
        qBatch.set(qRef, q);
      });
      await qBatch.commit();

      // Seeding documents
      const dBatch = firestore.batch();
      ACTIVE_SERVICE.documents.forEach((d) => {
        const dRef = serviceRef.collection('documents').doc(d.key);
        dBatch.set(dRef, d);
      });
      await dBatch.commit();

      console.log(`[Auto Seed] Seeding completed successfully. Total items created: ${1 + ACTIVE_SERVICE.questions.length + ACTIVE_SERVICE.documents.length}`);
    } else {
      console.log(`[Auto Seed] Service "${ACTIVE_SERVICE.key}" already exists in Firestore. Seeding skipped (Idempotent check).`);
    }
  } catch (error: any) {
    console.error('Warning: Auto-seeding failed due to an initialization or network error:', error.message || error);
  }
}

// Interfaces for CRUD Operations
export interface FirestoreUser {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
  preferences?: {
    textSize: string;
    contrast: string;
    voiceSpeed: string;
    voiceEnabled: boolean;
  };
}

export const db = {
  // 1. Users
  findUserById: async (uid: string): Promise<FirestoreUser | undefined> => {
    const doc = await firestore.collection('users').doc(uid).get();
    if (!doc.exists) return undefined;
    const data = doc.data();
    return {
      id: uid,
      email: data?.email || '',
      createdAt: data?.createdAt || '',
      updatedAt: data?.updatedAt || '',
      preferences: data?.preferences,
    };
  },

  createUser: async (uid: string, email: string): Promise<FirestoreUser> => {
    const user: FirestoreUser = {
      id: uid,
      email,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      preferences: {
        textSize: 'normal',
        contrast: 'normal',
        voiceSpeed: 'normal',
        voiceEnabled: false,
      },
    };
    await firestore.collection('users').doc(uid).set(user);
    return user;
  },

  // 2. Preferences
  findPreferencesByUserId: async (uid: string) => {
    const user = await db.findUserById(uid);
    return user?.preferences || {
      textSize: 'normal',
      contrast: 'normal',
      voiceSpeed: 'normal',
      voiceEnabled: false,
    };
  },

  upsertPreferences: async (uid: string, data: any) => {
    const userRef = firestore.collection('users').doc(uid);
    const updateObj: Record<string, any> = {};
    if (data.textSize !== undefined) updateObj['preferences.textSize'] = data.textSize;
    if (data.contrast !== undefined) updateObj['preferences.contrast'] = data.contrast;
    if (data.voiceSpeed !== undefined) updateObj['preferences.voiceSpeed'] = data.voiceSpeed;
    if (data.voiceEnabled !== undefined) updateObj['preferences.voiceEnabled'] = data.voiceEnabled;
    updateObj.updatedAt = new Date().toISOString();

    await userRef.update(updateObj);
    const updatedUser = await db.findUserById(uid);
    return updatedUser?.preferences;
  },

  // 3. Workflow Progress Operations (New Document scoped: users/{uid}/workflowProgress/{serviceId})
  findProgressDoc: async (uid: string, serviceId: string): Promise<WorkflowProgressDoc | null> => {
    const docRef = firestore.collection('users').doc(uid).collection('workflowProgress').doc(serviceId);
    const snap = await docRef.get();
    if (!snap.exists) return null;
    return snap.data() as WorkflowProgressDoc;
  },

  getOrCreateProgressDoc: async (uid: string, serviceId: string): Promise<WorkflowProgressDoc> => {
    const docRef = firestore.collection('users').doc(uid).collection('workflowProgress').doc(serviceId);
    const snap = await docRef.get();
    if (snap.exists) {
      return snap.data() as WorkflowProgressDoc;
    }

    const initialProgress: WorkflowProgressDoc = {
      serviceId,
      currentStep: 0,
      status: 'NOT_STARTED',
      answers: {},
      documentStatuses: {},
      updatedAt: new Date().toISOString(),
    };
    await docRef.set(initialProgress);
    return initialProgress;
  },

  upsertAnswer: async (uid: string, serviceId: string, questionKey: string, rawValue: string, interpretedValue: string, isConfirmed: boolean) => {
    const docRef = firestore.collection('users').doc(uid).collection('workflowProgress').doc(serviceId);

    await firestore.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      let progress: WorkflowProgressDoc;

      if (!snap.exists) {
        progress = {
          serviceId,
          currentStep: 0,
          status: 'IN_PROGRESS',
          answers: {},
          documentStatuses: {},
          updatedAt: new Date().toISOString(),
        };
      } else {
        progress = snap.data() as WorkflowProgressDoc;
      }

      if (!progress.answers) {
        progress.answers = {};
      }

      progress.answers[questionKey] = {
        rawValue,
        interpretedValue,
        isConfirmed,
        updatedAt: new Date().toISOString(),
      };
      progress.updatedAt = new Date().toISOString();

      transaction.set(docRef, progress, { merge: true });
    });
  },

  upsertDocumentStatus: async (uid: string, serviceId: string, documentKey: string, status: 'MISSING' | 'COMPLETED') => {
    const docRef = firestore.collection('users').doc(uid).collection('workflowProgress').doc(serviceId);

    await firestore.runTransaction(async (transaction) => {
      const snap = await transaction.get(docRef);
      let progress: WorkflowProgressDoc;

      if (!snap.exists) {
        progress = {
          serviceId,
          currentStep: 0,
          status: 'IN_PROGRESS',
          answers: {},
          documentStatuses: {},
          updatedAt: new Date().toISOString(),
        };
      } else {
        progress = snap.data() as WorkflowProgressDoc;
      }

      if (!progress.documentStatuses) {
        progress.documentStatuses = {};
      }

      progress.documentStatuses[documentKey] = {
        status,
        updatedAt: new Date().toISOString(),
      };
      progress.updatedAt = new Date().toISOString();

      transaction.set(docRef, progress, { merge: true });
    });
  },

  updateProgressState: async (uid: string, serviceId: string, currentStep: number, status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED') => {
    const docRef = firestore.collection('users').doc(uid).collection('workflowProgress').doc(serviceId);
    await docRef.set({
      currentStep,
      status,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  },
};
