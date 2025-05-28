'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
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
        console.log('Available categories:', data.categories);
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
    
    // Always show "All Reviews" if there are any reviews
    if (availableCategories.length > 0) {
      items.push({
        name: tCategories('all'),
        href: `/${locale}/reviews`
      });
    }

    // Check if we have anime or manga reviews
    const hasAnime = availableCategories.some(cat => cat.category === 'anime');
    const hasManga = availableCategories.some(cat => cat.category === 'manga');
    
    // Show "Anime and Manga" if we have either anime or manga reviews
    if (hasAnime || hasManga) {
      items.push({
        name: tCategories('anime'),
        href: `/${locale}/anime-manga`
      });
    }

    // Add video games category and its platforms
    const videoGamesCategory = availableCategories.find(cat => cat.category === 'video-games');
    if (videoGamesCategory) {
      items.push({
        name: tCategories('videoGames'),
        href: `/${locale}/video-games`
      });
      
      // Add platforms for video games if they exist
      videoGamesCategory.platforms.forEach(platform => {
        const platformKey = platform.toLowerCase();
        if (['playstation', 'xbox', 'nintendo', 'pc'].includes(platformKey)) {
          items.push({
            name: tCategories(platformKey),
            href: `/${locale}/video-games/${platformKey}`
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
    }
  };

  return (
    <header className="bg-[#1a1a1a] text-white">
      {/* Main Header */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href={`/${locale}`} className="flex items-center hover:opacity-90 transition-opacity">
              <Image
                src="/logo.png"
                alt="Grulla Comenta"
                width={280}
                height={46}
                className="object-contain w-48 h-8 sm:w-56 sm:h-9 md:w-64 md:h-10 lg:w-72 lg:h-12"
                priority
              />
            </Link>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <form onSubmit={handleSearch} className="relative hidden sm:block w-48 md:w-64">
                <input
                  type="search"
                  placeholder={t('search') || 'Search posts...'}
                  className="w-full px-4 py-1.5 pr-10 text-sm bg-[#2d2d2d] border border-gray-700 rounded-full text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </form>
              {/* Mobile search icon */}
              <button 
                onClick={() => {
                  const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
                  if (searchInput) {
                    searchInput.focus();
                  }
                }}
                className="sm:hidden p-2 text-gray-400 hover:text-white"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </button>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation */}
      <div className="border-b border-gray-800">
        <nav className="container mx-auto px-4">
          <div className="flex items-center space-x-6 h-12 overflow-x-auto">
            {!loading && navigationItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-gray-300 hover:text-white whitespace-nowrap transition-colors"
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