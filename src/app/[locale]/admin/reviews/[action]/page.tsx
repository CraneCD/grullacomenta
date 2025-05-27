'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface ReviewFormData {
  title: string;
  titleEs: string;
  titleEn: string;
  category: string;
  platform?: string;
  content: string; // Keep for backward compatibility
  contentEs: string;
  contentEn: string;
  rating?: number;
  coverImage: string;
  imageData?: string;
  imageMimeType?: string;
  status: 'draft' | 'published';
}

const initialFormData: ReviewFormData = {
  title: '',
  titleEs: '',
  titleEn: '',
  category: '',
  platform: '',
  content: '',
  contentEs: '',
  contentEn: '',
  rating: undefined,
  coverImage: '',
  status: 'draft'
};

export default function ReviewForm({ params }: { params: { action: string } }) {
  const [formData, setFormData] = useState<ReviewFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [useImageUpload, setUseImageUpload] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState<'es' | 'en'>('es');
  const [activeTitleTab, setActiveTitleTab] = useState<'es' | 'en'>('es');
  const searchParams = useSearchParams();
  const router = useRouter();
  const reviewId = searchParams.get('id');
  const isEditing = params.action === 'edit' && reviewId;

  useEffect(() => {
    if (isEditing && reviewId) {
      loadReviewData(reviewId);
    }
  }, [isEditing, reviewId]);

  const loadReviewData = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reviews/${id}`);
      if (response.ok) {
        const review = await response.json();
        setFormData({
          title: review.title,
          titleEs: review.titleEs || '',
          titleEn: review.titleEn || '',
          category: review.category,
          platform: review.platform || '',
          content: review.content,
          contentEs: review.contentEs || review.content || '', // Fallback to content if contentEs is empty
          contentEn: review.contentEn || '',
          rating: review.rating,
          coverImage: review.coverImage || '',
          imageData: review.imageData,
          imageMimeType: review.imageMimeType,
          status: review.status
        });
        
        // Set up image preview and upload mode
        if (review.imageData) {
          setUseImageUpload(true);
          setImagePreview(`data:${review.imageMimeType};base64,${review.imageData}`);
        } else if (review.coverImage) {
          setUseImageUpload(false);
          setImagePreview(review.coverImage);
        }
      } else {
        alert('Failed to load review data');
        router.push('/admin/reviews');
      }
    } catch (error) {
      console.error('Error loading review:', error);
      alert('Failed to load review data');
      router.push('/admin/reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that either an image is uploaded or a URL is provided
    if (!formData.imageData && !formData.coverImage) {
      alert('Please provide either an image upload or an image URL');
      return;
    }

    // Validate that at least one language title is provided (or has main title for backward compatibility)
    if (!formData.titleEs && !formData.titleEn && !formData.title) {
      alert('Please provide a title in at least one language (Spanish or English)');
      return;
    }

    // Validate that at least one language content is provided
    if (!formData.contentEs && !formData.contentEn) {
      alert('Please provide content in at least one language (Spanish or English)');
      return;
    }
    
    setSaving(true);

    try {
      // Use absolute URL without locale prefix for API routes
      const url = isEditing 
        ? `/api/reviews/${reviewId}` 
        : `/api/reviews`;
      const method = isEditing ? 'PUT' : 'POST';

      // Get CSRF token from API
      const csrfResponse = await fetch('/api/csrf', {
        credentials: 'include'
      });
      
      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token. Please make sure you are logged in.');
      }
      
      const { token: csrfToken } = await csrfResponse.json();

      // Prepare form data with backward compatibility
      const submitData = {
        ...formData,
        // Ensure title is set for backward compatibility
        title: formData.titleEs || formData.titleEn || formData.title || '', // Use Spanish as primary, fallback to English
        // Ensure content is at least 10 characters
        content: formData.contentEs || formData.contentEn || '', // Use Spanish as primary, fallback to English
        // Convert rating to number if it exists
        rating: formData.rating ? Number(formData.rating) : undefined,
        // Ensure at least one content field is filled
        contentEs: formData.contentEs || '',
        contentEn: formData.contentEn || ''
      };

      // Validate content length
      if (submitData.content.length < 10) {
        alert('Content must be at least 10 characters long');
        return;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify(submitData),
        credentials: 'include', // Include cookies for authentication
      });

      if (response.ok) {
        router.push('/admin/reviews');
      } else {
        const error = await response.json();
        alert(`Failed to ${isEditing ? 'update' : 'create'} review: ${error.error}`);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(`Failed to ${isEditing ? 'update' : 'create'} review`);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Update image preview for URL input
    if (name === 'coverImage' && !useImageUpload) {
      setImagePreview(value || null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      // Get CSRF token from API
      const csrfResponse = await fetch('/api/csrf', {
        credentials: 'include'
      });
      
      if (!csrfResponse.ok) {
        throw new Error('Failed to get CSRF token. Please make sure you are logged in.');
      }
      
      const { token: csrfToken } = await csrfResponse.json();
      console.log('CSRF Token obtained:', csrfToken ? 'Yes' : 'No');
      
      // Use absolute path to avoid locale prefix
      console.log('Sending upload request to /api/upload');
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'X-CSRF-Token': csrfToken,
          'Accept': 'application/json',
        },
        body: formData,
      });

      console.log('Upload response status:', response.status);
      console.log('Upload response headers:', Object.fromEntries(response.headers.entries()));

      // Check if the response is JSON
      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);
      
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error('Non-JSON response:', errorText);
        throw new Error(`Server returned non-JSON response (${contentType}). Please try again.`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload error response:', errorData);
        throw new Error(errorData.error || errorData.details || `Failed to upload image (${response.status})`);
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      
      setFormData(prev => ({
        ...prev,
        imageData: result.imageData,
        imageMimeType: result.mimeType,
        coverImage: '' // Clear URL when using upload
      }));
      setImagePreview(`data:${result.mimeType};base64,${result.imageData}`);
    } catch (error) {
      console.error('Error uploading image:', error);
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        alert(error.message);
      } else {
        alert('Failed to upload image. Please try again.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleImageModeChange = (useUpload: boolean) => {
    setUseImageUpload(useUpload);
    if (useUpload) {
      // Clear URL when switching to upload
      setFormData(prev => ({ ...prev, coverImage: '' }));
    } else {
      // Clear upload data when switching to URL
      setFormData(prev => ({ 
        ...prev, 
        imageData: undefined, 
        imageMimeType: undefined 
      }));
      setImagePreview(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Loading review data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-3">
          <Link
            href="/admin/reviews"
            className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Reviews
          </Link>
          <h1 className="text-3xl font-bold text-white">
            {isEditing ? 'Edit Review' : 'New Review'}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Multilingual Titles */}
        <div className="space-y-4 mb-6">
          <label className="block text-sm font-medium text-gray-300">
            Titles
          </label>
          
          {/* Title Language Tabs */}
          <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTitleTab('es')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTitleTab === 'es'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              🇪🇸 Español
            </button>
            <button
              type="button"
              onClick={() => setActiveTitleTab('en')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTitleTab === 'en'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              🇺🇸 English
            </button>
          </div>

          {/* Spanish Title */}
          {activeTitleTab === 'es' && (
            <div className="space-y-2">
              <label htmlFor="titleEs" className="block text-sm font-medium text-gray-400">
                Título en Español
              </label>
              <input
                type="text"
                id="titleEs"
                name="titleEs"
                value={formData.titleEs}
                onChange={handleChange}
                placeholder="Ingresa el título en español..."
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          )}

          {/* English Title */}
          {activeTitleTab === 'en' && (
            <div className="space-y-2">
              <label htmlFor="titleEn" className="block text-sm font-medium text-gray-400">
                Title in English
              </label>
              <input
                type="text"
                id="titleEn"
                name="titleEn"
                value={formData.titleEn}
                onChange={handleChange}
                placeholder="Enter the title in English..."
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {/* Title Status Indicators */}
          <div className="flex space-x-4 text-xs">
            <div className={`flex items-center space-x-2 ${formData.titleEs ? 'text-green-400' : 'text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full ${formData.titleEs ? 'bg-green-400' : 'bg-gray-500'}`}></div>
              <span>Español: {formData.titleEs ? 'Completado' : 'Pendiente'}</span>
            </div>
            <div className={`flex items-center space-x-2 ${formData.titleEn ? 'text-green-400' : 'text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full ${formData.titleEn ? 'bg-green-400' : 'bg-gray-500'}`}></div>
              <span>English: {formData.titleEn ? 'Completed' : 'Pending'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Category */}
          <div className="space-y-2">
            <label htmlFor="category" className="block text-sm font-medium text-gray-300">
              Category
            </label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            >
              <option value="">Select Category</option>
              <option value="video-games">Video Games</option>
              <option value="anime">Anime</option>
              <option value="manga">Manga</option>
            </select>
          </div>

          {/* Platform (only for video games) */}
          {formData.category === 'video-games' && (
            <div className="space-y-2">
              <label htmlFor="platform" className="block text-sm font-medium text-gray-300">
                Platform
              </label>
              <select
                id="platform"
                name="platform"
                value={formData.platform}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
                required
              >
                <option value="">Select Platform</option>
                <option value="playstation">PlayStation</option>
                <option value="xbox">Xbox</option>
                <option value="nintendo">Nintendo</option>
                <option value="pc">PC</option>
              </select>
            </div>
          )}

          {/* Rating */}
          <div className="space-y-2">
            <label htmlFor="rating" className="block text-sm font-medium text-gray-300">
              Rating (0-10) - Optional
            </label>
            <input
              type="number"
              id="rating"
              name="rating"
              min="0"
              max="10"
              step="0.1"
              value={formData.rating}
              onChange={handleChange}
              placeholder="Leave empty if no rating"
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Cover Image */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-300">
              Cover Image
            </label>
            
            {/* Image Mode Toggle */}
            <div className="flex space-x-4 mb-4">
              <button
                type="button"
                onClick={() => handleImageModeChange(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  useImageUpload 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Upload Image
              </button>
              <button
                type="button"
                onClick={() => handleImageModeChange(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !useImageUpload 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Image URL
              </button>
            </div>

            {useImageUpload ? (
              <div className="space-y-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-500 file:text-white hover:file:bg-blue-600 disabled:opacity-50"
                />
                {uploading && (
                  <div className="text-blue-400 text-sm">Uploading image...</div>
                )}
              </div>
            ) : (
              <input
                type="url"
                id="coverImage"
                name="coverImage"
                value={formData.coverImage}
                onChange={handleChange}
                placeholder="Enter image URL"
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
              />
            )}

            {/* Image Preview */}
            {imagePreview && (
              <div className="mt-4">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full max-w-md h-48 object-cover rounded-lg border border-gray-700"
                />
              </div>
            )}
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label htmlFor="status" className="block text-sm font-medium text-gray-300">
              Status
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white focus:outline-none focus:border-blue-500"
              required
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        {/* Multilingual Content */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-300">
            Content
          </label>
          
          {/* Language Tabs */}
          <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setActiveContentTab('es')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeContentTab === 'es'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              🇪🇸 Español
            </button>
            <button
              type="button"
              onClick={() => setActiveContentTab('en')}
              className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeContentTab === 'en'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-300 hover:text-white hover:bg-gray-700'
              }`}
            >
              🇺🇸 English
            </button>
          </div>

          {/* Spanish Content */}
          {activeContentTab === 'es' && (
            <div className="space-y-2">
              <label htmlFor="contentEs" className="block text-sm font-medium text-gray-400">
                Contenido en Español
              </label>
              <textarea
                id="contentEs"
                name="contentEs"
                value={formData.contentEs}
                onChange={handleChange}
                rows={10}
                placeholder="Escribe el contenido de la reseña en español..."
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          )}

          {/* English Content */}
          {activeContentTab === 'en' && (
            <div className="space-y-2">
              <label htmlFor="contentEn" className="block text-sm font-medium text-gray-400">
                Content in English
              </label>
              <textarea
                id="contentEn"
                name="contentEn"
                value={formData.contentEn}
                onChange={handleChange}
                rows={10}
                placeholder="Write the review content in English..."
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                required
              />
            </div>
          )}

          {/* Content Status Indicators */}
          <div className="flex space-x-4 text-sm">
            <div className={`flex items-center space-x-2 ${formData.contentEs ? 'text-green-400' : 'text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full ${formData.contentEs ? 'bg-green-400' : 'bg-gray-500'}`}></div>
              <span>Español: {formData.contentEs ? 'Completado' : 'Pendiente'}</span>
            </div>
            <div className={`flex items-center space-x-2 ${formData.contentEn ? 'text-green-400' : 'text-gray-500'}`}>
              <div className={`w-2 h-2 rounded-full ${formData.contentEn ? 'bg-green-400' : 'bg-gray-500'}`}></div>
              <span>English: {formData.contentEn ? 'Completed' : 'Pending'}</span>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Link
            href="/admin/reviews"
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving 
              ? (isEditing ? 'Updating...' : 'Creating...') 
              : (isEditing ? 'Update Review' : 'Create Review')
            }
          </button>
        </div>
      </form>
    </div>
  );
} 