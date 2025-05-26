import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/authOptions';
import { handleImageUpload } from '@/lib/imageUtils';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import { csrfMiddleware } from '@/lib/csrf';

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimitMiddleware(request);
    if (rateLimitResult) {
      console.log('Rate limit exceeded');
      return rateLimitResult;
    }
    
    // Check CSRF protection
    const csrfResult = await csrfMiddleware(request);
    if (csrfResult) {
      console.log('CSRF validation failed');
      return csrfResult;
    }
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      console.log('Unauthorized: No valid session found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate that the request has the correct content type
    const contentType = request.headers.get('content-type');
    if (!contentType || !contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Invalid content type. Expected multipart/form-data' },
        { status: 400 }
      );
    }

    console.log('Starting image upload process...');
    // Handle image upload with our utility
    const result = await handleImageUpload(request);
    console.log('Image upload completed successfully');
    return result;
  } catch (error) {
    console.error('Detailed error in upload endpoint:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown error type'
    });

    // Ensure we always return a JSON response
    return NextResponse.json(
      { 
        error: 'Failed to upload image', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
} 