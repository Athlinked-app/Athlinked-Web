'use client';

import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '@/utils/api';
import { Search, ChevronDown } from 'lucide-react';

interface AthleticPerformance {
  id?: string;
  jerseyNumber?: string;
  sport?: string;
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

function getSportDisplayName(sportKey: string) {
  const normalized = sportKey.toLowerCase().trim();
  if (normalized === 'basketball') return 'BasketBall';
  if (normalized === 'track & field' || normalized === 'track and field')
    return 'Track & Field';
  return sportKey
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function normalizeSportName(name: string) {
  return name.toLowerCase().replace(/\s+/g, '');
}

export default function StatsTab({ userId }: { userId?: string | null }) {
  const [activeSport, setActiveSport] = useState('football');
  const [userSports, setUserSports] = useState<string[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const [userProfiles, setUserProfiles] = useState<UserSportProfile[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const [selectedPosition, setSelectedPosition] = useState<string>('');
  const [availablePositions, setAvailablePositions] = useState<Position[]>([]);
  const [loadingPositions, setLoadingPositions] = useState(false);

  const [athleticPerformance, setAthleticPerformance] =
    useState<AthleticPerformance | null>(null);
  const [allAthleticPerformance, setAllAthleticPerformance] = useState<
    AthleticPerformance[]
  >([]);

  const [searchQuery, setSearchQuery] = useState('');

  // Fetch sports list + initial athletic performance (same source as /stats page)
  useEffect(() => {
    const run = async () => {
      if (!userId) return;
      setLoadingSummary(true);
      try {
        const combinedData = await apiGet<{
          success: boolean;
          user?: any;
          athleticPerformance?: AthleticPerformance | null;
          sports?: { id: string; name: string }[];
        }>(`/profile/${userId}/stats-summary`);

        if (!combinedData.success) return;

        // Sports list
        let sportsList: string[] = [];
        if (combinedData.sports && combinedData.sports.length > 0) {
          sportsList = combinedData.sports.map(s => s.name);
        } else if (combinedData.user?.sports_played) {
          let sportsString = String(combinedData.user.sports_played);
          if (sportsString.startsWith('{') && sportsString.endsWith('}')) {
            sportsString = sportsString.slice(1, -1);
          }
          sportsString = sportsString.replace(/["']/g, '');
          sportsList = sportsString
            .split(',')
            .map((s: string) => s.trim())
            .filter(Boolean);
        }
        if (sportsList.length === 0) {
          try {
            const sportsData = await apiGet<{
              success: boolean;
              sports?: { name: string; id: string }[];
            }>('/sports');
            if (sportsData.success && sportsData.sports) {
              sportsList = sportsData.sports.map(s => s.name);
            }
          } catch {
            sportsList = ['Football', 'Basketball', 'Golf'];
          }
        }
        setUserSports(sportsList);

        // Pick active sport (primary if present)
        const primary = combinedData.user?.primary_sport
          ? String(combinedData.user.primary_sport).toLowerCase()
          : null;
        if (primary) {
          const found = sportsList.some(s => s.toLowerCase() === primary);
          setActiveSport(found ? primary : sportsList[0]?.toLowerCase() || 'football');
        } else {
          setActiveSport(sportsList[0]?.toLowerCase() || 'football');
        }

        // Athletic performance
        if (combinedData.athleticPerformance) {
          const perf = {
            id: combinedData.athleticPerformance.id,
            jerseyNumber: combinedData.athleticPerformance.jerseyNumber,
            sport: combinedData.athleticPerformance.sport,
          };
          setAthleticPerformance(perf);
          setAllAthleticPerformance([perf]);
        }
      } finally {
        setLoadingSummary(false);
      }
    };

    run();
  }, [userId]);

  // Fetch all athletic performance once, then filter by sport in-memory
  useEffect(() => {
    const run = async () => {
      if (!userId) return;
      if (allAthleticPerformance.length > 0) return;
      try {
        const data = await apiGet<{
          success: boolean;
          data?: AthleticPerformance[];
        }>(`/profile/${userId}/athletic-performance`);
        if (data.success && data.data && data.data.length > 0) {
          setAllAthleticPerformance(data.data);
        }
      } catch {
        // ignore
      }
    };
    run();
  }, [userId, allAthleticPerformance.length]);

  useEffect(() => {
    if (!allAthleticPerformance.length) return;
    const sportMatch = allAthleticPerformance.find(
      perf => perf.sport && perf.sport.toLowerCase() === activeSport.toLowerCase()
    );
    if (sportMatch) setAthleticPerformance(sportMatch);
    else setAthleticPerformance(allAthleticPerformance[0] || null);
  }, [activeSport, allAthleticPerformance]);

  // Fetch user sport profiles + stats table rows
  useEffect(() => {
    const run = async () => {
      if (!userId) return;
      setLoadingStats(true);
      try {
        const data = await apiGet<{
          success: boolean;
          profiles?: UserSportProfile[];
          message?: string;
        }>(`/user/${userId}/sport-profiles`);
        if (data.success && data.profiles) setUserProfiles(data.profiles);
        else setUserProfiles([]);
      } catch {
        setUserProfiles([]);
      } finally {
        setLoadingStats(false);
      }
    };
    run();
  }, [userId]);

  // Fetch positions for active sport (filter dropdown)
  useEffect(() => {
    const run = async () => {
      setLoadingPositions(true);
      try {
        const sportsData = await apiGet<{
          success: boolean;
          sports?: any[];
        }>('/sports');
        if (!sportsData.success || !sportsData.sports) {
          setAvailablePositions([]);
          return;
        }

        const sportName = getSportDisplayName(activeSport);
        const normalizedSportName = normalizeSportName(sportName);
        const sport = sportsData.sports.find((s: any) => {
          const normalizedSName = normalizeSportName(String(s.name || ''));
          return normalizedSName === normalizedSportName;
        });
        if (!sport) {
          setAvailablePositions([]);
          return;
        }

        const positionsData = await apiGet<{
          success: boolean;
          positions?: any[];
        }>(`/sports/${sport.id}/positions`);
        if (positionsData.success && positionsData.positions) {
          setAvailablePositions(positionsData.positions);
          setSelectedPosition('');
        } else {
          setAvailablePositions([]);
        }
      } catch {
        setAvailablePositions([]);
      } finally {
        setLoadingPositions(false);
      }
    };

    run();
  }, [activeSport]);

  const sports = useMemo(() => {
    if (userSports.length > 0) return userSports;
    return ['Football', 'Basketball', 'Golf'];
  }, [userSports]);

  const currentProfiles = useMemo(() => {
    const sportName = getSportDisplayName(activeSport);
    const normalizedSportName = normalizeSportName(sportName);

    let profiles = userProfiles.filter(profile => {
      const normalizedProfileSport = normalizeSportName(profile.sport_name);
      return normalizedProfileSport === normalizedSportName;
    });

    if (selectedPosition) {
      profiles = profiles.filter(p => p.position_name === selectedPosition);
    }

    // remove rows with only Year
    profiles = profiles.filter(p => p.stats.some(s => s.field_label !== 'Year'));

    const q = searchQuery.trim().toLowerCase();
    if (!q) return profiles;

    return profiles.filter(p => {
      const year = p.stats.find(s => s.field_label === 'Year')?.value || '';
      if (p.position_name.toLowerCase().includes(q)) return true;
      if (year.toLowerCase().includes(q)) return true;
      return p.stats.some(s => `${s.field_label} ${s.value}`.toLowerCase().includes(q));
    });
  }, [activeSport, userProfiles, selectedPosition, searchQuery]);

  const allFieldLabels = useMemo(() => {
    const labels = new Set<string>();
    currentProfiles.forEach(profile => {
      profile.stats.forEach(stat => {
        if (stat.field_label !== 'Year') labels.add(stat.field_label);
      });
    });
    if (athleticPerformance?.jerseyNumber) labels.add('Jersey Number');
    return Array.from(labels).sort();
  }, [currentProfiles, athleticPerformance?.jerseyNumber]);

  const getYearForProfile = (profile: UserSportProfile) => {
    const yearStat = profile.stats.find(s => s.field_label === 'Year');
    return yearStat?.value || '';
  };

  const getValueForField = (profile: UserSportProfile, fieldLabel: string) => {
    if (fieldLabel === 'Jersey Number' && athleticPerformance?.jerseyNumber) {
      return athleticPerformance.jerseyNumber;
    }
    const stat = profile.stats.find(s => s.field_label === fieldLabel);
    if (!stat) return '';
    return stat.value + (stat.unit ? ` ${stat.unit}` : '');
  };

  return (
    <div className="w-full bg-white rounded-lg">
      <div className="flex-1 flex flex-col bg-white overflow-auto rounded-lg">
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

          {/* Action Bar */}
          <div className="flex items-center gap-4">
            <h2 className="text-md font-medium text-black mb-4">
              {getSportDisplayName(activeSport)} Stats
            </h2>
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black"
                size={20}
              />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 text-black"
              />
            </div>
            <div className="relative">
              <select
                value={selectedPosition}
                onChange={e => setSelectedPosition(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-yellow-500 min-w-[180px] text-black"
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
          </div>

          {/* Statistics Table */}
          <div className="overflow-x-auto">
            {loadingSummary || loadingStats ? (
              <div className="p-6 text-center text-black">Loading stats...</div>
            ) : currentProfiles.length === 0 || allFieldLabels.length === 0 ? (
              <div className="p-6 text-center text-gray-600">
                No stats data available.
              </div>
            ) : (
              <div className="overflow-x-auto">
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
                            {profile.position_name}
                          </td>
                          {allFieldLabels.map(fieldLabel => (
                            <td
                              key={fieldLabel}
                              className="px-6 py-4 whitespace-nowrap text-sm text-black"
                            >
                              {getValueForField(profile, fieldLabel) || '—'}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

