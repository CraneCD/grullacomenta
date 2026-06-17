'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
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
  youtubeUrl?: string;
  date: string | Date;
  updatedAt?: string | Date;
  slug: string;
  rating?: number;
  authorName?: string;
  content?: string;
  contentEs?: string;
  contentEn?: string;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availablePlatforms, setAvailablePlatforms] = useState<string[]>([]);
  
  const t = useTranslations('reviews');
  const locale = useLocale();

  useEffect(() => {
    fetchReviews();
  }, []);

  useEffect(() => {
    filterReviews();
  }, [reviews, searchTerm, categoryFilter, platformFilter]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/public/reviews');
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
        
        // Extract unique categories and platforms with proper type casting
        const categories = [...new Set(data.map((review: Review) => review.category))] as string[];
        const platforms = [...new Set(data.map((review: Review) => review.platform).filter(Boolean))] as string[];
        setAvailableCategories(categories);
        setAvailablePlatforms(platforms);
      } else {
        console.error('Failed to fetch reviews');
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterReviews = () => {
    let filtered = reviews;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(review => {
        const title = locale === 'es' && review.titleEs ? review.titleEs : 
                     locale === 'en' && review.titleEn ? review.titleEn : 
                     review.title;
        return title.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Filter by category
    if (categoryFilter) {
      filtered = filtered.filter(review => review.category === categoryFilter);
    }

    // Filter by platform
    if (platformFilter) {
      filtered = filtered.filter(review => review.platform === platformFilter);
    }

    setFilteredReviews(filtered);
  };

  const formatCategoryName = (category: string) => {
    switch (category) {
      case 'anime':
        return t('filterAnime');
      case 'manga':
        return t('filterManga');
      case 'video-games':
        return t('videoGamesTitle');
      default:
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
  };

  const formatPlatformName = (platform: string) => {
    switch (platform) {
      case 'PlayStation':
        return t('platformPlayStation');
      case 'Xbox':
        return t('platformXbox');
      case 'Nintendo':
        return t('platformNintendo');
      case 'PC':
        return t('platformPC');
      default:
        return platform;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-ink-600">{t('loadingReviews')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-ink-900">
          {t('title')}
        </h1>
        <p className="mt-2 font-body text-ink-600">
          {t('description')}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4 lg:space-y-0 lg:flex lg:gap-4 lg:items-center">
        {/* Search Input */}
        <div className="flex-1">
          <input
            type="text"
            placeholder={t('searchPlaceholder') || 'Search reviews...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
          />
        </div>

        {/* Category Filter */}
        <div className="lg:w-48">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-input"
          >
            <option value="">{t('filterAll')}</option>
            {availableCategories.map(category => (
              <option key={category} value={category}>
                {formatCategoryName(category)}
              </option>
            ))}
          </select>
        </div>

        {/* Platform Filter */}
        {availablePlatforms.length > 0 && (
          <div className="lg:w-48">
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="form-input"
            >
              <option value="">{t('platformAll')}</option>
              {availablePlatforms.map(platform => (
                <option key={platform} value={platform}>
                  {formatPlatformName(platform)}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div>
        <p className="text-sm text-ink-500">
          {filteredReviews.length === 1
            ? `1 ${t('title').toLowerCase().slice(0, -1)}`
            : `${filteredReviews.length} ${t('title').toLowerCase()}`}
          {searchTerm && ` ${t('resultsFor') || 'for'} "${searchTerm}"`}
        </p>
      </div>

      {/* Reviews Grid */}
      {filteredReviews.length > 0 ? (
        <ReviewGrid reviews={filteredReviews} showCategory={true} />
      ) : (
        <div className="text-center py-12">
          <div className="text-ink-500">
            {searchTerm || categoryFilter || platformFilter
              ? t('noResults') || 'No reviews found matching your criteria'
              : t('noReviewsGeneral') || 'No reviews available yet'
            }
          </div>
          {(searchTerm || categoryFilter || platformFilter) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                setPlatformFilter('');
              }}
              className="mt-4 px-5 py-2 bg-persimmon-500 text-[#FFF8F0] font-ui font-bold rounded-pill shadow-sm hover:bg-persimmon-600 transition-colors"
            >
              {t('clearFilters')}
            </button>
          )}
        </div>
      )}
    </div>
  );
} 