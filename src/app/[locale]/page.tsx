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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="bg-gray-800/50 rounded-lg overflow-hidden animate-pulse">
          <div className="aspect-video bg-gray-700/60" />
          <div className="p-4 space-y-2.5">
            <div className="h-4 bg-gray-700/60 rounded w-5/6" />
            <div className="h-3 bg-gray-700/60 rounded w-2/3" />
            <div className="h-3 bg-gray-700/60 rounded w-1/3" />
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
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <div className="-mx-4 sm:-mx-6 lg:-mx-8 mb-14">
        <div className="relative overflow-hidden bg-gradient-to-br from-blue-950/70 via-[#111827] to-purple-950/50 border-b border-white/5 px-4 sm:px-6 lg:px-8 py-16">
          {/* decorative blobs */}
          <div className="absolute -top-32 -left-32 w-[32rem] h-[32rem] bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 right-0 w-[32rem] h-[32rem] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-2xl">
            <span className="inline-block border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-5">
              Grulla Comenta
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
              Anime &amp; Manga
            </h1>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              {t('subtitle')}
            </p>
            <Link
              href={`/${locale}/anime-manga`}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
            >
              {t('viewAllReviews')}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Sections ───────────────────────────────────────────────────── */}
      <div className="space-y-14">

        {/* Anime */}
        <section aria-label="Anime">
          <div className="flex items-end justify-between mb-7">
            <div className="flex items-center gap-3">
              <div className="w-1 h-9 bg-blue-500 rounded-full" aria-hidden="true" />
              <div>
                <h2 className="text-xl font-bold text-white leading-none mb-0.5">Anime</h2>
                {!loading && (
                  <p className="text-xs text-gray-500">
                    {animeReviews.length}{' '}
                    {animeReviews.length === 1 ? 'reseña' : 'reseñas'}
                  </p>
                )}
              </div>
            </div>
            <Link
              href={`/${locale}/anime-manga`}
              className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
            >
              {tCommon('viewAll')} <ChevronRight />
            </Link>
          </div>

          {loading ? (
            <SkeletonGrid />
          ) : animeReviews.length > 0 ? (
            <ReviewGrid reviews={animeReviews} />
          ) : (
            <div className="text-center text-gray-500 py-10 bg-gray-800/20 rounded-xl border border-gray-800/40">
              {t('noAnimePosts')}
            </div>
          )}
        </section>

        <div className="border-t border-gray-800/50" />

        {/* Manga */}
        <section aria-label="Manga">
          <div className="flex items-end justify-between mb-7">
            <div className="flex items-center gap-3">
              <div className="w-1 h-9 bg-violet-500 rounded-full" aria-hidden="true" />
              <div>
                <h2 className="text-xl font-bold text-white leading-none mb-0.5">Manga</h2>
                {!loading && (
                  <p className="text-xs text-gray-500">
                    {mangaReviews.length}{' '}
                    {mangaReviews.length === 1 ? 'reseña' : 'reseñas'}
                  </p>
                )}
              </div>
            </div>
            <Link
              href={`/${locale}/anime-manga`}
              className="text-sm text-violet-400 hover:text-violet-300 font-medium flex items-center gap-1 transition-colors"
            >
              {tCommon('viewAll')} <ChevronRight />
            </Link>
          </div>

          {loading ? (
            <SkeletonGrid />
          ) : mangaReviews.length > 0 ? (
            <ReviewGrid reviews={mangaReviews} />
          ) : (
            <div className="text-center text-gray-500 py-10 bg-gray-800/20 rounded-xl border border-gray-800/40">
              {t('noMangaPosts')}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
