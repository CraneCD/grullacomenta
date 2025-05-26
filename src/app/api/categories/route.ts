import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get all published reviews with their categories and platforms
    const reviews = await prisma.review.findMany({
      where: {
        status: 'published'
      },
      select: {
        category: true,
        platform: true
      }
    });

    // Extract unique categories and platforms
    const categories = new Set<string>();
    const platforms = new Map<string, Set<string>>();

    reviews.forEach(review => {
      if (review.category) {
        categories.add(review.category);
        
        // Initialize platform set for this category if it doesn't exist
        if (!platforms.has(review.category)) {
          platforms.set(review.category, new Set<string>());
        }
        
        // Add platform if it exists
        if (review.platform) {
          platforms.get(review.category)?.add(review.platform);
        }
      }
    });

    // Convert to the format expected by the frontend
    const availableCategories = Array.from(categories).map(category => ({
      category,
      platforms: Array.from(platforms.get(category) || [])
    }));

    return NextResponse.json({
      categories: availableCategories,
      hasReviews: reviews.length > 0
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
} 