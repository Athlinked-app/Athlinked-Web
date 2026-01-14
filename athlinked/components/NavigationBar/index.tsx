'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
} from 'lucide-react';

interface NavigationBarProps {
  activeItem?: string;
  userName?: string;
  userProfileUrl?: string;
  userRole?: string;
}

interface UserData {
  full_name: string | null;
  username: string | null;
  profile_url?: string;
  user_type?: string;
}

export default function NavigationBar({
  activeItem = 'stats',
  userName: propUserName,
  userProfileUrl: propUserProfileUrl,
  userRole: propUserRole,
}: NavigationBarProps) {
  const router = useRouter();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState<number>(0);
  const [messageCount, setMessageCount] = useState<number>(0);

  // Fetch notification count and set up WebSocket
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
          const count = data.unreadCount ?? data.count ?? 0;
          setNotificationCount(count);
        }
      } catch (error) {
        console.error('Error fetching notification count:', error);
      }
    };

    // Initial fetch
    fetchNotificationCount();

    // Fetch message count
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
          const count = data.unreadCount ?? data.count ?? 0;
          setMessageCount(count);
        }
      } catch (error) {
        console.error('Error fetching message count:', error);
      }
    };

    fetchMessageCount();

    // Set up WebSocket connection
    let socket: any = null;
    let handleNotificationCountUpdate:
      | ((data: { count: number }) => void)
      | null = null;
    let handleNewNotification: (() => void) | null = null;
    let handleMessageCountUpdate: ((data: { count: number }) => void) | null =
      null;

    const setupWebSocket = async () => {
      const { getSocket } = await import('@/utils/useSocket');
      socket = getSocket();

      if (socket) {
        // Listen for notification count updates
        handleNotificationCountUpdate = (data: { count: number }) => {
          setNotificationCount(data.count);
        };

        handleNewNotification = () => {
          fetchNotificationCount();
        };

        // Listen for message count updates
        handleMessageCountUpdate = (data: { count: number }) => {
          setMessageCount(data.count);
        };

        socket.on('notification_count_update', handleNotificationCountUpdate);
        socket.on('new_notification', handleNewNotification);
        socket.on('message_count_update', handleMessageCountUpdate);
      }
    };

    setupWebSocket();

    return () => {
      if (socket) {
        if (handleNotificationCountUpdate) {
          socket.off(
            'notification_count_update',
            handleNotificationCountUpdate
          );
        }
        if (handleNewNotification) {
          socket.off('new_notification', handleNewNotification);
        }
        if (handleMessageCountUpdate) {
          socket.off('message_count_update', handleMessageCountUpdate);
        }
      }
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchUserData = async () => {
      try {
        const userIdentifier = localStorage.getItem('userEmail');
        if (!userIdentifier) {
          if (isMounted) {
            setLoading(false);
          }
          return;
        }

        const { apiGet } = await import('@/utils/api');
        let data;

        if (userIdentifier.startsWith('username:')) {
          const username = userIdentifier.replace('username:', '');
          data = await apiGet<{
            success: boolean;
            user?: UserData;
          }>(`/signup/user-by-username/${encodeURIComponent(username)}`);
        } else {
          data = await apiGet<{
            success: boolean;
            user?: UserData;
          }>(`/signup/user/${encodeURIComponent(userIdentifier)}`);
        }

        if (data.success && data.user && isMounted) {
          setUserData(data.user);
        }
      } catch (error) {
        console.error('Error fetching user data in NavigationBar:', error);
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
  }, []);

  const handleLogout = async () => {
    // Use the proper logout function from auth utils
    const { logout } = await import('@/utils/auth');
    await logout();
  };
  const menuItems = [
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'clips', icon: Play, label: 'Clips' },
    { id: 'network', icon: Users, label: 'My Network' },
    { id: 'my_athletes', icon: UserCheck, label: 'My Athletes' }, // New menu item
    { id: 'opportunities', icon: Briefcase, label: 'Opportunities' },
    { id: 'message', icon: MessageSquare, label: 'Message' },
    { id: 'notifications', icon: Bell, label: 'Notifications' },
    { id: 'stats', icon: BarChart3, label: 'Stats' },
    { id: 'resource', icon: Package, label: 'Resource' },
    { id: 'logout', icon: LogOut, label: 'Logout' },
  ];

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
          ? `http://localhost:3001${rawProfileUrl}`
          : rawProfileUrl
      : null;

  const userRole =
    propUserRole ||
    (userData?.user_type
      ? userData.user_type.charAt(0).toUpperCase() +
        userData.user_type.slice(1).toLowerCase()
      : 'Athlete');
  const displayName = userName || 'User';

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Determine which menu items to show based on user type
  const normalizedRole = (userData?.user_type || propUserRole || 'athlete')
    .toString()
    .toLowerCase();

  const filteredMenuItems = menuItems.filter(item => {
    // Athlete: show everything except "My Athletes"
    if (normalizedRole === 'athlete') {
      return item.id !== 'my_athletes';
    }

    // Coach / Organization: hide stats, resource, my_athletes, opportunities
    if (
      normalizedRole === 'coach' ||
      normalizedRole === 'organization' ||
      normalizedRole === 'organisation'
    ) {
      return !['stats', 'resource', 'my_athletes', 'opportunities'].includes(
        item.id
      );
    }

    // Parent: hide opportunities, resource, stats
    if (normalizedRole === 'parent') {
      return !['opportunities', 'resource', 'stats'].includes(item.id);
    }

    // Default: no filtering
    return true;
  });

  return (
    <div className="w-16 sm:w-20 md:w-56 lg:w-64 xl:w-72 bg-white flex flex-col border-r border-gray-200 rounded-lg  transition-all duration-300">
      {/* Athlete Profile Section */}
      <div className="p-2 sm:p-3 md:p-4 border-b border-gray-200">
        <div
          className="flex items-center gap-2 md:gap-3 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => {
            router.push('/profile');
          }}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gray-300 overflow-hidden border border-gray-200 flex items-center justify-center shrink-0">
            {userProfileUrl ? (
              <img
                src={userProfileUrl}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-600 font-semibold text-xs sm:text-sm md:text-base">
                {getInitials(userName)}
              </span>
            )}
          </div>
          <div className="hidden md:flex flex-col leading-tight min-w-0">
            <span className="text-xs md:text-sm text-gray-500 truncate">
              {userRole}
            </span>
            <span className="text-sm md:text-base lg:text-lg font-semibold text-gray-900 truncate">
              {displayName}
            </span>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-1 sm:p-2 md:p-3 overflow-y-auto">
        <ul className="space-y-0.5 md:space-y-1">
          {filteredMenuItems.map(item => {
            const Icon = item.icon;
            const isActive = activeItem === item.id;

            if (item.id === 'logout') {
              return (
                <li key={item.id}>
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className={`flex items-center justify-center md:justify-start gap-2 md:gap-3 px-2 md:px-3 lg:px-4 py-2 md:py-2.5 lg:py-3 rounded-lg transition-colors w-full text-left ${
                      isActive
                        ? 'bg-[#CB9729] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title={item.label}
                  >
                    <Icon
                      size={18}
                      className="md:w-5 md:h-5 shrink-0"
                      strokeWidth={2}
                    />
                    <span className="text-xs md:text-sm font-medium hidden md:inline truncate">
                      {item.label}
                    </span>
                  </button>
                </li>
              );
            }

            const getHref = () => {
              switch (item.id) {
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
                default:
                  return '#';
              }
            };

            const href = getHref();

            return (
              <li key={item.id}>
                {href !== '#' ? (
                  <Link
                    href={href}
                    className={`flex items-center justify-center md:justify-start gap-2 md:gap-3 px-2 md:px-3 lg:px-4 py-2 md:py-2.5 lg:py-3 rounded-lg transition-colors relative ${
                      isActive
                        ? ' text-[#CB9729]'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title={item.label}
                  >
                    <div className="relative shrink-0">
                      <Icon
                        size={18}
                        className="md:w-5 md:h-5"
                        strokeWidth={2}
                      />
                      {item.id === 'notifications' && notificationCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] md:text-[10px] font-bold rounded-full min-w-[16px] md:min-w-[18px] h-[16px] md:h-[18px] px-0.5 md:px-1 flex items-center justify-center z-10 border-2 border-white shadow-md">
                          {notificationCount > 99 ? '99+' : notificationCount}
                        </span>
                      )}
                      {item.id === 'message' && messageCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-[9px] md:text-[10px] font-bold rounded-full min-w-[16px] md:min-w-[18px] h-[16px] md:h-[18px] px-0.5 md:px-1 flex items-center justify-center z-10 border-2 border-white shadow-md">
                          {messageCount > 99 ? '99+' : messageCount}
                        </span>
                      )}
                    </div>
                    <span className="text-xs md:text-sm font-medium hidden md:inline truncate">
                      {item.label}
                    </span>
                  </Link>
                ) : (
                  <a
                    href={href}
                    className={`flex items-center justify-center md:justify-start gap-2 md:gap-3 px-2 md:px-3 lg:px-4 py-2 md:py-2.5 lg:py-3 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[#CB9729] text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                    title={item.label}
                  >
                    <Icon
                      size={18}
                      className="md:w-5 md:h-5 shrink-0"
                      strokeWidth={2}
                    />
                    <span className="text-xs md:text-sm font-medium hidden md:inline truncate">
                      {item.label}
                    </span>
                  </a>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      {showLogoutConfirm && (
        <>
          <div
            className="fixed inset-0 backdrop-blur-sm z-50"
            onClick={() => setShowLogoutConfirm(false)}
          ></div>
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
    </div>
  );
}
