// 'use client';

// import { useState, useEffect } from 'react';
// import NavigationBar from '@/components/NavigationBar';
// import RightSideBar from '@/components/RightSideBar';
// import Header from '@/components/Header';
// import { Search as SearchIcon, X, ChevronDown } from 'lucide-react';

// interface SearchResult {
//   id: string;
//   name: string;
//   role: string;
//   avatar: string | null;
//   isFollowing: boolean;
// }

// export default function SearchPage() {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
//   const [isSearching, setIsSearching] = useState(false);
//   const [currentUserId, setCurrentUserId] = useState<string | null>(null);
//   const [currentUser, setCurrentUser] = useState<any>(null);

//   // Filter states
//   const [sortBy, setSortBy] = useState<string>('');
//   const [searchType, setSearchType] = useState<string>('');
//   const [collegeSchool, setCollegeSchool] = useState<string>('');
//   const [location, setLocation] = useState<string>('');
//   const [achievements, setAchievements] = useState<string>('');
//   const [sportSpecialization, setSportSpecialization] = useState<string>('');
//   const [gender, setGender] = useState<string>('');
//   const [teamLevel, setTeamLevel] = useState<string>('');
//   const [teamCaptain, setTeamCaptain] = useState<string>('');

//   useEffect(() => {
//     fetchCurrentUser();
//   }, []);

//   const fetchCurrentUser = async () => {
//     try {
//       const userIdentifier = localStorage.getItem('userEmail');
//       if (!userIdentifier) return;

//       let response;
//       if (userIdentifier.startsWith('username:')) {
//         const username = userIdentifier.replace('username:', '');
//         response = await fetch(
//           `http://localhost:3001/api/signup/user-by-username/${encodeURIComponent(username)}`
//         );
//       } else {
//         response = await fetch(
//           `http://localhost:3001/api/signup/user/${encodeURIComponent(userIdentifier)}`
//         );
//       }

//       if (response.ok) {
//         const data = await response.json();
//         if (data.success && data.user) {
//           setCurrentUserId(data.user.id);
//           setCurrentUser(data.user);
//         }
//       }
//     } catch (error) {
//       console.error('Error fetching current user:', error);
//     }
//   };

//   const getInitials = (name: string) => {
//     return name
//       .split(' ')
//       .map(word => word[0])
//       .join('')
//       .toUpperCase()
//       .slice(0, 2);
//   };

//   const getProfileUrl = (profileUrl?: string | null): string | undefined => {
//     if (!profileUrl || profileUrl.trim() === '') return undefined;
//     if (profileUrl.startsWith('http')) return profileUrl;
//     if (profileUrl.startsWith('/') && !profileUrl.startsWith('/assets')) {
//       return `http://localhost:3001${profileUrl}`;
//     }
//     return profileUrl;
//   };

//   const handleSearch = async (query: string) => {
//     setSearchQuery(query);

//     if (query.trim() === '') {
//       setSearchResults([]);
//       return;
//     }

//     setIsSearching(true);
//     const searchLower = query.toLowerCase();
//     const baseUrl = 'http://localhost:3001';

//     try {
//       const usersResponse = await fetch(
//         `${baseUrl}/api/signup/users?limit=100`
//       ).catch(() => null);

//       // Process users
//       if (usersResponse && usersResponse.ok) {
//         const data = await usersResponse.json();
//         if (data.success && data.users) {
//           const filteredUsers = data.users.filter((user: any) => {
//             const fullName = (user.full_name || '').toLowerCase();
//             const username = (user.username || '').toLowerCase();

//             return (
//               user.id !== currentUserId &&
//               (fullName.includes(searchLower) || username.includes(searchLower))
//             );
//           });

//           const transformedResults: SearchResult[] = await Promise.all(
//             filteredUsers.map(async (user: any) => {
//               let isFollowing = false;
//               if (currentUserId) {
//                 try {
//                   const isFollowingResponse = await fetch(
//                     `${baseUrl}/api/network/is-following/${user.id}?follower_id=${currentUserId}`
//                   );
//                   if (isFollowingResponse.ok) {
//                     const isFollowingData = await isFollowingResponse.json();
//                     if (isFollowingData.success) {
//                       isFollowing = isFollowingData.isFollowing;
//                     }
//                   }
//                 } catch (error) {
//                   console.error(
//                     `Error checking follow status for ${user.id}:`,
//                     error
//                   );
//                 }
//               }

//               return {
//                 id: user.id,
//                 name: user.full_name || 'User',
//                 role: user.user_type
//                   ? user.user_type.charAt(0).toUpperCase() +
//                     user.user_type.slice(1).toLowerCase()
//                   : 'User',
//                 avatar: getProfileUrl(user.profile_url) || null,
//                 isFollowing,
//               };
//             })
//           );
//           setSearchResults(transformedResults);
//         } else {
//           setSearchResults([]);
//         }
//       } else {
//         setSearchResults([]);
//       }
//     } catch (error) {
//       console.error('Search error:', error);
//       setSearchResults([]);
//     } finally {
//       setIsSearching(false);
//     }
//   };

//   const handleFollow = async (
//     userId: string,
//     isCurrentlyFollowing: boolean
//   ) => {
//     if (!currentUserId) {
//       alert('You must be logged in to follow users');
//       return;
//     }

//     try {
//       const endpoint = isCurrentlyFollowing
//         ? `http://localhost:3001/api/network/unfollow/${userId}`
//         : `http://localhost:3001/api/network/follow/${userId}`;

//       const response = await fetch(endpoint, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           user_id: currentUserId,
//         }),
//       });

//       const result = await response.json();

//       if (result.success) {
//         setSearchResults(prevResults =>
//           prevResults.map(person =>
//             person.id === userId
//               ? { ...person, isFollowing: !isCurrentlyFollowing }
//               : person
//           )
//         );
//       } else {
//         alert(
//           result.message ||
//             `Failed to ${isCurrentlyFollowing ? 'unfollow' : 'follow'} user`
//         );
//       }
//     } catch (error) {
//       console.error(
//         `Error ${isCurrentlyFollowing ? 'unfollowing' : 'following'} user:`,
//         error
//       );
//       alert(
//         `Failed to ${isCurrentlyFollowing ? 'unfollow' : 'follow'} user. Please try again.`
//       );
//     }
//   };

//   const applyFilters = () => {
//     let results = [...searchResults];

//     // Apply sorting
//     if (sortBy === 'name') {
//       results.sort((a, b) => a.name.localeCompare(b.name));
//     }

//     // Apply search type filter
//     if (searchType) {
//       results = results.filter(
//         person => person.role.toLowerCase() === searchType.toLowerCase()
//       );
//     }

//     return results;
//   };

//   const filteredResults = applyFilters();

//   // Check if any filter has a value
//   const hasActiveFilters =
//     searchQuery.trim() !== '' ||
//     sortBy !== '' ||
//     searchType !== '' ||
//     collegeSchool.trim() !== '' ||
//     location.trim() !== '' ||
//     achievements.trim() !== '' ||
//     sportSpecialization !== '' ||
//     gender !== '' ||
//     teamLevel !== '' ||
//     teamCaptain !== '';

//   const renderContent = () => {
//     if (isSearching) {
//       return (
//         <div className="flex-1 flex items-center justify-center">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CB9729] mx-auto"></div>
//             <p className="text-gray-500 mt-4">Searching...</p>
//           </div>
//         </div>
//       );
//     }

//     if (filteredResults.length === 0) {
//       return null;
//     }

//     return (
//       <div className="mt-6">
//         <div className="divide-y divide-gray-200">
//           {filteredResults.map(person => (
//             <div
//               key={person.id}
//               className="p-4 hover:bg-gray-50 transition-colors"
//             >
//               <div className="flex items-center gap-3">
//                 <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
//                   {person.avatar ? (
//                     <img
//                       src={person.avatar}
//                       alt={person.name}
//                       className="w-full h-full object-cover"
//                     />
//                   ) : (
//                     <span className="text-gray-600 font-semibold text-sm">
//                       {getInitials(person.name)}
//                     </span>
//                   )}
//                 </div>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-semibold text-gray-900 truncate">
//                     {person.name}
//                   </p>
//                   <p className="text-xs text-gray-500">{person.role}</p>
//                 </div>
//                 <button
//                   onClick={() => handleFollow(person.id, person.isFollowing)}
//                   className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors flex-shrink-0 ${
//                     person.isFollowing
//                       ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
//                       : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
//                   }`}
//                 >
//                   {person.isFollowing ? 'Following' : 'Follow'}
//                 </button>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="h-screen bg-[#D4D4D4] flex flex-col overflow-hidden">
//       <Header
//         userName={currentUser?.full_name}
//         userProfileUrl={getProfileUrl(currentUser?.profile_url)}
//       />

//       <main className="flex flex-1 w-full mt-5 overflow-hidden">
//         <div className="hidden md:flex px-6">
//           <NavigationBar activeItem="search" />
//         </div>

//         <div className="flex-1 flex justify-center px-4 overflow-hidden min-w-0">
//           {/* Centered Advanced Search Panel */}
//           <div className="w-full max-w-md bg-white rounded-lg shadow-sm p-6 overflow-y-auto pb-8">
//             <div className="flex items-center justify-between mb-6">
//               <h2 className="text-xl font-bold text-gray-900">
//                 Advance Search
//               </h2>
//               <button className="text-gray-400 hover:text-gray-600">
//                 <X size={20} />
//               </button>
//             </div>

//             {/* Search Input */}
//             <div className="relative mb-6">
//               <SearchIcon
//                 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
//                 size={18}
//               />
//               <input
//                 type="text"
//                 placeholder="Search..."
//                 value={searchQuery}
//                 onChange={e => handleSearch(e.target.value)}
//                 className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] focus:border-transparent text-sm"
//               />
//               {searchQuery && (
//                 <button
//                   onClick={() => {
//                     setSearchQuery('');
//                     setSearchResults([]);
//                   }}
//                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
//                 >
//                   <X size={16} />
//                 </button>
//               )}
//             </div>

//             {/* Sort By */}
//             <div className="mb-4">
//               <label className="block text-sm font-semibold text-gray-900 mb-2">
//                 Sort By
//               </label>
//               <div className="relative">
//                 <select
//                   value={sortBy}
//                   onChange={e => setSortBy(e.target.value)}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] focus:border-transparent text-sm appearance-none bg-white text-gray-400"
//                 >
//                   <option value="">Choose user type</option>
//                   <option value="name">A-Z (Name)</option>
//                   <option value="latest">Latest</option>
//                   <option value="oldest">Oldest</option>
//                 </select>
//                 <ChevronDown
//                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
//                   size={20}
//                 />
//               </div>
//             </div>

//             {/* Select Search Type */}
//             <div className="mb-4">
//               <label className="block text-sm font-semibold text-gray-900 mb-2">
//                 Select Search Type
//               </label>
//               <div className="relative">
//                 <select
//                   value={searchType}
//                   onChange={e => setSearchType(e.target.value)}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] focus:border-transparent text-sm appearance-none bg-white text-gray-400"
//                 >
//                   <option value="">Choose user type</option>
//                   <option value="athlete">Athlete</option>
//                   <option value="coach">Coach / Recruiter</option>
//                   <option value="organization">Organization</option>
//                 </select>
//                 <ChevronDown
//                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
//                   size={20}
//                 />
//               </div>
//             </div>

//             {/* Select College/School */}
//             <div className="mb-4">
//               <label className="block text-sm font-semibold text-gray-900 mb-2">
//                 Select College/School
//               </label>
//               <input
//                 type="text"
//                 placeholder="College/School Name"
//                 value={collegeSchool}
//                 onChange={e => setCollegeSchool(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] focus:border-transparent text-sm"
//               />
//             </div>

//             {/* Enter Location */}
//             <div className="mb-4">
//               <label className="block text-sm font-semibold text-gray-900 mb-2">
//                 Enter Location
//               </label>
//               <input
//                 type="text"
//                 placeholder="Location"
//                 value={location}
//                 onChange={e => setLocation(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] focus:border-transparent text-sm"
//               />
//             </div>

//             {/* Select Achievements */}
//             <div className="mb-4">
//               <label className="block text-sm font-semibold text-gray-900 mb-2">
//                 Select Achievements
//               </label>
//               <input
//                 type="text"
//                 placeholder="Achievements"
//                 value={achievements}
//                 onChange={e => setAchievements(e.target.value)}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] focus:border-transparent text-sm"
//               />
//             </div>

//             {/* Sport Specialization */}
//             <div className="mb-4">
//               <label className="block text-sm font-semibold text-gray-900 mb-2">
//                 Sport Specialization
//               </label>
//               <div className="relative">
//                 <select
//                   value={sportSpecialization}
//                   onChange={e => setSportSpecialization(e.target.value)}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] focus:border-transparent text-sm appearance-none bg-white text-gray-400"
//                 >
//                   <option value="">Choose user type</option>
//                   <option value="basketball">Basketball</option>
//                   <option value="football">Football</option>
//                   <option value="soccer">Soccer</option>
//                   <option value="baseball">Baseball</option>
//                   <option value="volleyball">Volleyball</option>
//                   <option value="track">Track & Field</option>
//                   <option value="swimming">Swimming</option>
//                   <option value="tennis">Tennis</option>
//                 </select>
//                 <ChevronDown
//                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
//                   size={20}
//                 />
//               </div>
//             </div>

//             {/* Gender */}
//             <div className="mb-4">
//               <label className="block text-sm font-semibold text-gray-900 mb-2">
//                 Gender
//               </label>
//               <div className="relative">
//                 <select
//                   value={gender}
//                   onChange={e => setGender(e.target.value)}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] focus:border-transparent text-sm appearance-none bg-white text-gray-400"
//                 >
//                   <option value="">Choose user type</option>
//                   <option value="male">Male</option>
//                   <option value="female">Female</option>
//                   <option value="other">Other</option>
//                 </select>
//                 <ChevronDown
//                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
//                   size={20}
//                 />
//               </div>
//             </div>

//             {/* Team Level */}
//             <div className="mb-4">
//               <label className="block text-sm font-semibold text-gray-900 mb-2">
//                 Team Level
//               </label>
//               <div className="relative">
//                 <select
//                   value={teamLevel}
//                   onChange={e => setTeamLevel(e.target.value)}
//                   className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] focus:border-transparent text-sm appearance-none bg-white text-gray-400"
//                 >
//                   <option value="">Choose user type</option>
//                   <option value="professional">Professional</option>
//                   <option value="college">College</option>
//                   <option value="high-school">High School</option>
//                   <option value="youth">Youth</option>
//                 </select>
//                 <ChevronDown
//                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
//                   size={20}
//                 />
//               </div>
//             </div>

//             {/* Team Captain */}
//             <div className="mb-4">
//               <label className="block text-sm font-semibold text-gray-900 mb-2">
//                 Team Captain
//               </label>
//               <div className="relative">
//                 <select
//                   value={teamCaptain}
//                   onChange={e => setTeamCaptain(e.target.value)}
//                   className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] focus:border-transparent text-sm appearance-none bg-white text-gray-400"
//                 >
//                   <option value="">Choose user type</option>
//                   <option value="yes">Yes</option>
//                   <option value="no">No</option>
//                 </select>
//                 <ChevronDown
//                   className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
//                   size={20}
//                 />
//               </div>
//             </div>

//             {/* Search Results */}
//             {renderContent()}
//           </div>
//         </div>

//         {hasActiveFilters && (
//           <div className="hidden lg:flex">
//             <RightSideBar />
//           </div>
//         )}
//       </main>
//     </div>
//   );
// }

'use client';

import { useState, useEffect } from 'react';
import NavigationBar from '@/components/NavigationBar';
import RightSideBar from '@/components/RightSideBar';
import Header from '@/components/Header';
import { Search as SearchIcon, X, ChevronDown } from 'lucide-react';

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
      return `http://localhost:3001${profileUrl}`;
    }
    return profileUrl;
  };

  const performSearch = async () => {
    setIsSearching(true);
    const baseUrl = 'http://localhost:3001';

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

      const searchUrl = `${baseUrl}/api/search?${params.toString()}`;
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
                    `${baseUrl}/api/network/is-following/${user.id}?follower_id=${currentUserId}`
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
        ? `http://localhost:3001/api/network/unfollow/${userId}`
        : `http://localhost:3001/api/network/follow/${userId}`;

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
    if (isSearching) {
      return (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CB9729] mx-auto"></div>
            <p className="text-gray-500 mt-4">Searching...</p>
          </div>
        </div>
      );
    }

    if (searchResults.length === 0) {
      return null;
    }

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Search Results ({searchResults.length})
        </h3>
        <div className="divide-y divide-gray-200">
          {searchResults.map(person => (
            <div
              key={person.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
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
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {person.name}
                  </p>
                  <p className="text-xs text-gray-500">{person.role}</p>
                </div>
                <button
                  onClick={() => handleFollow(person.id, person.isFollowing)}
                  className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors flex-shrink-0 ${
                    person.isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {person.isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
                  <option value="latest">Latest</option>
                  <option value="oldest">Oldest</option>
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
            <RightSideBar searchResults={searchResults} />
          </div>
        )}
      </main>
    </div>
  );
}
