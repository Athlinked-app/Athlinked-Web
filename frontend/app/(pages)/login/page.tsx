
'use client';

import { Suspense, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import SignupHero from '@/components/Signup/SignupHero';
import { isAuthenticated } from '@/utils/auth';
import GoogleSignInButton from '@/components/Signup/GoogleSignInButton';

// Allowed redirect paths after login (internal app routes only; exclude auth pages)
const PUBLIC_AUTH_PATHS = ['/login', '/signup', '/parent-signup', '/forgot-password', '/', '/landing'];


function getSafeRedirect(redirect: string | null): string {
  if (!redirect || typeof redirect !== 'string') return '/home';
  const path = redirect.startsWith('/') ? redirect : '/' + redirect;
  const isPublic = PUBLIC_AUTH_PATHS.some(p => path === p || path.startsWith(p + '/'));
  if (isPublic) return '/home';
  return path;
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Support both ?redirect= and ?returnUrl= for post-login destination
  const redirectParam = searchParams.get('redirect');
  const returnUrlParam = searchParams.get('returnUrl');
  const redirectTo =
    getSafeRedirect(redirectParam) !== '/home'
      ? getSafeRedirect(redirectParam)
      : getSafeRedirect(returnUrlParam ? decodeURIComponent(returnUrlParam) : null);


  const [identifier, setIdentifier] = useState(''); // Can be email or username
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showDeletedAccountToast, setShowDeletedAccountToast] = useState(false);
  const [showPasswordChangedToast, setShowPasswordChangedToast] =
    useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Redirect if already authenticated (unless just logged out)
  useEffect(() => {
    const justLoggedOut = localStorage.getItem('justLoggedOut');
    if (justLoggedOut) {
      localStorage.removeItem('justLoggedOut');
      setCheckingAuth(false);
      return;
    }

    if (isAuthenticated()) {
      router.push(redirectTo);
    } else {
      setCheckingAuth(false);
    }
  }, [router, redirectTo]);

  const validatePassword = (password: string): string => {
    if (!password) {
      return 'Password is required';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (password.length > 12) {
      return 'Password must be no more than 12 characters';
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(
      password
    );

    const missingRequirements = [];
    if (!hasUpperCase) missingRequirements.push('1 uppercase letter');
    if (!hasLowerCase) missingRequirements.push('1 lowercase letter');
    if (!hasNumber) missingRequirements.push('1 number');
    if (!hasSpecialChar) missingRequirements.push('1 special character');

    if (missingRequirements.length > 0) {
      return `Password must contain: ${missingRequirements.join(', ')}`;
    }

    return '';
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value) {
      setPasswordError(validatePassword(value));
    } else {
      setPasswordError('');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowPasswordChangedToast(false); // Reset toast state
    setShowDeletedAccountToast(false); // Reset deleted account toast

    // Validate password before submitting
    const passwordValidationError = validatePassword(password);
    if (passwordValidationError) {
      setPasswordError(passwordValidationError);
      return;
    }

    setLoading(true);

    try {
      const { apiRequestUnauthenticated } = await import('@/utils/api');
      const response = await apiRequestUnauthenticated('/login', {
        method: 'POST',
        body: JSON.stringify({ email: identifier, password }), // Backend still expects 'email' field
      });

      const data = await response.json();
      console.log('Login response:', data); // Debug log

      if (!data.success) {
        // Check if account was recently deleted
        if (
          data.message === 'ACCOUNT_DELETED_RECENTLY' ||
          data.error?.includes('deleted recently')
        ) {
          setShowDeletedAccountToast(true);
          setLoading(false);
          // Auto-hide toast after 5 seconds
          setTimeout(() => {
            setShowDeletedAccountToast(false);
          }, 5000);
          return;
        }

        // Check if password was changed recently (show toast in addition to error message)
        console.log(
          'passwordChangedRecently flag:',
          data.passwordChangedRecently
        ); // Debug log

        // Always show the error message
        setError(
          data.message || 'Login failed. Please check your credentials.'
        );
        setLoading(false);

        // Show toast if password was changed recently
        if (data.passwordChangedRecently === true) {
          console.log('Setting password changed toast to true');
          setShowPasswordChangedToast(true);
          // Auto-hide toast after 7 seconds
          setTimeout(() => {
            setShowPasswordChangedToast(false);
          }, 7000);
        }
        return;
      }

      // Store access and refresh tokens
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      }
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }
      // Backward compatibility: also store as 'token' if only token is provided
      if (data.token && !data.accessToken) {
        localStorage.setItem('accessToken', data.token);
      }

      // Also store userEmail for backward compatibility during migration
      if (data.user?.email) {
        localStorage.setItem('userEmail', data.user.email);
      } else if (data.user?.username) {
        localStorage.setItem('userEmail', `username:${data.user.username}`);
      } else {
        const isEmail = identifier.includes('@');
        localStorage.setItem(
          'userEmail',
          isEmail ? identifier : `username:${identifier}`
        );
      }

      router.push(redirectTo);
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to connect to server. Please try again.');
      setLoading(false);
    }
  };

  //   GOOGLE SIGN-IN HANDLER
  const handleGoogleSignIn = async (data: any) => {
    console.log('Google sign-in data received:', data);
    setError('');
    setShowPasswordChangedToast(false);
    setShowDeletedAccountToast(false);

    if (!data.success) {
      setError(data.message || 'Failed to sign in with Google');
      return;
    }

    // If user needs to select user type, redirect to signup
    if (data.needs_user_type) {
      // Store Google data for signup page to use
      localStorage.setItem(
        'google_temp_data',
        JSON.stringify({
          google_id: data.google_id,
          email: data.email,
          full_name: data.full_name,
          profile_picture: data.profile_picture,
          email_verified: data.email_verified,
        })
      );

      // Redirect to signup page
      router.push('/signup?from=login');
      return;
    }

    // User exists, log them in
    if (data.accessToken || data.token) {
      if (data.accessToken) {
        localStorage.setItem('accessToken', data.accessToken);
      } else if (data.token) {
        localStorage.setItem('accessToken', data.token);
      }

      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('userEmail', data.user.email);
      }

      router.push(redirectTo);
      return;
    }

    setError('Failed to sign in with Google. Please try again.');
  };

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="flex min-h-screen flex-col md:flex-row">
        <SignupHero />
        <div className="w-full md:w-1/2 xl:w-2/5 flex items-center justify-center bg-gray-100 p-4 sm:p-6 md:p-8 md:min-h-screen">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 sm:p-8 lg:p-10 xl:p-12 my-6 md:my-0">
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mb-4"></div>
                <p className="text-black">Checking authentication...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Left Side - Hero Image */}
      <SignupHero />

      {/* Right Side - Login Form */}
      <div className="w-full md:w-1/2 xl:w-2/5 flex items-center justify-center bg-gray-100 p-4 sm:p-6 md:p-8 md:min-h-screen">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 sm:p-8 lg:p-10 xl:p-12 my-6 md:my-0">
          {/* Logo */}
          {/* Logo */}
          <div className="flex items-center mb-6 sm:mb-8">
            <Link href="/" className="cursor-pointer">
              <img
                src="/assets/Signup/logo.png"
                alt="ATHLINKED"
                className="h-8 sm:h-10 w-auto"
              />
            </Link>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-black mb-2">
            Welcome Back
          </h1>
          <p className="text-black mb-8">Sign in to your account to continue</p>

          {/* Show message if redirected from a shared link */}
          {redirectTo !== '/home' && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-600">
                Please log in to view this content
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Google Sign-In Button */}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email/Username Field */}
            <div>
              <label
                htmlFor="identifier"
                className="block text-sm font-medium text-black mb-2"
              >
                Email/Username
              </label>
              <input
                id="identifier"
                type="text"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-black"
                placeholder="Enter your email or username"
                disabled={loading}
              />
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-black mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => handlePasswordChange(e.target.value)}
                  required
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent pr-12 text-black ${
                    passwordError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Enter your password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-black hover:text-black focus:outline-none"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-xs text-red-600">{passwordError}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mb-6">
            <GoogleSignInButton
              onSuccess={handleGoogleSignIn}
              buttonText="Sign in with Google"
              mode="login" // NEW: Add this prop
            />
          </div>

          {/* Forgot Password Link */}
          <div className="mt-4 text-center">
            <a
              href="/forgot-password"
              className="text-sm text-yellow-500 hover:text-yellow-600 font-medium"
            >
              Forgot Password?
            </a>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-black">
              Don&apos;t have an account?{' '}
              <a
                href="/signup"
                className="text-yellow-500 hover:text-yellow-600 font-semibold"
              >
                Sign Up
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* Deleted Account Toast */}
      {showDeletedAccountToast && (
        <div
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999]"
          style={{ animation: 'fadeIn 0.3s ease-in' }}
        >
          <div className="bg-red-50 border border-red-200 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 min-w-[300px] max-w-md">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-red-800 flex-1">
              This account was deleted recently. Please create a new account to
              continue.
            </p>
            <button
              onClick={() => setShowDeletedAccountToast(false)}
              className="flex-shrink-0 text-red-600 hover:text-red-800"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Password Changed Recently Toast */}
      {showPasswordChangedToast && (
        <div
          className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999]"
          style={{ animation: 'fadeIn 0.3s ease-in' }}
        >
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 min-w-[300px] max-w-md">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-yellow-800 flex-1">
              Your password was changed recently. Please use your new password
              to login.
            </p>
            <button
              onClick={() => setShowPasswordChangedToast(false)}
              className="flex-shrink-0 text-yellow-600 hover:text-yellow-800"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LoginPageFallback() {
  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <SignupHero />
      <div className="w-full md:w-1/2 xl:w-2/5 flex items-center justify-center bg-gray-100 p-4 sm:p-6 md:p-8 md:min-h-screen">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-6 sm:p-8 lg:p-10 xl:p-12 my-6 md:my-0">
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mb-4"></div>
              <p className="text-black">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginPageContent />
    </Suspense>
  );
}

 

