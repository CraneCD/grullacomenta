'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import ReviewGrid from '@/components/ReviewGrid';

interface Review {
  id: string;
  title: string;
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

export default function VideoGamesPage() {
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
      const response = await fetch('/api/public/reviews?category=video-games');
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      }
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
      setFilteredReviews(reviews.filter(review => 
        review.platform?.toLowerCase() === activeFilter.toLowerCase()
      ));
    }
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };

  const platforms = [
    { name: t('platformAll'), value: 'all' },
    { name: t('platformPlayStation'), value: 'playstation' },
    { name: t('platformXbox'), value: 'xbox' },
    { name: t('platformNintendo'), value: 'nintendo' },
    { name: t('platformPC'), value: 'pc' }
  ];

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
        <h1 className="text-3xl font-bold text-white">{t('videoGamesTitle')}</h1>
        <p className="mt-2 text-gray-300">{t('videoGamesDescription')}</p>
      </div>
      
      <div className="flex flex-wrap gap-4">
        {platforms.map((platform) => (
          <button
            key={platform.name}
            onClick={() => handleFilterChange(platform.value)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeFilter === platform.value 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {platform.name}
          </button>
        ))}
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