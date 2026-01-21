/**
 * API utility functions for making authenticated requests
 */

// Import from config for consistency
import { API_BASE_URL, BASE_URL, getResourceUrl } from './config';

// Re-export for backward compatibility
export { BASE_URL, getResourceUrl };

/**
 * Make an unauthenticated API request (for login, signup, etc.)
 * Uses API_BASE_URL from config for consistent URL construction
 */
export async function apiRequestUnauthenticated(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  // Only set Content-Type if not FormData
  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });
    return response;
  } catch (error: any) {
    // Handle network errors
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      const networkError: any = new Error(
        `Network error: Unable to connect to ${url}. Please check:\n` +
          `1. The API server is running\n` +
          `2. The API URL is correct (${API_BASE_URL})\n` +
          `3. CORS is configured correctly\n` +
          `4. Your network connection is working`
      );
      networkError.isNetworkError = true;
      networkError.url = url;
      networkError.originalError = error;
      throw networkError;
    }
    throw error;
  }
}

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
export async function refreshAccessToken(): Promise<string | null> {
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

  try {
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
  } catch (error: any) {
    // Handle network errors (Failed to fetch, CORS, etc.)
    if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
      const networkError: any = new Error(
        `Network error: Unable to connect to ${url}. Please check:\n` +
          `1. The API server is running\n` +
          `2. The API URL is correct (${API_BASE_URL})\n` +
          `3. CORS is configured correctly\n` +
          `4. Your network connection is working`
      );
      networkError.isNetworkError = true;
      networkError.url = url;
      networkError.originalError = error;
      throw networkError;
    }
    throw error;
  }
}

/**
 * Helper function to detect and format database connection errors
 */
function formatDatabaseError(errorMessage: string, status: number): string {
  const lowerMessage = errorMessage.toLowerCase();
  
  // For connection limit errors, return a generic message that doesn't alarm users
  // These errors are usually temporary and will be retried automatically
  // Include all variations of connection limit errors including SUPERUSER attribute errors
  if (lowerMessage.includes('remaining connection slots') || 
      lowerMessage.includes('superuser attribute') ||
      lowerMessage.includes('reserved for roles') ||
      lowerMessage.includes('too many connections') ||
      lowerMessage.includes('connection limit') ||
      lowerMessage.includes('max_connections')) {
    return 'Server is temporarily busy. Please try again.';
  }

  if (
    lowerMessage.includes('connection refused') ||
    lowerMessage.includes('connection timeout') ||
    lowerMessage.includes('connection pool')
  ) {
    return 'Database connection error. The server is temporarily unavailable. Please try again later.';
  }

  if (
    lowerMessage.includes('relation') &&
    lowerMessage.includes('does not exist')
  ) {
    return 'Database configuration error. Please contact support.';
  }

  // For 500 errors, provide a generic server error message
  if (status >= 500) {
    return 'Server error. Please try again later or contact support if the problem persists.';
  }

  return errorMessage;
}

/**
 * Helper function for GET requests with automatic retry on connection errors
 */
export async function apiGet<T = any>(endpoint: string, retries = 5): Promise<T> {
  let lastError: any;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await apiRequest(endpoint, { method: 'GET' });

      // Check if response is ok (status 200-299)
      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = {
            message:
              errorText || `HTTP ${response.status}: ${response.statusText}`,
          };
        }
        
        const originalMessage = errorData.message || `HTTP ${response.status}: ${response.statusText}`;
        
        // Check if it's a connection error that we should retry
        const isConnectionError = originalMessage.toLowerCase().includes('connection limit') || 
                                  originalMessage.toLowerCase().includes('remaining connection slots') ||
                                  originalMessage.toLowerCase().includes('too many connections') ||
                                  originalMessage.toLowerCase().includes('max_connections') ||
                                  originalMessage.toLowerCase().includes('superuser attribute') ||
                                  originalMessage.toLowerCase().includes('reserved for roles');
        
        if (isConnectionError && attempt < retries) {
          // Wait before retrying (exponential backoff with jitter)
          const baseWaitTime = Math.min(500 * Math.pow(1.5, attempt), 3000);
          const jitter = Math.random() * 500; // Add random jitter to prevent thundering herd
          const waitTime = baseWaitTime + jitter;
          // Silently retry - don't log to avoid alarming users
          await new Promise(resolve => setTimeout(resolve, waitTime));
          lastError = errorData;
          continue;
        }
        
        // Only format and throw error if it's not a connection error or all retries exhausted
        let formattedMessage = formatDatabaseError(originalMessage, response.status);
        
        // For 404 "Route not found", include the requested URL to help debug
        if (response.status === 404 && /route\s*not\s*found/i.test(originalMessage)) {
          const url = endpoint.startsWith('http')
            ? endpoint
            : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
          formattedMessage = `Route not found: ${endpoint}. Full URL: ${url}. Check that API_BASE_URL (${API_BASE_URL}) includes /api and the endpoint path is correct.`;
        }
        
        const error: any = new Error(formattedMessage);
        error.status = response.status;
        error.response = { data: errorData };
        error.originalMessage = originalMessage; // Keep original for debugging
        error.url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
        throw error;
      }

      // Check content type before parsing JSON
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return response.json();
      } else {
        // If not JSON, return text as error
        const text = await response.text();
        throw new Error(
          `Expected JSON but got ${contentType || 'unknown content type'}: ${text.substring(0, 200)}`
        );
      }
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a connection error that we should retry
      const errorMsg = (error.message || '').toLowerCase();
      const originalMsg = (error.originalMessage || '').toLowerCase();
      const isConnectionError = errorMsg.includes('connection limit') || 
                                errorMsg.includes('remaining connection slots') ||
                                errorMsg.includes('too many connections') ||
                                errorMsg.includes('max_connections') ||
                                errorMsg.includes('superuser attribute') ||
                                errorMsg.includes('reserved for roles') ||
                                originalMsg.includes('connection limit') ||
                                originalMsg.includes('remaining connection slots') ||
                                originalMsg.includes('too many connections') ||
                                originalMsg.includes('superuser attribute') ||
                                originalMsg.includes('reserved for roles');
      
      if (isConnectionError && attempt < retries) {
        // Wait before retrying (exponential backoff with jitter)
        const baseWaitTime = Math.min(500 * Math.pow(1.5, attempt), 3000);
        const jitter = Math.random() * 500; // Add random jitter
        const waitTime = baseWaitTime + jitter;
        // Silently retry - don't log to avoid alarming users
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
      
      // Re-throw if it's already our custom error
      if (error.status) {
        throw error;
      }
      // Handle network errors (Failed to fetch)
      if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
        const networkError: any = new Error(
          'Network error: Unable to connect to the server. Please check your connection and ensure the API server is running.'
        );
        networkError.isNetworkError = true;
        networkError.originalError = error;
        throw networkError;
      }
      throw error;
    }
  }
  
  // If we get here, all retries failed
  // For connection errors, return a more user-friendly message or suppress completely
  if (lastError) {
    const errorMsg = (lastError.message || '').toLowerCase();
    const originalMsg = (lastError.originalMessage || '').toLowerCase();
    const isConnectionError = errorMsg.includes('connection limit') || 
                              errorMsg.includes('remaining connection slots') ||
                              errorMsg.includes('superuser attribute') ||
                              errorMsg.includes('reserved for roles') ||
                              originalMsg.includes('connection limit') ||
                              originalMsg.includes('remaining connection slots') ||
                              originalMsg.includes('superuser attribute') ||
                              originalMsg.includes('reserved for roles');
    
    if (isConnectionError) {
      // For connection errors, return a generic message that doesn't alarm users
      // These are usually temporary database issues
      const friendlyError: any = new Error('Server is temporarily busy. Please refresh the page and try again.');
      friendlyError.status = lastError.status || 500;
      friendlyError.originalError = lastError;
      friendlyError.isConnectionError = true; // Flag for silent handling
      throw friendlyError;
    }
  }
  
  throw lastError;
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

  // Check if response is ok (status 200-299)
  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = {
        message: errorText || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const originalMessage =
      errorData.message || `HTTP ${response.status}: ${response.statusText}`;
    const formattedMessage = formatDatabaseError(
      originalMessage,
      response.status
    );

    const error: any = new Error(formattedMessage);
    error.status = response.status;
    error.response = { data: errorData };
    error.originalMessage = originalMessage; // Keep original for debugging
    throw error;
  }

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

  // Check if response is ok (status 200-299)
  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = {
        message: errorText || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const originalMessage =
      errorData.message || `HTTP ${response.status}: ${response.statusText}`;
    const formattedMessage = formatDatabaseError(
      originalMessage,
      response.status
    );

    const error: any = new Error(formattedMessage);
    error.status = response.status;
    error.response = { data: errorData };
    error.originalMessage = originalMessage; // Keep original for debugging
    throw error;
  }

  return response.json();
}

/**
 * Helper function for DELETE requests
 */
export async function apiDelete<T = any>(endpoint: string): Promise<T> {
  const response = await apiRequest(endpoint, { method: 'DELETE' });

  // Check if response is ok (status 200-299)
  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = {
        message: errorText || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const originalMessage =
      errorData.message || `HTTP ${response.status}: ${response.statusText}`;
    const formattedMessage = formatDatabaseError(
      originalMessage,
      response.status
    );

    const error: any = new Error(formattedMessage);
    error.status = response.status;
    error.response = { data: errorData };
    error.originalMessage = originalMessage; // Keep original for debugging
    throw error;
  }

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

  // Check if response is ok (status 200-299)
  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = {
        message: errorText || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const originalMessage =
      errorData.message || `HTTP ${response.status}: ${response.statusText}`;
    const formattedMessage = formatDatabaseError(
      originalMessage,
      response.status
    );

    const error: any = new Error(formattedMessage);
    error.status = response.status;
    error.response = { data: errorData };
    error.originalMessage = originalMessage; // Keep original for debugging
    throw error;
  }

  return response.json();
}

/**
 * Helper function for FormData uploads (file uploads)
 */
export async function apiUpload<T = any>(
  endpoint: string,
  formData: FormData
): Promise<T> {
  try {
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

      const formattedMessage = formatDatabaseError(
        errorMessage,
        response.status
      );
      const error: any = new Error(formattedMessage);
      error.status = response.status;
      error.originalMessage = errorMessage; // Keep original for debugging
      throw error;
    }

    // Check content type before parsing JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return response.json();
    } else {
      // If not JSON, return text as error
      const text = await response.text();
      throw new Error(
        `Expected JSON but got ${contentType || 'unknown content type'}: ${text.substring(0, 200)}`
      );
    }
  } catch (error: any) {
    // Re-throw if it's already our custom error with status
    if (error.status) {
      throw error;
    }
    // Handle network errors (Failed to fetch)
    if (
      error.message === 'Failed to fetch' ||
      error.name === 'TypeError' ||
      error.isNetworkError
    ) {
      const networkError: any = new Error(
        `Network error: Unable to upload file to ${endpoint}. Please check:\n` +
          `1. The API server is running on ${API_BASE_URL}\n` +
          `2. The backend server is accessible\n` +
          `3. CORS is configured correctly\n` +
          `4. Your network connection is working`
      );
      networkError.isNetworkError = true;
      networkError.endpoint = endpoint;
      networkError.originalError = error;
      throw networkError;
    }
    throw error;
  }
}
