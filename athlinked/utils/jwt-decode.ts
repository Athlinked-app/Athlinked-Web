/**
 * Simple JWT decode utility (client-side only, no verification)
 * For verification, always use the backend
 */

interface DecodedToken {
  id: string;
  email: string | null;
  username: string | null;
  user_type: string | null;
  iat?: number;
  exp?: number;
}

/**
 * Decode JWT token without verification (client-side only)
 * Backend always verifies tokens
 */
export function decodeToken(token: string): DecodedToken | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}
