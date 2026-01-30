'use client';

import { useState, useEffect } from 'react';
import { getResourceUrl } from '@/utils/config';
import Header from '@/components/Header';
import NavigationBar from '@/components/NavigationBar';
import { apiGet, apiPost } from '@/utils/api';
import {
  Search,
  ChevronDown,
  Edit,
  Plus,
  X,
  Calendar,
  Trash2,
} from 'lucide-react';
import { getFieldsForPosition, getPositionOptions } from './sportsFields';

interface UserData {
  full_name: string;
  primary_sport: string | null;
  sports_played?: string | null;
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
  user_sport_profile_id?: string; // Original profile ID (without year suffix)
  sport_name: string;
  position_name: string;
  full_name?: string | null;
  stats: UserStat[];
}

interface Position {
  id: string;
  name: string;
  sport_name: string;
}

interface AthleticPerformance {
  id?: string;
  height?: string;
  weight?: string;
  hand?: string;
  arm?: string;
  jerseyNumber?: string;
  sport?: string;
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
  const [availableFields, setAvailableFields] = useState<any[]>([]);
  const [loadingFields, setLoadingFields] = useState(false);
  const [userSports, setUserSports] = useState<string[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({
    year: '',
    position: '',
  });
  const [editingProfile, setEditingProfile] = useState<UserSportProfile | null>(
    null
  );
  const [editingYear, setEditingYear] = useState<string>('');
  const [athleticPerformance, setAthleticPerformance] =
    useState<AthleticPerformance | null>(null);
  const [allAthleticPerformance, setAllAthleticPerformance] = useState<
    AthleticPerformance[]
  >([]); // Cache all performance data

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

  const [showYearPicker, setShowYearPicker] = useState(false);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  // Construct profile URL - return undefined if no profileUrl exists
  const getProfileUrl = (profileUrl?: string | null): string | undefined => {
    if (!profileUrl || profileUrl.trim() === '') return undefined;
    if (profileUrl.startsWith('http')) return profileUrl;
    if (!profileUrl.startsWith('/assets')) {
      return getResourceUrl(profileUrl) || profileUrl;
    }
    return profileUrl;
  };

  // Fetch user data on mount - OPTIMIZED: Single API call combines user data, athletic performance, and sports
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

        // First, get user ID from user identifier
        let userId: string | null = null;
        let initialData;
        if (userIdentifier.startsWith('username:')) {
          const username = userIdentifier.replace('username:', '');
          initialData = await apiGet<{
            success: boolean;
            user?: any;
          }>(`/signup/user-by-username/${encodeURIComponent(username)}`);
        } else {
          initialData = await apiGet<{
            success: boolean;
            user?: any;
          }>(`/signup/user/${encodeURIComponent(userIdentifier)}`);
        }

        if (!initialData.success || !initialData.user) {
          setLoading(false);
          return;
        }

        userId = initialData.user.id;
        setUserId(userId);

        // OPTIMIZED: Fetch combined data in ONE API call
        // This replaces 2-3 separate API calls (user data, athletic performance, sports)
        const combinedData = await apiGet<{
          success: boolean;
          user?: any;
          athleticPerformance?: AthleticPerformance | null;
          sports?: { id: string; name: string }[];
        }>(`/profile/${userId}/stats-summary`);

        if (combinedData.success) {
          // Set user data
          if (combinedData.user) {
            setUserData({
              full_name: combinedData.user.full_name,
              primary_sport: combinedData.user.primary_sport,
              sports_played: combinedData.user.sports_played,
              email: initialData.user.email,
              profile_url: combinedData.user.profile_url,
            });
          }

          // Set athletic performance (if available)
          // Note: For full optimization, we'd fetch ALL athletic performance here
          // For now, we set the initial one and will fetch all on sport change if needed
          if (combinedData.athleticPerformance) {
            const perf = {
              id: combinedData.athleticPerformance.id,
              height: combinedData.athleticPerformance.height,
              weight: combinedData.athleticPerformance.weight,
              hand: combinedData.athleticPerformance.hand,
              arm: combinedData.athleticPerformance.arm,
              jerseyNumber: combinedData.athleticPerformance.jerseyNumber,
              sport: combinedData.athleticPerformance.sport,
            };
            setAthleticPerformance(perf);
            // Cache as array for client-side filtering
            setAllAthleticPerformance([perf]);
          }

          // Set sports list with IDs (for sport buttons)
          let sportsList: string[] = [];
          if (combinedData.sports && combinedData.sports.length > 0) {
            // Use sports from API response (already matched with IDs)
            sportsList = combinedData.sports.map(s => s.name);
          } else if (combinedData.user?.sports_played) {
            // Fallback: parse sports_played string
            let sportsString = combinedData.user.sports_played;
            if (sportsString.startsWith('{') && sportsString.endsWith('}')) {
              sportsString = sportsString.slice(1, -1);
            }
            sportsString = sportsString.replace(/["']/g, '');
            sportsList = sportsString
              .split(',')
              .map((s: string) => s.trim())
              .filter(Boolean);
          }

          // Fallback: if still no sports, try fetching all sports
          if (sportsList.length === 0) {
            try {
              const sportsData = await apiGet<{
                success: boolean;
                sports?: { name: string; id: string }[];
              }>('/sports');
              if (sportsData.success && sportsData.sports) {
                sportsList = sportsData.sports.map(s => s.name);
              }
            } catch (error) {
              console.error('Error fetching sports:', error);
              sportsList = ['Football', 'Basketball', 'Golf'];
            }
          }

          setUserSports(sportsList);

          // Set active sport to user's primary sport if available, otherwise first sport
          if (combinedData.user?.primary_sport) {
            const primarySportLower =
              combinedData.user.primary_sport.toLowerCase();
            const primaryInList = sportsList.some(
              s => s.toLowerCase() === primarySportLower
            );
            if (primaryInList) {
              setActiveSport(primarySportLower);
            } else if (sportsList.length > 0) {
              setActiveSport(sportsList[0].toLowerCase());
            }
          } else if (sportsList.length > 0) {
            setActiveSport(sportsList[0].toLowerCase());
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
    // Special cases for display formatting
    if (normalized === 'basketball') return 'Basketball';
    if (normalized === 'track & field' || normalized === 'track and field')
      return 'Track & Field';
    // Default: capitalize first letter of each word
    return sportKey
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Fetch positions for the active sport
  useEffect(() => {
    const fetchPositions = async () => {
      setLoadingPositions(true);
      try {
        // Get all sports first
        const sportsData = await apiGet<{
          success: boolean;
          sports?: any[];
        }>('/sports');

        if (!sportsData.success || !sportsData.sports) {
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
        const positionsData = await apiGet<{
          success: boolean;
          positions?: any[];
          message?: string;
        }>(`/sports/${sport.id}/positions`);

        if (positionsData.success && positionsData.positions) {
          setAvailablePositions(positionsData.positions);
          // Reset selected position when sport changes
          setSelectedPosition('');
          console.log(
            `Loaded ${positionsData.positions.length} positions for ${sportName}:`,
            positionsData.positions.map((p: any) => p.name)
          );
        } else {
          console.error(
            'Failed to fetch positions:',
            positionsData.message || 'Unknown error'
          );
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

  // Fetch fields for selected position
  useEffect(() => {
    const fetchFields = async () => {
      if (!formData.position) {
        setAvailableFields([]);
        return;
      }

      // Find the position ID from availablePositions
      const selectedPosition = availablePositions.find(
        p => p.name === formData.position
      );

      if (!selectedPosition) {
        setAvailableFields([]);
        return;
      }

      setLoadingFields(true);
      try {
        const fieldsData = await apiGet<{
          success: boolean;
          fields?: any[];
          message?: string;
        }>(`/positions/${selectedPosition.id}/fields`);

        if (
          fieldsData.success &&
          fieldsData.fields &&
          fieldsData.fields.length > 0
        ) {
          setAvailableFields(fieldsData.fields);
        } else {
          // Fallback to hardcoded fields if API returns no fields
          const fallbackFields = getFieldsForPosition(
            activeSport,
            formData.position
          );
          if (fallbackFields.length > 0) {
            // Convert hardcoded field names to field objects that match API format
            const fieldObjects = fallbackFields.map((fieldLabel, index) => ({
              field_id: `fallback-${index}`,
              field_key: fieldLabel.toLowerCase().replace(/\s+/g, '_'),
              field_label: fieldLabel,
              field_type: 'text',
              unit: null,
              is_required: false,
            }));
            setAvailableFields(fieldObjects);
          } else {
            console.warn(
              `No fields found for position "${formData.position}" in sport "${activeSport}"`
            );
            setAvailableFields([]);
          }
        }
      } catch (error) {
        console.error('Error fetching fields:', error);
        // Fallback to hardcoded fields on error
        const fallbackFields = getFieldsForPosition(
          activeSport,
          formData.position
        );
        if (fallbackFields.length > 0) {
          const fieldObjects = fallbackFields.map((fieldLabel, index) => ({
            field_id: `fallback-${index}`,
            field_key: fieldLabel.toLowerCase().replace(/\s+/g, '_'),
            field_label: fieldLabel,
            field_type: 'text',
            unit: null,
            is_required: false,
          }));
          setAvailableFields(fieldObjects);
        } else {
          setAvailableFields([]);
        }
      } finally {
        setLoadingFields(false);
      }
    };

    fetchFields();
  }, [formData.position, availablePositions, activeSport]);

  // OPTIMIZED: Filter athletic performance client-side when sport changes
  // Fetch ALL athletic performance once, then filter in memory (no API call on sport change)
  useEffect(() => {
    const fetchAllAthleticPerformance = async () => {
      if (!userId) return;

      try {
        // Fetch all athletic performance data once
        const data = await apiGet<{
          success: boolean;
          data?: AthleticPerformance[];
        }>(`/profile/${userId}/athletic-performance`);

        if (data.success && data.data && data.data.length > 0) {
          setAllAthleticPerformance(data.data);
        }
      } catch (error) {
        console.error('Error fetching athletic performance:', error);
      }
    };

    // Fetch all performance data once when userId is available
    if (userId && allAthleticPerformance.length === 0) {
      fetchAllAthleticPerformance();
    }
  }, [userId]); // Only when userId changes, not on sport change

  // Filter athletic performance client-side when sport changes (NO API CALL)
  useEffect(() => {
    if (!allAthleticPerformance.length) {
      return;
    }

    // Filter from cached data by active sport
    const sportMatch = allAthleticPerformance.find(
      perf =>
        perf.sport && perf.sport.toLowerCase() === activeSport.toLowerCase()
    );

    if (sportMatch) {
      setAthleticPerformance(sportMatch);
    } else if (allAthleticPerformance.length > 0) {
      // Use most recent if no match
      setAthleticPerformance(allAthleticPerformance[0]);
    } else {
      setAthleticPerformance(null);
    }
  }, [activeSport, allAthleticPerformance]); // Filter client-side, no API call!

  // Fetch user sport profiles and stats
  useEffect(() => {
    const fetchUserStats = async () => {
      if (!userId) return;

      setLoadingStats(true);
      try {
        const data = await apiGet<{
          success: boolean;
          profiles?: any[];
          message?: string;
        }>(`/user/${userId}/sport-profiles`);

        if (data.success && data.profiles) {
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
    : userSports.length > 0
      ? userSports[0]
      : 'Football';

  // Sport options - use user's sports_played, with primary sport first
  const primarySportValue = userData?.primary_sport;
  let sports: string[] = [];

  if (userSports.length > 0) {
    // If user has a primary sport and it's in their sports list, put it first
    if (primarySportValue) {
      const primarySportLower = primarySportValue.toLowerCase();
      const primaryInList = userSports.find(
        s => s.toLowerCase() === primarySportLower
      );
      if (primaryInList) {
        // Put primary sport first, then other sports
        sports = [
          primaryInList,
          ...userSports.filter(s => s.toLowerCase() !== primarySportLower),
        ];
      } else {
        // Primary sport not in list, use sports as-is
        sports = [...userSports];
      }
    } else {
      // No primary sport, use sports as-is
      sports = [...userSports];
    }
  } else {
    // Fallback if no sports data
    sports = ['Football', 'Basketball', 'Golf'];
  }

  // Get current sport's profiles, filtered by selected position if any
  const getCurrentSportProfiles = () => {
    const sportName = getSportDisplayName(activeSport);
    const normalizedSportName = sportName.toLowerCase().replace(/\s+/g, '');
    let profiles = userProfiles.filter(profile => {
      const normalizedProfileSport = profile.sport_name
        .toLowerCase()
        .replace(/\s+/g, '');
      return normalizedProfileSport === normalizedSportName;
    });

    // Filter by selected position if one is selected
    if (selectedPosition) {
      profiles = profiles.filter(
        profile => profile.position_name === selectedPosition
      );
    }

    // Filter out profiles with no stats or only Year field
    return profiles.filter(profile => {
      const statsWithoutYear = profile.stats.filter(
        s => s.field_label !== 'Year'
      );
      return statsWithoutYear.length > 0;
    });
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

    // Add Jersey Number if it exists in athletic performance data
    if (athleticPerformance?.jerseyNumber) {
      fieldLabels.add('Jersey Number');
    }

    return Array.from(fieldLabels).sort();
  };

  const allFieldLabels = getAllFieldLabels();

  // Get year value from stats (if Year field exists)
  const getYearForProfile = (profile: UserSportProfile): string => {
    const yearStat = profile.stats.find(s => s.field_label === 'Year');
    return yearStat?.value || '';
  };

  // Get value for a field in a profile
  const getValueForField = (
    profile: UserSportProfile,
    fieldLabel: string
  ): string => {
    // Check if it's Jersey Number from athletic performance
    if (fieldLabel === 'Jersey Number' && athleticPerformance?.jerseyNumber) {
      return athleticPerformance.jerseyNumber;
    }

    const stat = profile.stats.find(s => s.field_label === fieldLabel);
    if (!stat) return '';
    return stat.value + (stat.unit ? ` ${stat.unit}` : '');
  };

  const _getRawValueForField = (
    profile: UserSportProfile,
    fieldLabel: string
  ): string => {
    const stat = profile.stats.find(s => s.field_label === fieldLabel);
    if (!stat) return '';
    return stat.value;
  };

  const handleEditProfile = async (profile: UserSportProfile, year: string) => {
    setEditingProfile(profile);
    setEditingYear(year);

    // Set the active sport to match the profile's sport
    const sportKey = profile.sport_name.toLowerCase().replace(/\s+/g, '');
    setActiveSport(sportKey);

    // Wait for positions to load, then set position and load fields
    try {
      // Get all sports first
      const sportsData = await apiGet<{
        success: boolean;
        sports?: any[];
      }>('/sports');

      if (sportsData.success && sportsData.sports) {
        const sportName = profile.sport_name;
        const normalizedSportName = sportName.toLowerCase().replace(/\s+/g, '');
        const sport = sportsData.sports.find((s: any) => {
          const normalizedSName = s.name.toLowerCase().replace(/\s+/g, '');
          return normalizedSName === normalizedSportName;
        });

        if (sport) {
          // Get positions for this sport
          const positionsData = await apiGet<{
            success: boolean;
            positions?: any[];
          }>(`/sports/${sport.id}/positions`);

          if (positionsData.success && positionsData.positions) {
            setAvailablePositions(positionsData.positions);
            setSelectedPosition(profile.position_name);

            // Find the position and load fields
            const position = positionsData.positions.find(
              (p: any) => p.name === profile.position_name
            );

            let loadedFields: any[] = [];
            if (position) {
              const fieldsData = await apiGet<{
                success: boolean;
                fields?: any[];
              }>(`/positions/${position.id}/fields`);

              if (
                fieldsData.success &&
                fieldsData.fields &&
                fieldsData.fields.length > 0
              ) {
                loadedFields = fieldsData.fields;
              } else {
                // Fallback to hardcoded fields
                const fallbackFields = getFieldsForPosition(
                  sportKey,
                  profile.position_name
                );
                if (fallbackFields.length > 0) {
                  loadedFields = fallbackFields.map((fieldLabel, index) => ({
                    field_id: `fallback-${index}`,
                    field_key: fieldLabel.toLowerCase().replace(/\s+/g, '_'),
                    field_label: fieldLabel,
                    field_type: 'text',
                    unit: null,
                    is_required: false,
                  }));
                }
              }
            }

            setAvailableFields(loadedFields);

            // Pre-populate form data with existing values AFTER fields are loaded
            const prefillData: Record<string, string> = {
              year: year || '',
              position: profile.position_name || '',
            };

            // Add all stat values to form data
            profile.stats.forEach(stat => {
              if (stat.field_label !== 'Year') {
                // Try to find the field key from loaded fields
                const field = loadedFields.find(
                  (f: any) => f.field_label === stat.field_label
                );
                if (field) {
                  const key =
                    field.field_key ||
                    field.field_label.toLowerCase().replace(/\s+/g, '_');
                  // Remove unit from value if present
                  const unitPattern = stat.unit
                    ? new RegExp(
                        `\\s*${stat.unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`
                      )
                    : null;
                  const rawValue = unitPattern
                    ? stat.value.replace(unitPattern, '').trim()
                    : stat.value.trim();
                  prefillData[key] = rawValue;
                } else {
                  // Fallback: use field_label as key
                  const key = stat.field_label
                    .toLowerCase()
                    .replace(/\s+/g, '_');
                  const unitPattern = stat.unit
                    ? new RegExp(
                        `\\s*${stat.unit.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`
                      )
                    : null;
                  const rawValue = unitPattern
                    ? stat.value.replace(unitPattern, '').trim()
                    : stat.value.trim();
                  prefillData[key] = rawValue;
                }
              }
            });

            setFormData(prefillData);
            setShowAddStatsModal(true);
          }
        }
      }
    } catch (error) {
      console.error('Error loading edit data:', error);
      alert('Error loading edit data. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-200 items-center justify-center">
        <div className="text-black">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-200  md:pb-0">
      {/* Header Component */}
      <Header
        userName={userData?.full_name}
        userProfileUrl={getProfileUrl(userData?.profile_url)}
      />

      {/* Content Area with Navigation and Main Content */}
      <div className="flex flex-1 overflow-hidden md:mt-5 overflow-hidden ">
        {/* Navigation Sidebar */}
        <div className="hidden md:flex px-3 ">
          <NavigationBar
            activeItem="stats"
            userName={userData?.full_name || ''}
          />
        </div>
        {/* Main Content Area */}

        <div className="flex-1 flex flex-col md:pr-3 gap-4 overflow-hidden min-w-0 ">
          <div className="bg-[#CB9729]  md:rounded-lg p-3 md:p-5 flex items-center justify-between shadow-sm">
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
                <h1 className="text-xl md:text-3xl font-bold text-white mb-1">
                  {displayName}
                </h1>
                <p className="text-white text-base">
                  {primarySport}
                  {athleticPerformance?.jerseyNumber &&
                    ` • #${athleticPerformance.jerseyNumber}`}
                </p>
              </div>
            </div>
            <div className="text-white mr-44">
              <div className="grid grid-cols-2  gap-x-20 md:gap-x-32 gap-y-2 text-sm md:text-lg font-semibold">
                {athleticPerformance?.height ? (
                  <div>Height: {athleticPerformance.height}</div>
                ) : (
                  <div className="text-gray-300">Height: —</div>
                )}
                {athleticPerformance?.hand ? (
                  <div>Hand: {athleticPerformance.hand}</div>
                ) : (
                  <div className="text-gray-300">Hand: —</div>
                )}
                {athleticPerformance?.weight ? (
                  <div>Weight: {athleticPerformance.weight}</div>
                ) : (
                  <div className="text-gray-300">Weight: —</div>
                )}
                {athleticPerformance?.arm ? (
                  <div>Arm: {athleticPerformance.arm}</div>
                ) : (
                  <div className="text-gray-300">Arm: —</div>
                )}
              </div>
            </div>
          </div>
          <div className="flex-1 flex flex-col bg-white overflow-auto rounded-lg ">
            <main className="flex-1 p-6 bg-white">
              {/* Sport Tabs */}
              <div className="flex mb-6 border-b border-gray-200">
                {sports.map((sport, index) => {
                  const sportKey = sport.toLowerCase();
                  const displayName = getSportDisplayName(sport);
                  return (
                    <button
                      key={sportKey}
                      onClick={() => setActiveSport(sportKey)}
                      className={`pb-3 px-8 font-medium transition-colors relative ${
                        activeSport === sportKey
                          ? 'text-[#CB9729]'
                          : 'text-gray-600 hover:text-gray-900'
                      } ${index !== 0 ? 'border-l  border-gray-200' : ''}`}
                    >
                      {displayName}
                      {activeSport === sportKey && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Football Stats Section */}

              {/* Action Bar */}
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-lg font-medium  text-black w-37.5 flex-shrink-0">
                  {getSportDisplayName(activeSport)} Stats
                </h2>
                <div className="flex-1 relative hidden md:block">
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
                <div className="relative flex-shrink-0">
                  <select
                    value={selectedPosition}
                    onChange={e => setSelectedPosition(e.target.value)}
                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-yellow-500 w-[180px] text-black"
                  >
                    <option value="" className="text-black">
                      All Positions
                    </option>
                    {loadingPositions ? (
                      <option disabled className="text-black">
                        Loading positions...
                      </option>
                    ) : availablePositions.length === 0 ? (
                      <option disabled className="text-black">
                        No positions available
                      </option>
                    ) : (
                      availablePositions.map(position => (
                        <option
                          key={position.id}
                          value={position.name}
                          className="text-black"
                        >
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

                {/* Desktop Edit/Add in same row */}
                <div className="hidden lg:flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={() => {
                      if (currentProfiles.length > 0) {
                        const firstProfile = currentProfiles[0];
                        const year = getYearForProfile(firstProfile);
                        handleEditProfile(firstProfile, year);
                      } else {
                        alert('No stats data to edit. Please add data first.');
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-black text-sm"
                  >
                    <Edit size={16} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingProfile(null);
                      setEditingYear('');
                      setFormData({ year: '', position: '' });
                      setAvailableFields([]);
                      setShowAddStatsModal(true);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-[#CB9729] text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                  >
                    <Plus size={16} />
                    <span>Add Data</span>
                  </button>
                </div>
              </div>

              <div className="mt-3 mb-4 flex gap-3 lg:hidden">
                <button
                  onClick={() => {
                    // If there are profiles, allow editing the first one (or selected one)
                    if (currentProfiles.length > 0) {
                      const firstProfile = currentProfiles[0];
                      const year = getYearForProfile(firstProfile);
                      handleEditProfile(firstProfile, year);
                    } else {
                      alert('No stats data to edit. Please add data first.');
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors text-black text-sm"
                >
                  <Edit size={18} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => {
                    setEditingProfile(null);
                    setEditingYear('');
                    setFormData({ year: '', position: '' });
                    setAvailableFields([]);
                    setShowAddStatsModal(true);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#CB9729] text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                >
                  <Plus size={18} />
                  <span>Add Data</span>
                </button>
              </div>

              {/* Statistics Table / Cards */}
              <div className="overflow-x-auto mt-2">
                {loadingStats ? (
                  <div className="p-6 text-center text-black">
                    Loading stats...
                  </div>
                ) : currentProfiles.length === 0 ||
                  allFieldLabels.length === 0 ? (
                  <div className="p-6 text-center text-gray-600">
                    No stats data available yet. Use the "Add Data" button above
                    to add your first stats entry.
                  </div>
                ) : (
                  <>
                    {/* Mobile: vertical cards */}
                    <div className="md:hidden space-y-4">
                      {currentProfiles.map(profile => {
                        const year = getYearForProfile(profile);
                        return (
                          <div
                            key={`${profile.id}-${year}-mobile`}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <p className="text-[11px] text-gray-500">
                                  Year
                                </p>
                                <p className="text-sm font-semibold text-black">
                                  {year || '—'}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-[11px] text-gray-500">
                                  Position
                                </p>
                                <p className="text-sm font-semibold text-black">
                                  {profile.position_name}
                                </p>
                              </div>
                            </div>

                            <div className="border-t border-gray-200 pt-3 space-y-2">
                              {allFieldLabels.map(fieldLabel => (
                                <div
                                  key={fieldLabel}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="text-gray-600 mr-4">
                                    {fieldLabel}
                                  </span>
                                  <span className="text-black font-medium text-right">
                                    {getValueForField(profile, fieldLabel) ||
                                      '—'}
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="mt-3 flex justify-end">
                              <button
                                onClick={() => handleEditProfile(profile, year)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-black hover:bg-gray-50 transition-colors"
                              >
                                <Edit size={14} />
                                <span>Edit</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Desktop: table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider whitespace-nowrap">
                              Year
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider whitespace-nowrap">
                              Position
                            </th>
                            {allFieldLabels.map(fieldLabel => (
                              <th
                                key={fieldLabel}
                                className="px-6 py-3 text-left text-xs font-semibold text-black uppercase tracking-wider whitespace-nowrap min-w-[150px]"
                              >
                                {fieldLabel}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {currentProfiles.map(profile => {
                            const year = getYearForProfile(profile);
                            return (
                              <tr
                                key={`${profile.id}-${year}`}
                                className="hover:bg-gray-50 transition-colors"
                              >
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-black">
                                  {year || '—'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                                  <div className="flex items-center gap-2">
                                    <span>{profile.position_name}</span>
                                    <button
                                      onClick={() =>
                                        handleEditProfile(profile, year)
                                      }
                                      className="p-1 rounded hover:bg-gray-200 transition-colors flex-shrink-0"
                                      title="Edit this row"
                                    >
                                      <Edit
                                        size={14}
                                        className="text-gray-600"
                                      />
                                    </button>
                                  </div>
                                </td>
                                {allFieldLabels.map(fieldLabel => (
                                  <td
                                    key={fieldLabel}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-black"
                                  >
                                    {getValueForField(profile, fieldLabel) ||
                                      '—'}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </main>
          </div>
        </div>
      </div>

      {/* Add Stats Modal */}
      {showAddStatsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-end pb-16 md:pb-0">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowAddStatsModal(false);
              setEditingProfile(null);
              setEditingYear('');
            }}
          />
          <div
            className="relative z-10 w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-black">
                  {editingProfile ? 'Edit Stats' : 'Add Stats'}
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setFormData({
                        year: '',
                        position: '',
                      });
                      setAvailableFields([]);
                      setEditingProfile(null);
                      setEditingYear('');
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-black hover:text-black hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                    <span>Clear all</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowAddStatsModal(false);
                      setFormData({
                        year: '',
                        position: '',
                      });
                      setAvailableFields([]);
                      setEditingProfile(null);
                      setEditingYear('');
                    }}
                    className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X size={20} className="text-black" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-6">
              {/* Sport Name */}
              <div className="mb-2">
                <h3 className="text-lg font-bold text-black">
                  {getSportDisplayName(activeSport)}
                </h3>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-2">
                  Year
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.year}
                    onChange={e =>
                      setFormData({ ...formData, year: e.target.value })
                    }
                    placeholder="Select Year (e.g., 2024)"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-black"
                    readOnly
                    onClick={() => setShowYearPicker(!showYearPicker)}
                  />
                  <Calendar
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black cursor-pointer"
                    size={20}
                    onClick={() => setShowYearPicker(!showYearPicker)}
                  />

                  {showYearPicker && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowYearPicker(false)}
                      />
                      <div className="absolute z-20 mt-2 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                        {years.map(year => (
                          <button
                            key={year}
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                year: year.toString(),
                              });
                              setShowYearPicker(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left hover:bg-gray-100 transition-colors ${
                              formData.year === year.toString()
                                ? 'bg-[#CB9729] text-white hover:bg-[#CB9729]'
                                : 'text-black'
                            }`}
                          >
                            {year}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
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
                    onChange={e => {
                      const newPosition = e.target.value;
                      if (editingProfile) {
                        // When editing, just update position without resetting other fields
                        setFormData({ ...formData, position: newPosition });
                      } else {
                        // When adding new, reset form data except year and position when position changes
                        const newFormData: Record<string, string> = {
                          year: formData.year || '',
                          position: newPosition,
                        };
                        setFormData(newFormData);
                      }
                    }}
                    disabled={editingProfile !== null}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-black appearance-none bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="" className="text-black">
                      {loadingPositions
                        ? 'Loading positions...'
                        : 'Select Position'}
                    </option>
                    {loadingPositions ? (
                      <option disabled className="text-black">
                        Loading...
                      </option>
                    ) : availablePositions.length === 0 ? (
                      <option disabled className="text-black">
                        No positions available
                      </option>
                    ) : (
                      availablePositions.map(position => (
                        <option
                          key={position.id}
                          value={position.name}
                          className="text-black"
                        >
                          {position.name}
                        </option>
                      ))
                    )}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-black pointer-events-none"
                    size={20}
                  />
                </div>
              </div>

              {/* Dynamic Fields based on Position */}
              {loadingFields && formData.position && (
                <div className="text-center text-gray-500 text-sm py-4">
                  Loading fields...
                </div>
              )}
              {!loadingFields &&
                formData.position &&
                availableFields
                  .filter((field: any) => field.field_label !== 'Year') // Year is already shown above
                  .map((field: any) => {
                    // Use field_key as the key, fallback to field_id
                    const _fieldKey = field.field_key || field.field_id;
                    // Use field_key for form data, or create from field_label
                    const displayKey =
                      field.field_key ||
                      field.field_label
                        .toLowerCase()
                        .replace(/\s+/g, '_')
                        .replace(/[^a-z0-9_]/g, '');
                    return (
                      <div key={field.field_id}>
                        <label className="block text-sm font-medium text-black mb-2">
                          {field.field_label}
                          {field.is_required && (
                            <span className="text-red-500 ml-1">*</span>
                          )}
                          {field.unit && (
                            <span className="text-gray-500 text-xs ml-1">
                              ({field.unit})
                            </span>
                          )}
                        </label>
                        <input
                          type={
                            field.field_type === 'number' ||
                            field.field_type === 'percentage'
                              ? 'number'
                              : field.field_type === 'time'
                                ? 'text'
                                : field.field_type === 'link'
                                  ? 'url'
                                  : 'text'
                          }
                          value={formData[displayKey] || ''}
                          onChange={e =>
                            setFormData({
                              ...formData,
                              [displayKey]: e.target.value,
                            })
                          }
                          placeholder={`Enter ${field.field_label}${field.unit ? ` (${field.unit})` : ''}`}
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
                    // OPTIMIZED: Single API call using combined endpoint
                    // This replaces 6 separate API calls with 1 call

                    // Get sport display name
                    const sportName = getSportDisplayName(activeSport);

                    // Prepare stats object from formData
                    // Map formData keys to field labels (backend matches by label)
                    const statsObject: Record<string, string> = {};

                    if (availableFields && availableFields.length > 0) {
                      // Use availableFields to map formData keys to field labels
                      for (const field of availableFields) {
                        // Skip Year field (handled separately)
                        if (
                          field.field_label === 'Year' ||
                          field.field_key === 'year'
                        ) {
                          continue;
                        }

                        const fieldLabel = field.field_label;
                        if (!fieldLabel) continue;

                        // Try multiple key formats to find the value in formData
                        const fieldKey = field.field_key;
                        const normalizedLabel = fieldLabel
                          .toLowerCase()
                          .replace(/\s+/g, '_')
                          .replace(/[^a-z0-9_]/g, '');

                        // Check formData for this field's value
                        const value =
                          formData[fieldKey] ||
                          formData[fieldLabel] ||
                          formData[normalizedLabel] ||
                          formData[fieldKey?.toLowerCase()] ||
                          formData[fieldLabel.toLowerCase()];

                        // If value exists and is not empty, add to stats object using field label as key
                        if (value && value.toString().trim() !== '') {
                          statsObject[fieldLabel] = String(value).trim();
                        }
                      }
                    } else {
                      // Fallback: if no availableFields, use formData directly (excluding year/position)
                      for (const [key, value] of Object.entries(formData)) {
                        if (
                          key !== 'year' &&
                          key !== 'position' &&
                          value &&
                          value.toString().trim() !== ''
                        ) {
                          // Use key as-is (backend will try to match)
                          statsObject[key] = String(value).trim();
                        }
                      }
                    }

                    // Call optimized combined endpoint
                    // When editing, pass the existing user_sport_profile_id to ensure we update the correct profile
                    const requestBody: any = {
                      user_id: userId,
                      sportName: sportName,
                      positionName: formData.position,
                      year: formData.year,
                      stats: statsObject,
                    };

                    // If editing, pass the existing profile ID to ensure we update the correct profile
                    // Use user_sport_profile_id if available (original profile ID), otherwise try id
                    if (editingProfile) {
                      // Check if id is a UUID (original profile ID) or composite (profile_id_year)
                      const profileId =
                        editingProfile.user_sport_profile_id ||
                        (editingProfile.id && editingProfile.id.includes('_')
                          ? editingProfile.id.split('_')[0]
                          : editingProfile.id);

                      if (profileId) {
                        requestBody.userSportProfileId = profileId;
                        console.log(
                          '[Stats Edit] Using profile ID:',
                          profileId
                        );
                      }
                    }

                    const result = await apiPost<{
                      success: boolean;
                      message?: string;
                      userSportProfileId?: string;
                      updatedProfiles?: any[];
                    }>('/user/stats', requestBody);

                    if (!result.success) {
                      throw new Error(result.message || 'Failed to save stats');
                    }

                    // Update UI with returned profiles (no need for separate refresh call)
                    if (result.updatedProfiles) {
                      setUserProfiles(result.updatedProfiles);
                    } else {
                      // Fallback: refresh if profiles not returned
                      const refreshData = await apiGet<{
                        success: boolean;
                        profiles?: any[];
                      }>(`/user/${userId}/sport-profiles`);
                      if (refreshData.success && refreshData.profiles) {
                        setUserProfiles(refreshData.profiles);
                      }
                    }

                    alert(
                      editingProfile
                        ? 'Stats updated successfully!'
                        : 'Stats saved successfully!'
                    );
                    setShowAddStatsModal(false);
                    // Reset form after save
                    setFormData({
                      year: '',
                      position: '',
                    });
                    setAvailableFields([]);
                    setEditingProfile(null);
                    setEditingYear('');
                  } catch (error: any) {
                    console.error('Error saving stats:', error);
                    alert(
                      `Failed to save stats: ${error.message || 'Unknown error'}`
                    );
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
