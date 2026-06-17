import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';
import { prisma } from '@/lib/prisma';

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
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
    const animeCount = categoryStats.find((stat: { category: string; _count: { category: number } }) => stat.category === 'anime')?._count.category || 0;
    const mangaCount = categoryStats.find((stat: { category: string; _count: { category: number } }) => stat.category === 'manga')?._count.category || 0;
    const videoGamesCount = categoryStats.find((stat: { category: string; _count: { category: number } }) => stat.category === 'video-games')?._count.category || 0;

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
      recentActivity: recentReviews.map((review: { id: string; title: string; author: { name: string | null }; updatedAt: Date; status: string }) => ({
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