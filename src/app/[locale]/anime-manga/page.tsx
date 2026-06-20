'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import ReviewGrid from '@/components/ReviewGrid';

interface Review {
  id: string;
  title: string;
  order?: number;
  category: string;
  coverImage?: string;
  imageData?: string;
  imageMimeType?: string;
  youtubeUrl?: string;
  date: string;
  slug: string;
  rating?: number;
  authorName: string;
  content?: string;
  contentEs?: string;
  contentEn?: string;
}

export default function AnimeMangaPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const t = useTranslations('reviews');

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    filterReviews();
  }, [reviews, activeFilter]);

  const fetchReviews = async () => {
    try {
      // Fetch both anime and manga reviews
      const [animeResponse, mangaResponse] = await Promise.all([
        fetch('/api/public/reviews?category=anime'),
        fetch('/api/public/reviews?category=manga')
      ]);

      const animeData = animeResponse.ok ? await animeResponse.json() : [];
      const mangaData = mangaResponse.ok ? await mangaResponse.json() : [];

      // Merge anime + manga and honour the admin's manual ordering
      // (lower `order` first), falling back to newest-first by date.
      const allReviews = [...animeData, ...mangaData].sort((a, b) => {
        const orderA = a.order ?? 0;
        const orderB = b.order ?? 0;
        if (orderA !== orderB) return orderA - orderB;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });

      setReviews(allReviews);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReviews = () => {
    if (activeFilter === 'all') {
      setFilteredReviews(reviews);
    } else {
      setFilteredReviews(reviews.filter(review => review.category === activeFilter));
    }
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-ink-600">{t('loadingReviews')}</div>
      </div>
    );
  }

  const filterBtn = (filter: string) =>
    `px-4 py-2 text-sm font-ui font-bold rounded-pill transition-colors ${
      activeFilter === filter
        ? 'bg-persimmon-500 text-[#FFF8F0] shadow-sm'
        : 'text-ink-700 bg-paper-200 hover:bg-paper-300'
    }`;

  // Only offer the filter buttons when there is something to filter between —
  // i.e. both anime and manga reviews exist.
  const hasAnime = reviews.some(review => review.category === 'anime');
  const hasManga = reviews.some(review => review.category === 'manga');
  const showFilters = hasAnime && hasManga;

  return (
    <div className="space-y-8">
      <div>
        <span className="gc-kicker block mb-2">Anime &amp; Manga</span>
        <h1 className="font-display text-3xl font-bold text-ink-900">{t('animeMangaTitle')}</h1>
        <p className="mt-2 font-body text-ink-600">{t('animeMangaDescription')}</p>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-3">
          <button onClick={() => handleFilterChange('all')} className={filterBtn('all')}>
            {t('filterAll')}
          </button>
          <button onClick={() => handleFilterChange('anime')} className={filterBtn('anime')}>
            {t('filterAnime')}
          </button>
          <button onClick={() => handleFilterChange('manga')} className={filterBtn('manga')}>
            {t('filterManga')}
          </button>
        </div>
      )}

      {filteredReviews.length > 0 ? (
        <ReviewGrid reviews={filteredReviews} />
      ) : (
        <div className="text-center text-ink-500 py-8">
          {activeFilter === 'all' 
            ? t('noReviewsGeneral')
            : t('noReviewsAvailable', { category: activeFilter })
          }
        </div>
      )}
    </div>
  );
} 