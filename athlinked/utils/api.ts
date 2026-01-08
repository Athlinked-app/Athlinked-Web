/**
 * API utility functions for making authenticated requests
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Get the access token from localStorage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

/**
 * Get the refresh token from localStorage
 */
export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('refreshToken');
}

/**
 * Set the access token in localStorage
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('accessToken', token);
}

/**
 * Set the refresh token in localStorage
 */
export function setRefreshToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('refreshToken', token);
}

/**
 * Set both access and refresh tokens
 */
export function setTokens(accessToken: string, refreshToken: string): void {
  if (typeof window === 'undefined') return;
  setToken(accessToken);
  setRefreshToken(refreshToken);
}

/**
 * Remove both tokens from localStorage
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

// Track ongoing refresh to prevent concurrent refresh requests
let refreshPromise: Promise<string | null> | null = null;

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(): Promise<string | null> {
  // If refresh is already in progress, wait for it
  if (refreshPromise) {
    return refreshPromise;
  }

  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    removeToken();
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return null;
  }

  // Create refresh promise
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        // Refresh token is invalid or expired
        removeToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return null;
      }

      const data = await response.json();
      if (data.success && data.accessToken) {
        setToken(data.accessToken);
        // Update refresh token if a new one is provided
        if (data.refreshToken) {
          setRefreshToken(data.refreshToken);
        }
        return data.accessToken;
      }

      removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    } catch (error) {
      console.error('Error refreshing token:', error);
      removeToken();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return null;
    } finally {
      // Clear the promise so next refresh can proceed
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/**
 * Make an authenticated API request with automatic token refresh
 *
 * @param endpoint - API endpoint (relative or absolute URL)
 * @param options - Fetch options (method, body, headers, etc.)
 * @param retryCount - Internal retry counter (prevents infinite loops)
 * @returns Promise<Response>
 */
export async function apiRequest(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0
): Promise<Response> {
  // Prevent infinite retry loops
  if (retryCount > 1) {
    throw new Error('Max retry attempts exceeded');
  }

  const token = getToken();

  // Check if body is FormData - if so, don't set Content-Type (browser will set it with boundary)
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  // Only set Content-Type if not FormData
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // If token is invalid or expired, try to refresh it once
  if (response.status === 401 && retryCount === 0) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      // Retry the original request with the new token
      return apiRequest(endpoint, options, retryCount + 1);
    }
    // If refresh failed, token is cleared and user will be redirected to login
  }

  return response;
}

/**
 * Helper function for GET requests
 */
export async function apiGet<T = any>(endpoint: string): Promise<T> {
  const response = await apiRequest(endpoint, { method: 'GET' });
  return response.json();
}

/**
 * Helper function for POST requests
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any
): Promise<T> {
  const response = await apiRequest(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * Helper function for PUT requests
 */
export async function apiPut<T = any>(
  endpoint: string,
  data?: any
): Promise<T> {
  const response = await apiRequest(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * Helper function for DELETE requests
 */
export async function apiDelete<T = any>(endpoint: string): Promise<T> {
  const response = await apiRequest(endpoint, { method: 'DELETE' });
  return response.json();
}

/**
 * Helper function for PATCH requests
 */
export async function apiPatch<T = any>(
  endpoint: string,
  data?: any
): Promise<T> {
  const response = await apiRequest(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
  return response.json();
}

/**
 * Helper function for FormData uploads (file uploads)
 */
export async function apiUpload<T = any>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  const response = await apiRequest(endpoint, {
    method: 'POST',
    body: formData,
  });

  // Check if response is ok before parsing JSON
  if (!response.ok) {
    let errorMessage = 'Failed to upload file';
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorMessage;
    } catch (e) {
      // If response is not JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}
