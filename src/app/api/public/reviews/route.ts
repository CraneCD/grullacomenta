import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Force fresh deployment - ensure youtubeUrl is included
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
    
    // Debug logging for production
    console.log('DEBUG: Raw reviews from database:', JSON.stringify(reviews, null, 2));
    if (reviews.length > 0) {
      const firstReview = reviews[0] as any;
      console.log('DEBUG: First review youtubeUrl:', firstReview.youtubeUrl);
      console.log('DEBUG: First review keys:', Object.keys(firstReview));
    }

    // Transform the data to match the expected format
    const transformedReviews = reviews.map((review: any) => ({
      id: review.id,
      title: review.title,
      category: review.category,
      platform: review.platform,
      coverImage: review.coverImage,
      imageData: review.imageData ? 'uploaded' : null, // Don't send actual data, just indicate if it exists
      imageMimeType: review.imageMimeType,
      youtubeUrl: review.youtubeUrl, // Ensure this field is included
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

    // Debug logging for transformed data
    console.log('DEBUG: Transformed reviews:', JSON.stringify(transformedReviews, null, 2));

    return NextResponse.json(transformedReviews);
  } catch (error) {
    console.error('Error fetching public reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
} 