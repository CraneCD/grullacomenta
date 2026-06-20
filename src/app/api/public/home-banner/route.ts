import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const BANNER_ID = 'home';

// Public, read-only view of the homepage banner. Text fields are returned
// as-is (the homepage picks the language and falls back to translated
// defaults for any empty field). The background, if any, is exposed as a
// single URL so the homepage can render it as a CSS background.
export async function GET() {
  try {
    const banner = await prisma.homeBanner.findUnique({ where: { id: BANNER_ID } });

    if (!banner) {
      return NextResponse.json({ backgroundUrl: null });
    }

    const hasUpload = Boolean(banner.imageData && banner.imageMimeType);
    const backgroundUrl = hasUpload
      // Cache-bust on update so a newly uploaded image shows immediately.
      ? `/api/home-banner/image?v=${new Date(banner.updatedAt).getTime()}`
      : banner.backgroundImage || null;

    return NextResponse.json({
      kickerEs: banner.kickerEs,
      kickerEn: banner.kickerEn,
      titleEs: banner.titleEs,
      titleEn: banner.titleEn,
      subtitleEs: banner.subtitleEs,
      subtitleEn: banner.subtitleEn,
      primaryLabelEs: banner.primaryLabelEs,
      primaryLabelEn: banner.primaryLabelEn,
      primaryLink: banner.primaryLink,
      secondaryLabelEs: banner.secondaryLabelEs,
      secondaryLabelEn: banner.secondaryLabelEn,
      secondaryLink: banner.secondaryLink,
      backgroundUrl,
    });
  } catch (error) {
    console.error('Error fetching public home banner:', error);
    // Fail soft — the homepage will just use its translated defaults.
    return NextResponse.json({ backgroundUrl: null });
  }
}
