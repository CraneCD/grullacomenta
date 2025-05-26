import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/authOptions';
import { reviewSchema, validateInput } from '@/lib/validation';
import { z } from 'zod';
import { csrfMiddleware } from '@/lib/csrf';
import { rateLimitMiddleware } from '@/lib/rateLimit';

// Use global Prisma client for serverless
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Console logger for serverless environment
const logger = {
  info: (message: string, context?: any) => {
    console.log(`[INFO] ${message}`, context ? JSON.stringify(context) : '');
  },
  warn: (message: string, context?: any) => {
    console.warn(`[WARN] ${message}`, context ? JSON.stringify(context) : '');
  },
  error: (message: string, error?: Error, context?: any) => {
    console.error(`[ERROR] ${message}`, error?.message || '', context ? JSON.stringify(context) : '');
  }
};

// GET all reviews
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimitMiddleware(request);
    if (rateLimitResult) {
      logger.warn('Rate limit exceeded', { 
        ip: request.ip, 
        path: request.nextUrl.pathname 
      });
      return rateLimitResult;
    }
    
    logger.info('Fetching all reviews');
    
    const reviews = await prisma.review.findMany({
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    logger.info(`Retrieved ${reviews.length} reviews`);
    return NextResponse.json(reviews);
  } catch (error) {
    logger.error('Error fetching reviews', error as Error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// POST new review
export async function POST(request: NextRequest) {
  let session;
  
  try {
    // Apply rate limiting
    const rateLimitResult = rateLimitMiddleware(request);
    if (rateLimitResult) {
      logger.warn('Rate limit exceeded', { 
        ip: request.ip, 
        path: request.nextUrl.pathname 
      });
      return rateLimitResult;
    }
    
    // Check CSRF protection
    const csrfResult = await csrfMiddleware(request);
    if (csrfResult) {
      logger.warn('CSRF validation failed', { 
        ip: request.ip, 
        path: request.nextUrl.pathname 
      });
      return csrfResult;
    }
    
    session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      logger.warn('Unauthorized review creation attempt', { 
        ip: request.ip, 
        path: request.nextUrl.pathname 
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    
    // Validate input
    const validationResult = validateInput(reviewSchema, body);
    if (!validationResult.success) {
      logger.warn('Invalid review data', { 
        email: session.user.email,
        errors: validationResult.error 
      });
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      );
    }
    
    // Type assertion for the validated data
    const validatedData = validationResult.data as z.infer<typeof reviewSchema>;
    const { title, content, contentEs, contentEn, category, platform, rating, coverImage, imageData, imageMimeType, status } = validatedData;

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      logger.error(`User not found during review creation. Email: ${session.user.email}`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Generate slug from title
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const reviewData = {
      title,
      slug,
      content,
      contentEs,
      contentEn,
      category,
      platform,
      coverImage,
      imageData,
      imageMimeType,
      status,
      authorId: user.id,
      rating: rating ? parseFloat(rating.toString()) : undefined
    };

    logger.info('Creating new review', { 
      title, 
      category, 
      authorId: user.id 
    });

    const review = await prisma.review.create({
      data: reviewData,
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    logger.info('Review created successfully', { 
      id: review.id, 
      title: review.title 
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    logger.error('Error creating review', error as Error, {
      userEmail: session?.user?.email
    });
    return NextResponse.json(
      { error: 'Failed to create review' },
      { status: 500 }
    );
  }
} 