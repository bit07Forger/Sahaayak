import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import app from './server';
import { initializeFirestoreData } from './services/dbService';

const PORT = process.env.PORT || 5000;

// Initialize Firestore seed data and startup server
initializeFirestoreData().then(() => {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` Sahaayak Firebase API Server Started`);
    console.log(` Port: ${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Mock AI: ${process.env.USE_MOCK_AI || 'false'}`);
    console.log(`=========================================`);
  });
}).catch((error) => {
  console.error('Failed to initialize database setup, server block:', error);
});
