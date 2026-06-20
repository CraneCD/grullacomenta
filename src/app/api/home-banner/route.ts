import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/authOptions';
import { homeBannerSchema, validateInput } from '@/lib/validation';
import { z } from 'zod';
import { csrfMiddleware } from '@/lib/csrf';
import { rateLimitMiddleware } from '@/lib/rateLimit';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

const BANNER_ID = 'home';

// GET the full banner record (admin only — includes raw imageData so the
// editor can show a preview of an uploaded background).
export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await rateLimitMiddleware(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const banner = await prisma.homeBanner.findUnique({ where: { id: BANNER_ID } });
    return NextResponse.json(banner ?? {});
  } catch (error) {
    logger.error('Error fetching home banner', error as Error);
    return NextResponse.json({ error: 'Failed to fetch home banner' }, { status: 500 });
  }
}

// PUT (upsert) the banner record (admin only).
export async function PUT(request: NextRequest) {
  let session;
  try {
    const rateLimitResult = await rateLimitMiddleware(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    if (process.env.NODE_ENV === 'production') {
      const csrfResult = await csrfMiddleware(request);
      if (csrfResult) {
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
    const validationResult = validateInput(homeBannerSchema, body);
    if (!validationResult.success) {
      return NextResponse.json({ error: validationResult.error }, { status: 400 });
    }

    const data = validationResult.data as z.infer<typeof homeBannerSchema>;

    // Normalise undefined → null so cleared fields are actually wiped.
    const values = {
      kickerEs: data.kickerEs ?? null,
      kickerEn: data.kickerEn ?? null,
      titleEs: data.titleEs ?? null,
      titleEn: data.titleEn ?? null,
      subtitleEs: data.subtitleEs ?? null,
      subtitleEn: data.subtitleEn ?? null,
      primaryLabelEs: data.primaryLabelEs ?? null,
      primaryLabelEn: data.primaryLabelEn ?? null,
      primaryLink: data.primaryLink ?? null,
      secondaryLabelEs: data.secondaryLabelEs ?? null,
      secondaryLabelEn: data.secondaryLabelEn ?? null,
      secondaryLink: data.secondaryLink ?? null,
      backgroundImage: data.backgroundImage ?? null,
      imageData: data.imageData ?? null,
      imageMimeType: data.imageMimeType ?? null,
    };

    const banner = await prisma.homeBanner.upsert({
      where: { id: BANNER_ID },
      update: values,
      create: { id: BANNER_ID, ...values },
    });

    logger.info('Home banner updated', { email: session.user.email });
    return NextResponse.json(banner);
  } catch (error) {
    logger.error('Error updating home banner', error as Error, { userEmail: session?.user?.email });
    return NextResponse.json({ error: 'Failed to update home banner' }, { status: 500 });
  }
}
