'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import NavigationBar from '@/components/NavigationBar';
import RightSideBar from '@/components/RightSideBar';
import SettingsNavigation from '@/components/Settings/Navigation';
import AboutUs from '@/components/Settings/About us';
import TermsAndService from '@/components/Settings/Terms&Service';
import PrivacyPolicy from '@/components/Settings/PrivacyPolicy';
import { getResourceUrl } from '@/utils/api';
import { API_BASE_URL } from '@/utils/config';

interface CurrentUser {
  id: string;
  full_name: string;
  profile_url?: string;
  username?: string;
}

export default function SettingsPage() {
  const _router = useRouter();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [activeSettingsItem, setActiveSettingsItem] =
    useState<string>('personal-info');
  const [showMobileNav, setShowMobileNav] = useState(true);

  async function fetchCurrentUser() {
    try {
      const userIdentifier = localStorage.getItem('userEmail');
      if (!userIdentifier) return;

      let response;
      if (userIdentifier.startsWith('username:')) {
        const username = userIdentifier.replace('username:', '');
        response = await fetch(
          `${API_BASE_URL}/api/signup/user-by-username/${encodeURIComponent(
            username
          )}`
        );
      } else {
        response = await fetch(
          `${API_BASE_URL}/api/signup/user/${encodeURIComponent(
            userIdentifier
          )}`
        );
      }

      if (!response?.ok) return;

      const data = await response.json();
      if (data?.success && data.user) {
        setCurrentUserId(data.user.id);
        setCurrentUser({
          id: data.user.id,
          full_name: data.user.full_name || 'User',
          profile_url: data.user.profile_url,
          username: data.user.username,
        });
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  }

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const handleSettingsItemClick = (itemId: string) => {
    setActiveSettingsItem(itemId);
    // On mobile, hide navigation and show content
    setShowMobileNav(false);
    console.log('Settings item clicked:', itemId);
  };

  const handleBackToNav = () => {
    setShowMobileNav(true);
  };

  // Construct profile URL - return undefined if no profileUrl exists (don't use default)
  const getProfileUrl = (profileUrl?: string | null): string | undefined => {
    if (!profileUrl || profileUrl.trim() === '') return undefined;
    if (profileUrl.startsWith('http')) return profileUrl;
    if (profileUrl.startsWith('/') && !profileUrl.startsWith('/assets')) {
      return getResourceUrl(profileUrl) || profileUrl;
    }
    return profileUrl;
  };

  // Get initials for placeholder
  const _getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-screen bg-[#D4D4D4] flex flex-col overflow-hidden">
      <Header
        userName={currentUser?.full_name}
        userProfileUrl={getProfileUrl(currentUser?.profile_url)}
      />

      <main className="flex flex-1 w-full mt-5 overflow-hidden">
        {/* Settings Content */}
        <div className="flex-1 flex gap-4 px-4 overflow-hidden">
          {/* Settings Navigation Sidebar - Desktop always visible, Mobile toggleable */}
          <div
            className={`
            w-80 flex-shrink-0
            ${showMobileNav ? 'block w-full' : 'hidden'}
            md:block md:w-80
          `}
          >
            <SettingsNavigation
              activeItem={activeSettingsItem}
              onItemClick={handleSettingsItemClick}
            />
          </div>

          {/* Settings Content Area - Desktop always visible, Mobile toggleable */}
          <div
            className={`
            flex-1 bg-white rounded-lg border border-gray-200 p-6 overflow-y-auto
            ${!showMobileNav ? 'block w-full' : 'hidden'}
            md:block md:flex-1 md:p-6
          `}
          >
            {/* Mobile Back Button */}
            <button
              onClick={handleBackToNav}
              className="md:hidden mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Settings
            </button>

            {activeSettingsItem === 'about' ? (
              <AboutUs />
            ) : activeSettingsItem === 'terms' ? (
              <TermsAndService />
            ) : activeSettingsItem === 'privacy-policy' ? (
              <PrivacyPolicy />
            ) : (
              <div className="text-center text-gray-500 mt-20">
                <p className="text-lg">
                  Settings content for: {activeSettingsItem}
                </p>
                <p className="text-sm mt-2">Content will be displayed here</p>
              </div>
            )}
          </div>
        </div>

        <div className="hidden lg:flex">
          <RightSideBar />
        </div>
      </main>
    </div>
  );
}
