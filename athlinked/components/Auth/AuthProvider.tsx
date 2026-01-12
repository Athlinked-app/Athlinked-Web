'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getToken, getRefreshToken, refreshAccessToken } from '@/utils/api';

/**
 * AuthProvider component that handles automatic session restoration
 * This ensures users stay logged in even after closing and reopening the browser
 */
export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Don't check auth on login/signup pages or landing page
    const publicRoutes = [
      '/login',
      '/signup',
      '/parent-signup',
      '/forgot-password',
      '/',
    ];
    if (publicRoutes.includes(pathname) || pathname.startsWith('/landing')) {
      return;
    }

    const restoreSession = async () => {
      try {
        const token = getToken();
        const refreshToken = getRefreshToken();

        // If no tokens at all, redirect to login with hard redirect
        if (!token && !refreshToken) {
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
          return;
        }

        // If access token exists, check if it's expired
        if (token) {
          try {
            const decoded = JSON.parse(atob(token.split('.')[1]));
            const currentTime = Math.floor(Date.now() / 1000);

            // If token is valid, user is authenticated
            if (decoded.exp && decoded.exp > currentTime) {
              return; // Session is valid
            }
          } catch (error) {
            // Token decode failed, try to refresh
          }
        }

        // If access token is expired or doesn't exist, try to refresh
        if (refreshToken) {
          try {
            const newToken = await refreshAccessToken();
            if (newToken) {
              // Successfully refreshed, user is authenticated
              return;
            }
          } catch (error) {
            // Refresh failed, user needs to login - use hard redirect
            console.log('Session expired, redirecting to login');
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        } else {
          // No refresh token, redirect to login with hard redirect
          if (typeof window !== 'undefined') {
            window.location.href = '/login';
          }
        }
      } catch (error) {
        console.error('Error restoring session:', error);
        // On error, don't redirect - let the user continue
        // Individual pages will handle auth checks
      }
    };

    restoreSession();
  }, [pathname, router]);

  return <>{children}</>;
}
