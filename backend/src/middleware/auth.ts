import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../services/firebaseAdmin';
import { AuthenticatedRequest, AuthenticatedRequestUser } from '../types/auth';

/**
 * Backwards compatibility interface for existing controller modules.
 */
export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/**
 * Reusable server-side Firebase Authentication ID Token Verification Middleware.
 * Extracts, validates, and injects trusted identity contexts into requests.
 */
export async function requireFirebaseAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid token.' });
  }

  const parts = authHeader.split(' ');
  // Accept the Bearer scheme case-insensitively
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid token.' });
  }

  const token = parts[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    
    // Attach only the minimal approved verified-user context
    const userContext: AuthenticatedRequestUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
    };

    req.user = userContext;
    next();
  } catch (err: any) {
    // Map expected verification failures (expired, invalid signature, etc.) to 401
    if (err.code && err.code.startsWith('auth/')) {
      return res.status(401).json({ error: 'Unauthorized', message: 'Missing or invalid token.' });
    }

    // Map unexpected credential, network, or server failures to 500
    return res.status(500).json({ error: 'Internal Server Error', message: 'Authentication check failed.' });
  }
}

/**
 * Backwards compatibility middleware wrapper for existing routes.
 * Maps req.user context back to req.userId and req.userEmail.
 */
export async function authenticateToken(req: any, res: Response, next: NextFunction) {
  await requireFirebaseAuth(req, res, () => {
    req.userId = req.user?.uid;
    req.userEmail = req.user?.email;
    next();
  });
}
