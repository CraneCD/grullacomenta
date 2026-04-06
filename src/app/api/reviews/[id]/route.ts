import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import { reviewSchema, validateInput } from '@/lib/validation';
import { z } from 'zod';

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

// GET single review by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const review = await prisma.review.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
}

// PUT update review
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let session;
  
  try {
    logger.info('PUT /api/reviews/[id] - Starting request processing', { id: params.id });
    
    session = await getServerSession(authOptions);
    logger.info('Session result:', { hasSession: !!session, email: session?.user?.email });
    
    if (!session?.user?.email) {
      logger.warn('Unauthorized review update attempt', { 
        id: params.id,
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

    // Validate input using the same schema as POST
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

    // Check if review exists and user has permission
    logger.info('Finding existing review', { id: params.id });
    const existingReview = await prisma.review.findUnique({
      where: { id: params.id },
      include: { author: true }
    });

    if (!existingReview) {
      logger.warn('Review not found', { id: params.id });
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if user is the author or has admin role
    logger.info('Finding user in database', { email: session.user.email });
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      logger.error(`User not found during review update. Email: ${session.user.email}`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (existingReview.authorId !== user.id && user.role !== 'admin') {
      logger.warn('Forbidden review update attempt', { 
        reviewId: params.id,
        reviewAuthorId: existingReview.authorId,
        userId: user.id,
        userRole: user.role
      });
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Generate new slug if primary title changed
    const primaryTitle = titleEs || titleEn || title;
    const existingPrimaryTitle = (existingReview as any).titleEs || (existingReview as any).titleEn || existingReview.title;
    let slug = existingReview.slug;
    if (primaryTitle !== existingPrimaryTitle) {
      slug = primaryTitle.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const updateData = {
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
      updatedAt: new Date(),
      rating: rating ? parseFloat(rating.toString()) : undefined
    };

    logger.info('Updating review', { 
      id: params.id, 
      title, 
      category, 
      authorId: user.id 
    });

    // Use raw SQL as a workaround for schema issues
    try {
      const updateResult = await prisma.$executeRaw`
        UPDATE "Review" 
        SET 
          title = ${title},
          "titleEs" = ${titleEs || null},
          "titleEn" = ${titleEn || null},
          slug = ${slug},
          content = ${content},
          "contentEs" = ${contentEs || null},
          "contentEn" = ${contentEn || null},
          category = ${category},
          platform = ${platform || null},
          "coverImage" = ${coverImage || null},
          "imageData" = ${imageData || null},
          "imageMimeType" = ${imageMimeType || null},
          "youtubeUrl" = ${youtubeUrl || null},
          status = ${status},
          rating = ${rating || null},
          "updatedAt" = NOW()
        WHERE id = ${params.id}
      `;
      
      logger.info('Raw SQL update successful', { updateResult });
      
      // Get the updated review
      const updatedReviewData = await prisma.$queryRaw`
        SELECT r.*, u.name as author_name, u.email as author_email
        FROM "Review" r
        JOIN "User" u ON r."authorId" = u.id
        WHERE r.id = ${params.id}
        LIMIT 1
      ` as any[];
      
      if (updatedReviewData.length === 0) {
        throw new Error('Review not found after update');
      }
      
      const reviewResult = updatedReviewData[0];
      const updatedReview = {
        ...reviewResult,
        author: {
          name: reviewResult.author_name,
          email: reviewResult.author_email
        }
      };
      
      // Clean up the flat fields
      delete updatedReview.author_name;
      delete updatedReview.author_email;
      
      logger.info('Review updated successfully via raw SQL', { 
        id: updatedReview.id, 
        title: updatedReview.title 
      });
      
      return NextResponse.json(updatedReview);
      
    } catch (rawSqlError) {
      logger.error('Raw SQL update failed, trying ORM fallback', rawSqlError as Error);
      
      // Fallback to ORM (might fail but let's try)
      const updatedReview = await prisma.review.update({
        where: { id: params.id },
        data: updateData,
        include: {
          author: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });
      
             return NextResponse.json(updatedReview);
     }
  } catch (error) {
    logger.error('Error updating review', error as Error, {
      userEmail: session?.user?.email,
      reviewId: params.id
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
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json(
          { error: 'Review not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update review', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE review
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  let session;
  
  try {
    logger.info('DELETE /api/reviews/[id] - Starting request processing', { id: params.id });
    
    session = await getServerSession(authOptions);
    logger.info('Session result:', { hasSession: !!session, email: session?.user?.email });
    
    if (!session?.user?.email) {
      logger.warn('Unauthorized review deletion attempt', { 
        id: params.id,
        ip: request.ip, 
        path: request.nextUrl.pathname 
      });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if review exists and user has permission
    logger.info('Finding existing review', { id: params.id });
    const existingReview = await prisma.review.findUnique({
      where: { id: params.id },
      include: { author: true }
    });

    if (!existingReview) {
      logger.warn('Review not found', { id: params.id });
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if user is the author or has admin role
    logger.info('Finding user in database', { email: session.user.email });
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user) {
      logger.error(`User not found during review deletion. Email: ${session.user.email}`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (existingReview.authorId !== user.id && user.role !== 'admin') {
      logger.warn('Forbidden review deletion attempt', { 
        reviewId: params.id,
        reviewAuthorId: existingReview.authorId,
        userId: user.id,
        userRole: user.role
      });
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    logger.info('Deleting review', { id: params.id, title: existingReview.title });
    await prisma.review.delete({
      where: { id: params.id }
    });

    logger.info('Review deleted successfully', { id: params.id });
    return NextResponse.json(
      { message: 'Review deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Error deleting review', error as Error, {
      userEmail: session?.user?.email,
      reviewId: params.id
    });
    
    // Check for specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json(
          { error: 'Review not found' },
          { status: 404 }
        );
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to delete review', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 