/**
 * Route protection utilities
 * Use this to protect pages that require authentication
 */

import { isAuthenticated } from './auth';

/**
 * Check if user is authenticated and redirect to login if not
 * Call this in useEffect at the top of protected page components
 */
export function protectRoute(): boolean {
  if (typeof window === 'undefined') return false;

  if (!isAuthenticated()) {
    window.location.href = '/login';
    return false;
  }

  return true;
}
