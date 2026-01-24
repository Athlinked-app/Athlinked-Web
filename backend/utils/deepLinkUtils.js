/**
 * Deep Link Utility Functions
 * Generates appropriate URLs for mobile (deep links) vs web (regular URLs)
 */

/**
 * Detect if request is from mobile app
 * @param {object} req - Express request object
 * @returns {boolean} True if mobile, false otherwise
 */
function isMobileRequest(req) {
  // Check for custom header sent by mobile app
  if (req.headers['x-client-type'] === 'mobile') {
    return true;
  }

  // Fallback: Check User-Agent
  const userAgent = req.headers['user-agent'] || '';
  return /Mobile|Android|iPhone|iPad/i.test(userAgent);
}

/**
 * Generate password reset link based on client type
 * @param {string} token - Password reset token
 * @param {boolean} isMobile - Whether request is from mobile app
 * @returns {string} Password reset link URL
 */
function generatePasswordResetLink(token, isMobile = false) {
  // URL encode the token to ensure it works properly in links
  const encodedToken = encodeURIComponent(token);

  if (isMobile) {
    // IMPORTANT: Use HTTPS universal link (NOT custom scheme)
    // This works in Gmail and opens the app when assetlinks.json is deployed
    // The web page will redirect to custom scheme if App Links not verified
    const deepLinkDomain = process.env.DEEP_LINK_DOMAIN || 'athlinked.randomw.dev';
    return `https://${deepLinkDomain}/forgot-password?token=${encodedToken}`;
  } else {
    // Web URL
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return `${baseUrl}/forgot-password?token=${encodedToken}`;
  }
}

/**
 * Generate deep link for different types
 * @param {string} type - Link type (profile, post, event, etc.)
 * @param {object} params - Parameters for the link
 * @param {boolean} isMobile - Whether request is from mobile app
 * @returns {string|null} Deep link URL or null if invalid
 */
function generateDeepLink(type, params, isMobile = false) {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const deepLinkScheme = process.env.DEEP_LINK_SCHEME || 'athlinked';
  
  // Extract domain from FRONTEND_URL for universal links
  let mobileDomain;
  if (process.env.DEEP_LINK_DOMAIN) {
    mobileDomain = process.env.DEEP_LINK_DOMAIN;
  } else {
    try {
      const url = new URL(baseUrl);
      mobileDomain = url.hostname;
    } catch (e) {
      mobileDomain = null;
    }
  }

  if (isMobile) {
    // Use custom scheme for localhost, universal link for production
    const useCustomScheme = !mobileDomain || mobileDomain === 'localhost' || mobileDomain === '127.0.0.1';
    
    switch (type) {
      case 'profile':
        if (useCustomScheme) {
          return params.userId
            ? `${deepLinkScheme}://profile?userId=${params.userId}`
            : null;
        }
        return params.userId
          ? `https://${mobileDomain}/profile?userId=${params.userId}`
          : null;
      case 'post':
        if (useCustomScheme) {
          return params.postId
            ? `${deepLinkScheme}://post?postId=${params.postId}`
            : null;
        }
        return params.postId
          ? `https://${mobileDomain}/post/${params.postId}`
          : null;
      case 'event':
        if (useCustomScheme) {
          return params.eventId
            ? `${deepLinkScheme}://event?eventId=${params.eventId}`
            : null;
        }
        return params.eventId
          ? `https://${mobileDomain}/event/${params.eventId}`
          : null;
      case 'forgot-password':
        if (useCustomScheme) {
          return params.token
            ? `${deepLinkScheme}://forgot-password?token=${encodeURIComponent(params.token)}`
            : null;
        }
        return params.token
          ? `https://${mobileDomain}/forgot-password?token=${encodeURIComponent(params.token)}`
          : null;
      default:
        return null;
    }
  } else {
    switch (type) {
      case 'profile':
        return params.userId
          ? `${baseUrl}/profile?userId=${params.userId}`
          : null;
      case 'post':
        return params.postId ? `${baseUrl}/post/${params.postId}` : null;
      case 'event':
        return params.eventId ? `${baseUrl}/event/${params.eventId}` : null;
      case 'forgot-password':
        return params.token
          ? `${baseUrl}/forgot-password?token=${encodeURIComponent(params.token)}`
          : null;
      default:
        return null;
    }
  }
}

module.exports = {
  isMobileRequest,
  generatePasswordResetLink,
  generateDeepLink,
};
