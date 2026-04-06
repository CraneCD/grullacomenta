import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    // Test 1: Check database connection
    const connectionTest = await prisma.$queryRaw`SELECT 1 as test`;
    
    // Test 2: Check table structure
    const tableStructure = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'Review' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    ` as any[];
    
    // Test 3: Get a raw review with all fields
    const rawReview = await prisma.$queryRaw`
      SELECT * FROM "Review" LIMIT 1;
    `;
    
    // Test 4: Try Prisma ORM query
    const prismaReview = await prisma.review.findFirst();
    
    return NextResponse.json({
      status: 'success',
      tests: {
        connectionTest,
        tableStructure,
        rawReview,
        prismaReview,
        prismaReviewKeys: prismaReview ? Object.keys(prismaReview) : [],
        hasYouTubeUrlInTable: tableStructure.some((col: any) => col.column_name === 'youtubeUrl'),
        hasYouTubeUrlInPrisma: prismaReview ? 'youtubeUrl' in prismaReview : false
      }
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
} 