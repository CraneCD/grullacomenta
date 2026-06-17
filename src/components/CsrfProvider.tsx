'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function CsrfProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const generateCsrfToken = async () => {
      if (status !== 'authenticated') {
        return;
      }

      try {
        const response = await fetch('/api/csrf', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const { token } = await response.json();

          let metaTag = document.querySelector('meta[name="csrf-token"]');
          if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.setAttribute('name', 'csrf-token');
            document.head.appendChild(metaTag);
          }
          metaTag.setAttribute('content', token);

          setRetryCount(0);
        } else if (response.status === 401 && retryCount < 3) {
          setRetryCount((prev) => prev + 1);
          setTimeout(generateCsrfToken, 1000);
        }
      } catch (error) {
        console.error('Failed to generate CSRF token:', error);
      }
    };

    generateCsrfToken();
  }, [session, status, retryCount]);

  return <>{children}</>;
}
