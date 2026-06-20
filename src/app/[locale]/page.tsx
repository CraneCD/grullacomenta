import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/prisma';
import HomeReviews from '@/components/HomeReviews';

// Render on every request so a freshly saved banner shows immediately
// (and so the hero is in the initial HTML — no flash of default content).
export const dynamic = 'force-dynamic';

function firstNonEmpty(...vals: (string | null | undefined)[]): string {
  return vals.find((v) => v && v.trim() !== '')?.trim() ?? '';
}

// Resolve an admin-entered link. Absolute http(s) links are returned as-is;
// anything else is treated as an internal path and given a locale prefix.
function resolveHref(link: string | null | undefined, locale: string, fallback: string): string {
  if (!link || !link.trim()) return fallback;
  const value = link.trim();
  if (/^https?:\/\//i.test(value)) return value;
  const path = value.startsWith('/') ? value : `/${value}`;
  if (path === `/${locale}` || path.startsWith(`/${locale}/`)) return path;
  return `/${locale}${path}`;
}

function isExternal(link: string | null | undefined): boolean {
  return /^https?:\/\//i.test(link?.trim() ?? '');
}

export default async function Home({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: 'home' });

  let banner: Awaited<ReturnType<typeof prisma.homeBanner.findUnique>> = null;
  try {
    banner = await prisma.homeBanner.findUnique({ where: { id: 'home' } });
  } catch (error) {
    // Fail soft — fall back to the translated defaults below.
    console.error('Error loading home banner:', error);
  }

  // Pick the field for the current locale, falling back to the other
  // language and finally to the translated default.
  const pickText = (es?: string | null, en?: string | null, fallback = '') =>
    firstNonEmpty(locale === 'en' ? en : es, locale === 'en' ? es : en) || fallback;

  const hasUpload = Boolean(banner?.imageData && banner?.imageMimeType);
  const backgroundUrl = hasUpload
    ? `/api/home-banner/image?v=${new Date(banner!.updatedAt).getTime()}`
    : banner?.backgroundImage?.trim() || null;

  const kicker = pickText(banner?.kickerEs, banner?.kickerEn, t('heroKicker'));
  const heroTitle = pickText(banner?.titleEs, banner?.titleEn, t('heroTitle'));
  const subtitle = pickText(banner?.subtitleEs, banner?.subtitleEn, t('subtitle'));
  const primaryLabel = pickText(banner?.primaryLabelEs, banner?.primaryLabelEn, t('viewAllReviews'));
  const primaryHref = resolveHref(banner?.primaryLink, locale, `/${locale}/anime-manga`);
  const secondaryLabel = pickText(banner?.secondaryLabelEs, banner?.secondaryLabelEn);
  const secondaryHref = resolveHref(banner?.secondaryLink, locale, '#');

  const primaryClass =
    'inline-flex items-center gap-2 bg-persimmon-500 hover:bg-persimmon-600 text-[#FFF8F0] font-ui font-bold px-6 py-3 rounded-pill shadow-md transition-colors active:translate-y-px';
  const secondaryClass =
    'inline-flex items-center gap-2 bg-paper-100/10 hover:bg-paper-100/20 text-paper-100 ring-1 ring-paper-100/30 font-ui font-bold px-6 py-3 rounded-pill transition-colors active:translate-y-px';

  const arrow = (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );

  return (
    <div>
      {/* ── Hero — warm sumi-sepia card, color only ──────────────────────── */}
      <div className="mb-14 mt-2">
        <div
          className="relative overflow-hidden rounded-2xl px-6 sm:px-10 lg:px-16 py-16 sm:py-24 shadow-xl ring-1 ring-persimmon-300/30
                     bg-[radial-gradient(120%_140%_at_50%_-10%,#5a3a24_0%,#3a2a20_38%,#2a2018_72%,#231a14_100%)]"
          style={
            backgroundUrl
              ? {
                  backgroundImage: `url(${backgroundUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : undefined
          }
        >
          {/* Dark overlay for legibility when a background image is set */}
          {backgroundUrl && (
            <div className="absolute inset-0 bg-[#231a14]/70" aria-hidden="true" />
          )}

          {/* ── Content ── */}
          <div className="relative mx-auto max-w-2xl text-center">
            <span className="gc-kicker text-persimmon-300 block mb-5">
              {kicker}
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-black text-paper-100 leading-tight mb-4 [text-shadow:0_2px_24px_rgba(0,0,0,0.35)]">
              {heroTitle}
            </h1>
            <p className="font-body text-ink-300 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
              {subtitle}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {isExternal(banner?.primaryLink) ? (
                <a href={primaryHref} className={primaryClass}>
                  {primaryLabel} {arrow}
                </a>
              ) : (
                <Link href={primaryHref} className={primaryClass}>
                  {primaryLabel} {arrow}
                </Link>
              )}

              {secondaryLabel && (
                isExternal(banner?.secondaryLink) ? (
                  <a href={secondaryHref} className={secondaryClass}>
                    {secondaryLabel}
                  </a>
                ) : (
                  <Link href={secondaryHref} className={secondaryClass}>
                    {secondaryLabel}
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sections ───────────────────────────────────────────────────────── */}
      <HomeReviews />
    </div>
  );
}
