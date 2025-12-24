'use client';
 
import { useState, useEffect } from 'react';
 
interface Person {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  isFollowing: boolean;
}
 
export default function RightSideBar() {
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
        
        let userId: string | null = null;
        const userIdentifier = localStorage.getItem('userEmail');
        if (userIdentifier) {
          try {
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
                userId = data.user.id;
                setCurrentUserId(data.user.id);
              }
            }
          } catch (error) {
            console.error('Error fetching current user ID:', error);
          }
        }

        const excludeParam = userId ? `&excludeUserId=${userId}` : '';
        const response = await fetch(
          `http://localhost:3001/api/signup/users?limit=10${excludeParam}`
        );

        if (!response.ok) {
          console.error('Failed to fetch users');
          setPeople([]);
          return;
        }

        const data = await response.json();
        if (data.success && data.users) {
          const transformedPeople: Person[] = await Promise.all(
            data.users.map(async (user: any) => {
              let isFollowing = false;
              if (userId) {
                try {
                  const isFollowingResponse = await fetch(
                    `http://localhost:3001/api/network/is-following/${user.id}?follower_id=${userId}`
                  );
                  if (isFollowingResponse.ok) {
                    const isFollowingData = await isFollowingResponse.json();
                    if (isFollowingData.success) {
                      isFollowing = isFollowingData.isFollowing;
                    }
                  }
                } catch (error) {
                  console.error(`Error checking follow status for ${user.id}:`, error);
                }
              }
              
              return {
                id: user.id,
                name: user.full_name || 'User',
                role: user.user_type ? user.user_type.charAt(0).toUpperCase() + user.user_type.slice(1).toLowerCase() : 'User',
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
        ? `http://localhost:3001/api/network/unfollow/${id}`
        : `http://localhost:3001/api/network/follow/${id}`;

      const userIdentifier = localStorage.getItem('userEmail');
      if (!userIdentifier) {
        alert('User not logged in');
        return;
      }

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
        setPeople(prevPeople =>
          prevPeople.map(person =>
            person.id === id
              ? { ...person, isFollowing: !isCurrentlyFollowing }
              : person
          )
        );
      } else {
        alert(result.message || `Failed to ${isCurrentlyFollowing ? 'unfollow' : 'follow'} user`);
      }
    } catch (error) {
      console.error(`Error ${isCurrentlyFollowing ? 'unfollowing' : 'following'} user:`, error);
      alert(`Failed to ${isCurrentlyFollowing ? 'unfollow' : 'follow'} user. Please try again.`);
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
                  <p className="text-xs text-gray-500 mb-0.5">{person.role}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {person.name}
                  </p>
                </div>
 
                {/* Follow Button */}
                <button
                  onClick={() => handleFollow(person.id, person.isFollowing)}
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