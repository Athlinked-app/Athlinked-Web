'use client';

import { useState, useEffect } from 'react';
import NavigationBar from '@/components/NavigationBar';
import { Search, ChevronDown, Edit, Plus } from 'lucide-react';

interface UserData {
  full_name: string;
  primary_sport: string | null;
  email: string;
}

export default function StatsPage() {
  const [activeSport, setActiveSport] = useState('football');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Get user identifier from localStorage (set after signup)
        const userIdentifier = localStorage.getItem('userEmail');

        if (!userIdentifier) {
          console.error('No user identifier found');
          setLoading(false);
          return;
        }

        // Fetch user data from backend
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

        const data = await response.json();

        if (data.success && data.user) {
          setUserData(data.user);

          // Set active sport to user's primary sport if available
          if (data.user.primary_sport) {
            setActiveSport(data.user.primary_sport.toLowerCase());
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Get display name (first name or full name)
  const displayName = userData?.full_name?.split(' ')[0] || 'User';

  // Get primary sport for display (capitalize first letter)
  const primarySport = userData?.primary_sport
    ? userData.primary_sport.charAt(0).toUpperCase() +
      userData.primary_sport.slice(1).toLowerCase()
    : 'Football';

  // Sport options - primary sport first, then other common sports
  const allSports = ['Football', 'Basketball'];
  const primarySportValue = userData?.primary_sport;
  const sports = primarySportValue
    ? [
        primarySportValue.charAt(0).toUpperCase() +
          primarySportValue.slice(1).toLowerCase(),
        ...allSports.filter(
          s => s.toLowerCase() !== primarySportValue.toLowerCase()
        ),
      ]
    : allSports;

  // Mock data structure - fields are ready for data
  const statsData = [
    {
      year: '2022',
      passingYards: '',
      passingTDs: '',
      completionPercentage: '',
      interceptions: '',
      qbRating: '',
      rushingYards: '',
      rushingTDs: '',
    },
    {
      year: '2023',
      passingYards: '',
      passingTDs: '',
      completionPercentage: '',
      interceptions: '',
      qbRating: '',
      rushingYards: '',
      rushingTDs: '',
    },
    {
      year: '2024',
      passingYards: '',
      passingTDs: '',
      completionPercentage: '',
      interceptions: '',
      qbRating: '',
      rushingYards: '',
      rushingTDs: '',
    },
  ];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-200 items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-200">
      {/* Header - Full Width */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center w-full">
        <div className="flex items-center">
          <img src="/Frame 171.png" alt="ATHLINKED" className="h-8 w-auto" />
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
          <img
            src="https://via.placeholder.com/40"
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
      </header>

      {/* Content Area with Navigation and Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <NavigationBar
          activeItem="stats"
          userName={userData?.full_name || ''}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col bg-white overflow-auto">
          {/* Main Content */}
          <main className="flex-1 p-6 bg-white">
            {/* Athlete Profile Card */}
            <div className="bg-[#CB9729] rounded-lg p-6 mb-6 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full bg-white overflow-hidden border-2 border-white shadow-md">
                  <img
                    src="https://via.placeholder.com/96"
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">
                    {displayName}
                  </h1>
                  <p className="text-white text-base">{primarySport} • #45</p>
                </div>
              </div>
              <div className="text-white space-y-1.5 text-right">
                <div className="text-sm">Height: 6'2.75"</div>
                <div className="text-sm">Weight: 221.3 pounds</div>
                <div className="text-sm">Hand: 9.6"</div>
                <div className="text-sm">Arm: 31.9"</div>
              </div>
            </div>

            {/* Sport Tabs */}
            <div className="flex gap-2 mb-6">
              {sports.map(sport => {
                const sportKey = sport.toLowerCase();
                return (
                  <button
                    key={sportKey}
                    onClick={() => setActiveSport(sportKey)}
                    className={`px-6 py-2.5 rounded-lg font-medium transition-colors ${
                      activeSport === sportKey
                        ? 'bg-[#CB9729] text-white shadow-sm'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {sport === 'Basketball' ? 'Basket Ball' : sport}
                  </button>
                );
              })}
            </div>

            {/* Football Stats Section */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900 mb-4">
                  {primarySport} Stats
                </h2>

                {/* Action Bar */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Search"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                  </div>
                  <div className="relative">
                    <select className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-yellow-500">
                      <option>Quarterback</option>
                    </select>
                    <ChevronDown
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                      size={20}
                    />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Edit size={18} />
                    <span>Edit</span>
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-[#CB9729] text-white rounded-lg hover:bg-yellow-600 transition-colors">
                    <Plus size={18} />
                    <span>Add Data</span>
                  </button>
                </div>
              </div>

              {/* Statistics Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Years
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Passing Yards
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Passing Touchdowns (TDs)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Completion Percentage
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Interceptions Thrown
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        QB Rating (HS Formula)
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Rushing Yards
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Rushing Touchdowns
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {statsData.map((row, index) => (
                      <tr
                        key={index}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {row.year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            placeholder="—"
                            className="w-full text-sm text-gray-500 border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:bg-white px-2 py-1 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            placeholder="—"
                            className="w-full text-sm text-gray-500 border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:bg-white px-2 py-1 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            placeholder="—"
                            className="w-full text-sm text-gray-500 border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:bg-white px-2 py-1 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            placeholder="—"
                            className="w-full text-sm text-gray-500 border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:bg-white px-2 py-1 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            placeholder="—"
                            className="w-full text-sm text-gray-500 border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:bg-white px-2 py-1 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            placeholder="—"
                            className="w-full text-sm text-gray-500 border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:bg-white px-2 py-1 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="text"
                            placeholder="—"
                            className="w-full text-sm text-gray-500 border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-yellow-500 focus:bg-white px-2 py-1 rounded"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
