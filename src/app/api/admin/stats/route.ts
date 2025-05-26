import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get total review count
    const totalReviews = await prisma.review.count();

    // Get review counts by category
    const categoryStats = await prisma.review.groupBy({
      by: ['category'],
      _count: {
        category: true
      }
    });

    // Calculate category-specific counts
    const animeCount = categoryStats.find(stat => stat.category === 'anime')?._count.category || 0;
    const mangaCount = categoryStats.find(stat => stat.category === 'manga')?._count.category || 0;
    const videoGamesCount = categoryStats.find(stat => stat.category === 'video-games')?._count.category || 0;

    // Get recent reviews for activity feed
    const recentReviews = await prisma.review.findMany({
      take: 5,
      orderBy: {
        updatedAt: 'desc'
      },
      include: {
        author: {
          select: {
            name: true
          }
        }
      }
    });

    const stats = {
      totalReviews,
      animeAndMangaReviews: animeCount + mangaCount,
      videoGameReviews: videoGamesCount,
      recentActivity: recentReviews.map(review => ({
        id: review.id,
        title: review.title,
        action: 'Updated',
        authorName: review.author.name,
        updatedAt: review.updatedAt,
        status: review.status
      }))
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
} 