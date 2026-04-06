'use client';

import { usePathname } from 'next/navigation';
import Header from './Header';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdminPage = pathname?.includes('/admin');

  return (
    <>
      {!isAdminPage && <Header />}
      <main className={isAdminPage ? '' : 'container py-8'}>
        {children}
      </main>
    </>
  );
} 