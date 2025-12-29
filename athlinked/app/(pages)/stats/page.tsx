'use client';

import { useState, useEffect } from 'react';
import NavigationBar from '@/components/NavigationBar';
import { Search, ChevronDown, Edit, Plus, X, Calendar, Trash2 } from 'lucide-react';
import { getFieldsForPosition, getPositionOptions } from './sportsFields';

interface UserData {
  full_name: string;
  primary_sport: string | null;
  email: string;
  profile_url?: string | null;
}

interface UserStat {
  field_label: string;
  value: string;
  unit: string | null;
}

interface UserSportProfile {
  id: string;
  sport_name: string;
  position_name: string;
  stats: UserStat[];
}

interface Position {
  id: string;
  name: string;
  sport_name: string;
}

export default function StatsPage() {
  const [activeSport, setActiveSport] = useState('football');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddStatsModal, setShowAddStatsModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [userProfiles, setUserProfiles] = useState<UserSportProfile[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({
    year: '',
    position: '',
  });

  
  // Get initials for placeholder
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  // Construct profile URL - return undefined if no profileUrl exists
  const getProfileUrl = (profileUrl?: string | null): string | undefined => {
    if (!profileUrl || profileUrl.trim() === '') return undefined;
    if (profileUrl.startsWith('http')) return profileUrl;
    if (profileUrl.startsWith('/') && !profileUrl.startsWith('/assets')) {
      return `http://localhost:3001${profileUrl}`;
    }
    return profileUrl;
  };

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
          setUserId(data.user.id);

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

  // Helper function to get sport display name
  const getSportDisplayName = (sportKey: string) => {
    const normalized = sportKey.toLowerCase().trim();
    if (normalized === 'football') return 'Football';
    if (normalized === 'basketball') return 'Basket Ball';
    if (normalized === 'golf') return 'Golf';
    return sportKey.charAt(0).toUpperCase() + sportKey.slice(1);
  };

  // Fetch positions for the active sport
  useEffect(() => {
    const fetchPositions = async () => {
      setLoadingPositions(true);
      try {
        // Get all sports first
        const sportsResponse = await fetch('http://localhost:3001/api/sports');
        const sportsData = await sportsResponse.json();
        
        if (!sportsData.success) {
          console.error('Failed to fetch sports');
          setAvailablePositions([]);
          setLoadingPositions(false);
          return;
        }

        // Find the sport ID by name (handle both "Basketball" and "Basket Ball")
        const sportName = getSportDisplayName(activeSport);
        const normalizedSportName = sportName.toLowerCase().replace(/\s+/g, '');
        const sport = sportsData.sports.find((s: any) => {
          const normalizedSName = s.name.toLowerCase().replace(/\s+/g, '');
          return normalizedSName === normalizedSportName;
        });

        if (!sport) {
          setAvailablePositions([]);
          setLoadingPositions(false);
          return;
        }

        // Get positions for this sport
        const positionsResponse = await fetch(
          `http://localhost:3001/api/sports/${sport.id}/positions`
        );
        const positionsData = await positionsResponse.json();
        
        if (positionsData.success && positionsData.positions) {
          setAvailablePositions(positionsData.positions);
          // Reset selected position when sport changes
          setSelectedPosition('');
          console.log(`Loaded ${positionsData.positions.length} positions for ${sportName}:`, positionsData.positions.map((p: any) => p.name));
        } else {
          console.error('Failed to fetch positions:', positionsData.message || 'Unknown error');
          setAvailablePositions([]);
        }
      } catch (error) {
        console.error('Error fetching positions:', error);
        setAvailablePositions([]);
      } finally {
        setLoadingPositions(false);
      }
    };

    fetchPositions();
  }, [activeSport]);

  // Fetch user sport profiles and stats
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!userId) return;

      setLoadingStats(true);
      try {
        const response = await fetch(
          `http://localhost:3001/api/user/sport-profiles?user_id=${userId}`
        );
        const data = await response.json();
        
        if (data.success) {
          setUserProfiles(data.profiles);
        } else {
          console.error('Failed to fetch user profiles:', data.message);
          setUserProfiles([]);
        }
      } catch (error) {
        console.error('Error fetching user stats:', error);
        setUserProfiles([]);
      } finally {
        setLoadingStats(false);
      }
    };

    if (userId) {
      fetchUserStats();
    }
  }, [userId]);

  // Get display name (first name or full name)
  const displayName = userData?.full_name?.split(' ')[0] || 'User';

  // Get primary sport for display (capitalize first letter)
  const primarySport = userData?.primary_sport
    ? userData.primary_sport.charAt(0).toUpperCase() +
      userData.primary_sport.slice(1).toLowerCase()
    : 'Football';

  // Sport options - primary sport first, then other common sports
  const allSports = ['Football', 'Basketball', 'Golf'];
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

  // Get current sport's profiles, filtered by selected position if any
  const getCurrentSportProfiles = () => {
    const sportName = getSportDisplayName(activeSport);
    const normalizedSportName = sportName.toLowerCase().replace(/\s+/g, '');
    let profiles = userProfiles.filter(profile => {
      const normalizedProfileSport = profile.sport_name.toLowerCase().replace(/\s+/g, '');
      return normalizedProfileSport === normalizedSportName;
    });
    
    // Filter by selected position if one is selected
    if (selectedPosition) {
      profiles = profiles.filter(profile => 
        profile.position_name === selectedPosition
      );
    }
    
    return profiles;
  };

  const currentProfiles = getCurrentSportProfiles();

  // Get unique field labels from all profiles for the current sport
  const getAllFieldLabels = () => {
    const fieldLabels = new Set<string>();
    currentProfiles.forEach(profile => {
      profile.stats.forEach(stat => {
        if (stat.field_label !== 'Year') {
          fieldLabels.add(stat.field_label);
        }
      });
    });
    return Array.from(fieldLabels).sort();
  };

  const allFieldLabels = getAllFieldLabels();

  // Get year value from stats (if Year field exists)
  const getYearForProfile = (profile: UserSportProfile): string => {
    const yearStat = profile.stats.find(s => s.field_label === 'Year');
    return yearStat?.value || '';
  };

  // Get value for a field in a profile
  const getValueForField = (profile: UserSportProfile, fieldLabel: string): string => {
    const stat = profile.stats.find(s => s.field_label === fieldLabel);
    if (!stat) return '';
    return stat.value + (stat.unit ? ` ${stat.unit}` : '');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-200 items-center justify-center">
        <div className="text-black">Loading...</div>
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
        <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center">
          {getProfileUrl(userData?.profile_url) ? (
            <img
              src={getProfileUrl(userData?.profile_url) || ''}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-black font-semibold text-xs">
              {getInitials(userData?.full_name)}
            </span>
          )}
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
                <div className="w-24 h-24 rounded-full bg-white overflow-hidden border-2 border-white shadow-md flex items-center justify-center">
                  {getProfileUrl(userData?.profile_url) ? (
                    <img
                      src={getProfileUrl(userData?.profile_url) || ''}
                      alt={displayName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-black font-semibold text-lg">
                      {getInitials(userData?.full_name || 'User')}
                    </span>
                  )}
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
                        : 'bg-white text-black hover:bg-gray-100 border border-gray-200'
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
                <h2 className="text-xl font-bold text-black mb-4">
                  {getSportDisplayName(activeSport)} Stats
                </h2>

                {/* Action Bar */}
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <Search
                      className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black"
                      size={20}
                    />
                    <input
                      type="text"
                      placeholder="Search"
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-black"
                    />
                  </div>
                  <div className="relative">
                    <select 
                      value={selectedPosition}
                      onChange={(e) => setSelectedPosition(e.target.value)}
                      className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-yellow-500 min-w-[180px] text-black"
                    >
                      <option value="" className="text-black">All Positions</option>
                      {loadingPositions ? (
                        <option disabled className="text-black">Loading positions...</option>
                      ) : availablePositions.length === 0 ? (
                        <option disabled className="text-black">No positions available</option>
                      ) : (
                        availablePositions.map((position) => (
                          <option key={position.id} value={position.name} className="text-black">
                            {position.name}
                          </option>
                        ))
                      )}
                    </select>
                    <ChevronDown
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-black pointer-events-none"
                      size={20}
                    />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                    <Edit size={18} />
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={() => setShowAddStatsModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-[#CB9729] text-white rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    <Plus size={18} />
                    <span>Add Data</span>
                  </button>
                </div>
              </div>

              {/* Statistics Table */}
              <div className="overflow-x-auto">
                {loadingStats ? (
                  <div className="p-6 text-center text-black">Loading stats...</div>
                ) : currentProfiles.length === 0 ? (
                  <div className="p-6 text-center text-black">
                    No stats data available. Click "Add Data" to add your first stats entry.
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">
                          Year
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider">
                          Position
                        </th>
                        {allFieldLabels.map((fieldLabel) => (
                          <th
                            key={fieldLabel}
                            className="px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider"
                          >
                            {fieldLabel}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentProfiles.map((profile) => (
                        <tr
                          key={profile.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                            {getYearForProfile(profile) || '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                            {profile.position_name}
                          </td>
                          {allFieldLabels.map((fieldLabel) => (
                            <td
                              key={fieldLabel}
                              className="px-6 py-4 whitespace-nowrap text-sm text-black"
                            >
                              {getValueForField(profile, fieldLabel) || '—'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Add Stats Modal */}
      {showAddStatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddStatsModal(false)}
          />

          {/* Modal - Slides in from right */}
          <div className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-black">Add Stats</h2>
                <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setFormData({
                      year: '',
                      position: '',
                    });
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                  <span>Clear all</span>
                </button>
                <button
                  onClick={() => setShowAddStatsModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X size={20} className="text-black" />
                </button>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-6">
              {/* Sport Name */}
              <div className="mb-2">
                <h3 className="text-lg font-bold text-black">
                  {getSportDisplayName(activeSport)}
                </h3>
              </div>

              {/* Year Field */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Year
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="Select Year (e.g., 2024)"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-black"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black" size={20} />
                </div>
              </div>

              {/* Position Field */}
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Position
                </label>
                <div className="relative">
                  <select
                    value={formData.position || ''}
                    onChange={(e) => {
                      const newPosition = e.target.value;
                      // Reset form data except year and position when position changes
                      const newFormData: Record<string, string> = {
                        year: formData.year || '',
                        position: newPosition,
                      };
                      setFormData(newFormData);
                    }}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-black appearance-none bg-white"
                  >
                    <option value="" className="text-black">
                      Select Position {activeSport === 'basketball' ? '(e.g., Point Guard)' : activeSport === 'golf' ? '(e.g., General)' : '(e.g., Quarterback)'}
                    </option>
                    {getPositionOptions(activeSport).map((pos) => (
                      <option key={pos} value={pos} className="text-black">
                        {pos}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black pointer-events-none" size={20} />
                </div>
              </div>

              {/* Dynamic Fields based on Position */}
              {formData.position && getFieldsForPosition(activeSport, formData.position)
                .filter(field => field !== 'Year') // Year is already shown above
                .map((field, index) => {
                  // Create a unique key for each field
                  const fieldKey = `field_${index}_${field.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}`;
                  const displayKey = field.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                  return (
                    <div key={fieldKey}>
                      <label className="block text-sm font-medium text-black mb-2">
                        {field}
                      </label>
                      <input
                        type="text"
                        value={formData[displayKey] || ''}
                        onChange={(e) => setFormData({ ...formData, [displayKey]: e.target.value })}
                        placeholder={`Enter ${field}${field.includes('%') ? '' : ' (e.g., 0)'}`}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-black"
                      />
                    </div>
                  );
                })}
            </div>

            {/* Save Button */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
              <button
                onClick={async () => {
                  if (!userId) {
                    alert('User not authenticated. Please log in.');
                    return;
                  }

                  if (!formData.position) {
                    alert('Please select a position');
                    return;
                  }

                  if (!formData.year) {
                    alert('Please enter a year');
                    return;
                  }

                  setSaving(true);
                  try {
                    // Step 1: Get all sports to find sport ID
                    const sportsResponse = await fetch('http://localhost:3001/api/sports');
                    const sportsData = await sportsResponse.json();
                    
                    if (!sportsData.success) {
                      throw new Error('Failed to fetch sports');
                    }

                    // Find the sport ID by name
                    const sportName = activeSport === 'basketball' ? 'Basketball' : 
                                    activeSport === 'football' ? 'Football' : 
                                    activeSport === 'golf' ? 'Golf' :
                                    activeSport.charAt(0).toUpperCase() + activeSport.slice(1);
                    const sport = sportsData.sports.find((s: any) => 
                      s.name.toLowerCase() === sportName.toLowerCase()
                    );

                    if (!sport) {
                      throw new Error(`Sport "${sportName}" not found`);
                    }

                    // Step 2: Get positions for the sport
                    const positionsResponse = await fetch(
                      `http://localhost:3001/api/sports/${sport.id}/positions`
                    );
                    const positionsData = await positionsResponse.json();
                    
                    if (!positionsData.success) {
                      throw new Error('Failed to fetch positions');
                    }

                    // Find the position ID by name
                    const position = positionsData.positions.find((p: any) => 
                      p.name === formData.position
                    );

                    if (!position) {
                      throw new Error(`Position "${formData.position}" not found`);
                    }

                    // Step 3: Get fields for the position
                    const fieldsResponse = await fetch(
                      `http://localhost:3001/api/positions/${position.id}/fields`
                    );
                    const fieldsData = await fieldsResponse.json();
                    
                    if (!fieldsData.success) {
                      throw new Error('Failed to fetch fields');
                    }

                    // Step 4: Create or update user sport profile
                    const profileResponse = await fetch(
                      'http://localhost:3001/api/user/sport-profile',
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          user_id: userId,
                          sportId: sport.id,
                          positionId: position.id,
                        }),
                      }
                    );
                    const profileData = await profileResponse.json();
                    
                    if (!profileData.success) {
                      throw new Error(profileData.message || 'Failed to create profile');
                    }

                    // Step 5: Map form data to field IDs and prepare stats
                    const stats = [];
                    for (const field of fieldsData.fields) {
                      // Try to find the value in formData using field_key first, then field_label
                      let value = formData[field.field_key];
                      
                      // If not found by field_key, try by converting field_label to key format
                      if (value === undefined || value === null || value === '') {
                        const fieldKeyFromLabel = field.field_label.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
                        value = formData[fieldKeyFromLabel];
                      }
                      
                      // Also check direct field_label match
                      if ((value === undefined || value === null || value === '') && formData[field.field_label]) {
                        value = formData[field.field_label];
                      }
                      
                      // Include the value if it exists (even if empty, but not undefined/null)
                      if (value !== undefined && value !== null && value !== '') {
                        stats.push({
                          fieldId: field.field_id,
                          value: String(value),
                        });
                      }
                    }

                    // Step 6: Save position stats
                    if (stats.length > 0) {
                      const statsResponse = await fetch(
                        'http://localhost:3001/api/user/position-stats',
                        {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          body: JSON.stringify({
                            user_id: userId,
                            userSportProfileId: profileData.user_sport_profile_id,
                            stats: stats,
                          }),
                        }
                      );
                      const statsData = await statsResponse.json();
                      
                      if (!statsData.success) {
                        throw new Error(statsData.message || 'Failed to save stats');
                      }
                    }

                    alert('Stats saved successfully!');
                    setShowAddStatsModal(false);
                    // Reset form after save
                    setFormData({
                      year: '',
                      position: '',
                    });
                    // Refresh stats data
                    const refreshResponse = await fetch(
                      `http://localhost:3001/api/user/sport-profiles?user_id=${userId}`
                    );
                    const refreshData = await refreshResponse.json();
                    if (refreshData.success) {
                      setUserProfiles(refreshData.profiles);
                    }
                  } catch (error: any) {
                    console.error('Error saving stats:', error);
                    alert(`Failed to save stats: ${error.message || 'Unknown error'}`);
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className="w-full px-6 py-3 bg-[#CB9729] text-white font-semibold rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
