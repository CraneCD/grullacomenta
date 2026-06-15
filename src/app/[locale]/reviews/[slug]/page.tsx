'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { format } from 'date-fns';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useTranslations, useLocale } from 'next-intl';
import ReviewGrid from '@/components/ReviewGrid';
import { CraneRating } from '@/components/Crane';
import { getLocalizedContent, hasContentForLocale, getLocalizedTitle, hasTitleForLocale, extractYouTubeVideoId, createYouTubeEmbedUrl } from '@/lib/utils';

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
  createdAt: string;
  updatedAt?: string;
  slug: string;
  content: string;
  contentEs?: string;
  contentEn?: string;
  rating?: number;
  author: {
    name: string;
  };
}

export default function ReviewPage({ params }: { params: { slug: string } }) {
  const [review, setReview] = useState<Review | null>(null);
  const [relatedReviews, setRelatedReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations('reviews');
  const locale = useLocale();

  useEffect(() => {
    fetchReviewBySlug(params.slug);
  }, [params.slug]);

  const fetchReviewBySlug = async (slug: string) => {
    try {
      // First get all reviews to find the one with matching slug
      const response = await fetch('/api/public/reviews');
      if (response.ok) {
        const reviews = await response.json();
        const foundReview = reviews.find((r: any) => r.slug === slug);
        
        if (foundReview) {
          // Get full review details
          const detailResponse = await fetch(`/api/reviews/${foundReview.id}`);
          if (detailResponse.ok) {
            const reviewDetail = await detailResponse.json();
            setReview(reviewDetail);
            
            // Get related reviews (same category, excluding current)
            const related = reviews
              .filter((r: any) => r.category === foundReview.category && r.id !== foundReview.id)
              .slice(0, 3);
            setRelatedReviews(related);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching review:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImageSrc = (review: Review) => {
    if (review.imageData) {
      const timestamp = review.updatedAt ? new Date(review.updatedAt).getTime() : Date.now();
      return `/api/images/${review.id}?v=${timestamp}`;
    }
    return review.coverImage || '/images/placeholder.jpg';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-ink-600">{t('loadingReview')}</div>
      </div>
    );
  }

  if (!review) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-ink-900 mb-4">{t('reviewNotFound')}</h1>
        <Link href={`/${locale}`} className="text-persimmon-600 hover:text-persimmon-700 font-ui font-bold">
          {t('returnToHome')}
        </Link>
      </div>
    );
  }

  const localizedTitle = getLocalizedTitle(review, locale);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <Link
          href={`/${locale}`}
          className="inline-flex items-center text-persimmon-600 hover:text-persimmon-700 text-sm font-ui font-bold"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          {t('backToReviews')}
        </Link>
      </div>

      <article className="space-y-8">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border shadow-sm bg-paper-200">
          <Image
            src={getImageSrc(review)}
            alt={localizedTitle}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="gc-kicker block mb-2 capitalize">{review.category}</span>
              <h1 className="font-display text-4xl font-black text-ink-900 mb-0 leading-tight">{localizedTitle}</h1>
            </div>
            <div className="text-right space-y-2">
              {typeof review.rating === 'number' && (
                <CraneRating rating={review.rating} size={24} showValue />
              )}
              <time className="block text-sm text-ink-500">
                {format(new Date(review.createdAt), 'd MMMM yyyy')}
              </time>
            </div>
          </div>

          {/* Title and Content Language Indicators */}
          <div className="mb-4 space-y-2 border-t border-divider pt-4">
            <div className="flex items-center space-x-2 text-sm text-ink-500">
              <span className="font-ui font-bold text-ink-600">
                {locale === 'es' ? 'Título en:' : 'Title in:'} 
                {locale === 'es' && hasTitleForLocale(review, 'es') ? ' Español' : ''}
                {locale === 'en' && hasTitleForLocale(review, 'en') ? ' English' : ''}
                {((locale === 'es' && !hasTitleForLocale(review, 'es')) || 
                  (locale === 'en' && !hasTitleForLocale(review, 'en'))) && 
                  hasTitleForLocale(review, locale === 'es' ? 'en' : 'es') ? 
                  ` ${locale === 'es' ? 'English (fallback)' : 'Español (fallback)'}` : 
                  ' Original'}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-ink-500">
              <span className="font-ui font-bold text-ink-600">
                {locale === 'es' ? 'Contenido en:' : 'Content in:'} 
                {locale === 'es' && hasContentForLocale(review, 'es') ? ' Español' : ''}
                {locale === 'en' && hasContentForLocale(review, 'en') ? ' English' : ''}
                {((locale === 'es' && !hasContentForLocale(review, 'es')) || 
                  (locale === 'en' && !hasContentForLocale(review, 'en'))) && 
                  hasContentForLocale(review, locale === 'es' ? 'en' : 'es') ? 
                  ` ${locale === 'es' ? 'English (fallback)' : 'Español (fallback)'}` : 
                  ' Original'}
              </span>
            </div>
          </div>

          <div className="gc-prose w-full">
            {getLocalizedContent(review, locale).split('\n').map((paragraph, index) => (
              paragraph.trim() && (
                <p key={index} className="mb-6">
                  {paragraph.trim()}
                </p>
              )
            ))}
          </div>

          {/* YouTube Video Embed */}
          {review.youtubeUrl && (
            <div className="mt-8">
              <h3 className="font-display text-xl font-bold text-ink-900 mb-4">
                {locale === 'es' ? 'Video relacionado' : 'Related Video'}
              </h3>
              <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-ink-900">
                {(() => {
                  const videoId = extractYouTubeVideoId(review.youtubeUrl);
                  if (videoId) {
                    return (
                      <iframe
                        src={createYouTubeEmbedUrl(videoId)}
                        title="YouTube video"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="absolute inset-0 w-full h-full"
                      />
                    );
                  } else {
                    return (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                        <p>{locale === 'es' ? 'URL de video inválida' : 'Invalid video URL'}</p>
                      </div>
                    );
                  }
                })()}
              </div>
            </div>
          )}
        </div>
      </article>

      <section className="mt-12 space-y-6">
        <h2 className="font-display text-2xl font-bold text-ink-900">{t('relatedReviews')}</h2>
        <ReviewGrid reviews={relatedReviews} />
      </section>
    </div>
  );
} 