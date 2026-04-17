import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/authOptions';
import { reviewSchema, validateInput } from '@/lib/validation';
import { z } from 'zod';
import { csrfMiddleware } from '@/lib/csrf';
import { rateLimitMiddleware } from '@/lib/rateLimit';
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

// GET all reviews — requires authentication (admin panel use)
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = rateLimitMiddleware(request);
    if (rateLimitResult) {
      logger.warn('Rate limit exceeded', { ip: request.ip, path: request.nextUrl.pathname });
      return rateLimitResult;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('Fetching all reviews');

    const reviews = await prisma.review.findMany({
      include: {
        author: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    logger.info(`Retrieved ${reviews.length} reviews`);
    return NextResponse.json(reviews);
  } catch (error) {
    logger.error('Error fetching reviews', error as Error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

// POST new review
export async function POST(request: NextRequest) {
  let session;

  try {
    logger.info('POST /api/reviews - Starting request processing');

    const rateLimitResult = rateLimitMiddleware(request);
    if (rateLimitResult) {
      logger.warn('Rate limit exceeded', { ip: request.ip, path: request.nextUrl.pathname });
      return rateLimitResult;
    }

    if (process.env.NODE_ENV === 'production') {
      const csrfResult = await csrfMiddleware(request);
      if (csrfResult) {
        logger.warn('CSRF validation failed', { ip: request.ip, path: request.nextUrl.pathname });
        return csrfResult;
      }
    }

    session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      logger.warn('Unauthorized review creation attempt', { ip: request.ip, path: request.nextUrl.pathname });
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

    const user = await prisma.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      logger.error(`User not found during review creation. Email: ${session.user.email}`);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate unique slug
    const primaryTitle = titleEs || titleEn || title;
    let slug = primaryTitle.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existingSlugs = await prisma.$queryRaw`
      SELECT slug FROM "Review" WHERE slug LIKE ${slug + '%'}
    ` as { slug: string }[];

    if (existingSlugs.length > 0) {
      const slugNumbers = existingSlugs
        .map((s) => s.slug)
        .filter((s) => s.startsWith(slug))
        .map((s) => {
          const match = s.match(new RegExp(`^${slug}(?:-(\\d+))?$`));
          return match ? (match[1] ? parseInt(match[1]) : 0) : -1;
        })
        .filter((n) => n >= 0);

      const maxNumber = slugNumbers.length > 0 ? Math.max(...slugNumbers) : -1;
      if (maxNumber >= 0) {
        slug = `${slug}-${maxNumber + 1}`;
      }
    }

    logger.info('Creating new review', { title, category, authorId: user.id });

    const review = await prisma.review.create({
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
        authorId: user.id,
        rating: rating ? parseFloat(rating.toString()) : undefined,
      },
      include: {
        author: {
          select: { name: true, email: true },
        },
      },
    });

    logger.info('Review created successfully', { id: review.id, title: review.title });
    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    logger.error('Error creating review', error as Error, { userEmail: session?.user?.email });

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

    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
