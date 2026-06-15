'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import ReviewGrid from '@/components/ReviewGrid';
import { CraneMark } from '@/components/Crane';

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
      {/* ── Hero — sumi-ink surface with a faint crane and persimmon accent ─── */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 mb-14">
        <div className="relative overflow-hidden bg-ink-900 px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          {/* faint crane watermark */}
          <CraneMark
            size={420}
            className="absolute -right-16 -top-10 text-persimmon-400/10 rotate-6 pointer-events-none hidden sm:block"
          />
          {/* soft warm highlight */}
          <div className="absolute -top-24 left-1/4 w-[34rem] h-[34rem] bg-persimmon-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-2xl">
            <span className="gc-kicker text-persimmon-300 block mb-5">
              Lecturas lentas · Opiniones cuidadas
            </span>
            <h1 className="font-display text-4xl sm:text-5xl font-black text-paper-100 leading-tight mb-4">
              Ensayos sobre anime, manga y videojuegos
            </h1>
            <p className="font-body text-ink-300 text-lg leading-relaxed mb-8">
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
