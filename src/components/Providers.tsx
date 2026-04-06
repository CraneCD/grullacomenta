'use client';

import { SessionProvider } from 'next-auth/react';
import CsrfProvider from './CsrfProvider';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CsrfProvider>
        {children}
      </CsrfProvider>
    </SessionProvider>
  );
} 