'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, X } from 'lucide-react';
import { apiDelete } from '@/utils/api';
import { logout, getCurrentUser } from '@/utils/auth';
import Header from '@/components/Header';
import NavigationBar from '@/components/NavigationBar';
import { getResourceUrl } from '@/utils/config';

export default function DeleteAccountPage() {
  const router = useRouter();
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch current user email when page loads
  useEffect(() => {
    const fetchCurrentUserEmail = async () => {
      try {
        const user = getCurrentUser();
        setCurrentUser(user);

        if (user?.email) {
          setCurrentUserEmail(user.email.toLowerCase().trim());
        } else {
          // Fallback: try to get from localStorage
          const userIdentifier = localStorage.getItem('userEmail');
          if (userIdentifier && !userIdentifier.startsWith('username:')) {
            setCurrentUserEmail(userIdentifier.toLowerCase().trim());
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
                if (data.success && data.user?.email) {
                  setCurrentUserEmail(data.user.email.toLowerCase().trim());
                }
              }
            } catch (error) {
              console.error('Error fetching user email:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error getting current user email:', error);
      }
    };

    fetchCurrentUserEmail();
  }, []);

  const handleConfirmDelete = async () => {
    // Validate email input
    const inputEmail = emailInput.trim().toLowerCase();

    if (!inputEmail) {
      setEmailError('Please enter your email address');
      return;
    }

    if (!currentUserEmail) {
      setEmailError('Unable to verify email. Please refresh and try again.');
      return;
    }

    if (inputEmail !== currentUserEmail) {
      setEmailError('Email does not match your account email');
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
      }>('/signup/delete-account');

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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <main className="flex flex-1 w-full  overflow-hidden">
        <div className="flex-1 flex justify-center items-center px-4 overflow-y-auto">
          <div className="bg-white max-w-md w-full mx-4">
            {/* Modal Header - Same as popup */}
            <div className="flex items-center justify-between p-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Delete Account
              </h2>
            </div>

            {/* Modal Body - Same as popup */}
            <div className="p-4 space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete your account? This action cannot
                be undone.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To confirm, please type your email address:{' '}
                  {currentUserEmail && (
                    <span className="font-bold">{currentUserEmail}</span>
                  )}
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={e => {
                    setEmailInput(e.target.value);
                    setEmailError(''); // Clear error when user types
                  }}
                  placeholder="Enter your email"
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

            {/* Modal Footer - Same as popup */}
            <div className="flex items-center justify-end gap-3 p-4 ">
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
                className="px-2 py-2 md:px-4 md:py-2 text-sm md:text-lg  text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
