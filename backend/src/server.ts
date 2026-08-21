import express from 'express';
import cors from 'cors';
import { authenticateToken } from './middleware/auth';
import { getMe, updatePreferences } from './controllers/authController';
import { getServices, getCurrentWorkflow } from './controllers/workflowController';
import { interpretAnswer, confirmAnswer, validateInput } from './controllers/answerController';
import { getChecklist, updateDocumentStatus } from './controllers/documentController';
import { getReadiness } from './controllers/readinessController';

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Profile / Preferences Routes (Stateless token verified)
app.get('/api/auth/me', authenticateToken, getMe);
app.post('/api/auth/preferences', authenticateToken, updatePreferences);

// Workflow & Services
app.get('/api/services', authenticateToken, getServices);
app.get('/api/workflows/current', authenticateToken, getCurrentWorkflow);

// Answers & Interpretation
app.post('/api/answers/interpret', authenticateToken, interpretAnswer);
app.post('/api/answers/confirm', authenticateToken, confirmAnswer);
app.post('/api/answers/validate', authenticateToken, validateInput);

// Documents & Checklists
app.get('/api/documents/checklist', authenticateToken, getChecklist);
app.post('/api/documents/update', authenticateToken, updateDocumentStatus);

// Readiness Summary
app.get('/api/readiness', authenticateToken, getReadiness);

export default app;
