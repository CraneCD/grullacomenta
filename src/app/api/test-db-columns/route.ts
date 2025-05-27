import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    console.log('=== TESTING DATABASE COLUMNS ===');
    
    const body = await request.json();
    const { reviewId } = body;
    
    if (!reviewId) {
      return NextResponse.json({
        error: 'reviewId is required'
      }, { status: 400 });
    }
    
    // First, check what columns exist
    console.log('Checking columns...');
    const columns = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'Review'
      ORDER BY ordinal_position;
    ` as { column_name: string; data_type: string }[];
    
    console.log('Available columns:', columns.map(c => c.column_name));
    
    // Try to select the review using raw SQL
    console.log('Selecting review with raw SQL...');
    const rawReview = await prisma.$queryRaw`
      SELECT id, title, "titleEs", "titleEn", content, "contentEs", "contentEn", category, platform, "coverImage", "imageData", "imageMimeType", status, "createdAt", "updatedAt", "authorId"
      FROM "Review" 
      WHERE id = ${reviewId}
      LIMIT 1;
    ` as any[];
    
    console.log('Raw review found:', rawReview.length > 0);
    
    if (rawReview.length === 0) {
      return NextResponse.json({
        error: 'Review not found',
        reviewId,
        availableColumns: columns.map(c => c.column_name)
      }, { status: 404 });
    }
    
    // Try to update using raw SQL
    console.log('Attempting raw SQL update...');
    const updateResult = await prisma.$executeRaw`
      UPDATE "Review" 
      SET 
        title = 'Test Title - Raw SQL Update',
        "titleEs" = 'Título de Prueba - Actualización SQL',
        "titleEn" = 'Test Title - Raw SQL Update',
        "updatedAt" = NOW()
      WHERE id = ${reviewId}
    `;
    
    console.log('Raw SQL update result:', updateResult);
    
    // Verify the update
    const updatedReview = await prisma.$queryRaw`
      SELECT id, title, "titleEs", "titleEn", "updatedAt"
      FROM "Review" 
      WHERE id = ${reviewId}
      LIMIT 1;
    ` as any[];
    
    return NextResponse.json({
      success: true,
      message: 'Raw SQL update successful',
      availableColumns: columns.map(c => c.column_name),
      reviewFound: rawReview.length > 0,
      updateResult,
      updatedReview: updatedReview[0] || null
    });
    
  } catch (error) {
    console.error('Database column test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 