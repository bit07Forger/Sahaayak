/**
 * Trusted server-side authenticated user context structure
 * as returned by protected API endpoints.
 */
export interface AuthenticatedRequestUser {
  uid: string;
  email?: string;
  emailVerified?: boolean;
}
