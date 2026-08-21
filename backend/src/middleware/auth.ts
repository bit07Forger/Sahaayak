import { Request, Response, NextFunction } from 'express';
import { auth } from '../services/firebaseAdmin';

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email;
    next();
  } catch (err: any) {
    console.error('Firebase ID token verification failed:', err);
    return res.status(403).json({ error: 'Invalid or expired Firebase session token.' });
  }
}
