/**
 * Configuration utilities for API and resource URLs
 */

// Base URL for API endpoints
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Log API URL in development for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('API Base URL:', API_BASE_URL);
}

// Base URL for non-API resources (images, static files, etc.)
export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';

// Socket URL
export const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

/**
 * Get the full URL for a resource (image, file, etc.)
 * @param path - Relative path (e.g., '/uploads/profile/image.jpg')
 * @returns Full URL or undefined if path is invalid
 */
export function getResourceUrl(
  path: string | null | undefined
): string | undefined {
  if (!path || path.trim() === '') return undefined;
  if (path.startsWith('http')) return path;
  if (path.startsWith('/') && !path.startsWith('/assets')) {
    return `${BASE_URL}${path}`;
  }
  return path;
}

/**
 * Get the full API URL for an endpoint
 * @param endpoint - API endpoint (e.g., '/posts' or 'posts')
 * @returns Full API URL
 */
export function getApiUrl(endpoint: string): string {
  if (endpoint.startsWith('http')) return endpoint;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}
