'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getResourceUrl } from '@/utils/config';

interface Person {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  isFollowing: boolean;
  dob?: string; // Date of birth for age sorting
  created_at?: string; // For newest/oldest sorting
}

interface SearchResult {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  isFollowing: boolean;
  dob?: string;
  created_at?: string;
}

interface RightSideBarProps {
  searchResults?: SearchResult[];
  sortBy?: string;
  searchType?: string;
  collegeSchool?: string;
}

export default function RightSideBar({
  searchResults,
  sortBy = '',
  searchType = '',
  collegeSchool = '',
}: RightSideBarProps) {
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
      return getResourceUrl(profileUrl) || profileUrl;
    }
    return profileUrl;
  };

  // Calculate age from date of birth
  const calculateAge = (dob: string): number => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  // Sort people based on sortBy parameter
  const sortPeople = (peopleList: Person[], sortOption: string): Person[] => {
    const sorted = [...peopleList];

    switch (sortOption) {
      case 'name':
        // A-Z by name
        return sorted.sort((a, b) => a.name.localeCompare(b.name));

      case 'latest':
        // Newest users (most recent created_at)
        return sorted.sort((a, b) => {
          if (!a.created_at || !b.created_at) return 0;
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        });

      case 'oldest':
        // Oldest users (earliest created_at)
        return sorted.sort((a, b) => {
          if (!a.created_at || !b.created_at) return 0;
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        });

      case 'youngest':
        // Youngest by age (most recent DOB = lowest age)
        return sorted.sort((a, b) => {
          if (!a.dob || !b.dob) return 0;
          const ageA = calculateAge(a.dob);
          const ageB = calculateAge(b.dob);
          return ageA - ageB; // Lower age first
        });

      default:
        return sorted;
    }
  };

  useEffect(() => {
    // If search results are provided, use them instead of fetching default people
    if (searchResults && searchResults.length > 0) {
      const sortedResults = sortPeople(searchResults, sortBy);
      setPeople(sortedResults);
      setLoading(false);
      return;
    }

    // Otherwise fetch default "People you may know"
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
        const currentUserIdParam = userId ? `&currentUserId=${userId}` : '';
        const sortParam = sortBy ? `&sortBy=${sortBy}` : '';
        const searchTypeParam = searchType ? `&searchType=${searchType}` : '';
        const collegeSchoolParam = collegeSchool
          ? `&collegeSchool=${encodeURIComponent(collegeSchool)}`
          : '';

        // Optimized: Backend now includes isFollowing status in the response
        // This eliminates 10 separate API calls for follow status checks
        const data = await apiGet<{
          success: boolean;
          users?: any[];
        }>(
          `/signup/users?limit=10${excludeParam}${currentUserIdParam}${sortParam}${searchTypeParam}${collegeSchoolParam}`
        );

        if (data.success && data.users) {
          // No need for Promise.all or separate follow status checks anymore!
          // Backend already includes isFollowing in the response
          const transformedPeople: Person[] = data.users.map((user: any) => ({
            id: user.id,
            name: user.full_name || 'User',
            role: user.user_type
              ? user.user_type.charAt(0).toUpperCase() +
                user.user_type.slice(1).toLowerCase()
              : 'User',
            avatar: getProfileUrl(user.profile_url),
            isFollowing: user.isFollowing || false, // Already included from backend
            dob: user.dob,
            created_at: user.created_at,
          }));

          const sortedPeople = sortPeople(transformedPeople, sortBy);
          setPeople(sortedPeople);
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
  }, [searchResults, sortBy, searchType, collegeSchool]);

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

  // Determine the title based on whether we're showing search results or default suggestions
  const title =
    searchResults && searchResults.length > 0
      ? `Search Results (${searchResults.length})`
      : 'People you may know';

  return (
    <div className="hidden lg:block w-64 xl:w-72 2xl:w-80 bg-white border-l border-gray-200 overflow-y-auto rounded-lg rounded-scrollbar transition-all duration-300">
      {/* Header */}
      <div className="p-2 sm:p-3 md:p-4 border-b border-gray-200">
        <h2 className="text-sm sm:text-base md:text-lg font-semibold text-gray-900 truncate">
          {title}
        </h2>
      </div>

      {/* People List */}
      <div className="divide-y divide-gray-200">
        {loading ? (
          <div className="p-3 sm:p-4 text-center text-gray-500 text-xs sm:text-sm">
            Loading...
          </div>
        ) : people.length === 0 ? (
          <div className="p-3 sm:p-4 text-center text-gray-500 text-xs sm:text-sm">
            {searchResults ? 'No results found' : 'No users found'}
          </div>
        ) : (
          people.map(person => (
            <div
              key={person.id}
              className="p-2 sm:p-3 md:p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                {/* Avatar and Info - Clickable */}
                <div
                  onClick={() => router.push(`/profile?userId=${person.id}`)}
                  className="flex items-center gap-2 sm:gap-2.5 md:gap-3 flex-1 min-w-0 cursor-pointer"
                >
                  {/* Avatar */}
                  <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gray-200 shrink-0 overflow-hidden flex items-center justify-center">
                    {person.avatar ? (
                      <img
                        src={person.avatar}
                        alt={person.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-semibold text-xs sm:text-sm">
                        {getInitials(person.name)}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5 truncate">
                      {person.role}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
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
                  className={`px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 text-xs sm:text-sm font-medium rounded-full border transition-colors shrink-0 ${
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
