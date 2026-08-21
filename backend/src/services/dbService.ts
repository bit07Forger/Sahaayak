import { firestore } from './firebaseAdmin';

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
  preferences?: {
    textSize: string;
    contrast: string;
    voiceSpeed: string;
    voiceEnabled: boolean;
  };
  progress?: {
    currentStep: number;
    status: string;
    updatedAt: string;
  };
}

export interface FirestoreAnswer {
  questionKey: string;
  rawValue: string;
  interpretedValue: string;
  isConfirmed: boolean;
  updatedAt: string;
}

export interface FirestoreDocumentStatus {
  documentKey: string;
  status: string; // MISSING, COMPLETED
  updatedAt: string;
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
      preferences: data?.preferences,
      progress: data?.progress,
    };
  },

  createUser: async (uid: string, email: string): Promise<FirestoreUser> => {
    const user: FirestoreUser = {
      id: uid,
      email,
      createdAt: new Date().toISOString(),
      preferences: {
        textSize: 'normal',
        contrast: 'normal',
        voiceSpeed: 'normal',
        voiceEnabled: false,
      },
      progress: {
        currentStep: 0,
        status: 'NOT_STARTED',
        updatedAt: new Date().toISOString(),
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

    await userRef.update(updateObj);
    const updatedUser = await db.findUserById(uid);
    return updatedUser?.preferences;
  },

  // 3. Progress
  findProgressByUserId: async (uid: string) => {
    const user = await db.findUserById(uid);
    return user?.progress || {
      currentStep: 0,
      status: 'NOT_STARTED',
      updatedAt: new Date().toISOString(),
    };
  },

  updateProgress: async (uid: string, currentStep: number, status: string) => {
    const userRef = firestore.collection('users').doc(uid);
    await userRef.update({
      'progress.currentStep': currentStep,
      'progress.status': status,
      'progress.updatedAt': new Date().toISOString(),
    });
  },

  // 4. Answers (Subcollection)
  findAnswersByUserId: async (uid: string): Promise<FirestoreAnswer[]> => {
    const snapshot = await firestore.collection('users').doc(uid).collection('answers').get();
    const answers: FirestoreAnswer[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      answers.push({
        questionKey: doc.id,
        rawValue: data.rawValue || '',
        interpretedValue: data.interpretedValue || '',
        isConfirmed: !!data.isConfirmed,
        updatedAt: data.updatedAt || '',
      });
    });
    return answers;
  },

  upsertAnswer: async (uid: string, questionKey: string, rawValue: string, interpretedValue: string, isConfirmed: boolean) => {
    const answerRef = firestore.collection('users').doc(uid).collection('answers').doc(questionKey);
    await answerRef.set({
      rawValue,
      interpretedValue,
      isConfirmed,
      updatedAt: new Date().toISOString(),
    });
  },

  // 5. Document Statuses (Subcollection)
  findDocumentStatusesByUserId: async (uid: string): Promise<FirestoreDocumentStatus[]> => {
    const snapshot = await firestore.collection('users').doc(uid).collection('documents').get();
    const docStatuses: FirestoreDocumentStatus[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      docStatuses.push({
        documentKey: doc.id,
        status: data.status || 'MISSING',
        updatedAt: data.updatedAt || '',
      });
    });
    return docStatuses;
  },

  upsertDocumentStatus: async (uid: string, documentKey: string, status: string) => {
    const docRef = firestore.collection('users').doc(uid).collection('documents').doc(documentKey);
    await docRef.set({
      status,
      updatedAt: new Date().toISOString(),
    });
  },
};
