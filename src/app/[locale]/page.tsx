'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import ReviewGrid from '@/components/ReviewGrid';

interface Review {
  id: string;
  title: string;
  titleEs?: string;
  titleEn?: string;
  category: string;
  platform?: string;
  coverImage?: string;
  imageData?: string;
  imageMimeType?: string;
  date: string;
  slug: string;
  rating?: number;
  authorName: string;
  content?: string;
  contentEs?: string;
  contentEn?: string;
}

function ChevronRight() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-paper-50 border border-border rounded-lg overflow-hidden animate-pulse">
          <div className="aspect-video bg-paper-300/60" />
          <div className="p-5 space-y-3">
            <div className="h-3 bg-paper-300/70 rounded-pill w-1/3" />
            <div className="h-5 bg-paper-300/70 rounded w-5/6" />
            <div className="h-4 bg-paper-300/70 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface Banner {
  kickerEs?: string | null;
  kickerEn?: string | null;
  titleEs?: string | null;
  titleEn?: string | null;
  subtitleEs?: string | null;
  subtitleEn?: string | null;
  primaryLabelEs?: string | null;
  primaryLabelEn?: string | null;
  primaryLink?: string | null;
  secondaryLabelEs?: string | null;
  secondaryLabelEn?: string | null;
  secondaryLink?: string | null;
  backgroundUrl?: string | null;
}

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

export default function Home() {
  const [animeReviews, setAnimeReviews] = useState<Review[]>([]);
  const [mangaReviews, setMangaReviews] = useState<Review[]>([]);
  const [banner, setBanner] = useState<Banner>({});
  const [loading, setLoading] = useState(true);
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  // While loading we show skeletons for both sections; once loaded, only show
  // a section if it actually has reviews.
  const showAnime = loading || animeReviews.length > 0;
  const showManga = loading || mangaReviews.length > 0;

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const [animeRes, mangaRes, bannerRes] = await Promise.all([
          fetch('/api/public/reviews?category=anime&limit=12'),
          fetch('/api/public/reviews?category=manga&limit=12'),
          fetch('/api/public/home-banner', { cache: 'no-store' }),
        ]);
        setAnimeReviews(animeRes.ok ? await animeRes.json() : []);
        setMangaReviews(mangaRes.ok ? await mangaRes.json() : []);
        if (bannerRes.ok) setBanner(await bannerRes.json());
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  // Pick the field for the current locale, falling back to the other
  // language and finally to the translated default.
  const pickText = (es?: string | null, en?: string | null, fallback = '') =>
    firstNonEmpty(locale === 'en' ? en : es, locale === 'en' ? es : en) || fallback;

  const kicker = pickText(banner.kickerEs, banner.kickerEn, t('heroKicker'));
  const heroTitle = pickText(banner.titleEs, banner.titleEn, t('heroTitle'));
  const subtitle = pickText(banner.subtitleEs, banner.subtitleEn, t('subtitle'));
  const primaryLabel = pickText(banner.primaryLabelEs, banner.primaryLabelEn, t('viewAllReviews'));
  const primaryHref = resolveHref(banner.primaryLink, locale, `/${locale}/anime-manga`);
  const secondaryLabel = pickText(banner.secondaryLabelEs, banner.secondaryLabelEn);
  const secondaryHref = resolveHref(banner.secondaryLink, locale, '#');
  const backgroundUrl = banner.backgroundUrl?.trim() || null;

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
              {isExternal(banner.primaryLink) ? (
                <a
                  href={primaryHref}
                  className="inline-flex items-center gap-2 bg-persimmon-500 hover:bg-persimmon-600 text-[#FFF8F0] font-ui font-bold px-6 py-3 rounded-pill shadow-md transition-colors active:translate-y-px"
                >
                  {primaryLabel}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              ) : (
                <Link
                  href={primaryHref}
                  className="inline-flex items-center gap-2 bg-persimmon-500 hover:bg-persimmon-600 text-[#FFF8F0] font-ui font-bold px-6 py-3 rounded-pill shadow-md transition-colors active:translate-y-px"
                >
                  {primaryLabel}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              )}

              {secondaryLabel && (
                isExternal(banner.secondaryLink) ? (
                  <a
                    href={secondaryHref}
                    className="inline-flex items-center gap-2 bg-paper-100/10 hover:bg-paper-100/20 text-paper-100 ring-1 ring-paper-100/30 font-ui font-bold px-6 py-3 rounded-pill transition-colors active:translate-y-px"
                  >
                    {secondaryLabel}
                  </a>
                ) : (
                  <Link
                    href={secondaryHref}
                    className="inline-flex items-center gap-2 bg-paper-100/10 hover:bg-paper-100/20 text-paper-100 ring-1 ring-paper-100/30 font-ui font-bold px-6 py-3 rounded-pill transition-colors active:translate-y-px"
                  >
                    {secondaryLabel}
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sections ───────────────────────────────────────────────────────── */}
      <div className="space-y-14">

        {/* Anime — persimmon accent */}
        {showAnime && (
        <section aria-label="Anime">
          <div className="flex items-end justify-between mb-7">
            <div className="flex items-center gap-3">
              <div className="w-1 h-9 bg-persimmon-500 rounded-pill" aria-hidden="true" />
              <div>
                <h2 className="font-display text-2xl font-bold text-ink-900 leading-none mb-1">Anime</h2>
                {!loading && (
                  <p className="text-xs text-ink-500">
                    {animeReviews.length}{' '}
                    {animeReviews.length === 1 ? 'ensayo' : 'ensayos'}
                  </p>
                )}
              </div>
            </div>
            <Link
              href={`/${locale}/anime-manga`}
              className="text-sm text-persimmon-600 hover:text-persimmon-700 font-ui font-bold flex items-center gap-1 transition-colors"
            >
              {tCommon('viewAll')} <ChevronRight />
            </Link>
          </div>

          {loading ? (
            <SkeletonGrid />
          ) : (
            <ReviewGrid reviews={animeReviews} />
          )}
        </section>
        )}

        {showAnime && showManga && <div className="border-t border-divider" />}

        {/* Manga — indigo accent */}
        {showManga && (
        <section aria-label="Manga">
          <div className="flex items-end justify-between mb-7">
            <div className="flex items-center gap-3">
              <div className="w-1 h-9 bg-indigo-500 rounded-pill" aria-hidden="true" />
              <div>
                <h2 className="font-display text-2xl font-bold text-ink-900 leading-none mb-1">Manga</h2>
                {!loading && (
                  <p className="text-xs text-ink-500">
                    {mangaReviews.length}{' '}
                    {mangaReviews.length === 1 ? 'ensayo' : 'ensayos'}
                  </p>
                )}
              </div>
            </div>
            <Link
              href={`/${locale}/anime-manga`}
              className="text-sm text-indigo-500 hover:text-indigo-600 font-ui font-bold flex items-center gap-1 transition-colors"
            >
              {tCommon('viewAll')} <ChevronRight />
            </Link>
          </div>

          {loading ? (
            <SkeletonGrid />
          ) : (
            <ReviewGrid reviews={mangaReviews} />
          )}
        </section>
        )}

      </div>
    </div>
  );
}
