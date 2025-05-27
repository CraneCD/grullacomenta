import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/authOptions';

const prisma = new PrismaClient();

// GET single review by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const review = await prisma.review.findUnique({
      where: { id: params.id },
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(review);
  } catch (error) {
    console.error('Error fetching review:', error);
    return NextResponse.json(
      { error: 'Failed to fetch review' },
      { status: 500 }
    );
  }
}

// PUT update review
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, titleEs, titleEn, content, contentEs, contentEn, category, platform, rating, coverImage, imageData, imageMimeType, status } = body;

    // Check if review exists and user has permission
    const existingReview = await prisma.review.findUnique({
      where: { id: params.id },
      include: { author: true }
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if user is the author or has admin role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || (existingReview.authorId !== user.id && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Generate new slug if primary title changed
    const primaryTitle = titleEs || titleEn || title;
    const existingPrimaryTitle = (existingReview as any).titleEs || (existingReview as any).titleEn || existingReview.title;
    let slug = existingReview.slug;
    if (primaryTitle !== existingPrimaryTitle) {
      slug = primaryTitle.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    const updateData: any = {
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
      updatedAt: new Date()
    };

    if (rating) {
      updateData.rating = parseFloat(rating);
    }

    const updatedReview = await prisma.review.update({
      where: { id: params.id },
      data: updateData,
      include: {
        author: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(updatedReview);
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
}

// DELETE review
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if review exists and user has permission
    const existingReview = await prisma.review.findUnique({
      where: { id: params.id },
      include: { author: true }
    });

    if (!existingReview) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    // Check if user is the author or has admin role
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    if (!user || (existingReview.authorId !== user.id && user.role !== 'admin')) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    await prisma.review.delete({
      where: { id: params.id }
    });

    return NextResponse.json(
      { message: 'Review deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json(
      { error: 'Failed to delete review' },
      { status: 500 }
    );
  }
} 