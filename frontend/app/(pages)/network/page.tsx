'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import NavigationBar from '@/components/NavigationBar';
import RightSideBar from '@/components/RightSideBar';
import { getResourceUrl } from '@/utils/config';

interface User {
  id: string;
  username: string | null;
  full_name: string | null;
  user_type: string | null;
  profile_url: string | null;
}

interface ConnectionRequest {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: string;
  created_at: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  user_type: string | null;
  profile_url: string | null;
}

export default function NetworkPage() {
  const [activeTab, setActiveTab] = useState<
    'followers' | 'following' | 'invitations'
  >('followers');
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [invitations, setInvitations] = useState<ConnectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    full_name?: string;
    profile_url?: string;
  } | null>(null);
  const [followStatuses, setFollowStatuses] = useState<{
    [key: string]: boolean;
  }>({});

  // Fetch current user ID
  useEffect(() => {
    const fetchCurrentUserId = async () => {
      try {
        const { getCurrentUserId, getCurrentUser } =
          await import('@/utils/auth');
        const userId = getCurrentUserId();
        const user = getCurrentUser();

        if (userId) {
          setCurrentUserId(userId);
          // Fetch full user profile for display
          const { apiGet } = await import('@/utils/api');
          try {
            const data = await apiGet<{ success: boolean; user?: any }>(
              `/profile`
            );
            if (data.success && data.user) {
              setCurrentUser({
                full_name: data.user.full_name,
                profile_url: data.user.profile_url,
              });
            }
          } catch (error) {
            // If profile fetch fails, use basic info from token
            console.error('Error fetching user profile:', error);
          }
        }
      } catch (error) {
        console.error('Error fetching current user ID:', error);
      }
    };

    fetchCurrentUserId();
  }, []);

  // Fetch followers and following lists
  const fetchNetworkData = async () => {
    if (!currentUserId) return;

    try {
      setLoading(true);
      const { apiGet } = await import('@/utils/api');

      // Fetch followers
      let followersList: User[] = [];
      try {
        const followersData = await apiGet<{
          success: boolean;
          followers?: User[];
        }>(`/network/followers/${currentUserId}`);
        if (followersData.success) {
          followersList = followersData.followers || [];
          setFollowers(followersList);
        }
      } catch (error) {
        console.error('Error fetching followers:', error);
      }

      // Fetch following
      let followingList: User[] = [];
      try {
        const followingData = await apiGet<{
          success: boolean;
          following?: User[];
        }>(`/network/following/${currentUserId}`);
        if (followingData.success) {
          followingList = followingData.following || [];
          setFollowing(followingList);
        }
      } catch (error) {
        console.error('Error fetching following:', error);
      }

      // Fetch connection requests (invitations)
      try {
        const invitationsData = await apiGet<{
          success: boolean;
          requests?: ConnectionRequest[];
        }>(`/network/invitations`);
        if (invitationsData.success) {
          setInvitations(invitationsData.requests || []);
        }
      } catch (error) {
        console.error('Error fetching invitations:', error);
        setInvitations([]);
      }

      // Update follow statuses
      const statuses: { [key: string]: boolean } = {};
      // All users in following list are being followed
      followingList.forEach((user: User) => {
        statuses[user.id] = true;
      });

      // Check follow status for followers who are not in following list
      for (const user of followersList) {
        if (user.id !== currentUserId && !statuses[user.id]) {
          try {
            const isFollowingData = await apiGet<{
              success: boolean;
              isFollowing?: boolean;
            }>(`/network/is-following/${user.id}`);
            if (isFollowingData.success) {
              statuses[user.id] = isFollowingData.isFollowing || false;
            }
          } catch (error) {
            console.error(
              `Error checking follow status for ${user.id}:`,
              error
            );
          }
        }
      }
      setFollowStatuses(statuses);
    } catch (error) {
      console.error('Error fetching network data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNetworkData();
  }, [currentUserId]);

  useEffect(() => {
    if (activeTab === 'invitations' && currentUserId) {
      fetchNetworkData();
    }
  }, [activeTab, currentUserId]);

  // Refresh data when page becomes visible (e.g., when user follows from sidebar)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && currentUserId) {
        fetchNetworkData();
      }
    };

    const handleFocus = () => {
      if (currentUserId) {
        fetchNetworkData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentUserId]);

  // Get initials for placeholder
  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get display name (full_name only)
  const getDisplayName = (user: User) => {
    return user.full_name || 'User';
  };

  // Get profile URL helper
  const getProfileUrl = (profileUrl?: string | null): string | undefined => {
    if (!profileUrl || profileUrl.trim() === '') return undefined;
    if (profileUrl.startsWith('http')) return profileUrl;
    if (profileUrl.startsWith('/') && !profileUrl.startsWith('/assets')) {
      return getResourceUrl(profileUrl) || profileUrl;
    }
    return profileUrl;
  };

  // Handle follow/unfollow
  const handleFollowToggle = async (
    userId: string,
    isCurrentlyFollowing: boolean
  ) => {
    if (!currentUserId) {
      alert('You must be logged in to follow users');
      return;
    }

    try {
      const { apiPost } = await import('@/utils/api');
      const endpoint = isCurrentlyFollowing
        ? `/network/unfollow/${userId}`
        : `/network/follow/${userId}`;

      const result = await apiPost<{ success: boolean; message?: string }>(
        endpoint,
        {}
      );

      if (result.success) {
        // Update follow status
        setFollowStatuses(prev => ({
          ...prev,
          [userId]: !isCurrentlyFollowing,
        }));

        // Refresh the lists
        await fetchNetworkData();
      } else {
        alert(
          result.message ||
            `Failed to ${isCurrentlyFollowing ? 'unfollow' : 'follow'} user`
        );
      }
    } catch (error: any) {
      console.error(
        `Error ${isCurrentlyFollowing ? 'unfollowing' : 'following'} user:`,
        error
      );
      alert(
        error.message ||
          `Failed to ${isCurrentlyFollowing ? 'unfollow' : 'follow'} user. Please try again.`
      );
    }
  };

  const handleAcceptInvitation = async (requestId: string) => {
    if (!currentUserId) {
      alert('You must be logged in');
      return;
    }

    try {
      const { apiPost } = await import('@/utils/api');
      const result = await apiPost<{ success: boolean; message?: string }>(
        `/network/accept/${requestId}`,
        {}
      );

      if (result.success) {
        setInvitations(prev => prev.filter(req => req.id !== requestId));
        await fetchNetworkData();
        alert('Connection request accepted!');
      } else {
        alert(result.message || 'Failed to accept connection request');
      }
    } catch (error: any) {
      console.error('Error accepting invitation:', error);
      alert(
        error.message ||
          'Failed to accept connection request. Please try again.'
      );
    }
  };

  const handleRejectInvitation = async (requestId: string) => {
    if (!currentUserId) {
      alert('You must be logged in');
      return;
    }

    try {
      const { apiPost } = await import('@/utils/api');
      const result = await apiPost<{ success: boolean; message?: string }>(
        `/network/reject/${requestId}`,
        {}
      );

      if (result.success) {
        setInvitations(prev => prev.filter(req => req.id !== requestId));
        alert('Connection request rejected');
      } else {
        alert(result.message || 'Failed to reject connection request');
      }
    } catch (error: any) {
      console.error('Error rejecting invitation:', error);
      alert(
        error.message ||
          'Failed to reject connection request. Please try again.'
      );
    }
  };

  const currentList =
    activeTab === 'followers'
      ? followers
      : activeTab === 'following'
        ? following
        : [];

  return (
    <div className="h-screen bg-[#D4D4D4] flex flex-col overflow-hidden">
      <Header
        userName={currentUser?.full_name}
        userProfileUrl={getProfileUrl(currentUser?.profile_url)}
      />

      <div className="flex flex-1 w-full mt-5 overflow-hidden">
        {/* Navigation Bar */}
        <div className="hidden md:flex px-3">
          <NavigationBar activeItem="network" />
        </div>

        <div className="flex-1 flex gap-3 overflow-y-auto">
          {/* Main Content */}
          <div className="flex-1 bg-white rounded-xl p-6">
            {/* Followers/Followings Section */}
            <div className="mb-8">
              <div className="flex border-b border-gray-200 mb-6">
                <button
                  onClick={() => setActiveTab('followers')}
                  className={`px-6 py-3 font-medium text-base relative ${
                    activeTab === 'followers'
                      ? 'text-[#CB9729]'
                      : 'text-black hover:text-black'
                  }`}
                >
                  Followers
                  {activeTab === 'followers' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('following')}
                  className={`px-6 py-3 font-medium text-base relative ${
                    activeTab === 'following'
                      ? 'text-[#CB9729]'
                      : 'text-black hover:text-black'
                  }`}
                >
                  Followings
                  {activeTab === 'following' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]"></div>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('invitations')}
                  className={`px-6 py-3 font-medium text-base relative ${
                    activeTab === 'invitations'
                      ? 'text-[#CB9729]'
                      : 'text-black hover:text-black'
                  }`}
                >
                  Invitations
                  {activeTab === 'invitations' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]"></div>
                  )}
                </button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-black">Loading...</div>
              ) : activeTab === 'invitations' ? (
                invitations.length === 0 ? (
                  <div className="text-center py-8 text-black">
                    No pending invitations
                  </div>
                ) : (
                  <div className="space-y-4">
                    {invitations.map(request => {
                      const profileUrl = getProfileUrl(request.profile_url);
                      return (
                        <div
                          key={request.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center">
                              {profileUrl ? (
                                <img
                                  src={profileUrl}
                                  alt={request.full_name || 'User'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-black font-semibold text-sm">
                                  {getInitials(request.full_name || 'User')}
                                </span>
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-black">
                                {request.full_name || 'User'}
                              </div>
                              <div className="text-sm text-black">
                                {request.user_type
                                  ? request.user_type.charAt(0).toUpperCase() +
                                    request.user_type.slice(1).toLowerCase()
                                  : 'User'}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleAcceptInvitation(request.id)}
                              className="px-4 py-2 bg-[#CB9729] text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium text-sm"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleRejectInvitation(request.id)}
                              className="px-4 py-2 bg-gray-200 text-black rounded-lg hover:bg-gray-300 transition-colors font-medium text-sm"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : currentList.length === 0 ? (
                <div className="text-center py-8 text-black">
                  No {activeTab === 'followers' ? 'followers' : 'followings'}{' '}
                  yet
                </div>
              ) : (
                <div className="space-y-4">
                  {currentList.map(user => {
                    const isFollowing = followStatuses[user.id] || false;
                    const profileUrl = getProfileUrl(user.profile_url);

                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center">
                            {profileUrl ? (
                              <img
                                src={profileUrl}
                                alt={getDisplayName(user)}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-black font-semibold text-sm">
                                {getInitials(user.full_name || 'User')}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-black">
                              {user.full_name || 'User'}
                            </div>
                            <div className="text-sm text-black">
                              {user.user_type
                                ? user.user_type.charAt(0).toUpperCase() +
                                  user.user_type.slice(1).toLowerCase()
                                : 'User'}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            handleFollowToggle(user.id, isFollowing)
                          }
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            isFollowing
                              ? 'bg-gray-200 text-black hover:bg-gray-300'
                              : 'bg-[#CB9729] text-white hover:bg-yellow-600'
                          }`}
                        >
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>
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
