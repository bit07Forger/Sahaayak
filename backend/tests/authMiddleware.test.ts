import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/server';
import { adminAuth } from '../src/services/firebaseAdmin';

vi.mock('../src/services/firebaseAdmin', () => {
  const mockVerifyIdToken = vi.fn();
  return {
    adminAuth: {
      verifyIdToken: mockVerifyIdToken,
    },
    firestore: {
      collection: vi.fn(),
    },
    default: {},
  };
});

describe('Firebase Authentication Middleware & Protected Verification Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Missing Authorization header - should return 401 AUTH_MISSING and not call verifyIdToken', async () => {
    const res = await request(app).get('/api/auth/session');
    
    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: {
        code: 'AUTH_MISSING',
        message: 'Sign in to continue.',
        requestId: expect.any(String),
      },
    });
    expect(adminAuth.verifyIdToken).not.toHaveBeenCalled();
  });

  it('Malformed or non-Bearer header - should return 401 and not call verifyIdToken', async () => {
    const res = await request(app)
      .get('/api/auth/session')
      .set('Authorization', 'Basic user:pass');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: {
        code: 'AUTH_MISSING',
        message: 'Sign in to continue.',
        requestId: expect.any(String),
      },
    });
    expect(adminAuth.verifyIdToken).not.toHaveBeenCalled();
  });

  it('Bearer scheme with empty token - should return 401 and not call verifyIdToken', async () => {
    const res = await request(app)
      .get('/api/auth/session')
      .set('Authorization', 'Bearer ');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: {
        code: 'AUTH_MISSING',
        message: 'Sign in to continue.',
        requestId: expect.any(String),
      },
    });
    expect(adminAuth.verifyIdToken).not.toHaveBeenCalled();
  });

  it('Invalid/expired mocked token - should return 401 AUTH_INVALID, no verified user, and no raw error details', async () => {
    const mockError = { code: 'auth/invalid-id-token', message: 'Token is expired.' };
    vi.mocked(adminAuth.verifyIdToken).mockRejectedValueOnce(mockError);

    const res = await request(app)
      .get('/api/auth/session')
      .set('Authorization', 'Bearer invalid-token-123');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      error: {
        code: 'AUTH_INVALID',
        message: 'Your session could not be verified. Please sign in again.',
        requestId: expect.any(String),
      },
    });
    expect(adminAuth.verifyIdToken).toHaveBeenCalledWith('invalid-token-123');
  });

  it('Valid mocked token - should attach approved identity context and return session payload', async () => {
    const mockClaims = {
      uid: 'test-user-id-555',
      email: 'test@sahaayak.org',
      email_verified: true,
    };
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValueOnce(mockClaims as any);

    const res = await request(app)
      .get('/api/auth/session')
      .set('Authorization', 'Bearer valid-token-555');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      user: {
        uid: 'test-user-id-555',
        email: 'test@sahaayak.org',
        emailVerified: true,
      },
    });
    expect(adminAuth.verifyIdToken).toHaveBeenCalledWith('valid-token-555');
  });

  it('Unexpected Firebase Admin failure - should return 500 INTERNAL_ERROR with no secrets/internal traces', async () => {
    const databaseError = new Error('Database socket timed out internally');
    vi.mocked(adminAuth.verifyIdToken).mockRejectedValueOnce(databaseError);

    const res = await request(app)
      .get('/api/auth/session')
      .set('Authorization', 'Bearer valid-token-555');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong. Please try again.',
        requestId: expect.any(String),
      },
    });
    // Ensure no error internals or logs were leaked to the API consumer
    expect(res.text).not.toContain('Database socket timed out');
  });

  it('Spoofed uid in body/query - route must ignore it and use only token-verified UID context', async () => {
    const mockClaims = {
      uid: 'actual-verified-uid',
      email: 'verified@sahaayak.org',
      email_verified: true,
    };
    vi.mocked(adminAuth.verifyIdToken).mockResolvedValueOnce(mockClaims as any);

    const res = await request(app)
      .get('/api/auth/session?uid=spoofed-query-uid')
      .send({ uid: 'spoofed-body-uid' })
      .set('Authorization', 'Bearer valid-token-999');

    expect(res.status).toBe(200);
    expect(res.body.user.uid).toBe('actual-verified-uid');
    expect(res.body.user.uid).not.toBe('spoofed-query-uid');
    expect(res.body.user.uid).not.toBe('spoofed-body-uid');
  });
});
