import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');
    
    // Test database connection
    await prisma.$connect();
    console.log('Database connected successfully');
    
    // Test if we can query users
    const userCount = await prisma.user.count();
    console.log(`Found ${userCount} users`);
    
    // Check for admin users specifically
    const adminUsers = await prisma.user.findMany({
      where: { role: 'admin' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });
    console.log('Admin users found:', adminUsers);
    
    // Test if we can query reviews
    const reviewCount = await prisma.review.count();
    console.log(`Found ${reviewCount} reviews`);
    
    // Test if we can read all fields including the new ones
    const latestReview = await prisma.review.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('Latest review with all fields:', latestReview);
    
    // Type assertion to access the fields that exist in the database
    const reviewData = latestReview as any;
    
    return NextResponse.json({
      success: true,
      message: 'Database test successful',
      data: {
        userCount,
        adminCount: adminUsers.length,
        adminUsers: adminUsers,
        reviewCount,
        latestReview: latestReview ? {
          id: latestReview.id,
          title: latestReview.title,
          titleEs: reviewData?.titleEs,
          titleEn: reviewData?.titleEn,
          content: latestReview.content,
          contentEs: latestReview.contentEs,
          contentEn: latestReview.contentEn,
          category: latestReview.category,
          createdAt: latestReview.createdAt
        } : null,
        hasMultilingualFields: latestReview ? {
          titleEs: reviewData?.titleEs !== null,
          titleEn: reviewData?.titleEn !== null,
          contentEs: latestReview.contentEs !== null,
          contentEn: latestReview.contentEn !== null
        } : null
      }
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Testing review creation with multilingual fields...');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    // Test creating a review with the new fields
    const testReview = {
      title: body.title || 'Test Review',
      titleEs: body.titleEs || 'Reseña de Prueba',
      titleEn: body.titleEn || 'Test Review English',
      content: body.content || 'Test content',
      contentEs: body.contentEs || 'Contenido de prueba en español',
      contentEn: body.contentEn || 'Test content in English',
      category: body.category || 'test',
      slug: `test-review-${Date.now()}`,
      status: 'draft',
      authorId: body.authorId || 'test-user-id'
    };
    
    console.log('Test review data:', testReview);
    
    return NextResponse.json({
      success: true,
      message: 'Test data prepared successfully',
      testData: testReview,
      note: 'This is just a test endpoint - no actual review was created'
    });
  } catch (error) {
    console.error('Test POST failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 