'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import NavigationBar from '@/components/NavigationBar';
import RightSideBar from '@/components/RightSideBar';

interface User {
  id: string;
  username: string | null;
  full_name: string | null;
  user_type: string | null;
  profile_url: string | null;
}

export default function NetworkPage() {
  const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ full_name?: string; profile_url?: string } | null>(null);
  const [followStatuses, setFollowStatuses] = useState<{ [key: string]: boolean }>({});

  // Fetch current user ID
  useEffect(() => {
    const fetchCurrentUserId = async () => {
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
              full_name: data.user.full_name,
              profile_url: data.user.profile_url,
            });
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

      // Fetch followers
      const followersResponse = await fetch(
        `http://localhost:3001/api/network/followers/${currentUserId}`
      );
      let followersList: User[] = [];
      if (followersResponse.ok) {
        const followersData = await followersResponse.json();
        if (followersData.success) {
          followersList = followersData.followers || [];
          setFollowers(followersList);
        }
      }

      // Fetch following
      const followingResponse = await fetch(
        `http://localhost:3001/api/network/following/${currentUserId}`
      );
      let followingList: User[] = [];
      if (followingResponse.ok) {
        const followingData = await followingResponse.json();
        if (followingData.success) {
          followingList = followingData.following || [];
          setFollowing(followingList);
        }
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
            const isFollowingResponse = await fetch(
              `http://localhost:3001/api/network/is-following/${user.id}?follower_id=${currentUserId}`
            );
            if (isFollowingResponse.ok) {
              const isFollowingData = await isFollowingResponse.json();
              if (isFollowingData.success) {
                statuses[user.id] = isFollowingData.isFollowing;
              }
            }
          } catch (error) {
            console.error(`Error checking follow status for ${user.id}:`, error);
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
      return `http://localhost:3001${profileUrl}`;
    }
    return profileUrl;
  };

  // Handle follow/unfollow
  const handleFollowToggle = async (userId: string, isCurrentlyFollowing: boolean) => {
    if (!currentUserId) {
      alert('You must be logged in to follow users');
      return;
    }

    try {
      const endpoint = isCurrentlyFollowing
        ? `http://localhost:3001/api/network/unfollow/${userId}`
        : `http://localhost:3001/api/network/follow/${userId}`;

      const userIdentifier = localStorage.getItem('userEmail');
      if (!userIdentifier) {
        alert('User not logged in');
        return;
      }

      // Get user data to get user_id
      let userResponse;
      if (userIdentifier.startsWith('username:')) {
        const username = userIdentifier.replace('username:', '');
        userResponse = await fetch(
          `http://localhost:3001/api/signup/user-by-username/${encodeURIComponent(username)}`
        );
      } else {
        userResponse = await fetch(
          `http://localhost:3001/api/signup/user/${encodeURIComponent(userIdentifier)}`
        );
      }

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userDataResponse = await userResponse.json();
      if (!userDataResponse.success || !userDataResponse.user) {
        throw new Error('User not found');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userDataResponse.user.id,
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let result;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError);
          const text = await response.text();
          console.error('Response text:', text);
          throw new Error(`Failed to parse response: ${text.substring(0, 100)}`);
        }
      } else {
        const text = await response.text();
        console.error('Non-JSON response (status:', response.status, '):', text.substring(0, 200));
        throw new Error(`Server returned non-JSON response (status: ${response.status}). Check backend logs.`);
      }

      if (result.success) {
        // Update follow status
        setFollowStatuses(prev => ({
          ...prev,
          [userId]: !isCurrentlyFollowing,
        }));

        // Refresh the lists
        if (activeTab === 'followers') {
          const followersResponse = await fetch(
            `http://localhost:3001/api/network/followers/${currentUserId}`
          );
          if (followersResponse.ok) {
            const followersData = await followersResponse.json();
            if (followersData.success) {
              setFollowers(followersData.followers || []);
            }
          }
        } else {
          const followingResponse = await fetch(
            `http://localhost:3001/api/network/following/${currentUserId}`
          );
          if (followingResponse.ok) {
            const followingData = await followingResponse.json();
            if (followingData.success) {
              setFollowing(followingData.following || []);
            }
          }
        }

      } else {
        alert(result.message || `Failed to ${isCurrentlyFollowing ? 'unfollow' : 'follow'} user`);
      }
    } catch (error) {
      console.error(`Error ${isCurrentlyFollowing ? 'unfollowing' : 'following'} user:`, error);
      alert(`Failed to ${isCurrentlyFollowing ? 'unfollow' : 'follow'} user. Please try again.`);
    }
  };

  const currentList = activeTab === 'followers' ? followers : following;

  return (
    <div className="h-screen bg-[#D4D4D4] flex flex-col overflow-hidden">
      <Header
        userName={currentUser?.full_name}
        userProfileUrl={getProfileUrl(currentUser?.profile_url)}
      />
      
      <div className="flex flex-1 w-full mt-5 overflow-hidden">
        {/* Navigation Bar */}
        <div className="hidden md:flex px-6">
          <NavigationBar activeItem="network" />
        </div>
        
        <div className="flex-1 flex gap-5 overflow-y-auto">
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
            </div>

            {loading ? (
              <div className="text-center py-8 text-black">Loading...</div>
            ) : currentList.length === 0 ? (
              <div className="text-center py-8 text-black">
                No {activeTab === 'followers' ? 'followers' : 'followings'} yet
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
                              ? user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1).toLowerCase()
                              : 'User'}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFollowToggle(user.id, isFollowing)}
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
          <div className="hidden lg:flex">
            <RightSideBar />
          </div>
        </div>
      </div>
    </div>
  );
}

