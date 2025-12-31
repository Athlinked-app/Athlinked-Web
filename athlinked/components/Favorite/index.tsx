'use client';

interface FavouriteUser {
  id: string;
  full_name: string;
  profile_url?: string;
  username?: string;
  user_type?: string;
}

interface FavoriteProps {
  favouritedUsers: FavouriteUser[];
  loadingFavourites: boolean;
  getProfileUrl: (profileUrl?: string | null) => string | undefined;
  getInitials: (name?: string) => string;
}

export default function Favorite({
  favouritedUsers,
  loadingFavourites,
  getProfileUrl,
  getInitials,
}: FavoriteProps) {
  return (
    <div className="w-full bg-white rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Favourite Profiles
      </h2>
      {loadingFavourites ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">Loading favourites...</p>
        </div>
      ) : favouritedUsers.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">
            No favourite profiles yet. Click the Favourite button on a profile
            to add them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {favouritedUsers.map(user => (
            <div
              key={user.id}
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = `/profile?userId=${user.id}`;
                }
              }}
              className="bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors border border-gray-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                  {user.profile_url ? (
                    <img
                      src={getProfileUrl(user.profile_url) || ''}
                      alt={user.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-lg font-semibold text-gray-600">
                        {getInitials(user.full_name)}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {user.full_name}
                  </h3>
                  {user.username && (
                    <p className="text-sm text-gray-600 truncate">
                      @{user.username}
                    </p>
                  )}
                  {user.user_type && (
                    <p className="text-xs text-gray-500 capitalize mt-1">
                      {user.user_type}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
