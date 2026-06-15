'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { CraneMark } from './Crane';
import LanguageSwitcher from './LanguageSwitcher';

interface CategoryData {
  category: string;
  platforms: string[];
}

interface AvailableCategoriesResponse {
  categories: CategoryData[];
  hasReviews: boolean;
}

export default function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [availableCategories, setAvailableCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const router = useRouter();
  const t = useTranslations('navigation');
  const tCategories = useTranslations('categories');
  const locale = useLocale();

  useEffect(() => {
    fetchAvailableCategories();
  }, []);

  const fetchAvailableCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data: AvailableCategoriesResponse = await response.json();
        setAvailableCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching available categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const buildNavigationItems = () => {
    const items = [];

    if (availableCategories.length > 0) {
      items.push({ name: tCategories('all'), href: `/${locale}/reviews` });
    }

    const hasAnime = availableCategories.some(cat => cat.category === 'anime');
    const hasManga = availableCategories.some(cat => cat.category === 'manga');

    if (hasAnime || hasManga) {
      items.push({ name: tCategories('anime'), href: `/${locale}/anime-manga` });
    }

    const videoGamesCategory = availableCategories.find(cat => cat.category === 'video-games');
    if (videoGamesCategory) {
      items.push({ name: tCategories('videoGames'), href: `/${locale}/video-games` });

      videoGamesCategory.platforms.forEach(platform => {
        const platformKey = platform.toLowerCase();
        if (['playstation', 'xbox', 'nintendo', 'pc'].includes(platformKey)) {
          items.push({
            name: tCategories(platformKey),
            href: `/${locale}/video-games/${platformKey}`,
          });
        }
      });
    }

    return items;
  };

  const navigationItems = buildNavigationItems();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/${locale}/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowMobileSearch(false);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-paper-50/85 backdrop-blur-md border-b border-border">
      {/* Main Header */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-[72px] gap-4">
          <Link
            href={`/${locale}`}
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
          >
            <CraneMark size={30} className="text-persimmon-500" />
            <span className="font-display font-black text-xl sm:text-2xl text-ink-900 tracking-tight">
              Grulla Comenta
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Desktop search */}
            <form onSubmit={handleSearch} className="relative hidden sm:block w-48 md:w-64">
              <input
                type="search"
                placeholder={t('search') || 'Buscar ensayos…'}
                className="w-full px-4 py-1.5 pr-10 text-sm bg-paper-100 border border-border-strong rounded-pill text-ink-900 placeholder-ink-500 focus:outline-none focus:border-persimmon-400 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-500 pointer-events-none" />
            </form>

            {/* Mobile search icon */}
            <button
              onClick={() => setShowMobileSearch(!showMobileSearch)}
              className="sm:hidden p-2 text-ink-500 hover:text-persimmon-500"
              aria-label={t('search')}
              aria-expanded={showMobileSearch}
            >
              <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      {/* Mobile search bar */}
      {showMobileSearch && (
        <div className="sm:hidden bg-paper-50 border-t border-border px-4 py-3">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="search"
              placeholder={t('search') || 'Buscar ensayos…'}
              className="w-full px-4 py-2 pr-10 text-sm bg-paper-100 border border-border-strong rounded-pill text-ink-900 placeholder-ink-500 focus:outline-none focus:border-persimmon-400 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-ink-500 pointer-events-none" />
          </form>
        </div>
      )}

      {/* Category Navigation */}
      <div className="border-t border-border">
        <nav className="container mx-auto px-4">
          <div className="flex items-center gap-1 h-12 overflow-x-auto">
            {!loading && navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-ui font-bold text-ink-600 hover:text-persimmon-500 hover:bg-paper-200 px-3 py-1.5 rounded-pill whitespace-nowrap transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
