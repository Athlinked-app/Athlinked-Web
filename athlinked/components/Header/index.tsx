'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Settings, LogOut, X } from 'lucide-react';

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
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

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
        const userIdentifier = localStorage.getItem('userEmail');
        if (!userIdentifier) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        let response;
        if (userIdentifier.startsWith('username:')) {
          const username = userIdentifier.replace('username:', '');
          response = await fetch(
            `http://localhost:3001/api/signup/user-by-username/${encodeURIComponent(username)}`
          );
        } else {
          response = await fetch(
            `http://localhost:3001/api/signup/user/${encodeURIComponent(userIdentifier)}`
          );
        }

        if (!response.ok) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        const data = await response.json();
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

  const userProfileUrl =
    rawProfileUrl && rawProfileUrl.trim() !== ''
      ? rawProfileUrl.startsWith('http')
        ? rawProfileUrl
        : rawProfileUrl.startsWith('/') && !rawProfileUrl.startsWith('/assets')
          ? `https://qd9ngjg1-3001.inc1.devtunnels.ms${rawProfileUrl}`
          : rawProfileUrl
      : null;

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
    // Revoke refresh token on server
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        await fetch('http://localhost:3001/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (error) {
        console.error('Error revoking token:', error);
      }
    }

    // Remove tokens and old userEmail
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userEmail');
    }
    router.push('/login');
  };

  const userRole = userData?.user_type
    ? userData.user_type.charAt(0).toUpperCase() +
      userData.user_type.slice(1).toLowerCase()
    : 'User';

  return (
    <nav className="flex items-center justify-between px-3 md:px-8 py-4 bg-white">
      <div className="flex items-center">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/assets/Homescreen/Logo.png"
            alt="ATHLINKED Logo"
            width={180}
            height={50}
            className="w-32 h-8 md:w-[200px] md:h-[50px]"
            priority
          />
        </Link>
      </div>

      <div className="flex items-center relative">
        <div className="ml-2">
          <button
            onClick={() => setShowPopup(!showPopup)}
            className="focus:outline-none"
          >
            {userProfileUrl ? (
              <Image
                src={userProfileUrl}
                alt={`${userName} profile avatar`}
                width={48}
                height={48}
                className="w-12 h-12 md:w-20 md:h-20 rounded-full object-cover border border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                priority
              />
            ) : (
              <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-gray-300 border border-gray-200 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
                <span className="text-gray-600 font-semibold text-xs md:text-base">
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
            className="absolute top-full right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50"
          >
            {/* Profile Section */}
            <div className="p-6 border-b border-gray-200">
              <div
                className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => {
                  router.push('/profile');
                  setShowPopup(false);
                }}
              >
                <div className="w-12 h-12 md:w-20 md:h-20 rounded-full bg-gray-300 overflow-hidden border border-gray-200 flex items-center justify-center flex-shrink-0">
                  {userProfileUrl ? (
                    <img
                      src={userProfileUrl}
                      alt={userName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 font-semibold text-sm md:text-lg">
                      {getInitials(userName)}
                    </span>
                  )}
                </div>
                <div className="flex flex-col leading-tight min-w-0">
                  <span className="text-sm text-gray-500">{userRole}</span>
                  <span className="text-xl font-semibold text-gray-900 truncate">
                    {userName}
                  </span>
                </div>
              </div>
            </div>

            {/* Options Section */}
            <div className="py-2">
              <button
                onClick={() => {
                  // Navigate to settings page or open settings modal
                  router.push('/settings');
                  setShowPopup(false);
                }}
                className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900 font-medium">Settings</span>
              </button>
              <button
                onClick={() => {
                  setShowLogoutConfirm(true);
                  setShowPopup(false);
                }}
                className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-gray-50 transition-colors"
              >
                <LogOut className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900 font-medium">Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 backdrop-blur-sm z-50"
            onClick={() => setShowLogoutConfirm(false)}
          ></div>

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Confirm Logout
                </h3>
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-gray-600 mb-6">
                Are you sure you want to logout? You will need to login again to
                access your account.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-[#CB9729] hover:bg-[#d4a846] text-white rounded-lg transition-colors font-medium"
                >
                  Yes, Logout
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
