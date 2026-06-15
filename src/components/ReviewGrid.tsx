'use client';

import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { useLocale } from 'next-intl';
import { getLocalizedTitle } from '@/lib/utils';
import { CraneRating } from './Crane';

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

// Genre accents — the three content pillars (matches the design system Tag).
const GENRE_STYLES: Record<string, string> = {
  anime: 'bg-persimmon-500/[0.14] text-persimmon-600',
  manga: 'bg-indigo-500/[0.14] text-indigo-500',
  'video-games': 'bg-matcha-600/[0.16] text-matcha-600',
};

function GenreTag({ label, category }: { label: string; category: string }) {
  const style = GENRE_STYLES[category] ?? 'bg-ink-600/[0.12] text-ink-600';
  return (
    <span
      className={`inline-flex items-center rounded-pill px-2.5 py-1 text-xs font-ui font-bold capitalize ${style}`}
    >
      {label}
    </span>
  );
}

export default function ReviewGrid({ reviews, showCategory = true }: ReviewGridProps) {
  const locale = useLocale();

  const getImageSrc = (review: Review) => {
    if (review.imageData) {
      const timestamp = review.updatedAt ? new Date(review.updatedAt).getTime() : Date.now();
      return `/api/images/${review.id}?v=${timestamp}`;
    }
    return review.coverImage || '/images/placeholder.jpg';
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {reviews.map((review) => {
        const localizedTitle = getLocalizedTitle(review, locale);

        return (
          <Link
            key={review.id}
            href={`/${locale}/reviews/${review.slug}`}
            className="group flex flex-col bg-paper-50 rounded-lg overflow-hidden border border-border shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative aspect-video overflow-hidden bg-paper-200">
              <Image
                src={getImageSrc(review)}
                alt={localizedTitle}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
            </div>
            <div className="flex flex-col gap-3 p-5">
              <div className="flex items-center gap-2">
                {showCategory && (
                  <GenreTag label={review.platform || review.category} category={review.category} />
                )}
                <span className="font-ui text-xs text-ink-500">
                  {format(new Date(review.date), 'd MMM yyyy')}
                </span>
              </div>

              <h3 className="font-display text-xl font-bold leading-tight text-ink-900 group-hover:text-persimmon-600 transition-colors line-clamp-2">
                {localizedTitle}
              </h3>

              {typeof review.rating === 'number' && (
                <div className="mt-auto pt-1">
                  <CraneRating rating={review.rating} size={16} />
                </div>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
