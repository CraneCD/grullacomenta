import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import { reviewSchema, validateInput } from '@/lib/validation';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';

const logger = {
  info: (message: string, context?: unknown) => {
    console.log(`[INFO] ${message}`, context ? JSON.stringify(context) : '');
  },
  warn: (message: string, context?: unknown) => {
    console.warn(`[WARN] ${message}`, context ? JSON.stringify(context) : '');
  },
  error: (message: string, error?: Error, context?: unknown) => {
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
          select: { name: true, email: true },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json({ error: 'Failed to fetch review' }, { status: 500 });
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
    if (!session?.user?.email) {
      logger.warn('Unauthorized review update attempt', { id: params.id, ip: request.ip });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const validationResult = validateInput(reviewSchema, body);
    if (!validationResult.success) {
      logger.warn('Invalid review data', { email: session.user.email, errors: validationResult.error });
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }

    const validatedData = validationResult.data as z.infer<typeof reviewSchema>;
    const {
      title, titleEs, titleEn,
      content, contentEs, contentEn,
      category, platform, rating,
      coverImage, imageData, imageMimeType, youtubeUrl, status,
    } = validatedData;

    const existingReview = await prisma.review.findUnique({
      where: { id: params.id },
      include: { author: true },
    });

    if (!existingReview) {
      logger.warn('Review not found', { id: params.id });
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      logger.error(`User not found during review update. Email: ${session.user.email}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (existingReview.authorId !== user.id && user.role !== 'admin') {
      logger.warn('Forbidden review update attempt', {
        reviewId: params.id,
        reviewAuthorId: existingReview.authorId,
        userId: user.id,
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Regenerate slug only if the primary title changed
    const primaryTitle = titleEs || titleEn || title;
    const existingPrimaryTitle = existingReview.titleEs || existingReview.titleEn || existingReview.title;
    let slug = existingReview.slug;
    if (primaryTitle !== existingPrimaryTitle) {
      slug = primaryTitle.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    logger.info('Updating review', { id: params.id, title, category, authorId: user.id });

    const updatedReview = await prisma.review.update({
      where: { id: params.id },
      data: {
        title,
        titleEs: titleEs ?? null,
        titleEn: titleEn ?? null,
        slug,
        content,
        contentEs: contentEs ?? null,
        contentEn: contentEn ?? null,
        category,
        platform: platform ?? null,
        coverImage: coverImage ?? null,
        imageData: imageData ?? null,
        imageMimeType: imageMimeType ?? null,
        youtubeUrl: youtubeUrl ?? null,
        status,
        rating: rating ? parseFloat(rating.toString()) : undefined,
      },
      include: {
        author: {
          select: { name: true, email: true },
        },
      },
    });

    logger.info('Review updated successfully', { id: updatedReview.id, title: updatedReview.title });
    return NextResponse.json(updatedReview);
  } catch (error) {
    logger.error('Error updating review', error as Error, {
      userEmail: session?.user?.email,
      reviewId: params.id,
    });

    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return NextResponse.json(
          { error: 'A review with this slug already exists' },
          { status: 409 }
        );
      }
      if (error.message.includes('Foreign key constraint')) {
        return NextResponse.json({ error: 'Invalid user reference' }, { status: 400 });
      }
      if (error.message.includes('Record to update not found')) {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 });
      }
    }

    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
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
    if (!session?.user?.email) {
      logger.warn('Unauthorized review deletion attempt', { id: params.id, ip: request.ip });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existingReview = await prisma.review.findUnique({
      where: { id: params.id },
      include: { author: true },
    });

    if (!existingReview) {
      logger.warn('Review not found', { id: params.id });
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      logger.error(`User not found during review deletion. Email: ${session.user.email}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (existingReview.authorId !== user.id && user.role !== 'admin') {
      logger.warn('Forbidden review deletion attempt', {
        reviewId: params.id,
        reviewAuthorId: existingReview.authorId,
        userId: user.id,
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    logger.info('Deleting review', { id: params.id, title: existingReview.title });
    await prisma.review.delete({ where: { id: params.id } });

    logger.info('Review deleted successfully', { id: params.id });
    return NextResponse.json({ message: 'Review deleted successfully' }, { status: 200 });
  } catch (error) {
    logger.error('Error deleting review', error as Error, {
      userEmail: session?.user?.email,
      reviewId: params.id,
    });

    if (error instanceof Error && error.message.includes('Record to delete does not exist')) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
