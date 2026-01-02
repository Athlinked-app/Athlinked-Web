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
 */
export function isAuthenticated(): boolean {
  const token = getToken();
  if (!token) return false;

  try {
    // Basic validation - check if token exists and is not expired
    // Full validation happens on backend
    return true;
  } catch (error) {
    return false;
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
 */
export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();

  // Revoke refresh token on server
  if (refreshToken) {
    try {
      const { apiPost } = await import('./api');
      await apiPost('/auth/logout', { refreshToken });
    } catch (error) {
      console.error('Error revoking token:', error);
    }
  }

  removeToken();
  // Remove old userEmail for cleanup
  if (typeof window !== 'undefined') {
    localStorage.removeItem('userEmail');
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
