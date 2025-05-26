import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { NextRequestWithAuth } from 'next-auth/middleware';
import { locales, defaultLocale } from './i18n/request';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import type { NextRequest } from 'next/server';

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always'
});

// Create a new ratelimiter that allows 10 requests per 10 seconds
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
  analytics: true,
  prefix: '@upstash/ratelimit',
});

export default async function middleware(req: NextRequestWithAuth) {
  const pathname = req.nextUrl.pathname;

  // Skip i18n middleware for auth API routes
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // Skip i18n middleware for all API routes
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Handle internationalization for all other routes
  const intlResponse = intlMiddleware(req);
  
  // Extract locale from pathname
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // If no locale in pathname, let intl middleware handle it
  if (pathnameIsMissingLocale) {
    return intlResponse;
  }

  // Extract the locale and the rest of the path
  const segments = pathname.split('/');
  const locale = segments[1];
  const pathWithoutLocale = '/' + segments.slice(2).join('/');

  // Auth logic
  const token = await getToken({ req });
  const isAuth = !!token;
  const isAuthPage = pathWithoutLocale.startsWith('/admin/login');
  const isAdminPage = pathWithoutLocale.startsWith('/admin');

  // For auth pages (login)
  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL(`/${locale}/admin`, req.url));
    }
    return intlResponse || NextResponse.next();
  }

  // For admin pages
  if (!isAuth && isAdminPage) {
    let from = req.nextUrl.pathname;
    if (req.nextUrl.search) {
      from += req.nextUrl.search;
    }

    return NextResponse.redirect(
      new URL(`/${locale}/admin/login?from=${encodeURIComponent(from)}`, req.url)
    );
  }

  // Check admin role
  if (isAuth && isAdminPage && token.role !== 'admin') {
    return NextResponse.redirect(new URL(`/${locale}`, req.url));
  }

  // Skip rate limiting for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/api/auth')
  ) {
    return intlResponse || NextResponse.next();
  }

  // Get the IP address
  const ip = req.ip ?? '127.0.0.1';

  // Rate limit by IP
  const { success, limit, reset, remaining } = await ratelimit.limit(ip);

  // Add rate limit headers
  req.headers.set('X-RateLimit-Limit', limit.toString());
  req.headers.set('X-RateLimit-Remaining', remaining.toString());
  req.headers.set('X-RateLimit-Reset', reset.toString());

  if (!success) {
    return new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': reset.toString(),
      },
    });
  }

  // Add security headers
  const headers = req.headers;
  headers.set('X-DNS-Prefetch-Control', 'on');
  headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  headers.set('X-XSS-Protection', '1; mode=block');
  headers.set('X-Frame-Options', 'SAMEORIGIN');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Referrer-Policy', 'origin-when-cross-origin');
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'"
  );

  // Verify CSRF token for non-GET requests (but not for API routes)
  if (req.method !== 'GET' && !pathname.startsWith('/api/')) {
    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  return intlResponse || NextResponse.next();
}

export const config = {
  matcher: [
    // Enable a redirect to a matching locale at the root
    '/',
    
    // Set a cookie to remember the previous locale for
    // all requests that have a locale prefix
    '/(es|en)/:path*',
    
    // Enable redirects that add missing locales
    // (e.g. `/pathnames` -> `/en/pathnames`)
    // Exclude API routes, Next.js internals and files with extensions
    '/((?!api|_next|_vercel|.*\\..*).*)',

    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ]
}; 