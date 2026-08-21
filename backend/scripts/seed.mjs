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
  id: 'accessible-parking-permit',
  name: 'Accessible Parking Permit',
  description: 'A permit that allows individuals with certified mobility impairments to park in designated accessible spaces close to building entrances.',
  version: '1.0.0',
  status: 'active',
  language: 'en',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const seedQuestions = [
  {
    id: 'name',
    label: 'What is your full legal name?',
    type: 'text',
    description: 'Speak or type your name exactly as it appears on your government identification card.',
    order: 1,
  },
  {
    id: 'dob',
    label: 'What is your date of birth?',
    type: 'date',
    description: 'State or select your birthday. You must be at least 18 years old to apply.',
    order: 2,
  },
  {
    id: 'has_impairment',
    label: 'Do you have a qualified medical mobility limitation?',
    type: 'boolean',
    description: 'Say "Yes" or select Yes if a certified physician has diagnosed you with a mobility-limiting condition.',
    order: 3,
  },
  {
    id: 'doctor_name',
    label: "What is your certifying physician's name?",
    type: 'text',
    description: 'Enter the name of the licensed doctor who will sign your medical evaluation form.',
    order: 4,
  },
  {
    id: 'doctor_license',
    label: "What is your physician's medical license number?",
    type: 'text',
    description: "Enter your doctor's official registration or license number (typically 6-10 characters).",
    order: 5,
  },
  {
    id: 'vehicle_plate',
    label: "What is your vehicle plate number? (Answer 'None' if passenger)",
    type: 'text',
    description: 'Input your license plate number, or say "None" if you will be using this permit as a passenger in other vehicles.',
    order: 6,
  },
];

const seedDocuments = [
  {
    id: 'identity_proof',
    label: 'Proof of Identity',
    description: 'A scanned copy or clear photo of your Government Driver License, Passport, or State ID.',
    type: 'REQUIRED',
  },
  {
    id: 'medical_certificate',
    label: 'Medical Certification Form',
    description: 'The physical Accessible Parking application form filled and signed by your physician within the last 6 months.',
    type: 'REQUIRED',
  },
  {
    id: 'vehicle_registration',
    label: 'Vehicle Registration Copy',
    description: 'Current registration certificate for the primary vehicle associated with this permit. (Optional for passengers).',
    type: 'OPTIONAL',
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

      const totalExpected = 1 + seedQuestions.length + seedDocuments.length;
      const totalPresent = 1 + presentQCount + presentDCount;

      let status = 'PARTIALLY_MISSING';
      if (totalPresent === totalExpected) {
        status = 'COMPLETE';
      }

      console.log(`Overall Status:  ${status}`);
      console.log(`Seed Version:    ${seedService.version}`);
      console.log(`- Service "${seedService.id}": PRESENT`);
      console.log(`- Questions:     ${presentQCount} / ${seedQuestions.length} present`);
      console.log(`- Documents:     ${presentDCount} / ${seedDocuments.length} present`);
    } catch (error) {
      console.error('Failed to query Firestore database for status check:', error.message || error);
      process.exit(1);
    }
    return;
  }

  const serviceDocCount = 1;
  const questionDocCount = seedQuestions.length;
  const documentDocCount = seedDocuments.length;
  const totalItems = serviceDocCount + questionDocCount + documentDocCount;

  // 2. If dry run, output planned summary immediately without connecting to remote Firestore
  if (isDryRun) {
    console.log(`\n[DRY RUN SUMMARY]`);
    console.log(`- Intended Creates: ${totalItems}`);
    console.log(`  * Service Document: ${serviceDocCount} ("${seedService.id}")`);
    console.log(`  * Questions Collection: ${questionDocCount} items`);
    console.log(`  * Documents Collection: ${documentDocCount} items`);
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
