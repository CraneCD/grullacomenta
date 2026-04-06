'use client';

import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { useLocale } from 'next-intl';
import { getLocalizedTitle } from '@/lib/utils';

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

interface ReviewGridProps {
  reviews: Review[];
  showCategory?: boolean;
}

export default function ReviewGrid({ reviews, showCategory = true }: ReviewGridProps) {
  const locale = useLocale();
  
  const getImageSrc = (review: Review) => {
    // If there's uploaded image data, use the API endpoint with cache busting
    if (review.imageData) {
      const timestamp = review.updatedAt ? new Date(review.updatedAt).getTime() : Date.now();
      return `/api/images/${review.id}?v=${timestamp}`;
    }
    // Otherwise use the coverImage URL
    return review.coverImage || '/images/placeholder.jpg';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {reviews.map((review) => {
        const localizedTitle = getLocalizedTitle(review, locale);
        
        return (
          <Link 
            key={review.id} 
            href={`/${locale}/reviews/${review.slug}`}
            className="group bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors"
          >
            <div className="relative h-48 overflow-hidden">
              <Image
                src={getImageSrc(review)}
                alt={localizedTitle}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            </div>
            <div className="p-4">
              <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-2">
                {localizedTitle}
              </h3>
              {showCategory && (
                <p className="text-sm font-medium text-gray-300 mt-1">
                  {review.platform || review.category}
                </p>
              )}
              {review.rating && (
                <p className="text-sm font-medium text-blue-400 mt-1">
                  ⭐ {review.rating}/10
                </p>
              )}
              <p className="text-sm text-gray-400 mt-2">
                {format(new Date(review.date), 'MMMM d, yyyy')}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
} 