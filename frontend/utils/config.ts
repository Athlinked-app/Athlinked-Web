/**
 * Configuration utilities for API and resource URLs
 */

/**
 * Normalize API base URL so it does NOT include `/api` at the end.
 * This prevents accidental `/api/api/...` URL construction across the app.
 */
function normalizeApiBaseUrl(url: string): string {
  const trimmed = (url || '').trim().replace(/\/+$/, '');
  // If someone configures NEXT_PUBLIC_API_URL as ".../api" or ".../api/", strip that suffix
  return trimmed.replace(/\/api$/i, '');
}

// Base URL for API endpoints (without trailing `/api`)
export const API_BASE_URL = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
);

// Log API URL in development for debugging
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('API Base URL:', API_BASE_URL);
}

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
    // Legacy compatibility: some older rows stored image paths like
    // `/profile/images/<file>` or `/posts/images/<file>`.
    // Backend serves local uploads under `/uploads` (NOT `/api/uploads`).
    if (path.startsWith('/profile/images/')) {
      const filename = path.split('/').pop();
      return filename
        ? `${API_BASE_URL}/uploads/profile/${filename}`
        : `${API_BASE_URL}${path}`;
    }
    if (path.startsWith('/posts/images/')) {
      const filename = path.split('/').pop();
      return filename ? `${API_BASE_URL}/uploads/${filename}` : `${API_BASE_URL}${path}`;
    }

    // If stored paths already include `/api/...`, don't double-prefix
    if (path.startsWith('/api/')) return `${API_BASE_URL}${path}`;

    // Static resources like `/uploads/...` live at the backend root.
    // For any other absolute path, prefer backend root as well (resource paths should not be treated as API endpoints).
    return `${API_BASE_URL}${path}`;
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
  // Avoid double-prefix if caller passes `/api/...`
  const withoutApiPrefix = cleanEndpoint.replace(/^\/api(\/|$)/i, '/');
  const suffix =
    withoutApiPrefix === '/' ? '' : withoutApiPrefix; // allow `getApiUrl('/api')` -> `${base}/api`
  return `${API_BASE_URL}/api${suffix}`;
}
