'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export default function CsrfProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [isInitialized, setIsInitialized] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Debug mount and initial state
  useEffect(() => {
    console.log('CsrfProvider: Component mounted');
    console.log('CsrfProvider: Initial session status:', status);
    console.log('CsrfProvider: Initial session data:', session);
    console.log('CsrfProvider: Cookies:', document.cookie);
  }, []);

  // Handle session changes
  useEffect(() => {
    console.log('CsrfProvider: Session status changed:', status);
    console.log('CsrfProvider: Session data:', session);
    console.log('CsrfProvider: Cookies:', document.cookie);

    const generateCsrfToken = async () => {
      if (status === 'loading') {
        console.log('CsrfProvider: Session is still loading');
        return;
      }

      if (status === 'unauthenticated') {
        console.log('CsrfProvider: User is not authenticated');
        return;
      }

      try {
        console.log('CsrfProvider: Fetching CSRF token...');
        const response = await fetch('/api/csrf', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          credentials: 'include',
        });
        
        console.log('CsrfProvider: CSRF response status:', response.status);
        console.log('CsrfProvider: CSRF response headers:', Object.fromEntries(response.headers.entries()));
        
        if (response.ok) {
          const { token } = await response.json();
          console.log('CsrfProvider: CSRF token received');
          
          // Add CSRF token to meta tag
          let metaTag = document.querySelector('meta[name="csrf-token"]');
          console.log('CsrfProvider: Existing meta tag found:', !!metaTag);
          
          if (!metaTag) {
            console.log('CsrfProvider: Creating new meta tag');
            metaTag = document.createElement('meta');
            metaTag.setAttribute('name', 'csrf-token');
            document.head.appendChild(metaTag);
          }
          
          metaTag.setAttribute('content', token);
          console.log('CsrfProvider: CSRF token set in meta tag');
          
          // Verify the token was set
          const verifyToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
          console.log('CsrfProvider: Token verification:', verifyToken ? 'Token present' : 'Token missing');
          
          setIsInitialized(true);
          setRetryCount(0); // Reset retry count on success
        } else {
          const errorText = await response.text();
          console.error('CsrfProvider: Failed to get CSRF token:', errorText);
          
          // Retry logic for 401 errors
          if (response.status === 401 && retryCount < 3) {
            console.log(`CsrfProvider: Retrying token generation (attempt ${retryCount + 1})`);
            setRetryCount(prev => prev + 1);
            setTimeout(generateCsrfToken, 1000); // Retry after 1 second
          } else {
            throw new Error(`Failed to get CSRF token: ${errorText}`);
          }
        }
      } catch (error) {
        console.error('CsrfProvider: Error generating CSRF token:', error);
      }
    };

    if (status === 'authenticated') {
      console.log('CsrfProvider: User is authenticated, generating token');
      generateCsrfToken();
    }
  }, [session, status, retryCount]);

  // Debug element
  useEffect(() => {
    const debugElement = document.createElement('div');
    debugElement.id = 'csrf-provider-debug';
    debugElement.style.display = 'none';
    debugElement.textContent = JSON.stringify({
      status,
      isInitialized,
      retryCount,
      hasSession: !!session,
      sessionId: session?.user?.id,
      cookies: document.cookie
    }, null, 2);
    document.body.appendChild(debugElement);
    return () => {
      // Check if the element still exists before removing it
      if (document.body.contains(debugElement)) {
        document.body.removeChild(debugElement);
      }
    };
  }, [status, isInitialized, retryCount, session]);

  return <>{children}</>;
} 