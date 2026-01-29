'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Search,
  Home,
  Play,
  Users,
  Briefcase,
  MessageSquare,
  Bell,
  BarChart3,
  Package,
  HelpCircle,
  LogOut,
  X,
  UserCheck,
  Settings,
} from 'lucide-react';
import { getResourceUrl } from '@/utils/config';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserData {
  full_name: string | null;
  username: string | null;
  profile_url?: string;
  user_type?: string;
}

const MENU_ITEMS = [
  { id: 'search', icon: Search, label: 'Search' },
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'clips', icon: Play, label: 'Clips' },
  { id: 'network', icon: Users, label: 'My Network' },
  { id: 'my_athletes', icon: UserCheck, label: 'My Athletes' },
  { id: 'opportunities', icon: Briefcase, label: 'Opportunities' },
  { id: 'message', icon: MessageSquare, label: 'Messages' },
  { id: 'notifications', icon: Bell, label: 'Notifications' },
  { id: 'stats', icon: BarChart3, label: 'Stats' },
  { id: 'resource', icon: Package, label: 'Resource' },
  { id: 'help', icon: HelpCircle, label: "Help & FAQ's" },
  { id: 'settings', icon: Settings, label: 'Settings' },
  { id: 'logout', icon: LogOut, label: 'Logout' },
];

function getHref(id: string): string {
  switch (id) {
    case 'search':
      return '/search';
    case 'home':
      return '/home';
    case 'stats':
      return '/stats';
    case 'clips':
      return '/clips';
    case 'network':
      return '/network';
    case 'my_athletes':
      return '/my_athletes';
    case 'opportunities':
      return '/opportunities';
    case 'resource':
      return '/resources';
    case 'message':
      return '/messages';
    case 'notifications':
      return '/notifications';
    case 'settings':
      return '/settings';
    case 'help':
      return '/help';
    default:
      return '#';
  }
}

export default function HamburgerMenu({ isOpen, onClose }: HamburgerMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);

  // Derive active item from current path
  const pathToActiveId: Record<string, string> = {
    '/search': 'search',
    '/advance-search': 'search',
    '/home': 'home',
    '/stats': 'stats',
    '/clips': 'clips',
    '/network': 'network',
    '/my_athletes': 'my_athletes',
    '/opportunities': 'opportunities',
    '/resources': 'resource',
    '/messages': 'message',
    '/notifications': 'notifications',
    '/settings': 'settings',
    '/help': 'help',
  };
  const activeItem =
    pathToActiveId[pathname] ??
    (pathname?.startsWith('/settings') ? 'settings' : 'home');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userIdentifier = localStorage.getItem('userEmail');
        if (!userIdentifier) return;

        const { apiGet } = await import('@/utils/api');
        let data;

        if (userIdentifier.startsWith('username:')) {
          const username = userIdentifier.replace('username:', '');
          data = await apiGet<{ success: boolean; user?: UserData }>(
            `/signup/user-by-username/${encodeURIComponent(username)}`
          );
        } else {
          data = await apiGet<{ success: boolean; user?: UserData }>(
            `/signup/user/${encodeURIComponent(userIdentifier)}`
          );
        }

        if (data.success && data.user) {
          setUserData(data.user);
        }
      } catch (error) {
        console.error('Error fetching user data in HamburgerMenu:', error);
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    const fetchNotificationCount = async () => {
      try {
        const { apiGet } = await import('@/utils/api');
        const { getCurrentUserId } = await import('@/utils/auth');
        const userId = getCurrentUserId();
        if (!userId) return;

        const data = await apiGet<{
          success: boolean;
          unreadCount?: number;
          count?: number;
        }>('/notifications/unread-count');
        if (data.success) {
          setNotificationCount(data.unreadCount ?? data.count ?? 0);
        }
      } catch {
        setNotificationCount(0);
      }
    };
    const fetchMessageCount = async () => {
      try {
        const { apiGet } = await import('@/utils/api');
        const { getCurrentUserId } = await import('@/utils/auth');
        const userId = getCurrentUserId();
        if (!userId) return;

        const data = await apiGet<{
          success: boolean;
          unreadCount?: number;
          count?: number;
        }>('/messages/unread-count');
        if (data.success) {
          setMessageCount(data.unreadCount ?? data.count ?? 0);
        }
      } catch {
        setMessageCount(0);
      }
    };

    fetchNotificationCount();
    fetchMessageCount();

    const onNotificationUpdated = () => fetchNotificationCount();
    window.addEventListener('notification-updated', onNotificationUpdated);
    return () => window.removeEventListener('notification-updated', onNotificationUpdated);
  }, []);

  const userName = userData?.full_name || 'User';
  const rawProfileUrl =
    userData?.profile_url &&
    typeof userData.profile_url === 'string' &&
    userData.profile_url.trim() !== ''
      ? userData.profile_url
      : null;
  const userProfileUrl = getResourceUrl(rawProfileUrl) || null;
  const userRole = userData?.user_type
    ? userData.user_type.charAt(0).toUpperCase() +
      userData.user_type.slice(1).toLowerCase()
    : 'User';

  const getInitials = (name: string) =>
    name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

  const normalizedRole = (userData?.user_type || 'athlete')
    .toString()
    .toLowerCase();

  const filteredMenuItems = MENU_ITEMS.filter(item => {
    if (normalizedRole === 'athlete') {
      return item.id !== 'my_athletes';
    }
    if (
      normalizedRole === 'coach' ||
      normalizedRole === 'organization' ||
      normalizedRole === 'organisation'
    ) {
      return !['stats', 'resource', 'my_athletes', 'opportunities'].includes(
        item.id
      );
    }
    if (normalizedRole === 'parent') {
      return !['opportunities', 'resource', 'stats'].includes(item.id);
    }
    return true;
  });

  const handleLogout = async () => {
    sessionStorage.clear();
    const { logout } = await import('@/utils/auth');
    await logout();
  };

  const handleNavClick = (href: string) => {
    onClose();
    router.push(href);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[100] md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed top-0 left-0 h-full w-[280px] max-w-[85vw] bg-white shadow-xl z-[101] md:hidden flex flex-col animate-in slide-in-from-left-0 duration-200"
        role="dialog"
        aria-label="Menu"
      >
        {/* Profile header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
          <button
            type="button"
            onClick={() => handleNavClick('/profile')}
            className="flex items-center gap-3 min-w-0 flex-1"
          >
            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden border border-gray-200 shrink-0 flex items-center justify-center">
              {userProfileUrl ? (
                <img
                  src={userProfileUrl}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-600 font-semibold text-sm">
                  {getInitials(userName)}
                </span>
              )}
            </div>
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-sm font-semibold text-gray-900 truncate">
                {userName}
              </span>
              <span className="text-xs text-gray-500">{userRole}</span>
            </div>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 shrink-0"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-2">
          <ul className="space-y-0.5 px-2">
            {filteredMenuItems
              .filter(item => item.id !== 'logout')
              .map(item => {
                const Icon = item.icon;
                const isActive = activeItem === item.id;
                const href = getHref(item.id);
                if (href === '#') return null;

                return (
                  <li key={item.id}>
                    <Link
                      href={href}
                      onClick={() => onClose()}
                      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors text-left ${
                        isActive
                          ? 'bg-[#CB9729]/10 text-[#CB9729]'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <Icon
                          className={`w-5 h-5 ${isActive ? 'text-[#CB9729]' : 'text-gray-600'}`}
                        />
                        {item.id === 'notifications' && notificationCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                            {notificationCount > 99 ? '99+' : notificationCount}
                          </span>
                        )}
                        {item.id === 'message' && messageCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                            {messageCount > 99 ? '99+' : messageCount}
                          </span>
                        )}
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
          </ul>
        </nav>

        {/* Logout at bottom */}
        <div className="border-t border-gray-200 p-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowLogoutConfirm(true)}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors text-left"
          >
            <LogOut className="w-5 h-5 shrink-0 text-gray-600" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>

        {/* Logout confirmation modal */}
        {showLogoutConfirm && (
          <>
            <div
              className="fixed inset-0 bg-black/30 z-[102] md:hidden"
              onClick={() => setShowLogoutConfirm(false)}
            />
            <div className="fixed inset-0 flex items-center justify-center z-[103] p-4 md:hidden">
              <div className="bg-white rounded-lg shadow-xl p-5 w-full max-w-md">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Confirm Logout
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-gray-600 text-sm mb-5">
                  Are you sure you want to logout? You will need to login again
                  to access your account.
                </p>
                <div className="flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="px-4 py-2 bg-[#CB9729] hover:bg-[#d4a846] text-white rounded-lg text-sm font-medium"
                  >
                    Yes, Logout
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
