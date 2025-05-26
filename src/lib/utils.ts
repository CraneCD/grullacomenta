interface ReviewContent {
  content?: string;
  contentEs?: string;
  contentEn?: string;
}

/**
 * Get the appropriate content based on the current locale
 * @param review - Review object with content fields
 * @param locale - Current locale ('es' or 'en')
 * @returns The appropriate content string
 */
export function getLocalizedContent(review: ReviewContent, locale: string): string {
  if (locale === 'es') {
    return review.contentEs || review.content || '';
  } else if (locale === 'en') {
    return review.contentEn || review.content || '';
  }
  return review.content || '';
}

/**
 * Check if content exists for a specific locale
 * @param review - Review object with content fields
 * @param locale - Locale to check ('es' or 'en')
 * @returns Boolean indicating if content exists for the locale
 */
export function hasContentForLocale(review: ReviewContent, locale: string): boolean {
  if (locale === 'es') {
    return !!(review.contentEs || review.content);
  } else if (locale === 'en') {
    return !!(review.contentEn || review.content);
  }
  return !!review.content;
} 