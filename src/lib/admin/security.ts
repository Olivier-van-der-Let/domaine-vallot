import { NextRequest, NextResponse } from 'next/server';

/**
 * Rate limiting configuration
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

/**
 * In-memory store for rate limiting
 * In production, consider using Redis or similar persistent store
 */
class RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now();
    const existing = this.store.get(key);

    if (!existing || now > existing.resetTime) {
      // Create new window
      const resetTime = now + windowMs;
      const record = { count: 1, resetTime };
      this.store.set(key, record);
      return record;
    }

    // Increment existing window
    existing.count++;
    this.store.set(key, existing);
    return existing;
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

const rateLimitStore = new RateLimitStore();

// Cleanup expired entries every 5 minutes
setInterval(() => rateLimitStore.cleanup(), 5 * 60 * 1000);

/**
 * Rate limiting middleware
 */
export function createRateLimit(config: RateLimitConfig) {
  return function rateLimit(request: NextRequest): NextResponse | null {
    const clientId = getClientIdentifier(request);
    const key = `rate_limit:${clientId}`;

    const { count, resetTime } = rateLimitStore.increment(key, config.windowMs);

    if (count > config.maxRequests) {
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);

      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `Too many requests. Try again in ${retryAfter} seconds.`,
          retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': config.maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(resetTime).toISOString()
          }
        }
      );
    }

    return null; // Allow request to proceed
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Use IP address as primary identifier
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'unknown';

  // Include user agent for additional uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown';
  const hashedUA = simpleHash(userAgent);

  return `${ip}:${hashedUA}`;
}

/**
 * Simple hash function for user agent
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Security headers middleware
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://checkout.stripe.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co https://api.stripe.com https://checkout.stripe.com",
      "frame-src https://js.stripe.com https://checkout.stripe.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ].join('; ')
  );

  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // XSS Protection
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Referrer Policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy
  response.headers.set(
    'Permissions-Policy',
    [
      'geolocation=()',
      'camera=()',
      'microphone=()',
      'payment=(self)',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()'
    ].join(', ')
  );

  // Strict Transport Security (HSTS)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }

  return response;
}

/**
 * Input sanitization utilities
 */
export class InputSanitizer {
  /**
   * Sanitize HTML input to prevent XSS
   */
  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return '';

    return input
      .replace(/[<>'"&]/g, (char) => {
        const entities: Record<string, string> = {
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#x27;',
          '&': '&amp;'
        };
        return entities[char] || char;
      })
      .trim();
  }

  /**
   * Sanitize SQL input (basic prevention)
   */
  static sanitizeSql(input: string): string {
    if (typeof input !== 'string') return '';

    // Remove common SQL injection patterns
    return input
      .replace(/['";]/g, '')
      .replace(/\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b/gi, '')
      .trim();
  }

  /**
   * Sanitize file paths
   */
  static sanitizeFilePath(input: string): string {
    if (typeof input !== 'string') return '';

    return input
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .replace(/\.{2,}/g, '.')
      .replace(/^\.+|\.+$/g, '')
      .trim();
  }

  /**
   * Validate and sanitize URLs
   */
  static sanitizeUrl(input: string): string | null {
    if (typeof input !== 'string') return null;

    try {
      const url = new URL(input);

      // Only allow https and http protocols
      if (!['http:', 'https:'].includes(url.protocol)) {
        return null;
      }

      // Prevent malicious redirects
      if (url.hostname === 'localhost' || url.hostname.startsWith('127.')) {
        return null;
      }

      return url.toString();
    } catch {
      return null;
    }
  }

  /**
   * Sanitize email addresses
   */
  static sanitizeEmail(input: string): string {
    if (typeof input !== 'string') return '';

    return input
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9@._-]/g, '');
  }

  /**
   * Deep sanitize object properties
   */
  static sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (typeof obj === 'string') {
      return this.sanitizeHtml(obj);
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        // Sanitize key names
        const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '');
        if (cleanKey) {
          sanitized[cleanKey] = this.sanitizeObject(value);
        }
      }
      return sanitized;
    }

    return obj;
  }
}

/**
 * CSRF protection
 */
export class CSRFProtection {
  private static tokens = new Map<string, { token: string; expires: number }>();

  /**
   * Generate CSRF token
   */
  static generateToken(): string {
    const token = crypto.randomUUID();
    const expires = Date.now() + 3600000; // 1 hour

    this.tokens.set(token, { token, expires });

    // Cleanup expired tokens
    this.cleanup();

    return token;
  }

  /**
   * Validate CSRF token
   */
  static validateToken(token: string): boolean {
    if (!token) return false;

    const record = this.tokens.get(token);
    if (!record) return false;

    if (Date.now() > record.expires) {
      this.tokens.delete(token);
      return false;
    }

    return true;
  }

  /**
   * Cleanup expired tokens
   */
  private static cleanup(): void {
    const now = Date.now();
    for (const [token, record] of this.tokens.entries()) {
      if (now > record.expires) {
        this.tokens.delete(token);
      }
    }
  }
}

/**
 * Request validation utilities
 */
export class RequestValidator {
  /**
   * Validate request origin
   */
  static validateOrigin(request: NextRequest): boolean {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');

    if (!origin || !host) return false;

    // Allow same-origin requests
    const allowedOrigins = [
      `https://${host}`,
      `http://${host}`, // For development
      ...(process.env.ALLOWED_ORIGINS?.split(',') || [])
    ];

    return allowedOrigins.includes(origin);
  }

  /**
   * Validate content type
   */
  static validateContentType(request: NextRequest, expectedTypes: string[]): boolean {
    const contentType = request.headers.get('content-type');
    if (!contentType) return false;

    return expectedTypes.some(type => contentType.includes(type));
  }

  /**
   * Validate request method
   */
  static validateMethod(request: NextRequest, allowedMethods: string[]): boolean {
    return allowedMethods.includes(request.method);
  }

  /**
   * Validate request size
   */
  static async validateRequestSize(request: NextRequest, maxSizeBytes: number): Promise<boolean> {
    const contentLength = request.headers.get('content-length');

    if (contentLength) {
      const size = parseInt(contentLength, 10);
      return size <= maxSizeBytes;
    }

    // If no content-length header, try to read and check
    try {
      const body = await request.text();
      return new Blob([body]).size <= maxSizeBytes;
    } catch {
      return false;
    }
  }
}

/**
 * Pre-configured rate limiters for different endpoints
 */
export const rateLimiters = {
  // Strict rate limit for authentication endpoints
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5 // 5 attempts per 15 minutes
  }),

  // Moderate rate limit for admin API
  adminApi: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60 // 60 requests per minute
  }),

  // Lenient rate limit for general API
  generalApi: createRateLimit({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100 // 100 requests per minute
  }),

  // Very strict for sensitive operations
  sensitive: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 10 // 10 requests per hour
  })
};