'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  UserCog,
  Eye,
  ShieldAlert,
  Sliders,
  Shield,
  Users,
  FileText,
  Trash2,
  X,
} from 'lucide-react';
import { apiDelete } from '@/utils/api';
import { logout, getCurrentUser } from '@/utils/auth';

interface SettingsNavigationProps {
  activeItem?: string;
  onItemClick?: (itemId: string) => void;
}

export default function SettingsNavigation({
  activeItem,
  onItemClick,
}: SettingsNavigationProps) {
  const router = useRouter();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState('');

  const menuItems = [
    { id: 'personal-info', icon: UserCog, label: 'Personal Information' },
    { id: 'security', icon: Eye, label: 'Security & Sign in' },
    { id: 'visibility', icon: ShieldAlert, label: 'Visibility' },
    { id: 'preferences', icon: Sliders, label: 'Preferences' },
    { id: 'privacy-policy', icon: Shield, label: 'Privacy Policy' },
    { id: 'about', icon: Users, label: 'About us' },
    { id: 'terms', icon: FileText, label: 'Terms & Service' },
  ];

  const handleItemClick = (itemId: string) => {
    if (onItemClick) {
      onItemClick(itemId);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch current user email when modal opens
  useEffect(() => {
    if (showDeleteModal) {
      const fetchCurrentUserEmail = async () => {
        try {
          const user = getCurrentUser();
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
    } else {
      // Reset when modal closes
      setEmailInput('');
      setEmailError('');
      setCurrentUserEmail(null);
    }
  }, [showDeleteModal]);

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

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
        setShowDeleteModal(false);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Failed to delete account. Please try again.');
      setShowDeleteModal(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <div className="flex flex-col h-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header Section */}
      <div className="p-4 border-b border-gray-200">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 mb-4 transition-colors"
        >
          <ChevronLeft size={16} className="text-gray-700" />
          <span className="text-md font-medium text-gray-700">Back</span>
        </button>

        {/* Settings Title */}
        <h1 className="text-2xl font-bold text-black">Settings</h1>
      </div>

      {/* Menu Items */}
      <div className="flex-1 overflow-y-auto">
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeItem === item.id; // Highlight based on activeItem prop

          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${
                isActive
                  ? 'bg-yellow-50 hover:bg-yellow-100'
                  : 'hover:bg-gray-50'
              }`}
            >
              <Icon
                size={20}
                className={isActive ? 'text-[#CB9729]' : 'text-gray-600'}
              />
              <span
                className={`text-base font-medium ${
                  isActive ? 'text-[#CB9729]' : 'text-gray-900'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Delete Account Button */}
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleDeleteAccount}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <Trash2 size={18} />
          <span className="text-base font-medium">Delete Account</span>
        </button>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Delete Account
              </h2>
              <button
                onClick={handleCancelDelete}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete your account? This action cannot
                be undone.
              </p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  To confirm, please type your email address:
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

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-200">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting || !emailInput.trim()}
                className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
      )}
    </div>
  );
}
