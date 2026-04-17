import { NextRequest, NextResponse } from 'next/server';
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
        imageData: true,
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
      orderBy: { createdAt: 'desc' },
      take: SEARCH_LIMIT,
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
