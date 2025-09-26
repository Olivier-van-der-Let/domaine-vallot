// Simple in-memory rate limiter for API endpoints
// For production, consider using Redis or similar distributed cache

interface RateLimitOptions {
  interval: number; // Time window in milliseconds
  uniqueTokenPerInterval: number; // Max unique tokens per interval
}

interface TokenInfo {
  count: number;
  lastReset: number;
}

class RateLimiter {
  private tokens = new Map<string, TokenInfo>();
  private interval: number;
  private maxRequests: number;

  constructor(options: RateLimitOptions) {
    this.interval = options.interval;
    this.maxRequests = options.uniqueTokenPerInterval;

    // Clean up old entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  async check(token: string, limit: number): Promise<void> {
    const now = Date.now();
    const tokenInfo = this.tokens.get(token);

    if (!tokenInfo || now - tokenInfo.lastReset > this.interval) {
      // Reset counter for new interval
      this.tokens.set(token, { count: 1, lastReset: now });
      return;
    }

    if (tokenInfo.count >= limit) {
      throw new Error('Rate limit exceeded');
    }

    // Increment counter
    tokenInfo.count++;
    this.tokens.set(token, tokenInfo);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [token, info] of this.tokens.entries()) {
      if (now - info.lastReset > this.interval * 2) {
        this.tokens.delete(token);
      }
    }
  }

  // Get current rate limit status for a token
  getStatus(token: string): { count: number; remaining: number; resetTime: number } {
    const tokenInfo = this.tokens.get(token);
    const now = Date.now();

    if (!tokenInfo || now - tokenInfo.lastReset > this.interval) {
      return {
        count: 0,
        remaining: this.maxRequests,
        resetTime: now + this.interval
      };
    }

    return {
      count: tokenInfo.count,
      remaining: Math.max(0, this.maxRequests - tokenInfo.count),
      resetTime: tokenInfo.lastReset + this.interval
    };
  }
}

// Factory function to create rate limiter instances
export function rateLimit(options: RateLimitOptions): RateLimiter {
  return new RateLimiter(options);
}

// Common rate limiter configurations
export const rateLimiters = {
  // General API endpoints
  general: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 100
  }),

  // Authentication endpoints (stricter)
  auth: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 50
  }),

  // Contact form (very strict)
  contact: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 10
  }),

  // Password reset (very strict)
  passwordReset: rateLimit({
    interval: 60 * 1000, // 1 minute
    uniqueTokenPerInterval: 3
  })
};

// Middleware helper for Next.js API routes
export function withRateLimit(limiter: RateLimiter, maxRequests: number = 10) {
  return async function rateLimitMiddleware(
    request: Request,
    getIdentifier?: (req: Request) => string
  ): Promise<void> {
    // Extract identifier (IP address or user ID)
    let identifier: string;

    if (getIdentifier) {
      identifier = getIdentifier(request);
    } else {
      // Try to get IP from headers
      const xForwardedFor = request.headers.get('x-forwarded-for');
      const xRealIp = request.headers.get('x-real-ip');

      if (xForwardedFor) {
        identifier = xForwardedFor.split(',')[0].trim();
      } else if (xRealIp) {
        identifier = xRealIp;
      } else {
        identifier = 'unknown';
      }
    }

    await limiter.check(identifier, maxRequests);
  };
}

// Rate limiting decorator for API route handlers
export function apiRateLimit(options: {
  limiter?: RateLimiter;
  maxRequests?: number;
  getIdentifier?: (req: Request) => string;
} = {}) {
  const {
    limiter = rateLimiters.general,
    maxRequests = 60,
    getIdentifier
  } = options;

  return function decorator(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const request = args[0]; // Assume first argument is the request

      try {
        await withRateLimit(limiter, maxRequests)(request, getIdentifier);
        return originalMethod.apply(this, args);
      } catch (error) {
        // Return rate limit error response
        return new Response(
          JSON.stringify({
            error: 'Too many requests',
            message: 'Rate limit exceeded. Please try again later.',
            code: 'RATE_LIMITED'
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '60' // Suggest retry after 60 seconds
            }
          }
        );
      }
    };

    return descriptor;
  };
}

// Helper to create headers with rate limit info
export function createRateLimitHeaders(limiter: RateLimiter, token: string): Record<string, string> {
  const status = limiter.getStatus(token);

  return {
    'X-RateLimit-Limit': String(status.count + status.remaining),
    'X-RateLimit-Remaining': String(status.remaining),
    'X-RateLimit-Reset': String(Math.ceil(status.resetTime / 1000))
  };
}

// IP-based rate limiting for specific use cases
export class IPRateLimiter {
  private limiter: RateLimiter;

  constructor(options: RateLimitOptions) {
    this.limiter = new RateLimiter(options);
  }

  async checkIP(request: Request, maxRequests: number = 10): Promise<void> {
    const ip = this.extractIP(request);
    await this.limiter.check(ip, maxRequests);
  }

  private extractIP(request: Request): string {
    // Extract IP from various possible headers
    const xForwardedFor = request.headers.get('x-forwarded-for');
    const xRealIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');

    if (xForwardedFor) {
      return xForwardedFor.split(',')[0].trim();
    }
    if (xRealIp) {
      return xRealIp;
    }
    if (cfConnectingIp) {
      return cfConnectingIp;
    }

    return 'unknown';
  }

  getIPStatus(request: Request) {
    const ip = this.extractIP(request);
    return this.limiter.getStatus(ip);
  }
}

// Export default rate limiter instance for common use
export default rateLimit;