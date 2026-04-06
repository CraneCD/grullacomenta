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

export default function Home() {
  const [animeReviews, setAnimeReviews] = useState<Review[]>([]);
  const [mangaReviews, setMangaReviews] = useState<Review[]>([]);
  const [videoGameReviews, setVideoGameReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations('home');
  const tCommon = useTranslations('common');
  const locale = useLocale();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      // Fetch anime reviews
      const animeResponse = await fetch('/api/public/reviews?category=anime&limit=5');
      const animeData = animeResponse.ok ? await animeResponse.json() : [];

      // Fetch manga reviews
      const mangaResponse = await fetch('/api/public/reviews?category=manga&limit=5');
      const mangaData = mangaResponse.ok ? await mangaResponse.json() : [];

      // Fetch video game reviews
      const videoGameResponse = await fetch('/api/public/reviews?category=video-games&limit=5');
      const videoGameData = videoGameResponse.ok ? await videoGameResponse.json() : [];

      setAnimeReviews(animeData);
      setMangaReviews(mangaData);
      setVideoGameReviews(videoGameData);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  // Combine anime and manga reviews for the anime-manga section
  const animeMangaReviews = [...animeReviews, ...mangaReviews].slice(0, 10);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-300">{tCommon('loading')}</div>
      </div>
    );
  }
  return (
    <div className="space-y-12">
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{t('latestReviews')} - Anime & Manga</h2>
          <Link
            href={`/${locale}/anime-manga`}
            className="text-accent hover:text-accent-hover font-medium flex items-center text-sm"
          >
            {tCommon('viewAll')}
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        {animeMangaReviews.length > 0 ? (
          <ReviewGrid reviews={animeMangaReviews} />
        ) : (
          <div className="text-center text-gray-400 py-8">
            {t('noReviews')}
          </div>
        )}
      </section>

      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{t('latestReviews')} - Videojuegos</h2>
          <Link
            href={`/${locale}/video-games`}
            className="text-accent hover:text-accent-hover font-medium flex items-center text-sm"
          >
            {tCommon('viewAll')}
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        {videoGameReviews.length > 0 ? (
          <ReviewGrid reviews={videoGameReviews} />
        ) : (
          <div className="text-center text-gray-400 py-8">
            {t('noReviews')}
          </div>
        )}
      </section>
    </div>
  );
}
