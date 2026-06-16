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

/* Faint line-art motifs that frame the hero — videojuegos (arcade joystick),
   manga/anime (stacked panels & cards) and origami facets. Drawn with thin
   strokes at low opacity so they read as a watermark, hidden on small screens. */
function HeroMotifs() {
  return (
    <div
      className="absolute inset-0 pointer-events-none text-persimmon-200/[0.14] hidden md:block"
      aria-hidden="true"
    >
      {/* ── left cluster ── */}
      <svg
        className="absolute left-0 top-1/2 -translate-y-1/2 h-[88%] w-auto"
        viewBox="0 0 220 320" fill="none"
        stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
      >
        {/* diamond frame + circle (origami medallion) */}
        <rect x="34" y="36" width="96" height="96" rx="6" transform="rotate(45 82 84)" />
        <circle cx="82" cy="84" r="34" />
        {/* stacked cards / manga panels */}
        <rect x="18" y="150" width="76" height="104" rx="8" transform="rotate(-10 56 202)" />
        <rect x="56" y="138" width="76" height="104" rx="8" transform="rotate(6 94 190)" />
        {/* arcade joystick */}
        <g transform="translate(78 246)">
          <rect x="0" y="40" width="96" height="60" rx="12" />
          <line x1="48" y1="40" x2="48" y2="6" />
          <circle cx="48" cy="2" r="12" />
          <circle cx="24" cy="78" r="6" />
          <circle cx="44" cy="78" r="6" />
        </g>
        {/* glyph-like marks */}
        <path d="M150 60 h34 M150 76 h22 M160 50 v40" />
      </svg>

      {/* ── right cluster ── */}
      <svg
        className="absolute right-0 top-1/2 -translate-y-1/2 h-[88%] w-auto"
        viewBox="0 0 220 320" fill="none"
        stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
      >
        {/* manga panel split + circle */}
        <rect x="96" y="30" width="108" height="92" rx="8" />
        <line x1="150" y1="30" x2="150" y2="122" />
        <circle cx="172" cy="76" r="26" />
        {/* tall framed panel */}
        <rect x="120" y="138" width="84" height="120" rx="8" />
        <path d="M120 220 L204 160 M120 248 L204 188" />
        {/* small joystick, upper area */}
        <g transform="translate(20 24)">
          <rect x="0" y="34" width="70" height="44" rx="10" />
          <line x1="35" y1="34" x2="35" y2="8" />
          <circle cx="35" cy="4" r="9" />
        </g>
        {/* origami arrow + glyphs */}
        <path d="M44 250 l40 26 M44 250 l30 6 M44 250 l8 28" />
        <path d="M40 130 h30 M55 118 v30" />
      </svg>
    </div>
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

export default function Home() {
  const [animeReviews, setAnimeReviews] = useState<Review[]>([]);
  const [mangaReviews, setMangaReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const [animeRes, mangaRes] = await Promise.all([
          fetch('/api/public/reviews?category=anime&limit=10'),
          fetch('/api/public/reviews?category=manga&limit=10'),
        ]);
        setAnimeReviews(animeRes.ok ? await animeRes.json() : []);
        setMangaReviews(mangaRes.ok ? await mangaRes.json() : []);
      } catch (error) {
        console.error('Error fetching reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  return (
    <div>
      {/* ── Hero — warm sumi-sepia card with a centered sunburst glow, faint ──
          line-art motifs (arcade joysticks, manga panels, origami facets) and
          an origami-crane sparkle in the corner ──────────────────────────── */}
      <div className="mb-14 mt-2">
        <div className="relative overflow-hidden rounded-2xl px-6 sm:px-10 lg:px-16 py-16 sm:py-24 shadow-xl ring-1 ring-persimmon-300/30
                        bg-[radial-gradient(120%_140%_at_50%_-10%,#5a3a24_0%,#3a2a20_38%,#2a2018_72%,#231a14_100%)]">

          {/* central warm sunburst — light pouring from the top */}
          <div className="absolute left-1/2 -top-32 -translate-x-1/2 w-[42rem] h-[42rem] rounded-full blur-3xl pointer-events-none
                          bg-[radial-gradient(circle,rgba(245,170,90,0.30)_0%,rgba(217,96,46,0.12)_45%,transparent_70%)]" />

          <HeroMotifs />

          {/* origami-crane sparkle, bottom-right */}
          <svg
            className="absolute bottom-6 right-6 sm:bottom-8 sm:right-10 w-7 h-7 text-paper-200/70 pointer-events-none"
            viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"
          >
            <path d="M12 0c.6 6.2 5.8 11.4 12 12-6.2.6-11.4 5.8-12 12-.6-6.2-5.8-11.4-12-12C6.2 11.4 11.4 6.2 12 0z" />
          </svg>

          {/* ── Content ── */}
          <div className="relative mx-auto max-w-2xl text-center">
            <span className="gc-kicker text-persimmon-300 block mb-5">
              Lecturas lentas · Opiniones cuidadas
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-black text-paper-100 leading-tight mb-4 [text-shadow:0_2px_24px_rgba(0,0,0,0.35)]">
              Ensayos sobre anime, manga y videojuegos
            </h1>
            <p className="font-body text-ink-300 text-lg leading-relaxed mb-8 max-w-xl mx-auto">
              {t('subtitle')}
            </p>
            <Link
              href={`/${locale}/anime-manga`}
              className="inline-flex items-center gap-2 bg-persimmon-500 hover:bg-persimmon-600 text-[#FFF8F0] font-ui font-bold px-6 py-3 rounded-pill shadow-md transition-colors active:translate-y-px"
            >
              {t('viewAllReviews')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Sections ───────────────────────────────────────────────────────── */}
      <div className="space-y-14">

        {/* Anime — persimmon accent */}
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
          ) : animeReviews.length > 0 ? (
            <ReviewGrid reviews={animeReviews} />
          ) : (
            <div className="text-center text-ink-500 py-10 bg-paper-50 rounded-xl border border-border">
              {t('noAnimePosts')}
            </div>
          )}
        </section>

        <div className="border-t border-divider" />

        {/* Manga — indigo accent */}
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
          ) : mangaReviews.length > 0 ? (
            <ReviewGrid reviews={mangaReviews} />
          ) : (
            <div className="text-center text-ink-500 py-10 bg-paper-50 rounded-xl border border-border">
              {t('noMangaPosts')}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
