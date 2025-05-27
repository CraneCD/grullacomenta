import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = searchParams.get('limit');

    // Build the where clause
    const where: any = {
      status: 'published' // Only show published reviews
    };

    // Add category filter if specified
    if (category) {
      where.category = category;
    }

    // Build the query options
    const queryOptions: any = {
      where,
      include: {
        author: {
          select: {
            name: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    };

    // Add limit if specified
    if (limit) {
      queryOptions.take = parseInt(limit);
    }

    const reviews = await prisma.review.findMany(queryOptions);

    // Transform the data to match the expected format
    const transformedReviews = reviews.map((review: any) => ({
      id: review.id,
      title: review.title,
      category: review.category,
      platform: review.platform,
      coverImage: review.coverImage,
      imageData: review.imageData ? 'uploaded' : null, // Don't send actual data, just indicate if it exists
      imageMimeType: review.imageMimeType,
      youtubeUrl: review.youtubeUrl,
      date: review.createdAt,
      updatedAt: review.updatedAt, // Add updatedAt for cache busting
      slug: review.slug,
      rating: review.rating,
      content: review.content,
      contentEs: review.contentEs,
      contentEn: review.contentEn,
      status: review.status,
      authorName: review.author.name
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