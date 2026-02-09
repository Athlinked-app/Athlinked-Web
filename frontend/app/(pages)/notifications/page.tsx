'use client';

import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import NavigationBar from '@/components/NavigationBar';
import RightSideBar from '@/components/RightSideBar';
import Header from '@/components/Header';
import { getResourceUrl } from '@/utils/config';

interface Notification {
  id: string;
  actorFullName: string;
  type: string;
  message: string;
  entityType: string;
  entityId: string;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<'all' | 'myPost' | 'mentions'>(
    'all'
  );
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{
    id?: string;
    full_name?: string;
    profile_url?: string;
  } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const userIdentifier = localStorage.getItem('userEmail');
        if (!userIdentifier) {
          return;
        }

        const { apiGet } = await import('@/utils/api');
        let data;
        if (userIdentifier.startsWith('username:')) {
          const username = userIdentifier.replace('username:', '');
          data = await apiGet<{
            success: boolean;
            user?: {
              id: string;
              full_name?: string;
              profile_url?: string;
            };
          }>(`/signup/user-by-username/${encodeURIComponent(username)}`);
        } else {
          data = await apiGet<{
            success: boolean;
            user?: {
              id: string;
              full_name?: string;
              profile_url?: string;
            };
          }>(`/signup/user/${encodeURIComponent(userIdentifier)}`);
        }

        if (data.success && data.user) {
          setCurrentUserId(data.user.id);
          setCurrentUser({
            id: data.user.id,
            full_name: data.user.full_name,
            profile_url: data.user.profile_url,
          });
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Fetch notifications function
  const fetchNotifications = async () => {
    if (!currentUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { apiGet, apiPost } = await import('@/utils/api');
      const data = await apiGet<{
        success: boolean;
        notifications?: Notification[];
        message?: string;
      }>(`/notifications?limit=50&offset=0`);

      if (data.success) {
        const list = data.notifications || [];
        setNotifications(list.map(n => ({ ...n, isRead: true })));
        // Visiting the page = seen: mark all as read so the nav badge clears
        try {
          await apiPost<{ success?: boolean }>('/notifications/read-all', {});
          window.dispatchEvent(new Event('notification-updated'));
        } catch {
          // non-critical
        }
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Set up WebSocket for real-time notifications
  useEffect(() => {
    if (!currentUserId) return;

    const { getSocket } = require('@/utils/useSocket');
    const socket = getSocket();

    if (socket) {
      // Listen for new notifications
      socket.on('new_notification', (notification: Notification) => {
        setNotifications(prev => [notification, ...prev]);
      });

      // Listen for notification deletion
      socket.on('notification_deleted', (data: { notificationId: string }) => {
        setNotifications(prev =>
          prev.filter(n => n.id !== data.notificationId)
        );
      });

      return () => {
        socket.off('new_notification');
        socket.off('notification_deleted');
      };
    }
  }, [currentUserId]);

  // Fetch notifications on mount and when userId changes
  useEffect(() => {
    fetchNotifications();
  }, [currentUserId]);

  // Refresh notifications when tab changes
  useEffect(() => {
    if (currentUserId) {
      fetchNotifications();
    }
  }, [activeTab]);

  // Filter notifications based on active tab
  const getFilteredNotifications = () => {
    if (activeTab === 'all') {
      return notifications;
    } else if (activeTab === 'myPost') {
      return notifications.filter(
        n => n.type === 'like' || n.type === 'comment'
      );
    } else if (activeTab === 'mentions') {
      return notifications.filter(n => n.type === 'mention');
    }
    return notifications;
  };

  const handleDismiss = async (id: string) => {
    try {
      const { apiPost } = await import('@/utils/api');
      const data = await apiPost<{
        success: boolean;
        message?: string;
      }>(`/notifications/${id}/read`, {});

      if (data.success) {
        // Update local state
        setNotifications(
          notifications.map(n => (n.id === id ? { ...n, isRead: true } : n))
        );
        // Dispatch event to update notification count
        window.dispatchEvent(new Event('notification-updated'));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Still update local state for better UX
      setNotifications(
        notifications.map(n => (n.id === id ? { ...n, isRead: true } : n))
      );
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notification?')) {
      return;
    }

    try {
      const { apiDelete } = await import('@/utils/api');
      const data = await apiDelete<{
        success: boolean;
        message?: string;
      }>(`/notifications/${id}`);

      if (data.success) {
        // Remove notification from local state
        setNotifications(notifications.filter(n => n.id !== id));
        // Dispatch event to update notification count
        window.dispatchEvent(new Event('notification-updated'));
      } else {
        alert(data.message || 'Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      alert('Failed to delete notification. Please try again.');
    }
  };

  const formatTimeAgo = (dateString: string) => {
    // If the timestamp doesn't have timezone info, treat it as UTC
    let date: Date;
    
    if (dateString.includes('Z') || dateString.includes('+') || dateString.includes('T')) {
      // Already has timezone info
      date = new Date(dateString);
    } else {
      // No timezone info, treat as UTC by appending 'Z'
      date = new Date(dateString + 'Z');
    }
    
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
    if (diffInSeconds < 0) {
      return 'just now';
    }
    
    if (diffInSeconds < 60) {
      return 'just now';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (diffInSeconds < 2592000) {
      const weeks = Math.floor(diffInSeconds / 604800);
      return `${weeks} week${weeks > 1 ? 's' : ''} ago`;
    } else {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months} month${months > 1 ? 's' : ''} ago`;
    }
  };
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProfileUrl = (profileUrl?: string | null): string | undefined => {
    if (!profileUrl || profileUrl.trim() === '') return undefined;
    if (profileUrl.startsWith('http')) return profileUrl;
    if (profileUrl.startsWith('/') && !profileUrl.startsWith('/assets')) {
      return getResourceUrl(profileUrl) || profileUrl;
    }
    return profileUrl;
  };

  const currentList = getFilteredNotifications();

  return (
    <div className="h-screen bg-[#D4D4D4] flex flex-col overflow-hidden">
      <Header
        userName={currentUser?.full_name}
        userProfileUrl={getProfileUrl(currentUser?.profile_url)}
      />

      <div className="flex flex-1 w-full mt-5 overflow-hidden">
        {/* Navigation Bar */}
        <div className="hidden md:flex px-3">
          <NavigationBar activeItem="notifications" />
        </div>

        <div className="flex-1 flex gap-3 overflow-y-auto px-2">
          {/* Main Content */}
          <div className="flex-1 bg-white rounded-xl p-6">
            {/* Tabs Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-black">Notifications</h1>
                {/* <button
                  onClick={fetchNotifications}
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-[#CB9729] text-white rounded-lg hover:bg-[#b78322] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button> */}
              </div>
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-6 py-3 font-medium text-base relative ${
                    activeTab === 'all'
                      ? 'text-[#CB9729]'
                      : 'text-black hover:text-black'
                  }`}
                >
                  All
                  {activeTab === 'all' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('myPost')}
                  className={`px-6 py-3 font-medium text-base relative ${
                    activeTab === 'myPost'
                      ? 'text-[#CB9729]'
                      : 'text-black hover:text-black'
                  }`}
                >
                  My Post
                  {activeTab === 'myPost' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('mentions')}
                  className={`px-6 py-3 font-medium text-base relative ${
                    activeTab === 'mentions'
                      ? 'text-[#CB9729]'
                      : 'text-black hover:text-black'
                  }`}
                >
                  Mentions
                  {activeTab === 'mentions' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]"></div>
                  )}
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-black">
                  Loading notifications...
                </div>
              ) : currentList.length === 0 ? (
                <div className="text-center py-8 text-black">
                  No notifications yet
                </div>
              ) : (
                <div className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-hide">
                {currentList.map(notification => {
                  return (
                    <div
                      key={notification.id}
                      className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${
                        !notification.isRead ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="md:w-12 md:h-12 w-12 h-8 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-yellow-400 overflow-hidden flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {getInitials(notification.actorFullName)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-black">
                            {notification.message}{' '}
                            <span className="text-sm text-gray-500">
                              {formatTimeAgo(notification.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleDelete(notification.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          aria-label="Delete notification"
                          title="Delete notification"
                        >
                          <Trash2 size={18} />
                        </button>
                        {!notification.isRead && (
                          <button
                            onClick={() => handleDismiss(notification.id)}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                            aria-label="Mark as read"
                            title="Mark as read"
                          >
                            <X size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:flex pr-3">
            <RightSideBar />
          </div>
        </div>
      </div>
    </div>
  );
}
