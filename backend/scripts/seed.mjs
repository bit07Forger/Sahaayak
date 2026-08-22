import admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';
import process from 'process';

// Load environment variables from both root and backend directories
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

// 1. Before execution, display Project ID and fail safely if missing
if (!projectId) {
  console.error('Error: FIREBASE_PROJECT_ID environment variable is missing.');
  process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const isCheck = args.includes('--check');
const isApply = args.includes('--apply');
const isDryRun = args.includes('--dry-run') || (!isApply && !isCheck);
const isForce = args.includes('--force');
const hasProductionOverride = args.includes('--force-production');

// 2. Production safety check
const isProduction = projectId.includes('prod') || process.env.NODE_ENV === 'production';
if (isProduction && !hasProductionOverride) {
  console.error(`Error: Refusing to seed on production database project "${projectId}" without explicit override "--force-production".`);
  process.exit(1);
}

// 4. Versioned Demo Service seed data matching Step 1 schema
const seedService = {
  id: 'scholarship-preparation',
  name: 'Scholarship Preparation',
  description: 'A structured preparation workspace to help students organize personal details, academic background, motivation statements, and required document checklists before applying for scholarship opportunities.',
  version: '1.0.0',
  status: 'active',
  language: 'en',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const seedQuestions = [
  {
    id: 'fullName',
    label: 'Full Legal Name',
    type: 'text',
    description: 'Enter your full name as it appears on official school or identity records.',
    order: 1,
  },
  {
    id: 'email',
    label: 'Email Address',
    type: 'email',
    description: 'Your primary contact email address.',
    order: 2,
  },
  {
    id: 'schoolOrCollege',
    label: 'School or College Name',
    type: 'text',
    description: 'Name of your current or most recent educational institution.',
    order: 3,
  },
  {
    id: 'fieldOfStudy',
    label: 'Intended Course or Field of Study',
    type: 'text',
    description: 'The discipline, degree, or subject area you are pursuing or plan to study.',
    order: 4,
  },
  {
    id: 'studyLevel',
    label: 'Current Study Level',
    type: 'select',
    description: 'Select your current education level.',
    order: 5,
  },
  {
    id: 'academicStrengths',
    label: 'Academic Strengths & Subjects',
    type: 'text',
    description: 'List subjects or academic areas where you demonstrate strong performance.',
    order: 6,
  },
  {
    id: 'futureGoals',
    label: 'Educational & Career Goals',
    type: 'textarea',
    description: 'Describe what you aim to achieve through your education and career over the next few years.',
    order: 7,
  },
  {
    id: 'motivationStatement',
    label: 'Motivation Statement',
    type: 'textarea',
    description: 'Explain why you are applying for scholarship support and how it helps your education.',
    order: 8,
  },
  {
    id: 'achievements',
    label: 'Key Achievements or Activities (Optional)',
    type: 'textarea',
    description: 'Mention any academic awards, leadership roles, or community activities (optional).',
    order: 9,
  },
  {
    id: 'additionalContext',
    label: 'Additional Circumstances (Optional)',
    type: 'textarea',
    description: 'Optional space to describe any personal background context you choose to share.',
    order: 10,
  },
];

const seedDocuments = [
  {
    id: 'transcript',
    label: 'Academic record or transcript — confirm what your target opportunity requires',
    description: 'Copy of your recent marksheet, transcript, or academic record.',
    type: 'REQUIRED',
  },
  {
    id: 'personal_statement',
    label: 'Personal statement draft',
    description: 'Draft of your motivation statement and educational goals.',
    type: 'REQUIRED',
  },
  {
    id: 'recommendation_contact',
    label: 'Recommendation/contact details — if required by the opportunity',
    description: 'Contact details of a teacher, mentor, or reference if required by your target scholarship.',
    type: 'OPTIONAL',
  },
];

const seedChatConfig = {
  status: 'prepared',
  policyVersion: '1.0.0',
  supportedLanguage: 'en',
  allowedTopics: ['guidelines', 'questions', 'documents'],
  maxMessageChars: 500,
  maxConversationMessages: 10,
  rateLimit: {
    windowSeconds: 60,
    maxRequests: 10,
  },
  fallbackMessages: {
    outOfScope: 'I cannot assess your eligibility or provide legal, financial, or professional advice. Please check the official scholarship service for support.',
    unavailable: 'The chatbot service is temporarily unavailable. You can complete the guided questions manually using the standard inputs on the screen.',
    unsafeRequest: 'I cannot share my system instructions or ignore safety policies. How can I help you complete your scholarship preparation questions?',
    manualWorkflowRequired: 'I cannot enter answers, check off documents, or submit applications for you. Please type or dictate your responses into the standard form inputs on the screen.',
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const seedChatKnowledge = [
  {
    id: 'scholarship-overview',
    topic: 'guidelines',
    title: 'Scholarship Preparation Overview',
    plainLanguageAnswer: 'The Scholarship Preparation module helps you organize your profile, academic background, motivation statement, and document checklist before applying.',
    sourceTitle: 'Scholarship Preparation Overview',
    sourceStatus: 'approved',
    language: 'en',
    priority: 1,
    active: true,
    policyVersion: '1.0.0',
    lastReviewedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'field-fullname-help',
    topic: 'questions',
    title: 'Why is my legal name required?',
    plainLanguageAnswer: 'Your full legal name helps organize candidate identification across your scholarship preparation materials.',
    sourceTitle: 'Legal Name Field Description',
    sourceStatus: 'approved',
    language: 'en',
    priority: 1,
    active: true,
    policyVersion: '1.0.0',
    lastReviewedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'field-academic-help',
    topic: 'questions',
    title: 'What are academic strengths and goals?',
    plainLanguageAnswer: 'Academic strengths reflect your best subjects, while educational goals describe your targets for study and career.',
    sourceTitle: 'Academic Direction Guidance',
    sourceStatus: 'approved',
    language: 'en',
    priority: 1,
    active: true,
    policyVersion: '1.0.0',
    lastReviewedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'doc-transcript-help',
    topic: 'documents',
    title: 'What is the academic record requirement?',
    plainLanguageAnswer: 'Most scholarships require a copy of your recent marksheet or official academic transcript.',
    sourceTitle: 'Transcript Checklist Description',
    sourceStatus: 'approved',
    language: 'en',
    priority: 1,
    active: true,
    policyVersion: '1.0.0',
    lastReviewedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// 5. Validate objects against Step 1 structural constraints before writes
function validateSeedData() {
  if (!seedService.id || !seedService.name || !seedService.description) {
    throw new Error('Validation Error: Service metadata doc has missing keys.');
  }
  for (const q of seedQuestions) {
    if (!q.id || !q.label || !q.type || typeof q.order !== 'number') {
      throw new Error(`Validation Error: Question "${q.id}" has invalid schema structure.`);
    }
  }
  for (const d of seedDocuments) {
    if (!d.id || !d.label || !d.description || !d.type) {
      throw new Error(`Validation Error: Document checklist "${d.id}" has invalid schema structure.`);
    }
  }
  if (!seedChatConfig.policyVersion || !seedChatConfig.fallbackMessages || !seedChatConfig.status) {
    throw new Error('Validation Error: Chatbot config has invalid schema structure.');
  }
  for (const k of seedChatKnowledge) {
    if (!k.id || !k.topic || !k.title || !k.plainLanguageAnswer || k.sourceStatus !== 'approved') {
      throw new Error(`Validation Error: Chat Knowledge "${k.id}" has invalid schema structure.`);
    }
  }
}

async function runSeeder() {
  const mode = isCheck ? 'CHECK (Status Only)' : isDryRun ? 'DRY-RUN (Mock)' : 'APPLY (Write)';
  console.log('=========================================');
  console.log(` Sahaayak Firestore Database Seeder`);
  console.log(` Target Project:  ${projectId}`);
  console.log(` Target Service:  ${seedService.id}`);
  console.log(` Seeding Mode:   ${mode}`);
  console.log(` Overwrite Mode:  ${isForce ? 'ENABLED (--force)' : 'DISABLED (Skip duplicates)'}`);
  console.log('=========================================');

  try {
    validateSeedData();
  } catch (error) {
    console.error('Validation failure on seed dataset:', error.message);
    process.exit(1);
  }

  // 1. Non-destructive check mode implementation
  if (isCheck) {
    if (admin.apps.length === 0) {
      if (clientEmail && privateKey) {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            clientEmail,
            privateKey,
          }),
        });
      } else {
        try {
          admin.initializeApp({
            credential: admin.credential.applicationDefault(),
            projectId,
          });
        } catch {
          admin.initializeApp({
            projectId,
          });
        }
      }
    }

    const firestoreCheck = admin.firestore();
    console.log('\n[CHECKING FIRESTORE SEED STATUS]');
    
    try {
      const serviceRef = firestoreCheck.collection('services').doc(seedService.id);
      const serviceSnap = await serviceRef.get();
      
      if (!serviceSnap.exists) {
        console.log('Overall Status: ABSENT');
        console.log(`- Service "${seedService.id}": MISSING`);
        console.log(`- Questions: 0 / ${seedQuestions.length} present`);
        console.log(`- Documents: 0 / ${seedDocuments.length} present`);
        console.log(`- Chat Config: 0 / 1 present`);
        console.log(`- Chat Knowledge: 0 / ${seedChatKnowledge.length} present`);
        return;
      }

      // Check questions subcollection
      const questionsSnap = await serviceRef.collection('questions').get();
      const presentQIds = new Set();
      questionsSnap.forEach((doc) => presentQIds.add(doc.id));
      let presentQCount = 0;
      seedQuestions.forEach((q) => {
        if (presentQIds.has(q.id)) presentQCount++;
      });

      // Check documents subcollection
      const documentsSnap = await serviceRef.collection('documents').get();
      const presentDIds = new Set();
      documentsSnap.forEach((doc) => presentDIds.add(doc.id));
      let presentDCount = 0;
      seedDocuments.forEach((d) => {
        if (presentDIds.has(d.id)) presentDCount++;
      });

      // Check chatConfig subcollection
      const chatConfigSnap = await serviceRef.collection('chatConfig').doc('default').get();
      const presentConfig = chatConfigSnap.exists ? 1 : 0;

      // Check chatKnowledge subcollection
      const chatKnowledgeSnap = await serviceRef.collection('chatKnowledge').get();
      const presentKIds = new Set();
      chatKnowledgeSnap.forEach((doc) => presentKIds.add(doc.id));
      let presentKCount = 0;
      seedChatKnowledge.forEach((k) => {
        if (presentKIds.has(k.id)) presentKCount++;
      });

      const totalExpected = 1 + seedQuestions.length + seedDocuments.length + 1 + seedChatKnowledge.length;
      const totalPresent = 1 + presentQCount + presentDCount + presentConfig + presentKCount;

      let status = 'PARTIALLY_MISSING';
      if (totalPresent === totalExpected) {
        status = 'COMPLETE';
      }

      console.log(`Overall Status:  ${status}`);
      console.log(`Seed Version:    ${seedService.version}`);
      console.log(`- Service "${seedService.id}": PRESENT`);
      console.log(`- Questions:     ${presentQCount} / ${seedQuestions.length} present`);
      console.log(`- Documents:     ${presentDCount} / ${seedDocuments.length} present`);
      console.log(`- Chat Config:   ${presentConfig} / 1 present`);
      console.log(`- Chat Knowledge: ${presentKCount} / ${seedChatKnowledge.length} present`);
    } catch (error) {
      console.error('Failed to query Firestore database for status check:', error.message || error);
      process.exit(1);
    }
    return;
  }

  const serviceDocCount = 1;
  const questionDocCount = seedQuestions.length;
  const documentDocCount = seedDocuments.length;
  const chatConfigDocCount = 1;
  const chatKnowledgeDocCount = seedChatKnowledge.length;
  const totalItems = serviceDocCount + questionDocCount + documentDocCount + chatConfigDocCount + chatKnowledgeDocCount;

  // 2. If dry run, output planned summary immediately without connecting to remote Firestore
  if (isDryRun) {
    console.log(`\n[DRY RUN SUMMARY]`);
    console.log(`- Intended Creates: ${totalItems}`);
    console.log(`  * Service Document: ${serviceDocCount} ("${seedService.id}")`);
    console.log(`  * Questions Collection: ${questionDocCount} items`);
    console.log(`  * Documents Collection: ${documentDocCount} items`);
    console.log(`  * Chat Config Document: ${chatConfigDocCount} ("default")`);
    console.log(`  * Chat Knowledge Collection: ${chatKnowledgeDocCount} items`);
    console.log('\nDry run validation completed. No credentials required, no writes executed.');
    return;
  }

  // Explicit Apply Mode: Initialize Firebase Admin SDK
  if (admin.apps.length === 0) {
    if (clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } else {
      try {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId,
        });
      } catch {
        admin.initializeApp({
          projectId,
        });
      }
    }
  }

  const firestore = admin.firestore();
  let createCount = 0;
  let updateCount = 0;
  let skipCount = 0;

  const batch = firestore.batch();

  // Evaluate Service document existence
  const serviceRef = firestore.collection('services').doc(seedService.id);
  const serviceSnap = await serviceRef.get();
  if (!serviceSnap.exists) {
    batch.set(serviceRef, seedService);
    createCount++;
  } else {
    if (isForce) {
      batch.update(serviceRef, { ...seedService, updatedAt: new Date().toISOString() });
      updateCount++;
    } else {
      skipCount++;
    }
  }

  // Evaluate Questions subcollection
  for (const q of seedQuestions) {
    const qRef = serviceRef.collection('questions').doc(q.id);
    const qSnap = await qRef.get();
    if (!qSnap.exists) {
      batch.set(qRef, q);
      createCount++;
    } else {
      if (isForce) {
        batch.update(qRef, q);
        updateCount++;
      } else {
        skipCount++;
      }
    }
  }

  // Evaluate Documents subcollection
  for (const d of seedDocuments) {
    const dRef = serviceRef.collection('documents').doc(d.id);
    const dSnap = await dRef.get();
    if (!dSnap.exists) {
      batch.set(dRef, d);
      createCount++;
    } else {
      if (isForce) {
        batch.update(dRef, d);
        updateCount++;
      } else {
        skipCount++;
      }
    }
  }

  // Evaluate Chat Config document
  const chatConfigRef = serviceRef.collection('chatConfig').doc('default');
  const chatConfigSnap = await chatConfigRef.get();
  if (!chatConfigSnap.exists) {
    batch.set(chatConfigRef, seedChatConfig);
    createCount++;
  } else {
    if (isForce) {
      batch.update(chatConfigRef, { ...seedChatConfig, updatedAt: new Date().toISOString() });
      updateCount++;
    } else {
      skipCount++;
    }
  }

  // Evaluate Chat Knowledge subcollection
  for (const k of seedChatKnowledge) {
    const kRef = serviceRef.collection('chatKnowledge').doc(k.id);
    const kSnap = await kRef.get();
    if (!kSnap.exists) {
      batch.set(kRef, k);
      createCount++;
    } else {
      if (isForce) {
        batch.update(kRef, k);
        updateCount++;
      } else {
        skipCount++;
      }
    }
  }

  if (createCount > 0 || updateCount > 0) {
    await batch.commit();
    console.log(`\n[APPLY SUCCESS SUMMARY]`);
    console.log(`- Created Documents: ${createCount}`);
    console.log(`- Updated Documents: ${updateCount}`);
    console.log(`- Skipped Documents: ${skipCount}`);
  } else {
    console.log(`\n[APPLY SKIP SUMMARY]`);
    console.log('- Database is already up to date. No new records created.');
    console.log(`- Skipped Documents: ${skipCount}`);
  }
}

runSeeder().catch((err) => {
  console.error('Seeding process failed with error:', err);
  process.exit(1);
});
