import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BANNER_ID = 'home';

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

// GET the banner background image. Serves an uploaded image from the
// database, or redirects to an allow-listed external URL.
export async function GET() {
  try {
    const banner = await prisma.homeBanner.findUnique({
      where: { id: BANNER_ID },
      select: { imageData: true, imageMimeType: true, backgroundImage: true },
    });

    if (!banner) {
      return NextResponse.json({ error: 'No banner found' }, { status: 404 });
    }

    if (banner.imageData && banner.imageMimeType) {
      const imageBuffer = Buffer.from(banner.imageData, 'base64');
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': banner.imageMimeType,
          'Cache-Control': 'public, max-age=3600, must-revalidate',
        },
      });
    }

    if (banner.backgroundImage) {
      if (!isAllowedImageUrl(banner.backgroundImage)) {
        return NextResponse.json({ error: 'Image URL not permitted' }, { status: 403 });
      }
      return NextResponse.redirect(banner.backgroundImage);
    }

    return NextResponse.json({ error: 'No background image set' }, { status: 404 });
  } catch (error) {
    console.error('Error serving banner image:', error);
    return NextResponse.json({ error: 'Failed to serve image' }, { status: 500 });
  }
}
