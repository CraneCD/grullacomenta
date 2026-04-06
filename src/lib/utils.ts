interface ReviewContent {
  content?: string;
  contentEs?: string;
  contentEn?: string;
}

interface ReviewTitle {
  title?: string;
  titleEs?: string;
  titleEn?: string;
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
 * Get the appropriate title based on the current locale
 * @param review - Review object with title fields
 * @param locale - Current locale ('es' or 'en')
 * @returns The appropriate title string
 */
export function getLocalizedTitle(review: ReviewTitle, locale: string): string {
  if (locale === 'es') {
    return review.titleEs || review.title || '';
  } else if (locale === 'en') {
    return review.titleEn || review.title || '';
  }
  return review.title || '';
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

/**
 * Check if title exists for a specific locale
 * @param review - Review object with title fields
 * @param locale - Locale to check ('es' or 'en')
 * @returns Boolean indicating if title exists for the locale
 */
export function hasTitleForLocale(review: ReviewTitle, locale: string): boolean {
  if (locale === 'es') {
    return !!(review.titleEs || review.title);
  } else if (locale === 'en') {
    return !!(review.titleEn || review.title);
  }
  return !!review.title;
}

/**
 * Extract YouTube video ID from various YouTube URL formats
 */
export function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Create YouTube embed URL from video ID
 */
export function createYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Check if a URL is a valid YouTube URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  if (!url) return false;
  return extractYouTubeVideoId(url) !== null;
} 