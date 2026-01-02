'use client';

import type { Follower } from './useMention';

interface MentionSuggestionsProps {
  suggestions: Follower[];
  selectedIndex: number;
  onSelect: (follower: Follower) => void;
  position?: { top: number; left: number };
}

export default function MentionSuggestions({
  suggestions,
  selectedIndex,
  onSelect,
  position,
}: MentionSuggestionsProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (suggestions.length === 0) return null;

  return (
    <>
      {suggestions.map((follower, index) => (
        <div
          key={follower.id}
          onClick={() => onSelect(follower)}
          className={`flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-gray-100 ${
            index === selectedIndex ? 'bg-gray-100' : ''
          }`}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-yellow-400 flex items-center justify-center flex-shrink-0">
            {follower.profile_url ? (
              <img
                src={
                  follower.profile_url.startsWith('http')
                    ? follower.profile_url
                    : `https://qd9ngjg1-3001.inc1.devtunnels.ms${follower.profile_url}`
                }
                alt={follower.full_name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <span className="text-white font-semibold text-xs">
                {getInitials(follower.full_name)}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {follower.full_name}
            </div>
            {follower.username && (
              <div className="text-sm text-gray-500 truncate">
                @{follower.username}
              </div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
