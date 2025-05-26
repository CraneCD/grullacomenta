import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { generateCsrfToken } from '@/lib/csrf';

export async function GET(request: NextRequest) {
  try {
    console.log('CSRF endpoint: Request received');
    console.log('CSRF endpoint: Request headers:', Object.fromEntries(request.headers.entries()));
    
    const token = await getToken({ req: request });
    console.log('CSRF endpoint: Session token:', token ? 'Found' : 'Not found');
    console.log('CSRF endpoint: Session details:', token);

    if (!token) {
      console.log('CSRF endpoint: No session token found');
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

    if (!token.sub) {
      console.log('CSRF endpoint: No user ID in session token');
      return NextResponse.json(
        { error: 'Invalid session' },
        { 
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
    }

    const csrfToken = generateCsrfToken();
    console.log('CSRF endpoint: Token generated');
    
    const response = NextResponse.json(
      { token: csrfToken },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Set CSRF token in cookie
    response.cookies.set('csrf-token', csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60 // 24 hours
    });

    return response;
  } catch (error) {
    console.error('CSRF endpoint: Error generating CSRF token:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 