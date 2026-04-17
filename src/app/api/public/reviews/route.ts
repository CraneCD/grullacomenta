import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const rawLimit = searchParams.get('limit');

    const where: { status: string; category?: string } = {
      status: 'published',
    };

    if (category) {
      where.category = category;
    }

    const take = rawLimit
      ? Math.min(Math.max(1, parseInt(rawLimit, 10) || 1), MAX_LIMIT)
      : undefined;

    const reviews = await prisma.review.findMany({
      where,
      select: {
        id: true,
        title: true,
        titleEs: true,
        titleEn: true,
        category: true,
        platform: true,
        coverImage: true,
        imageData: true,
        imageMimeType: true,
        youtubeUrl: true,
        slug: true,
        rating: true,
        content: true,
        contentEs: true,
        contentEn: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...(take !== undefined ? { take } : {}),
    });

    const transformedReviews = reviews.map((review) => ({
      id: review.id,
      title: review.title,
      titleEs: review.titleEs,
      titleEn: review.titleEn,
      category: review.category,
      platform: review.platform,
      coverImage: review.coverImage,
      imageData: review.imageData ? 'uploaded' : null,
      imageMimeType: review.imageMimeType,
      youtubeUrl: review.youtubeUrl,
      date: review.createdAt,
      updatedAt: review.updatedAt,
      slug: review.slug,
      rating: review.rating,
      content: review.content,
      contentEs: review.contentEs,
      contentEn: review.contentEn,
      status: review.status,
      authorName: review.author.name,
    }));

    return NextResponse.json(transformedReviews);
  } catch (error) {
    console.error('Error fetching public reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}
