import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const ALLOWED_IMAGE_HOSTS = [
  'example.com',
  'images.unsplash.com',
  'via.placeholder.com',
  'picsum.photos',
  'imgsrv.crunchyroll.com',
  'images3.alphacoders.com',
  'i.imgur.com',
  'cdn.myanimelist.net',
];

function isAllowedImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') return false;
    return ALLOWED_IMAGE_HOSTS.some(
      (host) => parsed.hostname === host || parsed.hostname.endsWith('.' + host)
    );
  } catch {
    return false;
  }
}

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

    if (review.imageData && review.imageMimeType) {
      const imageBuffer = Buffer.from(review.imageData, 'base64');
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': review.imageMimeType,
          'Cache-Control': 'public, max-age=3600, must-revalidate',
        },
      });
    }

    if (review.coverImage) {
      if (!isAllowedImageUrl(review.coverImage)) {
        return NextResponse.json(
          { error: 'Image URL not permitted' },
          { status: 403 }
        );
      }
      return NextResponse.redirect(review.coverImage);
    }

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
