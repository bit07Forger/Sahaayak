import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend directory and repository root fallback
dotenv.config({ override: true });
dotenv.config({ path: path.resolve(__dirname, '../../.env'), override: true });

import app from './server';
import { initializeFirestoreData } from './services/dbService';

const PORT = 5001;

// Startup server immediately so HTTP endpoints are active
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`=========================================`);
  console.log(` Sahaayak Firebase API Server Started`);
  console.log(` Port: ${PORT}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Mock AI: ${process.env.USE_MOCK_AI || 'false'}`);
  console.log(`=========================================`);

  // Asynchronously seed data in background if configured
  initializeFirestoreData().catch((error) => {
    console.warn('Warning: Auto-seeding encountered an issue:', error.message || error);
  });
});
