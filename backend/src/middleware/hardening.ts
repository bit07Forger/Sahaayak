import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import cors from 'cors';

export interface HardenedRequest extends Request {
  requestId?: string;
  userId?: string;
  userEmail?: string;
  user?: any;
}

/**
 * Custom operational API Error class
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 1. Request correlation ID middleware
 */
export function requestIdMiddleware(req: any, res: Response, next: NextFunction) {
  let reqId = req.headers['x-request-id'];
  // Capping client-supplied IDs at 100 characters to prevent buffer issues
  if (typeof reqId !== 'string' || !reqId.trim() || reqId.length > 100) {
    reqId = crypto.randomUUID();
  } else {
    reqId = `${reqId.trim()}-${crypto.randomUUID()}`; // Always incorporate server correlation
  }
  req.requestId = reqId;
  res.setHeader('X-Request-Id', reqId);
  next();
}

/**
 * 2. Privacy-safe, structured operational logger
 */
export function loggerMiddleware(req: any, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const authStatus = !!(req.user || req.userId);
    const logObj = {
      timestamp: new Date().toISOString(),
      level: res.statusCode >= 500 ? 'ERROR' : res.statusCode >= 400 ? 'WARN' : 'INFO',
      requestId: req.requestId || 'unknown',
      method: req.method,
      route: req.baseUrl + req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      authenticated: authStatus,
    };
    console.log(JSON.stringify(logObj));
  });

  next();
}

/**
 * 3. Strict CORS policy allowlist resolver
 */
const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [process.env.FRONTEND_URL || 'http://localhost:5173'];

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // If no origin (e.g. server-to-server or local script requests), allow or restrict based on design.
    // Express apps receive undefined origin for simple same-origin requests in non-browser envs.
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false); // Block other cross-origins safely
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id'],
  credentials: true,
};

/**
 * 4. Safe global error handler middleware
 */
export function errorHandler(err: any, req: any, res: Response, next: NextFunction) {
  const reqId = req.requestId || 'unknown';

  if (err instanceof ApiError) {
    return res.status(err.status).json({
      error: {
        code: err.code,
        message: err.message,
        requestId: reqId,
      },
    });
  }

  // Final fallback to redact stack traces or system details
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Please try again.',
      requestId: reqId,
    },
  });
}
