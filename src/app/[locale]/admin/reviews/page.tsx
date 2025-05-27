'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Review {
  id: string;
  title: string;
  titleEs?: string;
  titleEn?: string;
  category: string;
  platform?: string;
  rating?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  content?: string;
  contentEs?: string;
  contentEn?: string;
  author: {
    name: string;
    email: string;
  };
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const locale = useLocale();

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/reviews');
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched reviews:', data); // Debug log
        setReviews(data);
      } else {
        console.error('Failed to fetch reviews:', response.status, response.statusText);
        const errorData = await response.text();
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setReviews(reviews.filter(review => review.id !== reviewId));
      } else {
        const error = await response.json();
        alert(`Failed to delete review: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      alert('Failed to delete review');
    }
  };

  const getLocalizedTitle = (review: Review) => {
    // Return the title based on current locale
    if (locale === 'es') {
      return review.titleEs || review.title;
    } else if (locale === 'en') {
      return review.titleEn || review.title;
    }
    // Fallback to default title
    return review.title;
  };

  const filteredReviews = reviews.filter(review => {
    const localizedTitle = getLocalizedTitle(review);
    const matchesSearch = localizedTitle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || review.category.toLowerCase().includes(categoryFilter.toLowerCase());
    const matchesStatus = !statusFilter || review.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCategory = (category: string) => {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Loading reviews...</div>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Reviews</h1>
        <Link
          href={`/${locale}/admin/reviews/new`}
          className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          New Review
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search reviews..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
        />
        <select 
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">All Categories</option>
          <option value="video-games">Video Games</option>
          <option value="anime">Anime</option>
          <option value="manga">Manga</option>
        </select>
        <select 
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Reviews Table */}
      <div className="bg-[#1a1a1a] rounded-lg border border-gray-800">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Title</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Category</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Titles</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Content</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Rating</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Status</th>
              <th className="px-6 py-4 text-left text-sm font-medium text-gray-400">Date</th>
              <th className="px-6 py-4 text-right text-sm font-medium text-gray-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredReviews.length > 0 ? (
              filteredReviews.map((review) => (
                <tr key={review.id} className="hover:bg-[#2d2d2d] transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-white font-medium">{getLocalizedTitle(review)}</div>
                      {review.platform && (
                        <div className="text-sm text-gray-400">{review.platform}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{formatCategory(review.category)}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        review.titleEs ? 'bg-green-400/10 text-green-400' : 'bg-gray-400/10 text-gray-400'
                      }`}>
                        🇪🇸
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        review.titleEn ? 'bg-green-400/10 text-green-400' : 'bg-gray-400/10 text-gray-400'
                      }`}>
                        🇺🇸
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        review.contentEs ? 'bg-green-400/10 text-green-400' : 'bg-gray-400/10 text-gray-400'
                      }`}>
                        🇪🇸
                      </span>
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        review.contentEn ? 'bg-green-400/10 text-green-400' : 'bg-gray-400/10 text-gray-400'
                      }`}>
                        🇺🇸
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{review.rating ? review.rating : 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      review.status === 'published' 
                        ? 'bg-green-400/10 text-green-400' 
                        : 'bg-yellow-400/10 text-yellow-400'
                    }`}>
                      {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{formatDate(review.createdAt)}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <Link 
                      href={`/${locale}/admin/reviews/edit?id=${review.id}`}
                      className="text-gray-400 hover:text-white"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </Link>
                    <button 
                      onClick={() => handleDelete(review.id)}
                      className="text-gray-400 hover:text-red-400"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <div className="text-gray-400">
                    <div className="text-lg font-medium mb-2">No reviews found</div>
                    <div className="text-sm">
                      {reviews.length === 0 
                        ? "You haven't created any reviews yet. Click 'New Review' to get started!"
                        : "No reviews match your current filters."
                      }
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 