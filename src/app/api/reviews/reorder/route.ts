import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import { csrfMiddleware } from '@/lib/csrf';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

// PATCH — persist a new display order for reviews.
// Accepts an ordered list of review IDs; each review's `order` is set to its
// index in the list. The order is global and is reflected everywhere reviews
// are listed (home, category pages and the all-reviews page).
export async function PATCH(request: NextRequest) {
  let session;

  try {
    const rateLimitResult = await rateLimitMiddleware(request);
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const ids = body?.ids;

    if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === 'string')) {
      return NextResponse.json(
        { error: 'Expected a non-empty array of review IDs' },
        { status: 400 }
      );
    }

    // Guard against duplicate IDs sneaking in.
    if (new Set(ids).size !== ids.length) {
      return NextResponse.json({ error: 'Duplicate review IDs' }, { status: 400 });
    }

    logger.info('Reordering reviews', { count: ids.length });

    await prisma.$transaction(
      ids.map((id, index) =>
        prisma.review.update({
          where: { id },
          data: { order: index },
        })
      )
    );

    logger.info('Reviews reordered successfully', { count: ids.length });
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error reordering reviews', error as Error, { userEmail: session?.user?.email });

    const message = error instanceof Error ? error.message : String(error);
    const code = (error as { code?: string })?.code;

    if (message.includes('Record to update not found')) {
      return NextResponse.json({ error: 'One or more reviews not found' }, { status: 404 });
    }

    // P2022 = column does not exist in the database. This means the `order`
    // column hasn't been created yet (the `prisma db push` step didn't run).
    if (code === 'P2022' || (message.includes('order') && message.includes('does not exist'))) {
      return NextResponse.json(
        {
          error: 'The "order" column is missing from the database. Run `prisma db push` to create it.',
          detail: message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to reorder reviews', detail: message, code },
      { status: 500 }
    );
  }
}
