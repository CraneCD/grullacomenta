import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Redis-backed so it works correctly across the multiple concurrent
// serverless instances a deployment runs (an in-memory Map per instance
// neither rate-limits effectively nor evicts old entries, so it grows
// unbounded). This mirrors the limiter middleware.ts uses for page requests.
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(120, '60 s'),
  analytics: true,
  prefix: '@upstash/ratelimit/api',
});

// Rate limiting middleware for API route handlers
export async function rateLimitMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const ip = request.ip ?? 'unknown';

  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      }
    );
  }

  return null;
}
