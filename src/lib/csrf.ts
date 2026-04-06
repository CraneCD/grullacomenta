import { randomBytes } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Generate a CSRF token
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

// CSRF middleware for API routes
export async function csrfMiddleware(request: NextRequest) {
  console.log('CSRF middleware called for:', request.method, request.nextUrl.pathname);
  
  // Skip CSRF check for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    console.log('Skipping CSRF check for', request.method, 'request');
    return null;
  }
  
  // Get session token
  const token = await getToken({ req: request });
  if (!token) {
    console.log('No session token found in CSRF middleware');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { 
        status: 401,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
  
  // Get CSRF token from header
  const csrfToken = request.headers.get('X-CSRF-Token');
  if (!csrfToken) {
    console.log('No CSRF token found in request headers');
    return NextResponse.json(
      { error: 'CSRF token missing' },
      { 
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }

  // Get CSRF token from cookie
  const cookieToken = request.cookies.get('csrf-token')?.value;
  if (!cookieToken) {
    console.log('No CSRF token found in cookies');
    return NextResponse.json(
      { error: 'CSRF token missing' },
      { 
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
  
  // Validate CSRF token
  if (csrfToken !== cookieToken) {
    console.log('CSRF token mismatch');
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { 
        status: 403,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
  
  // CSRF check passed
  console.log('CSRF check passed');
  return null;
} 