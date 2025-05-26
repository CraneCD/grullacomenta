import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json([]);
    }

    const searchTerm = query.trim();

    // Search in title and content
    const reviews = await prisma.review.findMany({
      where: {
        status: 'published',
        OR: [
          {
            title: {
              contains: searchTerm
            }
          },
          {
            content: {
              contains: searchTerm
            }
          }
        ]
      },
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
    });

    // Transform the data to match the expected format
    const transformedReviews = reviews.map((review: any) => ({
      id: review.id,
      title: review.title,
      category: review.category,
      platform: review.platform,
      coverImage: review.coverImage,
      imageData: review.imageData ? 'uploaded' : null,
      imageMimeType: review.imageMimeType,
      date: review.createdAt,
      updatedAt: review.updatedAt,
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
    console.error('Error searching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to search reviews' },
      { status: 500 }
    );
  }
} 