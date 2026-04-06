'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
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

export default function PlatformPage({ params }: { params: { platform: string } }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations('reviews');
  const locale = useLocale();
  
  const platform = params.platform.toLowerCase();

  useEffect(() => {
    fetchReviews();
  }, [platform]);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`/api/public/reviews?category=video-games&platform=${platform}`);
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

  const platforms = [
    { name: t('platformAll'), href: `/${locale}/video-games` },
    { name: t('platformPlayStation'), href: `/${locale}/video-games/playstation` },
    { name: t('platformXbox'), href: `/${locale}/video-games/xbox` },
    { name: t('platformNintendo'), href: `/${locale}/video-games/nintendo` },
    { name: t('platformPC'), href: `/${locale}/video-games/pc` }
  ];

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'playstation':
        return t('platformPlayStation');
      case 'xbox':
        return t('platformXbox');
      case 'nintendo':
        return t('platformNintendo');
      case 'pc':
        return t('platformPC');
      default:
        return platform;
    }
  };

  const platformName = getPlatformName(platform);

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
        <h1 className="text-3xl font-bold text-white">
          {platformName} {t('videoGamesTitle')}
        </h1>
        <p className="mt-2 text-gray-300">
          {t('videoGamesDescription')} - {platformName}
        </p>
      </div>
      
      <div className="flex flex-wrap gap-4">
        {platforms.map((p) => (
          <Link
            key={p.name}
            href={p.href}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              p.href === `/${locale}/video-games/${platform}`
                ? 'bg-blue-600 text-white'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {p.name}
          </Link>
        ))}
      </div>

      {reviews.length > 0 ? (
        <ReviewGrid reviews={reviews} />
      ) : (
        <div className="text-center text-gray-400 py-8">
          {t('noReviewsAvailable', { category: platformName })}
        </div>
      )}
    </div>
  );
} 