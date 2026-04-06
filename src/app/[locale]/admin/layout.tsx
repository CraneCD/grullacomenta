'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { redirect, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { 
  HomeIcon, 
  DocumentTextIcon
} from '@heroicons/react/24/outline';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const locale = useLocale();

  const sidebarItems = [
    { name: 'Dashboard', href: `/${locale}/admin`, icon: HomeIcon },
    { name: 'All Reviews', href: `/${locale}/admin/reviews`, icon: DocumentTextIcon },
  ];
  
  // Don't apply authentication check to login page
  const isLoginPage = pathname === `/${locale}/admin/login`;
  
  if (isLoginPage) {
    return children;
  }

  if (status === 'loading') {
    return <div className="min-h-screen bg-[#121212] flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>;
  }

  if (!session) {
    redirect(`/${locale}/admin/login`);
  }

  return (
    <div className="min-h-screen bg-[#121212]">
      {/* Admin Header */}
      <header className="bg-[#1a1a1a] border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link href={`/${locale}/admin`} className="text-xl font-bold text-white">
              Reviews Admin
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-400">
                {session.user?.email}
              </span>
              <Link 
                href={`/${locale}`} 
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                View Site
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-[#1a1a1a] min-h-[calc(100vh-4rem)] border-r border-gray-800">
          <nav className="p-4 space-y-1">
            {sidebarItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center px-4 py-3 text-gray-300 hover:text-white hover:bg-[#2d2d2d] rounded-lg transition-colors"
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
} 