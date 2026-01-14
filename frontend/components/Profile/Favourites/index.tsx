'use client';
import { useState, useEffect } from 'react';
import { getResourceUrl } from '@/utils/config';
import { useRouter } from 'next/navigation';
import { apiGet, apiDelete } from '@/utils/api';
import { Heart, User, MapPin, GraduationCap, Trophy } from 'lucide-react';

interface FavoriteAthlete {
  id: string;
  username: string;
  full_name: string;
  user_type: string;
  profile_url: string | null;
  bio: string | null;
  primary_sport: string | null;
  sports_played: string | string[] | null;
  city: string | null;
  education: string | null;
  favorited_at: string;
}

interface FavouritesProps {
  coachId: string;
}

export default function Favourites({ coachId }: FavouritesProps) {
  const router = useRouter();
  const [favorites, setFavorites] = useState<FavoriteAthlete[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (coachId) {
      fetchFavorites();
    }
  }, [coachId]);

  const fetchFavorites = async () => {
    try {
      setLoading(true);
      const result = await apiGet<{
        success: boolean;
        favorites: FavoriteAthlete[];
      }>('/favorites');

      if (result.success && result.favorites) {
        setFavorites(result.favorites);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (athleteId: string) => {
    try {
      const result = await apiDelete<{
        success: boolean;
        isFavorite: boolean;
      }>(`/favorites/${athleteId}`);

      if (result.success) {
        setFavorites(prev => prev.filter(fav => fav.id !== athleteId));
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Failed to remove favorite. Please try again.');
    }
  };

  const getProfileUrl = (profileUrl?: string | null): string => {
    if (!profileUrl || profileUrl.trim() === '') {
      return '';
    }
    if (profileUrl.startsWith('http')) {
      return profileUrl;
    }
    if (profileUrl.startsWith('/') && !profileUrl.startsWith('/assets')) {
      return getResourceUrl(profileUrl) || profileUrl;
    }
    return profileUrl;
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AL';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="w-full bg-white rounded-lg p-6 mt-4">
        <p className="text-gray-500 italic">Loading favorites...</p>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="w-full bg-white rounded-lg p-6 mt-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Favourites</h2>
        <p className="text-gray-500 italic">
          No favorite athletes yet. Add athletes to your favorites to see them
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-lg p-6 mt-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Favourites</h2>
      <div className="space-y-4">
        {favorites.map(athlete => {
          const profileUrl = getProfileUrl(athlete.profile_url);
          return (
            <div
              key={athlete.id}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => router.push(`/profile?userId=${athlete.id}`)}
            >
              <div className="flex items-start gap-4">
                {/* Profile Image */}
                <div className="flex-shrink-0">
                  {profileUrl ? (
                    <img
                      src={profileUrl}
                      alt={athlete.full_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[#CB9729] flex items-center justify-center text-white font-semibold text-lg">
                      {getInitials(athlete.full_name)}
                    </div>
                  )}
                </div>

                {/* Athlete Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {athlete.full_name}
                      </h3>
                      {athlete.username && (
                        <p className="text-sm text-gray-600 mb-2">
                          @{athlete.username}
                        </p>
                      )}

                      {/* Bio */}
                      {athlete.bio && (
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                          {athlete.bio}
                        </p>
                      )}

                      {/* Details */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-2">
                        {athlete.city && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{athlete.city}</span>
                          </div>
                        )}
                        {athlete.education && (
                          <div className="flex items-center gap-1">
                            <GraduationCap className="w-4 h-4" />
                            <span>{athlete.education}</span>
                          </div>
                        )}
                        {athlete.primary_sport && (
                          <div className="flex items-center gap-1">
                            <Trophy className="w-4 h-4" />
                            <span>{athlete.primary_sport}</span>
                          </div>
                        )}
                      </div>

                      {/* Sports Played */}
                      {athlete.sports_played && (
                        <p className="text-sm text-gray-600 mt-2">
                          <span className="font-medium">Sports:</span>{' '}
                          {Array.isArray(athlete.sports_played)
                            ? athlete.sports_played.join(', ')
                            : typeof athlete.sports_played === 'string'
                              ? athlete.sports_played.replace(/[{}"']/g, '')
                              : athlete.sports_played}
                        </p>
                      )}
                    </div>

                    {/* Remove Favorite Button */}
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        if (
                          confirm(`Remove ${athlete.full_name} from favorites?`)
                        ) {
                          handleRemoveFavorite(athlete.id);
                        }
                      }}
                      className="p-2 rounded-full hover:bg-red-50 transition-colors flex-shrink-0"
                      title="Remove from favorites"
                    >
                      <Heart className="w-5 h-5 text-red-500 fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
