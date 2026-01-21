'use client';

import { useState, useEffect } from 'react';
import NavigationBar from '@/components/NavigationBar';
import RightSideBar from '@/components/RightSideBar';
import Header from '@/components/Header';
import { Search as SearchIcon, X, ChevronDown } from 'lucide-react';
import { getResourceUrl } from '@/utils/api';
import { API_BASE_URL } from '@/utils/config';

interface SearchResult {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  isFollowing: boolean;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filter states
  const [sortBy, setSortBy] = useState<string>('');
  const [searchType, setSearchType] = useState<string>('');
  const [collegeSchool, setCollegeSchool] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [achievements, setAchievements] = useState<string>('');
  const [sportSpecialization, setSportSpecialization] = useState<string>('');
  const [gender, setGender] = useState<string>('');
  const [teamLevel, setTeamLevel] = useState<string>('');
  const [teamCaptain, setTeamCaptain] = useState<string>('');

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Trigger search when filters change
  useEffect(() => {
    if (hasActiveFilters) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [
    searchQuery,
    sortBy,
    searchType,
    collegeSchool,
    location,
    sportSpecialization,
    gender,
    teamLevel,
    teamCaptain,
  ]);

  const fetchCurrentUser = async () => {
    try {
      const userIdentifier = localStorage.getItem('userEmail');
      if (!userIdentifier) return;

      let response;
      if (userIdentifier.startsWith('username:')) {
        const username = userIdentifier.replace('username:', '');
        response = await fetch(
          `${API_BASE_URL}/api/signup/user-by-username/${encodeURIComponent(username)}`
        );
      } else {
        response = await fetch(
          `${API_BASE_URL}/api/signup/user/${encodeURIComponent(userIdentifier)}`
        );
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setCurrentUserId(data.user.id);
          setCurrentUser(data.user);
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
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

  const performSearch = async () => {
    setIsSearching(true);

    try {
      // Build query parameters
      const params = new URLSearchParams();

      if (searchQuery.trim()) params.append('searchQuery', searchQuery.trim());
      if (sortBy) params.append('sortBy', sortBy);
      if (searchType) params.append('searchType', searchType);
      if (collegeSchool.trim())
        params.append('collegeSchool', collegeSchool.trim());
      if (location.trim()) params.append('location', location.trim());
      if (sportSpecialization)
        params.append('sportSpecialization', sportSpecialization);
      if (gender) params.append('gender', gender);
      if (teamLevel) params.append('teamLevel', teamLevel);
      if (teamCaptain) params.append('teamCaptain', teamCaptain);

      const searchUrl = `${API_BASE_URL}/api/api/search?${params.toString()}`;
      console.log('Search URL:', searchUrl);
      console.log('Sort By:', sortBy);

      const response = await fetch(searchUrl);

      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);

        if (data.success && data.users) {
          console.log('Number of users returned:', data.users.length);
          console.log(
            'First 3 users:',
            data.users.slice(0, 3).map((u: any) => ({
              name: u.full_name,
              created_at: u.created_at,
            }))
          );

          // Filter out current user and check follow status
          const filteredUsers = data.users.filter(
            (user: any) => user.id !== currentUserId
          );

          const transformedResults: SearchResult[] = await Promise.all(
            filteredUsers.map(async (user: any) => {
              let isFollowing = false;
              if (currentUserId) {
                try {
                  const isFollowingResponse = await fetch(
                    `${API_BASE_URL}/api/api/network/is-following/${user.id}?follower_id=${currentUserId}`
                  );
                  if (isFollowingResponse.ok) {
                    const isFollowingData = await isFollowingResponse.json();
                    if (isFollowingData.success) {
                      isFollowing = isFollowingData.isFollowing;
                    }
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
                avatar: getProfileUrl(user.profile_url) || null,
                isFollowing,
              };
            })
          );
          console.log('Transformed results count:', transformedResults.length);
          setSearchResults(transformedResults);
        } else {
          console.log('No users in response');
          setSearchResults([]);
        }
      } else {
        console.error('Response not OK:', response.status);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFollow = async (
    userId: string,
    isCurrentlyFollowing: boolean
  ) => {
    if (!currentUserId) {
      alert('You must be logged in to follow users');
      return;
    }

    try {
      const endpoint = isCurrentlyFollowing
        ? `${API_BASE_URL}/api/network/unfollow/${userId}`
        : `${API_BASE_URL}/api/network/follow/${userId}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUserId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSearchResults(prevResults =>
          prevResults.map(person =>
            person.id === userId
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

  // Check if any filter has a value
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    sortBy !== '' ||
    searchType !== '' ||
    collegeSchool.trim() !== '' ||
    location.trim() !== '' ||
    achievements.trim() !== '' ||
    sportSpecialization !== '' ||
    gender !== '' ||
    teamLevel !== '' ||
    teamCaptain !== '';

  const renderContent = () => {
    // Search results will only be shown in RightSideBar
    return null;
  };

  return (
    <div className="h-screen bg-[#D4D4D4] flex flex-col overflow-hidden">
      <Header
        userName={currentUser?.full_name}
        userProfileUrl={getProfileUrl(currentUser?.profile_url)}
      />

      <main className="flex flex-1 w-full mt-5 overflow-hidden">
        <div className="hidden md:flex px-6">
          <NavigationBar activeItem="search" />
        </div>

        <div className="flex-1 flex justify-center px-4 overflow-hidden min-w-0">
          {/* Centered Advanced Search Panel */}
          <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-6 overflow-y-auto pb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Advance Search
              </h2>
              <button className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-6">
              <SearchIcon
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] focus:border-transparent text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Sort By */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Sort By
              </label>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] focus:border-transparent text-sm appearance-none bg-white text-gray-400"
                >
                  <option value="">Choose sort option</option>
                  <option value="name">A-Z (Name)</option>
                  <option value="latest">Newest Users</option>
                  <option value="oldest">Oldest Users</option>
                  <option value="youngest">Youngest Age</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={20}
                />
              </div>
            </div>

            {/* Select Search Type */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Select Search Type
              </label>
              <div className="relative">
                <select
                  value={searchType}
                  onChange={e => setSearchType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] focus:border-transparent text-sm appearance-none bg-white text-gray-400"
                >
                  <option value="">Choose user type</option>
                  <option value="athlete">Athlete</option>
                  <option value="coach">Coach / Recruiter</option>
                  <option value="organization">Organization</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={20}
                />
              </div>
            </div>

            {/* Select College/School */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Select College/School
              </label>
              <input
                type="text"
                placeholder="College/School Name"
                value={collegeSchool}
                onChange={e => setCollegeSchool(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] focus:border-transparent text-sm"
              />
            </div>

            {/* Enter Location */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Enter Location
              </label>
              <input
                type="text"
                placeholder="Location"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] focus:border-transparent text-sm"
              />
            </div>

            {/* Select Achievements */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Select Achievements
              </label>
              <input
                type="text"
                placeholder="Achievements"
                value={achievements}
                onChange={e => setAchievements(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] focus:border-transparent text-sm"
              />
            </div>

            {/* Sport Specialization */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Sport Specialization
              </label>
              <div className="relative">
                <select
                  value={sportSpecialization}
                  onChange={e => setSportSpecialization(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] focus:border-transparent text-sm appearance-none bg-white text-gray-400"
                >
                  <option value="">Choose sport</option>
                  <option value="basketball">Basketball</option>
                  <option value="football">Football</option>
                  <option value="soccer">Soccer</option>
                  <option value="baseball">Baseball</option>
                  <option value="volleyball">Volleyball</option>
                  <option value="track">Track & Field</option>
                  <option value="swimming">Swimming</option>
                  <option value="tennis">Tennis</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={20}
                />
              </div>
            </div>

            {/* Gender */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Gender
              </label>
              <div className="relative">
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] focus:border-transparent text-sm appearance-none bg-white text-gray-400"
                >
                  <option value="">Choose gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={20}
                />
              </div>
            </div>

            {/* Team Level */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Team Level
              </label>
              <div className="relative">
                <select
                  value={teamLevel}
                  onChange={e => setTeamLevel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] focus:border-transparent text-sm appearance-none bg-white text-gray-400"
                >
                  <option value="">Choose team level</option>
                  <option value="professional">Professional</option>
                  <option value="college">College</option>
                  <option value="high-school">High School</option>
                  <option value="youth">Youth</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={20}
                />
              </div>
            </div>

            {/* Team Captain */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-900 mb-2">
                Team Captain
              </label>
              <div className="relative">
                <select
                  value={teamCaptain}
                  onChange={e => setTeamCaptain(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] focus:border-transparent text-sm appearance-none bg-white text-gray-400"
                >
                  <option value="">Choose option</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                <ChevronDown
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={20}
                />
              </div>
            </div>

            {/* Search Results */}
            {renderContent()}
          </div>
        </div>

        {hasActiveFilters && (
          <div className="hidden lg:flex">
            <RightSideBar
              searchResults={searchResults}
              sortBy={sortBy}
              searchType={searchType}
              collegeSchool={collegeSchool}
            />
          </div>
        )}
      </main>
    </div>
  );
}
