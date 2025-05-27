'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import ReviewGrid from '@/components/ReviewGrid';

interface Review {
  id: string;
  title: string;
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

      const allReviews = [...animeData, ...mangaData].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

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
        <div className="text-gray-300">{t('loadingReviews')}</div>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">{t('animeMangaTitle')}</h1>
        <p className="mt-2 text-gray-300">{t('animeMangaDescription')}</p>
      </div>
      
      <div className="flex space-x-4">
        <button 
          onClick={() => handleFilterChange('all')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeFilter === 'all' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {t('filterAll')}
        </button>
        <button 
          onClick={() => handleFilterChange('anime')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeFilter === 'anime' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {t('filterAnime')}
        </button>
        <button 
          onClick={() => handleFilterChange('manga')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeFilter === 'manga' 
              ? 'bg-blue-600 text-white' 
              : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {t('filterManga')}
        </button>
      </div>

      {filteredReviews.length > 0 ? (
        <ReviewGrid reviews={filteredReviews} />
      ) : (
        <div className="text-center text-gray-400 py-8">
          {activeFilter === 'all' 
            ? t('noReviewsGeneral')
            : t('noReviewsAvailable', { category: activeFilter })
          }
        </div>
      )}
    </div>
  );
} 