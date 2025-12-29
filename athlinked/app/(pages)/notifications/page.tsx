'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import NavigationBar from '@/components/NavigationBar';
import RightSideBar from '@/components/RightSideBar';
import Header from '@/components/Header';

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
  const [activeTab, setActiveTab] = useState<'all' | 'myPost' | 'mentions'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<{ id?: string; full_name?: string; profile_url?: string } | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const userIdentifier = localStorage.getItem('userEmail');
        if (!userIdentifier) {
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

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setCurrentUserId(data.user.id);
            setCurrentUser({
              id: data.user.id,
              full_name: data.user.full_name,
              profile_url: data.user.profile_url,
            });
          }
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
      // TODO: Replace with proper authentication
      // For now, pass userId as query param
      const response = await fetch(
        `http://localhost:3001/api/notifications?limit=50&offset=0&userId=${currentUserId}`
      );

      if (!response.ok) {
        console.error('Failed to fetch notifications:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
        setNotifications([]);
        return;
      }

      const data = await response.json();
      console.log('Fetched notifications:', data);
      
      if (data.success && data.notifications) {
        setNotifications(data.notifications);
        console.log('Notifications set:', data.notifications.length);
      } else {
        console.log('No notifications in response:', data);
        setNotifications([]);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notifications on mount and when userId changes
  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // Refresh notifications when tab changes
  useEffect(() => {
    if (currentUserId) {
      fetchNotifications();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Filter notifications based on active tab
  const getFilteredNotifications = () => {
    if (activeTab === 'all') {
      return notifications;
    } else if (activeTab === 'myPost') {
      return notifications.filter(n => n.type === 'like' || n.type === 'comment');
    } else if (activeTab === 'mentions') {
      return notifications.filter(n => n.type === 'mention');
    }
    return notifications;
  };

  const handleDismiss = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/notifications/${id}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Update local state
        setNotifications(notifications.map(n => 
          n.id === id ? { ...n, isRead: true } : n
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      // Still update local state for better UX
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

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
      return `http://localhost:3001${profileUrl}`;
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
        <div className="hidden md:flex px-6">
          <NavigationBar activeItem="notifications" />
        </div>
        
        <div className="flex-1 flex gap-5 overflow-y-auto">
          {/* Main Content */}
          <div className="flex-1 bg-white rounded-xl p-6">
            {/* Tabs Section */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-black">Notifications</h1>
                <button
                  onClick={fetchNotifications}
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-[#CB9729] text-white rounded-lg hover:bg-[#b78322] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
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
                <div className="space-y-4">
                  {currentList.map((notification) => {
                    return (
                      <div
                        key={notification.id}
                        className={`flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors ${
                          !notification.isRead ? 'bg-blue-50' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-yellow-400 overflow-hidden flex items-center justify-center">
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
                        <button
                          onClick={() => handleDismiss(notification.id)}
                          className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                          aria-label="Mark as read"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:flex">
            <RightSideBar />
          </div>
        </div>
      </div>
    </div>
  );
}

