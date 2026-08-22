import express, { Response } from 'express';
import cors from 'cors';
import { authenticateToken, requireFirebaseAuth } from './middleware/auth';
import { getMe, updatePreferences } from './controllers/authController';
import { getServices, getCurrentWorkflow } from './controllers/workflowController';
import { interpretAnswer, confirmAnswer, validateInput } from './controllers/answerController';
import { getChecklist, updateDocumentStatus } from './controllers/documentController';
import { getReadiness } from './controllers/readinessController';
import {
  requestIdMiddleware,
  loggerMiddleware,
  corsOptions,
  errorHandler,
  ApiError,
} from './middleware/hardening';

const app = express();

// Hardening Middlewares (early execution)
app.use(requestIdMiddleware);
app.use(loggerMiddleware);
app.use(cors(corsOptions));
app.use(express.json());

// Public Health & Readiness Endpoints
app.get('/health', (req: any, res: Response) => {
  res.status(200).json({
    service: 'sahaayak-api',
    status: 'ok',
    requestId: req.requestId,
  });
});

app.get('/ready', (req: any, res: Response) => {
  const isFirebaseConfigured = !!process.env.FIREBASE_PROJECT_ID;
  if (isFirebaseConfigured) {
    res.status(200).json({
      status: 'ok',
      requestId: req.requestId,
    });
  } else {
    res.status(503).json({
      status: 'service_unavailable',
      message: 'Required environment configuration is missing.',
      requestId: req.requestId,
    });
  }
});

// Profile / Preferences Routes (Stateless token verified)
app.get('/api/auth/me', authenticateToken, getMe);
app.get('/api/auth/session', requireFirebaseAuth, (req: any, res: any) => {
  res.json({
    user: {
      uid: req.user?.uid,
      email: req.user?.email,
      emailVerified: req.user?.emailVerified,
    },
  });
});
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

// 404 Catch-all handler
app.use((req, res, next) => {
  next(new ApiError(404, 'NOT_FOUND', 'The requested resource was not found.'));
});

// Global Error Handler (must be mounted last)
app.use(errorHandler);

export default app;
