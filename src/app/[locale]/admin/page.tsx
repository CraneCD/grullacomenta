'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { 
  DocumentTextIcon, 
  FilmIcon, 
  DevicePhoneMobileIcon,
  PlusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalReviews: number;
  animeAndMangaReviews: number;
  videoGameReviews: number;
  recentActivity: {
    id: string;
    title: string;
    action: string;
    authorName: string;
    updatedAt: string;
    status: string;
  }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const locale = useLocale();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  if (loading && !stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Loading dashboard...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-white">Failed to load dashboard data. Please try refreshing.</div>
      </div>
    );
  }
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <div className="flex gap-3">
          <button
            onClick={fetchStats}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <ArrowPathIcon className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href={`/${locale}/admin/reviews/new`}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            New Review
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats && [
          { name: 'Total Reviews', value: stats.totalReviews.toString(), icon: DocumentTextIcon },
          { name: 'Anime & Manga Reviews', value: stats.animeAndMangaReviews.toString(), icon: FilmIcon },
          { name: 'Video Game Reviews', value: stats.videoGameReviews.toString(), icon: DevicePhoneMobileIcon },
        ].map((stat) => (
          <div
            key={stat.name}
            className="bg-[#1a1a1a] p-6 rounded-lg border border-gray-800"
          >
            <div className="flex items-center">
              <div className="p-3 bg-blue-500 bg-opacity-10 rounded-lg">
                <stat.icon className="w-6 h-6 text-blue-400" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-400">{stat.name}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <section className="space-y-4">
        <h2 className="text-xl font-bold text-white">Recent Activity</h2>
        <div className="bg-[#1a1a1a] rounded-lg border border-gray-800 divide-y divide-gray-800">
          {stats && stats.recentActivity.length > 0 ? (
            stats.recentActivity.map((activity) => (
              <div key={activity.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Review {activity.action}</p>
                  <p className="text-sm text-gray-400">{activity.title}</p>
                  <p className="text-xs text-gray-500">by {activity.authorName}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-400">{formatTimeAgo(activity.updatedAt)}</span>
                  <div className="mt-1">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      activity.status === 'published' 
                        ? 'bg-green-400/10 text-green-400' 
                        : 'bg-yellow-400/10 text-yellow-400'
                    }`}>
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-400">
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
} 