'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface BannerFormData {
  kickerEs: string;
  kickerEn: string;
  titleEs: string;
  titleEn: string;
  subtitleEs: string;
  subtitleEn: string;
  primaryLabelEs: string;
  primaryLabelEn: string;
  primaryLink: string;
  secondaryLabelEs: string;
  secondaryLabelEn: string;
  secondaryLink: string;
  backgroundImage: string;
  imageData?: string;
  imageMimeType?: string;
}

const emptyForm: BannerFormData = {
  kickerEs: '',
  kickerEn: '',
  titleEs: '',
  titleEn: '',
  subtitleEs: '',
  subtitleEn: '',
  primaryLabelEs: '',
  primaryLabelEn: '',
  primaryLink: '',
  secondaryLabelEs: '',
  secondaryLabelEn: '',
  secondaryLink: '',
  backgroundImage: '',
};

const inputClass =
  'w-full px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500';
const labelClass = 'block text-sm font-medium text-gray-300';

export default function BannerEditor() {
  const [formData, setFormData] = useState<BannerFormData>(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [activeLang, setActiveLang] = useState<'es' | 'en'>('es');
  const [useImageUpload, setUseImageUpload] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const locale = useLocale();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/home-banner', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setFormData({ ...emptyForm, ...sanitize(data) });
          if (data.imageData) {
            setUseImageUpload(true);
            setImagePreview(`data:${data.imageMimeType};base64,${data.imageData}`);
          } else if (data.backgroundImage) {
            setUseImageUpload(false);
            setImagePreview(data.backgroundImage);
          }
        }
      } catch (error) {
        console.error('Error loading banner:', error);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Replace nulls from the API with empty strings for controlled inputs.
  const sanitize = (data: Record<string, unknown>): Partial<BannerFormData> => {
    const out: Record<string, string> = {};
    for (const key of Object.keys(emptyForm) as (keyof BannerFormData)[]) {
      const value = data[key];
      out[key] = typeof value === 'string' ? value : '';
    }
    return out as Partial<BannerFormData>;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'backgroundImage' && !useImageUpload) {
      setImagePreview(value || null);
    }
  };

  const getCsrfToken = async () => {
    const res = await fetch('/api/csrf', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to get CSRF token. Please make sure you are logged in.');
    const { token } = await res.json();
    return token as string;
  };

  const handleImageModeChange = (useUpload: boolean) => {
    setUseImageUpload(useUpload);
    if (useUpload) {
      setFormData((prev) => ({ ...prev, backgroundImage: '' }));
      setImagePreview(formData.imageData ? `data:${formData.imageMimeType};base64,${formData.imageData}` : null);
    } else {
      setFormData((prev) => ({ ...prev, imageData: undefined, imageMimeType: undefined }));
      setImagePreview(formData.backgroundImage || null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const body = new FormData();
      body.append('image', file);
      const csrfToken = await getCsrfToken();

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'X-CSRF-Token': csrfToken, Accept: 'application/json' },
        body,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.details || `Failed to upload image (${res.status})`);
      }

      const result = await res.json();
      setFormData((prev) => ({
        ...prev,
        imageData: result.imageData,
        imageMimeType: result.mimeType,
        backgroundImage: '',
      }));
      setImagePreview(`data:${result.mimeType};base64,${result.imageData}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setFormData((prev) => ({
      ...prev,
      imageData: undefined,
      imageMimeType: undefined,
      backgroundImage: '',
    }));
    setImagePreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedMessage('');
    try {
      const csrfToken = await getCsrfToken();
      const res = await fetch('/api/home-banner', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrfToken },
        body: JSON.stringify(formData),
        credentials: 'include',
      });

      if (res.ok) {
        setSavedMessage('Banner saved successfully.');
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to save banner: ${err.error || res.status}`);
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to save banner');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Loading banner...</div>
      </div>
    );
  }

  const langField = (
    base: 'kicker' | 'title' | 'subtitle' | 'primaryLabel' | 'secondaryLabel'
  ) => `${base}${activeLang === 'es' ? 'Es' : 'En'}` as keyof BannerFormData;

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link
          href={`/${locale}/admin`}
          className="inline-flex items-center text-blue-400 hover:text-blue-300 text-sm font-medium"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-white">Home Banner</h1>
        <p className="text-gray-400 text-sm">
          Customise the hero banner shown at the top of the homepage. Empty fields fall back to the
          site&apos;s default text.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Language tabs */}
        <div className="flex space-x-1 bg-gray-800 p-1 rounded-lg max-w-sm">
          <button
            type="button"
            onClick={() => setActiveLang('es')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeLang === 'es' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            🇪🇸 Español
          </button>
          <button
            type="button"
            onClick={() => setActiveLang('en')}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeLang === 'en' ? 'bg-blue-500 text-white' : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
          >
            🇺🇸 English
          </button>
        </div>

        {/* Text fields (per language) */}
        <div className="space-y-4 bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white">
            Text ({activeLang === 'es' ? 'Español' : 'English'})
          </h2>

          <div className="space-y-2">
            <label htmlFor={langField('kicker')} className={labelClass}>Kicker (small text above title)</label>
            <input
              type="text"
              id={langField('kicker')}
              name={langField('kicker')}
              value={formData[langField('kicker')] as string}
              onChange={handleChange}
              placeholder="e.g. Slow reads · Considered takes"
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor={langField('title')} className={labelClass}>Title</label>
            <input
              type="text"
              id={langField('title')}
              name={langField('title')}
              value={formData[langField('title')] as string}
              onChange={handleChange}
              placeholder="e.g. Essays on anime, manga and video games"
              className={inputClass}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor={langField('subtitle')} className={labelClass}>Subtitle</label>
            <textarea
              id={langField('subtitle')}
              name={langField('subtitle')}
              value={formData[langField('subtitle')] as string}
              onChange={handleChange}
              rows={3}
              placeholder="Short description shown under the title"
              className={inputClass}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="space-y-6 bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white">Buttons</h2>

          {/* Primary button */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-300">Primary button</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor={langField('primaryLabel')} className={labelClass}>
                  Label ({activeLang === 'es' ? 'Español' : 'English'})
                </label>
                <input
                  type="text"
                  id={langField('primaryLabel')}
                  name={langField('primaryLabel')}
                  value={formData[langField('primaryLabel')] as string}
                  onChange={handleChange}
                  placeholder="e.g. View all reviews"
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="primaryLink" className={labelClass}>Link</label>
                <input
                  type="text"
                  id="primaryLink"
                  name="primaryLink"
                  value={formData.primaryLink}
                  onChange={handleChange}
                  placeholder="e.g. anime-manga or https://..."
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Secondary button */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-300">Secondary button (optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor={langField('secondaryLabel')} className={labelClass}>
                  Label ({activeLang === 'es' ? 'Español' : 'English'})
                </label>
                <input
                  type="text"
                  id={langField('secondaryLabel')}
                  name={langField('secondaryLabel')}
                  value={formData[langField('secondaryLabel')] as string}
                  onChange={handleChange}
                  placeholder="Leave empty to hide this button"
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="secondaryLink" className={labelClass}>Link</label>
                <input
                  type="text"
                  id="secondaryLink"
                  name="secondaryLink"
                  value={formData.secondaryLink}
                  onChange={handleChange}
                  placeholder="e.g. video-games or https://..."
                  className={inputClass}
                />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Links can be an internal path (e.g. <code>anime-manga</code>) or a full URL starting with
            http(s). Internal paths are shown in the visitor&apos;s language automatically.
          </p>
        </div>

        {/* Background image */}
        <div className="space-y-4 bg-[#1a1a1a] border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white">Background image (optional)</h2>
          <p className="text-xs text-gray-500">
            Leave empty to keep the default gradient background. A dark overlay is added automatically
            for text legibility.
          </p>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => handleImageModeChange(true)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                useImageUpload ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Upload Image
            </button>
            <button
              type="button"
              onClick={() => handleImageModeChange(false)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                !useImageUpload ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              Image URL
            </button>
          </div>

          {useImageUpload ? (
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-gray-800 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-500 file:text-white hover:file:bg-blue-600 disabled:opacity-50"
              />
              {uploading && <div className="text-blue-400 text-sm">Uploading image...</div>}
            </div>
          ) : (
            <input
              type="url"
              id="backgroundImage"
              name="backgroundImage"
              value={formData.backgroundImage}
              onChange={handleChange}
              placeholder="https://..."
              className={inputClass}
            />
          )}

          {imagePreview && (
            <div className="space-y-2">
              <div className="relative overflow-hidden rounded-lg border border-gray-700 max-w-md">
                <img src={imagePreview} alt="Background preview" className="w-full h-48 object-cover" />
                <div className="absolute inset-0 bg-[#231a14]/70" />
              </div>
              <button
                type="button"
                onClick={clearImage}
                className="text-sm text-red-400 hover:text-red-300"
              >
                Remove background image
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          {savedMessage && <span className="text-green-400 text-sm">{savedMessage}</span>}
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving...' : 'Save Banner'}
          </button>
        </div>
      </form>
    </div>
  );
}
