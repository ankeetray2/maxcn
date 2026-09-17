import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';

// 1. Helmet HTTP headers configuration
export const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Allows Vite SPA scripts and images in development
  crossOriginEmbedderPolicy: false
});

// 2. Rate Limiting configuration
export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false
  },
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes'
  }
});

export const uploadRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 40, // 40 screenshot uploads per minute
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    xForwardedForHeader: false,
    forwardedHeader: false
  },
  message: {
    success: false,
    error: 'Upload rate limit exceeded. Please wait a moment before uploading another screenshot.'
  }
});

// 3. Mongo Injection Sanitization Middleware
export function mongoSanitizeMiddleware(req: Request, _res: Response, next: NextFunction) {
  const sanitize = (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(sanitize);

    const clean: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      // Strip keys starting with $ or containing . (NoSQL operator injections)
      if (key.startsWith('$') || key.includes('.')) {
        continue;
      }
      clean[key] = sanitize(obj[key]);
    }
    return clean;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
}

// 4. CSRF Protection Middleware
export function csrfProtection(req: Request, res: Response, next: NextFunction) {
  // Allow safe idempotent HTTP methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Verify custom client header or authorization presence to block cross-origin browser form posts
  const customHeader = req.headers['x-requested-with'] || req.headers['x-csrf-token'];
  const hasContentTypeJson = req.headers['content-type']?.includes('application/json');

  if (!customHeader && !hasContentTypeJson && !req.headers.authorization) {
    return res.status(403).json({
      success: false,
      error: 'CSRF Protection: Missing required request security headers'
    });
  }

  next();
}

// 5. File Validation (PNG, JPG, JPEG, WEBP; max 10MB)
export interface ValidatedFilePayload {
  buffer: Buffer;
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
  sizeBytes: number;
  filename: string;
}

export function validateScreenshotFile(payload: {
  imageBase64?: string;
  filename?: string;
  mimeType?: string;
}): { valid: boolean; error?: string; data?: ValidatedFilePayload } {
  if (!payload.imageBase64) {
    return { valid: false, error: 'No image data provided. Please provide an image file.' };
  }

  let base64Clean = payload.imageBase64;
  let detectedMime = payload.mimeType || 'image/png';

  // Handle data URI format (e.g. data:image/png;base64,....)
  if (base64Clean.startsWith('data:')) {
    const match = base64Clean.match(/^data:([^;]+);base64,(.*)$/);
    if (match) {
      detectedMime = match[1];
      base64Clean = match[2];
    }
  }

  const allowedMimes: Array<'image/png' | 'image/jpeg' | 'image/webp'> = [
    'image/png',
    'image/jpeg',
    'image/webp'
  ];

  if (detectedMime === 'image/jpg') {
    detectedMime = 'image/jpeg';
  }

  if (!allowedMimes.includes(detectedMime as any)) {
    return {
      valid: false,
      error: `Invalid file format (${detectedMime}). Only PNG, JPG, JPEG, and WEBP formats are accepted.`
    };
  }

  try {
    const buffer = Buffer.from(base64Clean, 'base64');
    const sizeBytes = buffer.length;
    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB

    if (sizeBytes > maxSizeBytes) {
      return {
        valid: false,
        error: `File size (${(sizeBytes / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum limit of 10 MB.`
      };
    }

    if (sizeBytes < 10) {
      return { valid: false, error: 'File appears corrupt or empty.' };
    }

    return {
      valid: true,
      data: {
        buffer,
        mimeType: detectedMime as 'image/png' | 'image/jpeg' | 'image/webp',
        sizeBytes,
        filename: payload.filename || `screenshot_${Date.now()}.${detectedMime.split('/')[1]}`
      }
    };
  } catch (err: any) {
    return { valid: false, error: 'Failed to decode base64 image data: ' + err.message };
  }
}

export function validateSpreadsheetFile(payload: {
  fileBase64?: string;
  filename?: string;
  mimeType?: string;
}): {
  valid: boolean;
  error?: string;
  data?: { buffer: Buffer; filename: string; sizeBytes: number; extension: 'csv' | 'xlsx' };
} {
  if (!payload.fileBase64) {
    return { valid: false, error: 'No file data provided. Please provide a CSV or XLSX file.' };
  }

  let base64Clean = payload.fileBase64;
  if (base64Clean.startsWith('data:')) {
    const match = base64Clean.match(/^data:([^;]+);base64,(.*)$/);
    if (match) {
      base64Clean = match[2];
    }
  }

  const filename = payload.filename || 'data.csv';
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext !== 'csv' && ext !== 'xlsx') {
    return {
      valid: false,
      error: `Invalid file extension (.${ext}). Only .csv and .xlsx files are supported.`
    };
  }

  try {
    const buffer = Buffer.from(base64Clean, 'base64');
    const sizeBytes = buffer.length;
    const maxSizeBytes = 10 * 1024 * 1024; // 10 MB

    if (sizeBytes > maxSizeBytes) {
      return {
        valid: false,
        error: `File size (${(sizeBytes / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum limit of 10 MB.`
      };
    }

    if (sizeBytes < 5) {
      return { valid: false, error: 'Spreadsheet file appears empty.' };
    }

    return {
      valid: true,
      data: {
        buffer,
        filename,
        sizeBytes,
        extension: ext as 'csv' | 'xlsx'
      }
    };
  } catch (err: any) {
    return { valid: false, error: 'Failed to parse file: ' + err.message };
  }
}

// 6. Enterprise Lightweight JWT Authentication
const JWT_SECRET = process.env.JWT_SECRET || 'commodity_greeks_pro_secret_key';

export function generateJwtToken(payload: { userId: string; username: string; role: string }): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 7 * 24 * 3600; // 7 days
  const body = Buffer.from(JSON.stringify({ ...payload, iat: now, exp })).toString('base64url');

  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');

  return `${header}.${body}.${signature}`;
}

export function verifyJwtToken(token: string): { valid: boolean; payload?: any } {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return { valid: false };

    const [header, body, signature] = parts;
    const expectedSig = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${header}.${body}`)
      .digest('base64url');

    if (signature !== expectedSig) return { valid: false };

    const decoded = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return { valid: false }; // Expired
    }

    return { valid: true, payload: decoded };
  } catch {
    return { valid: false };
  }
}

export function jwtAuthMiddleware(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const verification = verifyJwtToken(token);
    if (verification.valid) {
      (req as any).user = verification.payload;
    }
  }
  // Soft auth: allows authenticated session or guest trader
  next();
}
