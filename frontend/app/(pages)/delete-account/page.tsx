'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, X } from 'lucide-react';
import { apiDelete } from '@/utils/api';
import { logout, getCurrentUser, isAuthenticated } from '@/utils/auth';
import Header from '@/components/Header';
import NavigationBar from '@/components/NavigationBar';
import { getResourceUrl } from '@/utils/config';

export default function DeleteAccountPage() {
  const router = useRouter();
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUserIdentifier, setCurrentUserIdentifier] = useState<
    string | null
  >(null); // NEW: Can be email or username
  const [isUsername, setIsUsername] = useState(false); // NEW: Track if it's a username
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check authentication and redirect if not logged in
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check if user is authenticated
        const authenticated = isAuthenticated();

        if (!authenticated) {
          // Not authenticated, redirect to login
          router.push('/login');
          return;
        }

        setIsCheckingAuth(false);
      } catch (error) {
        console.error('Auth check error:', error);
        router.push('/login');
      }
    };

    checkAuth();
  }, [router]);

  // Fetch current user email/username when page loads
  useEffect(() => {
    if (isCheckingAuth) return; // Don't fetch if still checking auth

    const fetchCurrentUserEmail = async () => {
      try {
        const user = getCurrentUser();
        setCurrentUser(user);

        // Check if user has email
        if (user?.email && !user.email.startsWith('username:')) {
          setCurrentUserEmail(user.email.toLowerCase().trim());
          setCurrentUserIdentifier(user.email.toLowerCase().trim());
          setIsUsername(false);
        }
        // Check if user has username
        else if (user?.username) {
          setCurrentUserIdentifier(user.username.toLowerCase().trim());
          setIsUsername(true);
        }
        // Check localStorage for email or username
        else {
          const userIdentifier = localStorage.getItem('userEmail');
          if (userIdentifier) {
            if (userIdentifier.startsWith('username:')) {
              // It's a username
              const username = userIdentifier.replace('username:', '');
              setCurrentUserIdentifier(username.toLowerCase().trim());
              setIsUsername(true);
            } else {
              // It's an email
              setCurrentUserEmail(userIdentifier.toLowerCase().trim());
              setCurrentUserIdentifier(userIdentifier.toLowerCase().trim());
              setIsUsername(false);
            }
          } else {
            // Try to fetch from API
            try {
              const { apiGet } = await import('@/utils/api');
              const { getCurrentUserId } = await import('@/utils/auth');
              const userId = getCurrentUserId();
              if (userId) {
                const data = await apiGet<{ success: boolean; user?: any }>(
                  '/profile'
                );
                if (data.success && data.user) {
                  if (data.user.email) {
                    setCurrentUserEmail(data.user.email.toLowerCase().trim());
                    setCurrentUserIdentifier(
                      data.user.email.toLowerCase().trim()
                    );
                    setIsUsername(false);
                  } else if (data.user.username) {
                    setCurrentUserIdentifier(
                      data.user.username.toLowerCase().trim()
                    );
                    setIsUsername(true);
                  }
                }
              }
            } catch (error) {
              console.error('Error fetching user data:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error getting current user identifier:', error);
      }
    };

    fetchCurrentUserEmail();
  }, [isCheckingAuth]);

  const handleConfirmDelete = async () => {
    // Validate input
    const input = emailInput.trim().toLowerCase();

    if (!input) {
      setEmailError(
        isUsername
          ? 'Please enter your username'
          : 'Please enter your email address'
      );
      return;
    }

    if (!currentUserIdentifier) {
      setEmailError(
        'Unable to verify identifier. Please refresh and try again.'
      );
      return;
    }

    if (input !== currentUserIdentifier) {
      setEmailError(
        isUsername
          ? 'Username does not match your account username'
          : 'Email does not match your account email'
      );
      return;
    }

    // Clear any previous errors
    setEmailError('');
    setIsDeleting(true);

    try {
      // Call delete account API
      const result = await apiDelete<{
        success: boolean;
        message?: string;
      }>('/signup/Savedount');

      if (result.success) {
        // Logout user and clear tokens
        await logout();

        // Redirect to login page
        router.push('/login');
      } else {
        alert(result.message || 'Failed to delete account. Please try again.');
        setIsDeleting(false);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const getProfileUrl = (profileUrl?: string | null): string | undefined => {
    return getResourceUrl(profileUrl);
  };

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex flex-1 w-full overflow-hidden">
        <div className="flex-1 flex justify-center items-center px-4 overflow-y-auto">
          <div className="bg-white max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Delete Account
              </h2>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete your account? This action cannot
                be undone.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To confirm, please type your{' '}
                  {isUsername ? 'username' : 'email address'}:{' '}
                  {currentUserIdentifier && (
                    <span className="font-bold">{currentUserIdentifier}</span>
                  )}
                </label>
                <input
                  type="text"
                  value={emailInput}
                  onChange={e => {
                    setEmailInput(e.target.value);
                    setEmailError(''); // Clear error when user types
                  }}
                  placeholder={
                    isUsername ? 'Enter your username' : 'Enter your email'
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 ${
                    emailError
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300'
                  }`}
                  disabled={isDeleting}
                />
                {emailError && (
                  <p className="mt-1 text-xs text-red-600">{emailError}</p>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4">
              <button
                onClick={handleCancel}
                disabled={isDeleting}
                className="px-2 py-2 md:px-4 md:py-2 text-sm md:text-lg text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting || !emailInput.trim()}
                className="px-2 py-2 md:px-4 md:py-2 text-sm md:text-lg text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting && (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {isDeleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
