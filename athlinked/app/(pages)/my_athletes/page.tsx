'use client';

import { useState, useEffect } from 'react';
import NavigationBar from '@/components/NavigationBar';
import RightSideBar from '@/components/RightSideBar';
import Header from '@/components/Header';
import { MoreVertical } from 'lucide-react';

interface Athlete {
  id: string;
  name: string;
  profileUrl: string | null;
}

export default function MyAthletesPage() {
  const [myAthletes, setMyAthletes] = useState<Athlete[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch current user
      const userIdentifier = localStorage.getItem('userEmail');
      if (userIdentifier) {
        const { apiGet } = await import('@/utils/api');
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
        }
      }

      // For demo purposes, using dummy data
      // Replace this with actual API calls to fetch your athletes and suggested people
      setMyAthletes([
        {
          id: '1',
          name: 'Kira Volkow',
          profileUrl:
            'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
        },
        {
          id: '2',
          name: 'Naomi Singh',
          profileUrl:
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
        },
        {
          id: '3',
          name: 'Benicio Costa',
          profileUrl:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        },
      ]);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
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
                  My Childrens
                </h2>
                <div className="space-y-1">
                  {myAthletes.map(athlete => (
                    <div
                      key={athlete.id}
                      className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-teal-400 overflow-hidden flex items-center justify-center">
                          {athlete.profileUrl ? (
                            <img
                              src={athlete.profileUrl}
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
                          <p className="text-xs text-gray-500">Athlete</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {athlete.name}
                          </p>
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600">
                        <MoreVertical size={20} />
                      </button>
                    </div>
                  ))}
                </div>
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
