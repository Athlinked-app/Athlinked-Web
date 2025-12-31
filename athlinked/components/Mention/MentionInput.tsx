'use client';

import { useState, useEffect, useRef } from 'react';

interface Follower {
  id: string;
  full_name: string;
  username?: string;
  profile_url?: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  currentUserId: string;
  className?: string;
  disabled?: boolean;
}

export default function MentionInput({
  value,
  onChange,
  placeholder = "What's on your mind?",
  currentUserId,
  className = '',
  disabled = false,
}: MentionInputProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Follower[]>([]);
  const [mentionStart, setMentionStart] = useState<number>(-1);
  const [mentionQuery, setMentionQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [followers, setFollowers] = useState<Follower[]>([]);

  // Fetch followers
  useEffect(() => {
    const fetchFollowers = async () => {
      if (!currentUserId) return;

      try {
        const response = await fetch(
          `http://localhost:3001/api/network/following/${currentUserId}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.following) {
            setFollowers(
              data.following.map((user: any) => ({
                id: user.id,
                full_name: user.full_name || 'User',
                username: user.username,
                profile_url: user.profile_url,
              }))
            );
          }
        }
      } catch (error) {
        console.error('Error fetching followers:', error);
      }
    };

    fetchFollowers();
  }, [currentUserId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    onChange(newValue);

    // Find @ mentions
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newValue.substring(0, cursorPos);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
      // Check if there's a space or end of string after @
      if (textAfterAt.length === 0 || !textAfterAt.match(/^\s/)) {
        const query = textAfterAt.split(/\s/)[0];
        setMentionStart(lastAtIndex);
        setMentionQuery(query.toLowerCase());

        // Filter followers based on query
        const filtered = followers.filter(
          follower =>
            follower.full_name.toLowerCase().includes(query.toLowerCase()) ||
            (follower.username &&
              follower.username.toLowerCase().includes(query.toLowerCase()))
        );

        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
        setSelectedIndex(0);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const insertMention = (follower: Follower) => {
    if (mentionStart === -1) return;

    const textBefore = value.substring(0, mentionStart);
    const textAfter = value.substring(mentionStart);
    const textAfterMention = textAfter.substring(
      textAfter.indexOf(' ') !== -1 ? textAfter.indexOf(' ') : textAfter.length
    );

    const newValue = `${textBefore}@${follower.full_name}${textAfterMention}`;
    onChange(newValue);
    setShowSuggestions(false);
    setMentionStart(-1);
    setMentionQuery('');

    // Focus back on input
    setTimeout(() => {
      inputRef.current?.focus();
      const newCursorPos = textBefore.length + follower.full_name.length + 1;
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
      } else if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        insertMention(suggestions[selectedIndex]);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
      }
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

  // Get mention positions for highlighting
  const getMentions = (
    text: string
  ): Array<{ start: number; end: number; name: string }> => {
    const mentions: Array<{ start: number; end: number; name: string }> = [];
    const regex = /@([^\s@]+)/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      mentions.push({
        start: match.index,
        end: match.index + match[0].length,
        name: match[1],
      });
    }

    return mentions;
  };

  const mentions = getMentions(value);

  return (
    <div className="relative">
      <textarea
        ref={inputRef}
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full resize-none border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#CB9729] ${className}`}
        rows={3}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((follower, index) => (
            <div
              key={follower.id}
              onClick={() => insertMention(follower)}
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
        </div>
      )}
    </div>
  );
}

// Helper function to extract mentions from text
export function extractMentions(text: string): string[] {
  const mentions: string[] = [];
  const regex = /@([^\s@]+)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    mentions.push(match[1]);
  }

  return [...new Set(mentions)]; // Remove duplicates
}
