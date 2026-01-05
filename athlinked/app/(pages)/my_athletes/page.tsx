'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavigationBar from '@/components/NavigationBar';
import RightSideBar from '@/components/RightSideBar';
import Header from '@/components/Header';
import { MoreVertical } from 'lucide-react';
import { apiGet } from '@/utils/api';

interface Athlete {
  id: string;
  name: string;
  profileUrl: string | null;
  username?: string | null;
  email?: string | null;
  primary_sport?: string | null;
}

export default function MyAthletesPage() {
  const [myAthletes, setMyAthletes] = useState<Athlete[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch current user
      const userIdentifier = localStorage.getItem('userEmail');
      if (userIdentifier) {
        let data;
        if (userIdentifier.startsWith('username:')) {
          const username = userIdentifier.replace('username:', '');
          data = await apiGet<{
            success: boolean;
            user?: any;
          }>(`/signup/user-by-username/${encodeURIComponent(username)}`);
        } else {
          data = await apiGet<{
            success: boolean;
            user?: any;
          }>(`/signup/user/${encodeURIComponent(userIdentifier)}`);
        }

        if (data.success && data.user) {
          setCurrentUser(data.user);

          // If user is a parent, fetch their children
          if (data.user.user_type === 'parent') {
            await fetchChildren();
          } else {
            // If not a parent, show empty or redirect
            setMyAthletes([]);
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  };

  const fetchChildren = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        console.error('No access token found');
        setLoading(false);
        return;
      }

      const data = await apiGet<{
        success: boolean;
        children?: any[];
      }>('/signup/my-children');

      if (data.success && data.children) {
        // Transform children data to match Athlete interface
        const children = data.children.map((child: any) => ({
          id: child.id,
          name: child.full_name || child.username || 'Unknown',
          profileUrl: child.profile_url || null,
          username: child.username,
          email: child.email,
          primary_sport: child.primary_sport,
        }));
        setMyAthletes(children);
      } else {
        setMyAthletes([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching children:', error);
      setMyAthletes([]);
      setLoading(false);
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

  const handleAthleteClick = (athleteId: string) => {
    router.push(`/profile?userId=${athleteId}`);
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#D4D4D4] flex flex-col overflow-hidden">
        <Header />
        <main className="flex flex-1 w-full mt-5 overflow-hidden items-center justify-center">
          <p className="text-gray-600">Loading...</p>
        </main>
      </div>
    );
  }

  // If user is not a parent, show message
  if (currentUser && currentUser.user_type !== 'parent') {
    return (
      <div className="h-screen bg-[#D4D4D4] flex flex-col overflow-hidden">
        <Header />
        <main className="flex flex-1 w-full mt-5 overflow-hidden">
          <div className="hidden md:flex px-6">
            <NavigationBar activeItem="my_athletes" />
          </div>
          <div className="flex-1 flex flex-col px-4 overflow-hidden min-w-0 items-center justify-center">
            <p className="text-gray-600">This page is only available for parents.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#D4D4D4] flex flex-col overflow-hidden">
      <Header />

      <main className="flex flex-1 w-full mt-5 overflow-hidden">
        <div className="hidden md:flex px-6">
          <NavigationBar activeItem="my_athletes" />
        </div>

        <div className="flex-1 flex flex-col px-4 overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto pr-2 min-h-0 flex justify-center">
            <div className="flex flex-col gap-4 pb-4 w-full max-w-full">
              {/* My Children Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  My Children
                </h2>
                {myAthletes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No children found.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {myAthletes.map(athlete => {
                      const profileImageUrl = getProfileUrl(athlete.profileUrl);
                      return (
                        <div
                          key={athlete.id}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                          onClick={() => handleAthleteClick(athlete.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-teal-400 overflow-hidden flex items-center justify-center flex-shrink-0">
                              {profileImageUrl ? (
                                <img
                                  src={profileImageUrl}
                                  alt={athlete.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-white font-semibold text-sm">
                                  {getInitials(athlete.name)}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">
                                {athlete.primary_sport
                                  ? athlete.primary_sport.charAt(0).toUpperCase() +
                                    athlete.primary_sport.slice(1).toLowerCase()
                                  : 'Athlete'}
                              </p>
                              <p className="text-sm font-semibold text-gray-900">
                                {athlete.name}
                              </p>
                            </div>
                          </div>
                          <button
                            className="text-gray-400 hover:text-gray-600"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle menu click
                            }}
                          >
                            <MoreVertical size={20} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex">
          <RightSideBar />
        </div>
      </main>
    </div>
  );
}
