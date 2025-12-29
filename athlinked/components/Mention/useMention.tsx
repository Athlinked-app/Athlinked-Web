'use client';

import { useState, useEffect, useCallback } from 'react';

export interface Follower {
  id: string;
  full_name: string;
  username?: string;
  profile_url?: string;
}

interface UseMentionOptions {
  currentUserId: string;
  value: string;
  onChange: (value: string) => void;
  onSelectionChange?: (start: number, end: number) => void;
}

interface MentionState {
  showSuggestions: boolean;
  suggestions: Follower[];
  mentionStart: number;
  mentionQuery: string;
  selectedIndex: number;
}

export function useMention({
  currentUserId,
  value,
  onChange,
  onSelectionChange,
}: UseMentionOptions) {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [mentionState, setMentionState] = useState<MentionState>({
    showSuggestions: false,
    suggestions: [],
    mentionStart: -1,
    mentionQuery: '',
    selectedIndex: 0,
  });

  // Fetch followers
  useEffect(() => {
    const fetchFollowers = async () => {
      if (!currentUserId) return;

      try {
        const response = await fetch(
          `https://qd9ngjg1-3001.inc1.devtunnels.ms/api/network/following/${currentUserId}`
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

  const handleInputChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      cursorPos?: number
    ) => {
      const newValue = e.target.value;
      onChange(newValue);

      const pos =
        cursorPos !== undefined ? cursorPos : e.target.selectionStart || 0;
      const textBeforeCursor = newValue.substring(0, pos);
      const lastAtIndex = textBeforeCursor.lastIndexOf('@');

      if (lastAtIndex !== -1) {
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        // Check if there's a space after @
        if (textAfterAt.length === 0 || !textAfterAt.match(/^\s/)) {
          const query = textAfterAt.split(/\s/)[0];

          // Filter followers based on query
          const filtered = followers.filter(
            follower =>
              follower.full_name.toLowerCase().includes(query.toLowerCase()) ||
              (follower.username &&
                follower.username.toLowerCase().includes(query.toLowerCase()))
          );

          setMentionState({
            showSuggestions: filtered.length > 0,
            suggestions: filtered,
            mentionStart: lastAtIndex,
            mentionQuery: query,
            selectedIndex: 0,
          });
        } else {
          setMentionState(prev => ({ ...prev, showSuggestions: false }));
        }
      } else {
        setMentionState(prev => ({ ...prev, showSuggestions: false }));
      }
    },
    [followers, onChange]
  );

  const insertMention = useCallback(
    (follower: Follower) => {
      if (mentionState.mentionStart === -1) return;

      const textBefore = value.substring(0, mentionState.mentionStart);
      const textAfter = value.substring(mentionState.mentionStart);
      const textAfterMention = textAfter.substring(
        textAfter.indexOf(' ') !== -1
          ? textAfter.indexOf(' ')
          : textAfter.length
      );

      const newValue = `${textBefore}@${follower.full_name}${textAfterMention}`;
      onChange(newValue);

      setMentionState({
        showSuggestions: false,
        suggestions: [],
        mentionStart: -1,
        mentionQuery: '',
        selectedIndex: 0,
      });

      return textBefore.length + follower.full_name.length + 1;
    },
    [value, mentionState.mentionStart, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (mentionState.showSuggestions && mentionState.suggestions.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setMentionState(prev => ({
            ...prev,
            selectedIndex:
              prev.selectedIndex < prev.suggestions.length - 1
                ? prev.selectedIndex + 1
                : prev.selectedIndex,
          }));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setMentionState(prev => ({
            ...prev,
            selectedIndex: prev.selectedIndex > 0 ? prev.selectedIndex - 1 : 0,
          }));
        } else if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          insertMention(mentionState.suggestions[mentionState.selectedIndex]);
        } else if (e.key === 'Escape') {
          setMentionState(prev => ({ ...prev, showSuggestions: false }));
        }
      }
    },
    [mentionState, insertMention]
  );

  return {
    ...mentionState,
    handleInputChange,
    handleKeyDown,
    insertMention,
    followers,
  };
}
