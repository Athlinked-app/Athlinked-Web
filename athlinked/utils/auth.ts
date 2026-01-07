/**
 * Authentication utilities for frontend
 */

import { getToken, getRefreshToken, removeToken } from './api';
import { decodeToken } from './jwt-decode';

interface DecodedToken {
  id: string;
  email: string | null;
  username: string | null;
  user_type: string | null;
  iat?: number;
  exp?: number;
}

/**
 * Check if user is authenticated (has valid token)
 * Also checks if token is expired and if refresh token exists
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) {
    // Check if refresh token exists - user might still be logged in
    const refreshToken = getRefreshToken();
    return refreshToken !== null;
  }

  try {
    // Check if token is expired
    const decoded = decodeToken(token) as DecodedToken | null;
    if (!decoded) return false;

    // If token has expiration, check it
    if (decoded.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      if (decoded.exp < currentTime) {
        // Token expired, but check if refresh token exists
        const refreshToken = getRefreshToken();
        return refreshToken !== null;
      }
    }

    return true;
  } catch (error) {
    // If token decode fails, check if refresh token exists
    const refreshToken = getRefreshToken();
    return refreshToken !== null;
  }
}

/**
 * Get current user ID from token
 */
export function getCurrentUserId(): string | null {
  const token = getToken();
  if (!token) return null;

  try {
    // Decode without verification (for frontend use only)
    // Backend will verify the token
    const decoded = decodeToken(token) as DecodedToken | null;
    return decoded?.id || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get current user data from token
 */
export function getCurrentUser(): DecodedToken | null {
  const token = getToken();
  if (!token) return null;

  try {
    const decoded = decodeToken(token) as DecodedToken | null;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Logout user by revoking refresh token and removing tokens
 * Redirects to login page after logout
 */
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();

  // Clear tokens FIRST before making any API calls
  // This ensures tokens are removed even if the API call fails
  removeToken();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userEmail');
    // Set a flag to indicate we just logged out - this prevents auto-redirect on login page
    localStorage.setItem('justLoggedOut', 'true');
  }

  // Revoke refresh token on server (non-blocking)
  if (refreshToken) {
    try {
      const { apiPost } = await import('./api');
      await apiPost('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Error revoking token:', error);
      // Continue with logout even if API call fails
    }
  }

  // Force a hard redirect to login page to clear any cached state
  if (typeof window !== 'undefined') {
    // Use replace to prevent back button from going to previous page
    window.location.replace('/login');
  }
}

/**
 * Redirect to login if not authenticated
 */
export function requireAuth(): void {
  if (!isAuthenticated() && typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
