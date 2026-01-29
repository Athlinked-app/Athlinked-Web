'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Settings, LogOut, X, Menu } from 'lucide-react';
import { getResourceUrl } from '@/utils/api';
import HamburgerMenu from '@/components/Hamburgermenu';
type HeaderProps = {
  userName?: string;
  userProfileUrl?: string;
};

interface UserData {
  full_name: string | null;
  username: string | null;
  profile_url?: string;
  user_type?: string;
}

export default function Header({
  userName: propUserName,
  userProfileUrl: propUserProfileUrl,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  const isHome =
    pathname === '/' || pathname === '/home' || pathname === '/Landingpage';

  const pageTitle = (() => {
    if (isHome) return '';
    if (pathname.startsWith('/opportunities')) return 'Opportunities';
    if (pathname.startsWith('/resources')) return 'Resources';
    if (pathname.startsWith('/network')) return 'My Network';
    if (pathname.startsWith('/stats')) return 'Stats';
    if (pathname.startsWith('/clips')) return 'Clips';
    if (pathname.startsWith('/notifications')) return 'Notifications';
    if (pathname.startsWith('/messages')) return 'Messages';
      if (pathname.startsWith('/profile')) return 'Profile';
      if(pathname.startsWith('/settings')) return 'Settings';
      if(pathname.startsWith('/search')) return 'Search';
    return '';
  })();

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      // If we have both userName and userProfileUrl props (and userProfileUrl is not undefined), use them and don't fetch
      if (
        propUserName &&
        propUserName !== 'User' &&
        propUserProfileUrl !== undefined &&
        propUserProfileUrl !== null &&
        propUserProfileUrl !== '/assets/Header/profiledummy.jpeg' &&
        propUserProfileUrl.trim() !== ''
      ) {
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      try {
        // Use authenticated API to get current user profile
        const { apiGet } = await import('@/utils/api');
        const { getCurrentUserId } = await import('@/utils/auth');
        const userId = getCurrentUserId();

        if (!userId) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        const data = await apiGet<{
          success: boolean;
          user?: UserData;
        }>('/profile');

        if (data.success && data.user && isMounted) {
          setUserData(data.user);
        }
      } catch (error) {
        console.error('Error fetching user data in Header:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserData();

    return () => {
      isMounted = false;
    };
  }, [propUserName, propUserProfileUrl]);

  const userName = propUserName || userData?.full_name || 'User';

  const rawProfileUrl =
    propUserProfileUrl ||
    (userData?.profile_url &&
    typeof userData.profile_url === 'string' &&
    userData.profile_url.trim() !== ''
      ? userData.profile_url
      : null);

  // Helper function to validate if a string is a valid URL for Next.js Image
  const isValidUrl = (urlString: string): boolean => {
    if (
      !urlString ||
      typeof urlString !== 'string' ||
      urlString.trim() === ''
    ) {
      return false;
    }
    try {
      // For relative paths starting with /, they're valid for Next.js Image
      if (urlString.startsWith('/')) {
        return true;
      }
      // For absolute URLs, validate using URL constructor
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  // Use getResourceUrl for consistent URL construction, then validate
  const userProfileUrl = rawProfileUrl ? getResourceUrl(rawProfileUrl) : null;

  // Final validation - ensure the URL is valid before using it with Next.js Image
  const validUserProfileUrl =
    userProfileUrl && isValidUrl(userProfileUrl) ? userProfileUrl : null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node)
      ) {
        setShowPopup(false);
      }
    };

    if (showPopup) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPopup]);

  const handleLogout = async () => {
    // Use the proper logout function from auth utils
    const { logout } = await import('@/utils/auth');
    await logout();
  };

  const userRole = userData?.user_type
    ? userData.user_type.charAt(0).toUpperCase() +
      userData.user_type.slice(1).toLowerCase()
    : 'User';

  return (
    <>
    <nav className="flex items-center justify-between px-3 sm:px-3 md:px-4 lg:px-6 py-6 md:py-3 bg-white">
      <div className="flex items-center gap-2">
        {/* Hamburger - mobile only */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-1.5 rounded-lg text-gray-700 hover:bg-gray-100 focus:outline-none"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        {/* Logo: on home always; on web (md+) show on all pages */}
        <Link
          href="/"
          className={`flex items-center gap-1 sm:gap-2 ${!isHome ? 'hidden md:flex' : ''}`}
        >
          <Image
            src="/assets/Homescreen/Logo.png"
            alt="ATHLINKED Logo"
            width={180}
            height={50}
            className="w-32 h-8 md:w-[145px] md:h-[35px]"
            priority
          />
        </Link>
        {/* Page title: mobile only when not home */}
        {!isHome && (
          <span className="md:hidden text-lg sm:text-xl font-semibold text-black">
            {pageTitle}
          </span>
        )}
      </div>

      {/* Profile avatar + popup - hidden on mobile */}
      <div className="hidden md:flex items-center relative">
        <div className="ml-1 sm:ml-2">
          <button
            onClick={() => setShowPopup(!showPopup)}
            className="focus:outline-none"
          >
            {validUserProfileUrl ? (
              <Image
                src={validUserProfileUrl}
                alt={`${userName} profile avatar`}
                width={48}
                height={48}
                className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                priority
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gray-300 border border-gray-200 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                <span className="text-gray-600 font-semibold text-xs sm:text-sm md:text-base">
                  {getInitials(userName)}
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Profile Popup */}
        {showPopup && (
          <div
            ref={popupRef}
            className="absolute top-full right-0 mt-1 sm:mt-2 w-64 sm:w-72 md:w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
          >
            {/* Profile Section */}
            <div className="p-3 sm:p-4 md:p-5 border-b border-gray-200">
              <div
                className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  router.push('/profile');
                  setShowPopup(false);
                }}
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gray-300 overflow-hidden border border-gray-200 flex items-center justify-center shrink-0">
                  {validUserProfileUrl ? (
                    <img
                      src={validUserProfileUrl}
                      alt={userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 font-semibold text-xs sm:text-sm md:text-base">
                      {getInitials(userName)}
                    </span>
                  )}
                </div>
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="text-xs sm:text-sm text-gray-500 truncate">
                    {userRole}
                  </span>
                  <span className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">
                    {userName}
                  </span>
                </div>
              </div>
            </div>

            {/* Options Section */}
            <div className="py-1 sm:py-2">
              <button
                onClick={() => {
                  // Navigate to settings page or open settings modal
                  router.push('/settings');
                  setShowPopup(false);
                }}
                className="w-full flex items-center gap-2 sm:gap-3 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 shrink-0" />
                <span className="text-sm sm:text-base text-gray-900 font-medium">
                  Settings
                </span>
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(true);
                  setShowPopup(false);
                }}
                className="w-full flex items-center gap-2 sm:gap-3 px-4 sm:px-5 md:px-6 py-2 sm:py-2.5 md:py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 shrink-0" />
                <span className="text-sm sm:text-base text-gray-900 font-medium">
                  Logout
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal - hidden on mobile */}
      {showLogoutConfirm && (
        <div className="hidden md:block">
          {/* Backdrop */}
          <div
            className="fixed inset-0 backdrop-blur-sm z-50"
            onClick={() => setShowLogoutConfirm(false)}
          ></div>

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-4 sm:p-5 md:p-6 max-w-md w-full mx-3 sm:mx-4">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Confirm Logout
                </h3>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>

              <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-5 md:mb-6">
                Are you sure you want to logout? You will need to login again to
                access your account.
              </p>

              <div className="flex gap-2 sm:gap-3 justify-end">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-[#CB9729] hover:bg-[#d4a846] text-white rounded-lg transition-colors font-medium"
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>

    {/* Mobile hamburger drawer */}
    <HamburgerMenu
      isOpen={mobileMenuOpen}
      onClose={() => setMobileMenuOpen(false)}
    />
    </>
  );
}
