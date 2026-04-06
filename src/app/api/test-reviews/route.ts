import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { reviewSchema, validateInput } from '@/lib/validation';
import { z } from 'zod';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json({
      message: 'Test reviews GET endpoint working',
      timestamp: new Date().toISOString(),
      method: 'GET'
    });
  } catch (error) {
    return NextResponse.json({
      message: 'Test reviews GET endpoint error',
      timestamp: new Date().toISOString(),
      method: 'GET',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Testing review creation with multilingual fields...');
    
    const body = await request.json();
    console.log('Request body:', body);
    
    // Test validation first
    const validationResult = validateInput(reviewSchema, body);
    if (!validationResult.success) {
      return NextResponse.json({
        success: false,
        message: 'Validation failed',
        error: validationResult.error
      }, { status: 400 });
    }
    
    const validatedData = validationResult.data as z.infer<typeof reviewSchema>;
    const { title, titleEs, titleEn, content, contentEs, contentEn, category, platform, rating, coverImage, imageData, imageMimeType, status } = validatedData;
    
    // Generate slug from primary title
    const primaryTitle = titleEs || titleEn || title;
    const slug = `test-${primaryTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}-${Date.now()}`;
    
    // For testing, we'll use the first admin user as the author
    const adminUser = await prisma.user.findFirst({
      where: { role: 'admin' }
    });
    
    if (!adminUser) {
      return NextResponse.json({
        success: false,
        message: 'No admin user found for testing'
      }, { status: 400 });
    }
    
    const reviewData = {
      title,
      titleEs,
      titleEn,
      slug,
      content,
      contentEs,
      contentEn,
      category,
      platform,
      coverImage,
      imageData,
      imageMimeType,
      status,
      authorId: adminUser.id,
      rating: rating ? parseFloat(rating.toString()) : undefined
    };
    
    console.log('Creating test review with data:', reviewData);
    
    const review = await prisma.review.create({
      data: reviewData,
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });
    
    return NextResponse.json({
      success: true,
      message: 'Test review created successfully',
      review: review
    }, { status: 201 });
  } catch (error) {
    console.error('Test review creation failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Test review creation failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 