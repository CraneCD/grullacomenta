import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

const SEARCH_LIMIT = 50;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json([]);
    }

    const searchTerm = query.trim();

    const reviews = await prisma.review.findMany({
      where: {
        status: 'published',
        OR: [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { titleEs: { contains: searchTerm, mode: 'insensitive' } },
          { titleEn: { contains: searchTerm, mode: 'insensitive' } },
          { content: { contains: searchTerm, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        title: true,
        titleEs: true,
        titleEn: true,
        category: true,
        platform: true,
        coverImage: true,
        imageMimeType: true,
        youtubeUrl: true,
        slug: true,
        rating: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: { name: true },
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      take: SEARCH_LIMIT,
    });

    const reviewIds = reviews.map((review: (typeof reviews)[number]) => review.id);
    const imageFlags = reviewIds.length > 0
      ? await prisma.$queryRaw`
          SELECT id, ("imageData" IS NOT NULL AND "imageData" != '') AS "hasImageData"
          FROM "Review"
          WHERE id IN (${Prisma.join(reviewIds)})
        ` as { id: string; hasImageData: boolean }[]
      : [];

    const hasImageById = new Map(imageFlags.map((f) => [f.id, f.hasImageData]));

    const transformedReviews = reviews.map((review: (typeof reviews)[number]) => ({
      id: review.id,
      title: review.title,
      titleEs: review.titleEs,
      titleEn: review.titleEn,
      category: review.category,
      platform: review.platform,
      coverImage: review.coverImage,
      imageData: hasImageById.get(review.id) ? 'uploaded' : null,
      imageMimeType: review.imageMimeType,
      youtubeUrl: review.youtubeUrl,
      date: review.createdAt,
      updatedAt: review.updatedAt,
      slug: review.slug,
      rating: review.rating,
      status: review.status,
      authorName: review.author.name,
    }));

    return NextResponse.json(transformedReviews);
  } catch (error) {
    console.error('Error searching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to search reviews' },
      { status: 500 }
    );
  }
}
