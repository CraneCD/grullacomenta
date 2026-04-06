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
    if (error?.stack) {
      console.error('Stack trace:', error.stack);
    }
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
    logger.info('POST /api/reviews - Starting request processing');
    
    // Apply rate limiting
    const rateLimitResult = rateLimitMiddleware(request);
    if (rateLimitResult) {
      logger.warn('Rate limit exceeded', { 
        ip: request.ip, 
        path: request.nextUrl.pathname 
      });
      return rateLimitResult;
    }
    
    // Check CSRF protection (skip in development)
    if (process.env.NODE_ENV === 'production') {
      const csrfResult = await csrfMiddleware(request);
      if (csrfResult) {
        logger.warn('CSRF validation failed', { 
          ip: request.ip, 
          path: request.nextUrl.pathname 
        });
        return csrfResult;
      }
    } else {
      logger.info('Skipping CSRF check in development mode');
    }
    
    logger.info('Getting server session');
    session = await getServerSession(authOptions);
    logger.info('Session result:', { hasSession: !!session, email: session?.user?.email });
    
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

    logger.info('Parsing request body');
    const body = await request.json();
    logger.info('Request body received:', { 
      hasTitle: !!body.title, 
      hasTitleEs: !!body.titleEs,
      hasTitleEn: !!body.titleEn,
      hasContent: !!body.content, 
      hasContentEs: !!body.contentEs,
      hasContentEn: !!body.contentEn,
      category: body.category 
    });
    
    // Validate input
    logger.info('Validating input data');
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
    const { title, titleEs, titleEn, content, contentEs, contentEn, category, platform, rating, coverImage, imageData, imageMimeType, youtubeUrl, status } = validatedData;

    // Find the user
    logger.info('Finding user in database', { email: session.user.email });
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

    logger.info('User found', { userId: user.id, userName: user.name });

    // Generate slug from primary title (Spanish first, then English, fallback to title)
    const primaryTitle = titleEs || titleEn || title;
    let slug = primaryTitle.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists and make it unique if needed
    const existingSlugs = await prisma.$queryRaw`
      SELECT slug FROM "Review" WHERE slug LIKE ${slug + '%'}
    ` as { slug: string }[];
    
    if (existingSlugs.length > 0) {
      const slugNumbers = existingSlugs
        .map(s => s.slug)
        .filter(s => s.startsWith(slug))
        .map(s => {
          const match = s.match(new RegExp(`^${slug}(?:-(\\d+))?$`));
          return match ? (match[1] ? parseInt(match[1]) : 0) : -1;
        })
        .filter(n => n >= 0);
      
      const maxNumber = slugNumbers.length > 0 ? Math.max(...slugNumbers) : -1;
      if (maxNumber >= 0) {
        slug = `${slug}-${maxNumber + 1}`;
      }
    }

    const reviewData = {
      title,
      titleEs,
      titleEn,
      slug,
      content,
      contentEs,
      contentEn,
      category,
      platform,
      coverImage,
      imageData,
      imageMimeType,
      youtubeUrl,
      status,
      authorId: user.id,
      rating: rating ? parseFloat(rating.toString()) : undefined
    };

    logger.info('Creating new review', { 
      title, 
      category, 
      authorId: user.id 
    });

    // Use raw SQL as a workaround for schema issues
    try {
      // Generate a unique ID for the new review
      const reviewId = `cmb${Date.now()}${Math.random().toString(36).substring(2, 15)}`;
      
      const insertResult = await prisma.$executeRaw`
        INSERT INTO "Review" (
          id, title, "titleEs", "titleEn", slug, content, "contentEs", "contentEn", 
          category, platform, "coverImage", "imageData", "imageMimeType", "youtubeUrl", status, 
          rating, "authorId", "createdAt", "updatedAt"
        ) VALUES (
          ${reviewId},
          ${title},
          ${titleEs || null},
          ${titleEn || null},
          ${slug},
          ${content},
          ${contentEs || null},
          ${contentEn || null},
          ${category},
          ${platform || null},
          ${coverImage || null},
          ${imageData || null},
          ${imageMimeType || null},
          ${youtubeUrl || null},
          ${status},
          ${rating || null},
          ${user.id},
          NOW(),
          NOW()
        )
      `;
      
      logger.info('Raw SQL insert successful', { insertResult, reviewId });
      
      // Get the created review with author information
      const createdReviewData = await prisma.$queryRaw`
        SELECT r.*, u.name as author_name, u.email as author_email
        FROM "Review" r
        JOIN "User" u ON r."authorId" = u.id
        WHERE r.id = ${reviewId}
        LIMIT 1
      ` as any[];
      
      if (createdReviewData.length === 0) {
        throw new Error('Review not found after creation');
      }
      
      const reviewResult = createdReviewData[0];
      const review = {
        ...reviewResult,
        author: {
          name: reviewResult.author_name,
          email: reviewResult.author_email
        }
      };
      
      // Clean up the flat fields
      delete review.author_name;
      delete review.author_email;
      
      logger.info('Review created successfully via raw SQL', { 
        id: review.id, 
        title: review.title 
      });

      return NextResponse.json(review, { status: 201 });
      
    } catch (rawSqlError) {
      logger.error('Raw SQL insert failed, trying ORM fallback', rawSqlError as Error);
      
      // Fallback to ORM (might fail but let's try)
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

      logger.info('Review created successfully via ORM fallback', { 
        id: review.id, 
        title: review.title 
      });

      return NextResponse.json(review, { status: 201 });
    }
  } catch (error) {
    logger.error('Error creating review', error as Error, {
      userEmail: session?.user?.email,
      step: 'unknown'
    });
    
    // Check for specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'A review with this slug already exists' },
          { status: 409 }
        );
      }
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json(
          { error: 'Invalid user reference' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to create review', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 