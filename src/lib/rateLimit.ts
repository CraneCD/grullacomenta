import { NextRequest, NextResponse } from 'next/server';

// Simple in-memory store for rate limiting
// In a production environment, use Redis or a similar distributed cache
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 120; // 120 requests per minute

// Rate limiting middleware
export function rateLimitMiddleware(request: NextRequest) {
  // Skip rate limiting for static assets and CSRF endpoint
  if (request.nextUrl.pathname.startsWith('/_next') || 
      request.nextUrl.pathname.startsWith('/static') ||
      request.nextUrl.pathname === '/api/csrf') {
    return null;
  }
  
  // Get client IP
  const ip = request.ip || 'unknown';
  const key = ip; // Track globally per IP instead of per endpoint
  
  // Get current time
  const now = Date.now();
  
  // Get rate limit data for this IP
  const rateLimitData = rateLimitStore.get(key);
  
  // If no data exists or the window has expired, create new data
  if (!rateLimitData || now > rateLimitData.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return null;
  }
  
  // Increment request count
  rateLimitData.count++;
  
  // Check if rate limit exceeded
  if (rateLimitData.count > RATE_LIMIT_MAX_REQUESTS) {
    // Calculate time until reset
    const resetTime = new Date(rateLimitData.resetTime).toISOString();
    
    return NextResponse.json(
      { 
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
        resetTime
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.ceil((rateLimitData.resetTime - now) / 1000).toString(),
          'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetTime
        }
      }
    );
  }
  
  // Rate limit not exceeded
  return null;
}

// Clean up expired rate limit data periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (now > data.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 1000); // Clean up every minute 