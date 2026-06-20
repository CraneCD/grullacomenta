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

export default function HomeReviews() {
  const [animeReviews, setAnimeReviews] = useState<Review[]>([]);
  const [mangaReviews, setMangaReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const tCommon = useTranslations('common');
  const locale = useLocale();

  // While loading we show skeletons for both sections; once loaded, only show
  // a section if it actually has reviews.
  const showAnime = loading || animeReviews.length > 0;
  const showManga = loading || mangaReviews.length > 0;

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const [animeRes, mangaRes] = await Promise.all([
          fetch('/api/public/reviews?category=anime&limit=12'),
          fetch('/api/public/reviews?category=manga&limit=12'),
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
  );
}
