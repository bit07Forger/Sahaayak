import { Request } from 'express';

/**
 * Trusted server-side authenticated user context, populated
 * after validating the incoming Firebase ID token.
 */
export interface AuthenticatedRequestUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
}

/**
 * Extended Express Request interface carrying verified user properties.
 */
export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedRequestUser;
}
