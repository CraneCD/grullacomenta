import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const review = await prisma.review.findUnique({
      where: { id: params.id },
      select: {
        imageData: true,
        imageMimeType: true,
        coverImage: true
      }
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // If there's uploaded image data, serve it
    if (review.imageData && review.imageMimeType) {
      const imageBuffer = Buffer.from(review.imageData, 'base64');
      
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': review.imageMimeType,
          'Cache-Control': 'public, max-age=3600, must-revalidate', // Cache for 1 hour but revalidate
        },
      });
    }

    // If no uploaded image but has coverImage URL, redirect to it
    if (review.coverImage) {
      return NextResponse.redirect(review.coverImage);
    }

    // No image found
    return NextResponse.json(
      { error: 'No image found for this review' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json(
      { error: 'Failed to serve image' },
      { status: 500 }
    );
  }
} 