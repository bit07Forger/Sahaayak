import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
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

describe('Backend API Operational Hardening Tests', () => {
  let consoleSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  // 1. API Errors tests
  describe('API Safe Error Contracts', () => {
    it('AUTH_MISSING: missing authorization header should return standardized safe error structure', async () => {
      const res = await request(app).get('/api/auth/session');
      
      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: {
          code: 'AUTH_MISSING',
          message: 'Sign in to continue.',
          requestId: expect.any(String),
        },
      });
    });

    it('AUTH_INVALID: invalid token should return standardized safe error structure', async () => {
      vi.mocked(adminAuth.verifyIdToken).mockRejectedValueOnce({
        code: 'auth/invalid-id-token',
        message: 'Token signature is incorrect',
      });

      const res = await request(app)
        .get('/api/auth/session')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
      expect(res.body).toEqual({
        error: {
          code: 'AUTH_INVALID',
          message: 'Your session could not be verified. Please sign in again.',
          requestId: expect.any(String),
        },
      });
      // Ensure no raw auth secrets or details were returned
      expect(res.text).not.toContain('auth/invalid-id-token');
      expect(res.text).not.toContain('Token signature is incorrect');
    });

    it('NOT_FOUND: undefined route should trigger 404 ApiError handler', async () => {
      const res = await request(app).get('/api/non-existent-route-999');

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        error: {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found.',
          requestId: expect.any(String),
        },
      });
    });

    it('INTERNAL_ERROR: unexpected middleware error should return standardized safe error structure without leakages', async () => {
      vi.mocked(adminAuth.verifyIdToken).mockRejectedValueOnce(new Error('Internal database disconnect'));

      const res = await request(app)
        .get('/api/auth/session')
        .set('Authorization', 'Bearer token-123');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Something went wrong. Please try again.',
          requestId: expect.any(String),
        },
      });
      expect(res.text).not.toContain('Internal database disconnect');
    });
  });

  // 2. Request Correlation IDs tests
  describe('Request Correlation IDs', () => {
    it('All responses must include X-Request-Id header', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['x-request-id']).toBeDefined();
      expect(res.body.requestId).toBe(res.headers['x-request-id']);
    });

    it('Client-supplied request ID is validated and incorporated with server correlation', async () => {
      const clientReqId = 'client-id-123';
      const res = await request(app)
        .get('/health')
        .set('X-Request-Id', clientReqId);

      const returnedId = res.headers['x-request-id'];
      expect(returnedId).toBeDefined();
      expect(returnedId).toContain(clientReqId);
      expect(returnedId).not.toBe(clientReqId); // Always server-correlated
    });
  });

  // 3. Logger Redaction & Metadata tests
  describe('Operational Logger Metadata and Redaction', () => {
    it('Logger outputs only safe JSON metadata and redacts sensitive payload parameters', async () => {
      await request(app)
        .post('/api/auth/preferences')
        .send({ textSize: 'large', password: 'mysecretpassword123' })
        .set('Authorization', 'Bearer secret-auth-token');

      // Verify that console.log was called
      expect(consoleSpy).toHaveBeenCalled();
      
      const lastCall = consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1][0];
      const parsedLog = JSON.parse(lastCall);

      // Verify log schema
      expect(parsedLog).toHaveProperty('timestamp');
      expect(parsedLog).toHaveProperty('level');
      expect(parsedLog).toHaveProperty('requestId');
      expect(parsedLog).toHaveProperty('method');
      expect(parsedLog).toHaveProperty('route');
      expect(parsedLog).toHaveProperty('statusCode');
      expect(parsedLog).toHaveProperty('durationMs');
      expect(parsedLog).toHaveProperty('authenticated');

      // Assert complete absence of sensitive input body fields or request headers in logs
      const rawLogText = JSON.stringify(parsedLog);
      expect(rawLogText).not.toContain('mysecretpassword123');
      expect(rawLogText).not.toContain('secret-auth-token');
      expect(rawLogText).not.toContain('textSize');
    });
  });

  // 4. Strict CORS Policy tests
  describe('CORS Policy Configuration', () => {
    it('Approved CORS origin receives access-control headers', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:5173');

      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
      expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    it('Disallowed CORS origin does not receive access-control headers', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://malicious-origin.com');

      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  // 5. Health & Readiness Endpoints tests
  describe('Health and Readiness Endpoints', () => {
    it('GET /health returns safe ok status and request ID without authentication', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        service: 'sahaayak-api',
        status: 'ok',
        requestId: expect.any(String),
      });
    });

    it('GET /ready returns 200 ok when required environment checks pass', async () => {
      const originalProjectId = process.env.FIREBASE_PROJECT_ID;
      process.env.FIREBASE_PROJECT_ID = 'test-sahaayak-999';

      const res = await request(app).get('/ready');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        status: 'ok',
        requestId: expect.any(String),
      });

      process.env.FIREBASE_PROJECT_ID = originalProjectId;
    });

    it('GET /ready returns 503 service_unavailable when environment config is missing', async () => {
      const originalProjectId = process.env.FIREBASE_PROJECT_ID;
      delete process.env.FIREBASE_PROJECT_ID;

      const res = await request(app).get('/ready');
      expect(res.status).toBe(503);
      expect(res.body).toEqual({
        status: 'service_unavailable',
        message: 'Required environment configuration is missing.',
        requestId: expect.any(String),
      });

      process.env.FIREBASE_PROJECT_ID = originalProjectId;
    });
  });
});
