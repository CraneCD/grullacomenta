'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
  content: string;
  authorName: string;
}

export default function SearchPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchParams = useSearchParams();
  const t = useTranslations('search');
  const tCommon = useTranslations('common');

  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setReviews([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setReviews(data);
      } else {
        console.error('Search failed:', response.status);
        setReviews([]);
      }
    } catch (error) {
      console.error('Error searching:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-300">{tCommon('loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">
          {searchQuery ? `Search results for "${searchQuery}"` : 'Search Posts'}
        </h1>
        {searchQuery && (
          <p className="mt-2 text-gray-300">
            {reviews.length === 0 
              ? 'No posts found matching your search.'
              : `Found ${reviews.length} post${reviews.length !== 1 ? 's' : ''} matching your search.`
            }
          </p>
        )}
      </div>

      {searchQuery && reviews.length > 0 && (
        <ReviewGrid reviews={reviews} />
      )}

      {searchQuery && reviews.length === 0 && !loading && (
        <div className="text-center text-gray-400 py-8">
          <p>No posts found for "{searchQuery}".</p>
          <p className="mt-2">Try searching with different keywords.</p>
        </div>
      )}

      {!searchQuery && (
        <div className="text-center text-gray-400 py-8">
          <p>Enter a search term to find posts.</p>
        </div>
      )}
    </div>
  );
} 