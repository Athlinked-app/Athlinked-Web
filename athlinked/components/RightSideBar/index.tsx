'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Person {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  isFollowing: boolean;
}

export default function RightSideBar() {
  const router = useRouter();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProfileUrl = (profileUrl?: string | null): string | null => {
    if (!profileUrl || profileUrl.trim() === '') return null;
    if (profileUrl.startsWith('http')) return profileUrl;
    if (profileUrl.startsWith('/') && !profileUrl.startsWith('/assets')) {
      return `http://localhost:3001${profileUrl}`;
    }
    return profileUrl;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { apiGet } = await import('@/utils/api');

        let userId: string | null = null;
        const userIdentifier = localStorage.getItem('userEmail');
        if (userIdentifier) {
          try {
            let data;
            if (userIdentifier.startsWith('username:')) {
              const username = userIdentifier.replace('username:', '');
              data = await apiGet<{
                success: boolean;
                user?: { id: string };
              }>(`/signup/user-by-username/${encodeURIComponent(username)}`);
            } else {
              data = await apiGet<{
                success: boolean;
                user?: { id: string };
              }>(`/signup/user/${encodeURIComponent(userIdentifier)}`);
            }

            if (data.success && data.user) {
              userId = data.user.id;
              setCurrentUserId(data.user.id);
            }
          } catch (error) {
            console.error('Error fetching current user ID:', error);
          }
        }

        const excludeParam = userId ? `&excludeUserId=${userId}` : '';
        const data = await apiGet<{
          success: boolean;
          users?: any[];
        }>(`/signup/users?limit=10${excludeParam}`);
        if (data.success && data.users) {
          const transformedPeople: Person[] = await Promise.all(
            data.users.map(async (user: any) => {
              let isFollowing = false;
              if (userId) {
                try {
                  const { apiGet } = await import('@/utils/api');
                  const isFollowingData = await apiGet<{
                    success: boolean;
                    isFollowing?: boolean;
                  }>(`/network/is-following/${user.id}?follower_id=${userId}`);
                  if (isFollowingData.success) {
                    isFollowing = isFollowingData.isFollowing || false;
                  }
                } catch (error) {
                  console.error(
                    `Error checking follow status for ${user.id}:`,
                    error
                  );
                }
              }

              return {
                id: user.id,
                name: user.full_name || 'User',
                role: user.user_type
                  ? user.user_type.charAt(0).toUpperCase() +
                    user.user_type.slice(1).toLowerCase()
                  : 'User',
                avatar: getProfileUrl(user.profile_url),
                isFollowing,
              };
            })
          );
          setPeople(transformedPeople);
        } else {
          setPeople([]);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
        setPeople([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFollow = async (id: string, isCurrentlyFollowing: boolean) => {
    if (!currentUserId) {
      alert('You must be logged in to follow users');
      return;
    }

    try {
      const endpoint = isCurrentlyFollowing
        ? `/network/unfollow/${id}`
        : `/network/follow/${id}`;

      const { apiPost } = await import('@/utils/api');
      const result = await apiPost<{
        success: boolean;
        message?: string;
      }>(endpoint, {
        user_id: currentUserId,
      });

      if (result.success) {
        setPeople(prevPeople =>
          prevPeople.map(person =>
            person.id === id
              ? { ...person, isFollowing: !isCurrentlyFollowing }
              : person
          )
        );
      } else {
        alert(
          result.message ||
            `Failed to ${isCurrentlyFollowing ? 'unfollow' : 'follow'} user`
        );
      }
    } catch (error) {
      console.error(
        `Error ${isCurrentlyFollowing ? 'unfollowing' : 'following'} user:`,
        error
      );
      alert(
        `Failed to ${isCurrentlyFollowing ? 'unfollow' : 'follow'} user. Please try again.`
      );
    }
  };

  return (
    <div className="w-96 bg-white border-l border-gray-200 overflow-y-auto mr-10 rounded-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">
          People you may know
        </h2>
      </div>

      {/* People List */}
      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            Loading...
          </div>
        ) : people.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No users found
          </div>
        ) : (
          people.map(person => (
            <div
              key={person.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                {/* Avatar and Info - Clickable */}
                <div
                  onClick={() => router.push(`/profile?userId=${person.id}`)}
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                    {person.avatar ? (
                      <img
                        src={person.avatar}
                        alt={person.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-semibold text-sm">
                        {getInitials(person.name)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 mb-0.5">
                      {person.role}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {person.name}
                    </p>
                  </div>
                </div>

                {/* Follow Button */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleFollow(person.id, person.isFollowing);
                  }}
                  className={`px-4 py-1.5 text-sm font-medium rounded-full border transition-colors flex-shrink-0 ${
                    person.isFollowing
                      ? 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {person.isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
