'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import NavigationBar from '@/components/NavigationBar';
import Header from '@/components/Header';
import FileUploadModal from '@/components/Clips/FileUploadModal';
import ShareModal from '@/components/Share/ShareModal';
import SaveModal from '@/components/Save/SaveModal';
import type { PostData } from '@/components/Post';
import { getResourceUrl } from '@/utils/config';
import {
  Heart,
  Share2,
  Volume2,
  VolumeX,
  Send,
  MessageSquare,
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  MoreVertical,
  Bookmark,
} from 'lucide-react';

interface UserData {
  full_name: string;
  email: string;
  profile_url?: string;
}

interface Comment {
  id: string;
  author: string;
  authorAvatar: string | null;
  text: string;
  hasReplies?: boolean;
  replies?: Comment[];
  parent_username?: string | null;
}

interface Reel {
  id: string;
  videoUrl: string;
  author: string;
  authorAvatar: string | null;
  caption: string;
  // Raw created timestamp from backend (ISO string)
  timestamp: string;
  likes: number;
  shares: number;
  comments: Comment[];
  commentCount: number;
  user_id?: string;
}

export default function ClipsPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    full_name?: string;
    profile_url?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [mutedReels, setMutedReels] = useState<{ [key: string]: boolean }>({});
  const [likedReels, setLikedReels] = useState<{ [key: string]: boolean }>({});
  const [pausedReels, setPausedReels] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [selectedReelId, setSelectedReelId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedReelForShare, setSelectedReelForShare] = useState<Reel | null>(
    null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [commentTexts, setCommentTexts] = useState<{ [key: string]: string }>(
    {}
  );
  const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [replyingTo, setReplyingTo] = useState<{
    [key: string]: string | null;
  }>({});
  const [showDeleteMenu, setShowDeleteMenu] = useState<{
    [key: string]: boolean;
  }>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [saveAlertMessage, setSaveAlertMessage] = useState('');
  const [savedClipId, setSavedClipId] = useState<string | null>(null);
  const [savedClips, setSavedClips] = useState<{ [key: string]: boolean }>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
  const playPromisesRef = useRef<{ [key: string]: Promise<void> | null }>({});
  const lastWheelTimeRef = useRef(0);
  // Track which clips have had their comments fetched to avoid duplicate calls
  const fetchedCommentsRef = useRef<Set<string>>(new Set());
  // Track ongoing fetch to prevent concurrent requests
  const fetchingCommentsRef = useRef<string | null>(null);
  // Debounce timer for scroll-based comment fetching
  const commentFetchTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Define fetchComments early so it can be used in useEffects
  const fetchComments = useCallback(
    async (clipId: string, forceRefresh = false) => {
      // Skip if already fetched (unless force refresh) or currently fetching this clip
      if (!forceRefresh && fetchedCommentsRef.current.has(clipId)) {
        return;
      }

      // Skip if we're already fetching comments for this clip
      if (fetchingCommentsRef.current === clipId) {
        return;
      }

      // Mark as currently fetching
      fetchingCommentsRef.current = clipId;

      try {
        const { apiGet } = await import('@/utils/api');
        const data = await apiGet<{ success: boolean; comments?: any[] }>(
          `/clips/${clipId}/comments`
        );

        // Mark as fetched
        fetchedCommentsRef.current.add(clipId);

        if (data.success && data.comments) {
          const transformedComments: Comment[] = data.comments.map(
            (comment: any) => ({
              id: comment.id,
              author: comment.username || 'User',
              authorAvatar:
                comment.user_profile_url &&
                comment.user_profile_url.trim() !== ''
                  ? comment.user_profile_url
                  : null,
              text: comment.comment,
              hasReplies: comment.replies && comment.replies.length > 0,
              replies: comment.replies
                ? comment.replies.map((reply: any) => ({
                    id: reply.id,
                    author: reply.username || 'User',
                    authorAvatar:
                      reply.user_profile_url &&
                      reply.user_profile_url.trim() !== ''
                        ? reply.user_profile_url
                        : null,
                    text: reply.comment,
                    parent_username: reply.parent_username || null,
                  }))
                : [],
            })
          );

          // Show all replies by default
          const newShowReplies: { [key: string]: boolean } = {};
          transformedComments.forEach(comment => {
            if (
              comment.hasReplies &&
              comment.replies &&
              comment.replies.length > 0
            ) {
              newShowReplies[comment.id] = true;
            }
          });
          setShowReplies(prev => ({ ...prev, ...newShowReplies }));

          // Count total comments including replies for the count
          const totalCount = data.comments.reduce(
            (count: number, comment: any) => {
              return count + 1 + (comment.replies ? comment.replies.length : 0);
            },
            0
          );

          setReels(prev =>
            prev.map(reel => {
              if (reel.id === clipId) {
                return {
                  ...reel,
                  comments: transformedComments,
                  commentCount: totalCount,
                };
              }
              return reel;
            })
          );
        } else if (
          data.success &&
          (!data.comments || data.comments.length === 0)
        ) {
          // If no comments, ensure comments array is set to empty array
          setReels(prev =>
            prev.map(reel => {
              if (reel.id === clipId) {
                return {
                  ...reel,
                  comments: [],
                  commentCount: 0,
                };
              }
              return reel;
            })
          );
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
        // On error, ensure comments array exists
        setReels(prev =>
          prev.map(reel => {
            if (reel.id === clipId) {
              return {
                ...reel,
                comments: reel.comments || [],
              };
            }
            return reel;
          })
        );
      } finally {
        // Clear fetching flag
        fetchingCommentsRef.current = null;
      }
    },
    []
  );

  const handleWheelScroll = (event: React.WheelEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container || reels.length === 0) return;

    const deltaY = event.deltaY;

    // Ignore very small scrolls
    if (Math.abs(deltaY) < 10) return;

    // Throttle wheel-based snapping so we don't jump multiple reels at once
    const now = Date.now();
    const COOLDOWN_MS = 400;
    if (now - lastWheelTimeRef.current < COOLDOWN_MS) {
      event.preventDefault();
      return;
    }

    event.preventDefault();

    const reelHeight = container.clientHeight;
    let targetIndex = currentReelIndex;

    if (deltaY > 0 && currentReelIndex < reels.length - 1) {
      targetIndex = currentReelIndex + 1;
    } else if (deltaY < 0 && currentReelIndex > 0) {
      targetIndex = currentReelIndex - 1;
    }

    if (targetIndex !== currentReelIndex) {
      lastWheelTimeRef.current = now;
      container.scrollTo({
        top: targetIndex * reelHeight,
        behavior: 'smooth',
      });
    }
  };

  const [reels, setReels] = useState<Reel[]>([]);
  useEffect(() => {
    const initialMuted: { [key: string]: boolean } = {};
    reels.forEach(reel => {
      initialMuted[reel.id] = false;
    });
    setMutedReels(initialMuted);
  }, [reels]);

  useEffect(() => {
    Object.keys(mutedReels).forEach(reelId => {
      const audio = audioRefs.current[reelId];
      if (audio) {
        audio.muted = mutedReels[reelId];
        if (!mutedReels[reelId]) {
          audio.volume = 1;
        }
        if (!audio.paused && !mutedReels[reelId] && userHasInteracted) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromisesRef.current[reelId] = playPromise;
            playPromise
              .catch(err => {
                if (err.name !== 'AbortError') {
                  console.error('Error playing audio:', err);
                }
              })
              .finally(() => {
                playPromisesRef.current[reelId] = null;
              });
          }
        }
      }
    });
  }, [mutedReels, userHasInteracted]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollPosition = container.scrollTop;
      const reelHeight = container.clientHeight;
      const currentIndex = Math.round(scrollPosition / reelHeight);
      setCurrentReelIndex(currentIndex);

      if (reels[currentIndex]) {
        setSelectedReelId(reels[currentIndex].id);

        // Debounce comment fetching - clear previous timer and set new one
        if (commentFetchTimerRef.current) {
          clearTimeout(commentFetchTimerRef.current);
        }
        commentFetchTimerRef.current = setTimeout(() => {
          fetchComments(reels[currentIndex].id);
        }, 300); // Wait 300ms after scroll stops before fetching
      } // Play/pause audio based on current index and paused state
      reels.forEach((reel, index) => {
        const audio = audioRefs.current[reel.id];
        if (audio) {
          if (
            index === currentIndex &&
            !pausedReels[reel.id] &&
            userHasInteracted
          ) {
            const shouldBeMuted = mutedReels[reel.id] ?? false;
            audio.muted = shouldBeMuted;
            if (!shouldBeMuted) {
              audio.volume = 1;
            }
            if (playPromisesRef.current[reel.id]) {
              playPromisesRef.current[reel.id] = null;
            }

            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromisesRef.current[reel.id] = playPromise;
              playPromise
                .catch(err => {
                  if (err.name !== 'AbortError') {
                    console.error('Error playing audio:', err);
                  }
                })
                .finally(() => {
                  playPromisesRef.current[reel.id] = null;
                });
            }
          } else {
            // Cancel any pending play promise before pausing
            if (playPromisesRef.current[reel.id]) {
              playPromisesRef.current[reel.id] = null;
            }
            audio.pause();
          }
        }
      });
    };

    container.addEventListener('scroll', handleScroll);

    if (reels.length > 0 && !selectedReelId) {
      setSelectedReelId(reels[0].id);
      // Comments will be fetched by the useEffect watching selectedReelId
    }

    // Play the first audio on initial load (only after user interaction)
    if (reels.length > 0 && currentReelIndex === 0 && userHasInteracted) {
      const firstAudio = audioRefs.current[reels[0].id];
      if (firstAudio && !pausedReels[reels[0].id]) {
        firstAudio.muted = mutedReels[reels[0].id] ?? false;
        if (!mutedReels[reels[0].id]) {
          firstAudio.volume = 1;
        }
        const playPromise = firstAudio.play();
        if (playPromise !== undefined) {
          playPromisesRef.current[reels[0].id] = playPromise;
          playPromise
            .catch(err => {
              if (err.name !== 'AbortError') {
                console.error('Error playing audio:', err);
              }
            })
            .finally(() => {
              playPromisesRef.current[reels[0].id] = null;
            });
        }
      }
    }

    return () => {
      container.removeEventListener('scroll', handleScroll);
      // Clear any pending comment fetch timer
      if (commentFetchTimerRef.current) {
        clearTimeout(commentFetchTimerRef.current);
      }
    };
  }, [
    reels,
    selectedReelId,
    pausedReels,
    currentReelIndex,
    mutedReels,
    userHasInteracted,
  ]);

  // Fetch comments when selectedReelId changes (with debounce protection)
  useEffect(() => {
    if (selectedReelId && reels.length > 0) {
      // The fetchComments function already handles duplicate prevention via fetchedCommentsRef
      // This ensures comments are fetched for the initially selected reel
      fetchComments(selectedReelId);
    }
  }, [selectedReelId, fetchComments]);

  // Enable audio on any page interaction (makes it feel automatic)
  useEffect(() => {
    const enableAudioOnInteraction = () => {
      if (!userHasInteracted) {
        setUserHasInteracted(true);
        // Start playing audio for current reel after user interaction
        if (
          reels.length > 0 &&
          currentReelIndex >= 0 &&
          currentReelIndex < reels.length
        ) {
          const currentReel = reels[currentReelIndex];
          const audio = audioRefs.current[currentReel.id];
          if (audio && !pausedReels[currentReel.id]) {
            audio.muted = mutedReels[currentReel.id] ?? false;
            if (!mutedReels[currentReel.id]) {
              audio.volume = 1;
            }
            audio.play().catch(err => {
              if (err.name !== 'AbortError') {
                console.error('Error playing audio after interaction:', err);
              }
            });
          }
        }
      }
    };

    // Listen for any user interaction on the page
    document.addEventListener('click', enableAudioOnInteraction, {
      once: true,
    });
    document.addEventListener('touchstart', enableAudioOnInteraction, {
      once: true,
    });
    document.addEventListener('keydown', enableAudioOnInteraction, {
      once: true,
    });

    return () => {
      document.removeEventListener('click', enableAudioOnInteraction);
      document.removeEventListener('touchstart', enableAudioOnInteraction);
      document.removeEventListener('keydown', enableAudioOnInteraction);
    };
  }, [userHasInteracted, reels, currentReelIndex, mutedReels, pausedReels]);

  // Ensure current audio plays when reels are loaded or current index changes
  useEffect(() => {
    if (
      reels.length > 0 &&
      currentReelIndex >= 0 &&
      currentReelIndex < reels.length &&
      userHasInteracted
    ) {
      const currentReel = reels[currentReelIndex];
      const audio = audioRefs.current[currentReel.id];
      if (audio && !pausedReels[currentReel.id]) {
        audio.muted = mutedReels[currentReel.id] ?? false;
        if (!mutedReels[currentReel.id]) {
          audio.volume = 1;
        }

        // Cancel any pending play promise
        if (playPromisesRef.current[currentReel.id]) {
          playPromisesRef.current[currentReel.id] = null;
        }

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromisesRef.current[currentReel.id] = playPromise;
          playPromise
            .catch(err => {
              if (err.name !== 'AbortError') {
                console.error('Error playing audio:', err);
              }
            })
            .finally(() => {
              playPromisesRef.current[currentReel.id] = null;
            });
        }
      }
    }
  }, [reels, currentReelIndex, pausedReels, mutedReels, userHasInteracted]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { getCurrentUserId, getCurrentUser } =
          await import('@/utils/auth');
        const userId = getCurrentUserId();
        const user = getCurrentUser();

        if (userId) {
          // Fetch full user profile for display
          const { apiGet } = await import('@/utils/api');
          try {
            const data = await apiGet<{ success: boolean; user?: any }>(
              `/profile`
            );
            if (data.success && data.user) {
              setUserData(data.user);
              setCurrentUserId(userId);
              setCurrentUser({
                full_name: data.user.full_name,
                profile_url: data.user.profile_url,
              });
            } else {
              // Fallback to token data
              setUserData({ full_name: user?.username || 'User', email: '' });
              setCurrentUserId(userId);
              setCurrentUser({
                full_name: user?.username || 'User',
                profile_url: undefined,
              });
            }
          } catch (error) {
            // Fallback to token data
            setUserData({ full_name: user?.username || 'User', email: '' });
            setCurrentUserId(userId);
            setCurrentUser({
              full_name: user?.username || 'User',
              profile_url: undefined,
            });
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

  // Get display name
  const _displayName = userData?.full_name?.split(' ')[0] || 'User';

  // Check saved clips status on mount and when reels change
  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!currentUserId || reels.length === 0) return;

      try {
        const { apiGet } = await import('@/utils/api');
        const savedMap: { [key: string]: boolean } = {};

        // Check each clip's save status
        await Promise.all(
          reels.map(async reel => {
            try {
              const data = await apiGet<{
                success: boolean;
                isSaved?: boolean;
              }>(`/clips/${reel.id}/save-status?user_id=${currentUserId}`);
              savedMap[reel.id] = data.success && (data.isSaved || false);
            } catch (error) {
              savedMap[reel.id] = false;
            }
          })
        );

        setSavedClips(savedMap);
      } catch (error) {
        console.error('Error checking save status:', error);
        // Fallback to localStorage for backward compatibility
        const savedClipIds = JSON.parse(
          localStorage.getItem('athlinked_saved_clips') || '[]'
        );
        const savedMap: { [key: string]: boolean } = {};
        reels.forEach(reel => {
          savedMap[reel.id] = savedClipIds.includes(reel.id);
        });
        setSavedClips(savedMap);
      }
    };

    checkSavedStatus();
  }, [reels, currentUserId]);

  // Toggle save clip
  const handleSaveClip = async (clipId: string) => {
    if (!currentUserId) {
      alert('Please log in to save clips');
      return;
    }

    const wasSaved = savedClips[clipId] || false;
    // Optimistic update
    setSavedClips(prev => ({
      ...prev,
      [clipId]: !wasSaved,
    }));
    setSaveAlertMessage(wasSaved ? 'This clip is unsaved' : 'Clip is saved');
    setSavedClipId(clipId);
    setShowSaveAlert(true);

    try {
      const { apiPost } = await import('@/utils/api');
      const endpoint = wasSaved ? '/save/unsave' : '/save';

      const result = await apiPost<{
        success: boolean;
        message?: string;
      }>(endpoint, {
        type: 'clip',
        id: clipId,
        user_id: currentUserId,
      });

      if (!result.success) {
        // Revert optimistic update on error
        setSavedClips(prev => ({
          ...prev,
          [clipId]: wasSaved,
        }));
        alert(result.message || 'Failed to update save status');
      }
    } catch (error) {
      console.error('Error updating save status:', error);
      // Revert optimistic update on error
      setSavedClips(prev => ({
        ...prev,
        [clipId]: wasSaved,
      }));
      alert('Failed to update save status. Please try again.');
    }

    setTimeout(() => {
      setShowSaveAlert(false);
      setSavedClipId(null);
    }, 2000);

    // Close the menu
    setShowDeleteMenu({});
  };

  const handleLike = async (reelId: string) => {
    // Optimistic update
    const wasLiked = !!likedReels[reelId];
    setReels(prev =>
      prev.map(reel => {
        if (reel.id === reelId) {
          return {
            ...reel,
            likes: wasLiked ? reel.likes - 1 : reel.likes + 1,
          };
        }
        return reel;
      })
    );
    setLikedReels(prev => ({ ...prev, [reelId]: !prev[reelId] }));

    try {
      const { apiPost } = await import('@/utils/api');
      const endpoint = wasLiked
        ? `/clips/${reelId}/unlike`
        : `/clips/${reelId}/like`;
      const result = await apiPost(endpoint, {});

      if (!result.success) {
        // revert
        setReels(prev =>
          prev.map(reel => {
            if (reel.id === reelId) {
              return {
                ...reel,
                likes: wasLiked ? reel.likes + 1 : reel.likes - 1,
              };
            }
            return reel;
          })
        );
        setLikedReels(prev => ({ ...prev, [reelId]: wasLiked }));
        alert(result.message || 'Failed to update like status');
      } else if (result.like_count !== undefined) {
        // sync server count
        setReels(prev =>
          prev.map(r =>
            r.id === reelId ? { ...r, likes: result.like_count } : r
          )
        );
      }
    } catch (error) {
      console.error('Error liking/unliking clip:', error);
      // revert optimistic update
      setReels(prev =>
        prev.map(reel => {
          if (reel.id === reelId) {
            return {
              ...reel,
              likes: wasLiked ? reel.likes + 1 : reel.likes - 1,
            };
          }
          return reel;
        })
      );
      setLikedReels(prev => ({ ...prev, [reelId]: wasLiked }));
      alert('Failed to update like. Please try again.');
    }
  };

  const handleShare = (reelId: string) => {
    const reel = reels.find(r => r.id === reelId);
    if (reel) {
      setSelectedReelForShare(reel);
      setShowShareModal(true);
    }
  };

  const handleShareComplete = () => {
    // Increment share count after successful share
    if (selectedReelForShare) {
      setReels(prev =>
        prev.map(reel => {
          if (reel.id === selectedReelForShare.id) {
            return { ...reel, shares: (reel.shares || 0) + 1 };
          }
          return reel;
        })
      );
    }
    setShowShareModal(false);
    setSelectedReelForShare(null);
  };

  // Convert Reel to PostData format for ShareModal
  const reelToPostData = (reel: Reel): PostData => {
    return {
      id: reel.id,
      username: reel.author,
      user_profile_url: reel.authorAvatar,
      user_id: reel.user_id,
      post_type: 'video',
      caption: reel.caption,
      media_url: reel.videoUrl,
      like_count: reel.likes,
      comment_count: reel.commentCount,
      created_at: reel.timestamp,
    };
  };

  const handleToggleMute = (reelId: string) => {
    // Mark user as interacted when they toggle mute
    if (!userHasInteracted) {
      setUserHasInteracted(true);
    }

    setMutedReels(prev => {
      const newMuted = !prev[reelId];
      // Update audio muted state immediately
      const audio = audioRefs.current[reelId];
      if (audio) {
        audio.muted = newMuted;
        // Set volume when unmuting
        if (!newMuted) {
          audio.volume = 1;
        }
      }
      return {
        ...prev,
        [reelId]: newMuted,
      };
    });
  };

  const handleVideoClick = (
    e: React.MouseEvent<HTMLVideoElement | HTMLDivElement>,
    reelId: string
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // Mark user as interacted when they click
    if (!userHasInteracted) {
      setUserHasInteracted(true);
    }

    const audio = audioRefs.current[reelId];
    if (audio) {
      if (audio.paused) {
        // Ensure muted state and volume are correct (default to unmuted)
        const shouldBeMuted = mutedReels[reelId] ?? false;
        audio.muted = shouldBeMuted;
        if (!shouldBeMuted) {
          audio.volume = 1;
        }

        // Cancel any pending play promise
        if (playPromisesRef.current[reelId]) {
          playPromisesRef.current[reelId] = null;
        }

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromisesRef.current[reelId] = playPromise;
          playPromise
            .catch(err => {
              if (err.name !== 'AbortError') {
                console.error('Error playing audio:', err);
              }
            })
            .finally(() => {
              playPromisesRef.current[reelId] = null;
            });
        }
        setPausedReels(prev => ({ ...prev, [reelId]: false }));
      } else {
        // Cancel any pending play promise before pausing
        if (playPromisesRef.current[reelId]) {
          playPromisesRef.current[reelId] = null;
        }
        audio.pause();
        setPausedReels(prev => ({ ...prev, [reelId]: true }));
      }
    }
  };

  const _handleComment = async (reelId: string) => {
    // Just fetch comments when comment button is clicked
    await fetchComments(reelId);
  };

  const handleAddComment = async (reelId: string) => {
    const text = commentTexts[reelId] || '';
    if (!text.trim()) {
      return;
    }

    try {
      const { apiPost } = await import('@/utils/api');
      const result = await apiPost<{ success: boolean; message?: string }>(
        `/clips/${reelId}/comments`,
        {
          comment: text.trim(),
        }
      );

      if (!result.success) {
        throw new Error(result.message || 'Failed to add comment');
      }

      setCommentTexts(prev => ({ ...prev, [reelId]: '' }));
      await fetchComments(reelId, true); // Force refresh after adding comment
    } catch (error) {
      console.error('Error adding comment:', error);
      alert(error instanceof Error ? error.message : 'Failed to add comment');
    }
  };

  const handleAddReply = async (reelId: string, commentId: string) => {
    const text = replyTexts[`${reelId}-${commentId}`] || '';
    if (!text.trim()) {
      return;
    }

    try {
      const { apiPost } = await import('@/utils/api');
      const result = await apiPost<{ success: boolean; message?: string }>(
        `/clips/comments/${commentId}/reply`,
        {
          comment: text.trim(),
        }
      );

      if (!result.success) {
        throw new Error(result.message || 'Failed to add reply');
      }

      setReplyTexts(prev => {
        const newState = { ...prev };
        delete newState[`${reelId}-${commentId}`];
        return newState;
      });
      setReplyingTo(prev => ({ ...prev, [reelId]: null }));
      await fetchComments(reelId, true); // Force refresh after adding reply
    } catch (error) {
      console.error('Error adding reply:', error);
      alert(error instanceof Error ? error.message : 'Failed to add reply');
    }
  };

  const toggleReplies = (commentId: string) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleReplyClick = (reelId: string, commentId: string) => {
    setReplyingTo(prev => ({ ...prev, [reelId]: commentId }));
    setShowReplies(prev => ({ ...prev, [commentId]: true }));
  };

  const fetchClips = async () => {
    try {
      // Reset the fetched comments cache when clips are refreshed
      fetchedCommentsRef.current.clear();

      const { apiGet } = await import('@/utils/api');
      const data = await apiGet<{ success: boolean; clips?: any[] }>(
        '/clips?page=1&limit=50'
      );

      if (data.success && data.clips) {
        const fallbackName = userData?.full_name?.split(' ')[0] || 'User';

        // Transform backend data to frontend format
        const transformedClips: Reel[] = data.clips.map((clip: any) => ({
          id: clip.id,
          videoUrl: clip.video_url?.startsWith('http')
            ? clip.video_url
            : getResourceUrl(clip.video_url) || clip.video_url,
          author: clip.username || fallbackName,
          authorAvatar:
            clip.user_profile_url && clip.user_profile_url.trim() !== ''
              ? clip.user_profile_url
              : null,
          caption: clip.description || '',
          timestamp: clip.created_at,
          likes: clip.like_count || 0,
          shares: clip.share_count || clip.shares || 0,
          commentCount: clip.comment_count || 0,
          comments: [],
          user_id: clip.user_id,
        }));

        setReels(transformedClips);

        if (transformedClips.length > 0 && !selectedReelId) {
          setSelectedReelId(transformedClips[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching clips:', error);
    }
  };

  // Format timestamp to relative time
  const parseUTCTimestamp = (timestamp: string): Date => {
    if (!timestamp) return new Date(NaN);

    let ts = String(timestamp).trim();

    // Normalize: replace space with T for ISO format
    if (ts.includes(' ') && !ts.includes('T')) {
      ts = ts.replace(' ', 'T');
    }

    // Add Z suffix if no timezone indicator (backend often returns UTC without Z)
    if (
      !ts.endsWith('Z') &&
      !ts.includes('+') &&
      !/[+-]\d{2}:\d{2}$/.test(ts)
    ) {
      ts = ts + 'Z';
    }

    return new Date(ts);
  };

  const formatTimestamp = (dateString: string) => {
    const date = parseUTCTimestamp(dateString);
    if (Number.isNaN(date.getTime())) return '';

    const now = Date.now();
    const diffInSeconds = Math.max(
      0,
      Math.floor((now - date.getTime()) / 1000)
    );

    // < 1 hour: show minutes for fresh uploads
    if (diffInSeconds < 3600) {
      const mins = Math.max(1, Math.floor(diffInSeconds / 60));
      return `${mins}m`;
    }

    // < 24 hours: show hours like "5hr"
    if (diffInSeconds < 86400) {
      const hrs = Math.floor(diffInSeconds / 3600);
      return `${hrs}hr`;
    }

    // >= 24 hours: show date like "27 October 2025"
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleFileUpload = async (file: File, description: string) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('video', file);
      formData.append('description', description);

      // Use apiUpload which handles token refresh automatically
      const { apiUpload } = await import('@/utils/api');
      const result = await apiUpload<{
        success: boolean;
        message?: string;
        clip?: any;
      }>('/clips', formData);

      if (!result.success) {
        throw new Error(result.message || 'Failed to create clip');
      }

      // Refresh clips list
      await fetchClips();

      setShowUploadModal(false);
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload file');
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (clipId: string) => {
    if (!currentUserId) {
      return;
    }

    const reel = reels.find(r => r.id === clipId);
    if (!reel || reel.user_id !== currentUserId) {
      return;
    }

    if (
      !confirm(
        'Are you sure you want to delete this clip? This action cannot be undone.'
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const { apiDelete } = await import('@/utils/api');
      const result = await apiDelete<{ success: boolean; message?: string }>(
        `/clips/${clipId}`
      );

      if (result.success) {
        // Refresh clips list
        await fetchClips();
        setShowDeleteMenu({});
      } else {
        alert(result.message || 'Failed to delete clip');
      }
    } catch (error) {
      console.error('Error deleting clip:', error);
      alert('Failed to delete clip. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteMenu({});
    }
  };

  useEffect(() => {
    if (!loading && userData) {
      fetchClips();
    }
  }, [loading, userData]);

  // Try to enable audio automatically on page load using multiple strategies
  useEffect(() => {
    // Strategy 1: Try to play a silent audio context to unlock audio (browser trick)
    const unlockAudio = async () => {
      try {
        const AudioContext =
          window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContext) {
          const audioContext = new AudioContext();
          const buffer = audioContext.createBuffer(1, 1, 22050);
          const source = audioContext.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContext.destination);
          source.start(0);
          // Resume audio context (some browsers require this)
          if (audioContext.state === 'suspended') {
            await audioContext.resume();
          }
        }
      } catch (e) {
        // Ignore errors
      }
    };

    // Try to unlock audio immediately
    unlockAudio();

    // Also try when videos are loaded
    if (reels.length > 0) {
      unlockAudio();
    }
  }, [reels]);

  const selectedReel = reels.find(r => r.id === selectedReelId) || null;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-200 items-center justify-center">
        <div className="text-black">Loading...</div>
      </div>
    );
  }

  const getProfileUrl = (profileUrl?: string | null): string | undefined => {
    if (!profileUrl || profileUrl.trim() === '') return undefined;
    if (profileUrl.startsWith('http')) return profileUrl;
    if (profileUrl.startsWith('/') && !profileUrl.startsWith('/assets')) {
      return getResourceUrl(profileUrl) || profileUrl;
    }
    return profileUrl;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-200">
      <Header
        userName={currentUser?.full_name}
        userProfileUrl={getProfileUrl(currentUser?.profile_url)}
      />

      {/* Content Area with Navigation and Main Content */}
      <div className="flex flex-1 overflow-hidden mt-2 sm:mt-3 md:mt-4 lg:mt-5 ml-2 sm:ml-3 md:ml-4 lg:ml-5">
        {/* Navigation Sidebar */}
        <NavigationBar activeItem="clips" />

        {/* Main Content Area - Scrollable Reels with Comments */}
        <div
          className="flex-1 relative bg-gray-200 overflow-hidden"
          style={{ height: 'calc(100vh - 73px)' }}
        >
          {/* Scrollable Reels Container - Always has space for comments on the right */}
          {/* Scrollable Reels Container - Always has space for comments on the right */}
          <div className="absolute inset-0 flex items-center justify-center right-0 lg:right-[calc(350px+1rem)] xl:right-[calc(380px+1rem)] 2xl:right-[calc(500px+1rem)]">
            {/* Create Button - Fixed on video container when videos exist */}
            {reels.length > 0 && (
              <div className="absolute top-2 sm:top-3 md:top-4 lg:top-8 xl:top-8 2xl:top-8 left-24 xl-left-502xl:left-100 -translate-x-1/2 z-30">
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-[#CB9729] hover:bg-yellow-600 text-white rounded-full px-3 py-1.5 sm:px-4 sm:py-2 flex items-center gap-1.5 sm:gap-2 shadow-lg transition-colors"
                >
                  <Plus size={16} className="sm:w-[18px] sm:h-[18px]" />
                  <span className="text-xs sm:text-sm font-medium">Create</span>
                </button>
              </div>
            )}
            <div
              ref={scrollContainerRef}
              onWheel={handleWheelScroll}
              className={`w-full h-full ${reels.length > 0 ? 'overflow-y-scroll snap-y snap-mandatory hide-scrollbar' : 'overflow-hidden'}`}
              style={{
                scrollBehavior: 'smooth',
                scrollSnapType: reels.length > 0 ? 'y mandatory' : 'none',
                WebkitOverflowScrolling: 'touch',
              }}
            >
              {reels.length > 0 ? (
                reels.map((reel, index) => (
                  <div
                    key={reel.id}
                    className="w-full flex items-center justify-center px-2 sm:px-3 md:px-4 lg:px-6 relative snap-start"
                  >
                    <div
                      className="
    relative bg-black rounded-lg overflow-hidden shadow-2xl cursor-pointer w-full
    max-w-[280px] sm:max-w-[320px] md:max-w-[400px] lg:max-w-[480px] mb-1
    xl:max-w-[700px] 2xl:max-w-[1000px] 

    aspect-[9/12]
    xl:aspect-[11/12]
    2xl:aspect-[12/12]
  "
                      onClick={e => handleVideoClick(e, reel.id)}
                    >
                      <video
                        ref={el => {
                          if (el) {
                            videoRefs.current[reel.id] = el;
                            // Also set audio ref for audio control (video elements work the same way)
                            audioRefs.current[reel.id] = el as any;
                            el.muted = mutedReels[reel.id] ?? false;
                            el.volume = 1;
                            el.loop = true;
                            el.playsInline = true;
                          }
                        }}
                        src={reel.videoUrl}
                        className="w-full h-[90%] 2xl:h-[80%] object-top  mt-20 "
                        playsInline
                        loop
                        preload="auto"
                        muted={mutedReels[reel.id] ?? false}
                      />

                      {/* Top Right - More Options Menu (Save for all, Delete only for owned clips) */}
                      <div className="absolute top-1.5 sm:top-2 md:top-3 lg:top-4 xl:top-6 right-1.5 sm:right-2 md:right-3 lg:right-4 z-20">
                        <div className="relative">
                          <button
                            onClick={() =>
                              setShowDeleteMenu(prev => ({
                                ...prev,
                                [reel.id]: !prev[reel.id],
                              }))
                            }
                            className="p-1 sm:p-1.5 md:p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors backdrop-blur-sm"
                          >
                            <MoreVertical
                              size={14}
                              className="sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-5 lg:h-5"
                            />
                          </button>
                          {showDeleteMenu[reel.id] && (
                            <div className="absolute top-full right-0 mt-1.5 sm:mt-2 bg-white rounded-lg shadow-lg overflow-hidden z-30 min-w-[110px] sm:min-w-[130px] md:min-w-[150px]">
                              <button
                                onClick={() => handleSaveClip(reel.id)}
                                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-gray-700 hover:bg-gray-50 transition-colors w-full text-left border-b border-gray-200"
                              >
                                <Bookmark
                                  size={12}
                                  className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-[18px] lg:h-[18px]"
                                  fill={
                                    savedClips[reel.id]
                                      ? 'currentColor'
                                      : 'none'
                                  }
                                />
                                <span className="text-[10px] sm:text-xs md:text-sm font-medium">
                                  {savedClips[reel.id] ? 'Saved' : 'Save Clip'}
                                </span>
                              </button>
                              {reel.user_id === currentUserId && (
                                <button
                                  onClick={() => {
                                    setShowDeleteMenu({});
                                    handleDelete(reel.id);
                                  }}
                                  disabled={isDeleting}
                                  className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                                >
                                  <Trash2
                                    size={12}
                                    className="sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 lg:w-[18px] lg:h-[18px]"
                                  />
                                  <span className="text-[10px] sm:text-xs md:text-sm font-medium">
                                    {isDeleting ? 'Deleting...' : 'Delete Clip'}
                                  </span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div
                        className="absolute bottom-8 sm:bottom-10 md:bottom-12 lg:bottom-14 xl:bottom-20 2xl:bottom-32 left-0 right-0 p-1.5 sm:p-2 md:p-3 lg:p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10 w-44"
                        style={{ pointerEvents: 'none' }}
                      >
                        <div
                          className="flex items-start gap-1.5 sm:gap-2 md:gap-2.5 lg:gap-3"
                          style={{ pointerEvents: 'auto' }}
                        >
                          <div className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 rounded-full bg-gray-300 overflow-hidden shrink-0 border-2 border-white flex items-center justify-center">
                            {reel.authorAvatar ? (
                              <img
                                src={reel.authorAvatar}
                                alt={reel.author}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-semibold text-[9px] sm:text-[10px] md:text-xs">
                                {reel.author
                                  .split(' ')
                                  .map(word => word[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="mb-0.5 sm:mb-1">
                              <span className="font-semibold text-white text-[10px] sm:text-xs md:text-sm truncate block">
                                {reel.author}
                              </span>
                            </div>
                            <p className="text-white text-[10px] sm:text-xs md:text-sm leading-relaxed line-clamp-2 sm:line-clamp-3">
                              {reel.caption}
                            </p>
                            {reel.timestamp && (
                              <p className="mt-0.5 text-white/80 text-[9px] sm:text-[10px] md:text-xs">
                                {formatTimestamp(reel.timestamp)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div
                        className="absolute right-1.5 sm:right-2 md:right-3 lg:right-4 bottom-24 sm:bottom-28 md:bottom-32 lg:bottom-36 xl:bottom-10 2xl:bottom-26 flex flex-col items-center gap-2 sm:gap-2.5 md:gap-3 lg:gap-4 xl:gap-5"
                        style={{ pointerEvents: 'auto' }}
                      >
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            handleLike(reel.id);
                          }}
                          className="flex flex-col items-center gap-0.5 sm:gap-1 text-white hover:scale-110 transition-transform"
                        >
                          <Heart
                            size={16}
                            className="sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6"
                            fill={likedReels[reel.id] ? 'currentColor' : 'none'}
                          />
                          <span className="text-[9px] sm:text-[10px] md:text-xs font-medium">
                            {reel.likes}
                          </span>
                        </button>

                        <button
                          onClick={() => handleShare(reel.id)}
                          className="flex flex-col items-center gap-0.5 sm:gap-1 text-white hover:scale-110 transition-transform"
                        >
                          <Share2
                            size={16}
                            className="sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6"
                          />
                          <span className="text-[9px] sm:text-[10px] md:text-xs font-medium">
                            {reel.shares}
                          </span>
                        </button>

                        <button
                          onClick={() => handleToggleMute(reel.id)}
                          className="flex flex-col items-center gap-0.5 sm:gap-1 text-white hover:scale-110 transition-transform"
                        >
                          {mutedReels[reel.id] ? (
                            <VolumeX
                              size={16}
                              className="sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6"
                            />
                          ) : (
                            <Volume2
                              size={16}
                              className="sm:w-4 sm:h-4 md:w-5 md:h-5 lg:w-6 lg:h-6"
                            />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <div className="text-center text-black">
                    <p className="text-sm sm:text-base md:text-lg mb-1 sm:mb-2">
                      No videos yet
                    </p>
                    <p className="text-xs sm:text-sm mb-3 sm:mb-4">
                      Use the Create button to add your first video
                    </p>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="bg-[#CB9729] hover:bg-yellow-600 text-white rounded-full px-3 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1.5 sm:gap-2 shadow-lg transition-colors mx-auto"
                    >
                      <Plus size={16} className="sm:w-5 sm:h-5" />
                      <span className="text-xs sm:text-sm font-medium">
                        Create
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section - Always Visible on the Right, positioned higher */}
          {reels.length > 0 && (
            <div
              className="hidden lg:flex absolute bg-white border-l border-gray-200 flex-col z-10 shadow-lg rounded-lg
                         lg:right-4 lg:w-[320px] lg:top-[38%]
                         xl:right-4 xl:w-[360px] xl:top-[38%]
                         2xl:right-8 2xl:w-[480px] 2xl:top-[38%]
                         -translate-y-1/2"
              style={{
                height: 'calc(66.666667vh)',
              }}
            >
              {/* Comments Header */}
              <div className="p-2 sm:p-3 md:p-4 border-b border-gray-200 flex items-center justify-between shrink-0">
                <h2 className="text-sm sm:text-base md:text-lg font-semibold text-black">
                  Comments
                </h2>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 space-y-3 sm:space-y-4 relative">
                {selectedReel ? (
                  selectedReel.comments &&
                  Array.isArray(selectedReel.comments) &&
                  selectedReel.comments.length > 0 ? (
                    <>
                      {selectedReel.comments.map(comment => (
                        <div
                          key={comment.id}
                          className="flex gap-2 sm:gap-2.5 md:gap-3"
                        >
                          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-gray-300 overflow-hidden shrink-0 flex items-center justify-center">
                            {comment.authorAvatar ? (
                              <img
                                src={comment.authorAvatar}
                                alt={comment.author}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-black font-semibold text-xs">
                                {comment.author
                                  .split(' ')
                                  .map(word => word[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="mb-0.5 sm:mb-1">
                              <span className="font-semibold text-black text-xs sm:text-sm truncate block">
                                {comment.author}
                              </span>
                            </div>
                            <p className="text-xs sm:text-sm text-black mb-1 sm:mb-2 wrap-break-word">
                              {comment.text}
                            </p>
                            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 text-[10px] sm:text-xs text-black">
                              <button
                                onClick={() =>
                                  selectedReel &&
                                  handleReplyClick(selectedReel.id, comment.id)
                                }
                                className="hover:text-black"
                              >
                                Reply
                              </button>
                              {comment.hasReplies && (
                                <button
                                  onClick={() => toggleReplies(comment.id)}
                                  className="hover:text-black"
                                >
                                  {showReplies[comment.id]
                                    ? `Hide replies (${comment.replies?.length || 0})`
                                    : `View replies (${comment.replies?.length || 0})`}
                                </button>
                              )}
                            </div>

                            {/* Replies */}
                            {showReplies[comment.id] &&
                              comment.replies &&
                              comment.replies.length > 0 && (
                                <div className="mt-2 sm:mt-3 ml-2 sm:ml-3 md:ml-4 space-y-2 sm:space-y-3 border-l-2 border-gray-300 pl-2 sm:pl-3 md:pl-4">
                                  {comment.replies.map(reply => (
                                    <div
                                      key={reply.id}
                                      className="flex gap-1.5 sm:gap-2"
                                    >
                                      <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gray-300 overflow-hidden shrink-0 flex items-center justify-center">
                                        {reply.authorAvatar ? (
                                          <img
                                            src={reply.authorAvatar}
                                            alt={reply.author}
                                            className="w-full h-full object-cover"
                                          />
                                        ) : (
                                          <span className="text-black font-semibold text-xs">
                                            {reply.author
                                              .split(' ')
                                              .map(word => word[0])
                                              .join('')
                                              .toUpperCase()
                                              .slice(0, 2)}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="mb-0.5 sm:mb-1 flex items-center gap-1 flex-wrap">
                                          <span className="font-semibold text-black text-[10px] sm:text-xs truncate">
                                            {reply.author}
                                          </span>
                                          {reply.parent_username && (
                                            <>
                                              <span className="text-gray-500 text-[10px] sm:text-xs">
                                                replying to
                                              </span>
                                              <span className="font-semibold text-[#CB9729] text-[10px] sm:text-xs truncate">
                                                {reply.parent_username}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                        <p className="text-[10px] sm:text-xs text-black wrap-break-word">
                                          {reply.text}
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                            {/* Reply Input */}
                            {selectedReel &&
                              replyingTo[selectedReel.id] === comment.id && (
                                <div className="mt-2 sm:mt-3 ml-2 sm:ml-3 md:ml-4 flex items-center gap-1.5 sm:gap-2">
                                  <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gray-300 overflow-hidden shrink-0 flex items-center justify-center">
                                    {userData?.full_name ? (
                                      <span className="text-black font-semibold text-[10px] sm:text-xs">
                                        {userData.full_name
                                          .split(' ')
                                          .map(word => word[0])
                                          .join('')
                                          .toUpperCase()
                                          .slice(0, 2)}
                                      </span>
                                    ) : (
                                      <span className="text-black font-semibold text-[10px] sm:text-xs">
                                        U
                                      </span>
                                    )}
                                  </div>
                                  <input
                                    type="text"
                                    placeholder={`Reply to ${comment.author}...`}
                                    value={
                                      replyTexts[
                                        `${selectedReel.id}-${comment.id}`
                                      ] || ''
                                    }
                                    onChange={e =>
                                      setReplyTexts(prev => ({
                                        ...prev,
                                        [`${selectedReel.id}-${comment.id}`]:
                                          e.target.value,
                                      }))
                                    }
                                    className="flex-1 px-2 sm:px-3 py-1 sm:py-1.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 text-[10px] sm:text-xs text-black"
                                    onKeyDown={e => {
                                      if (
                                        e.key === 'Enter' &&
                                        !e.shiftKey &&
                                        selectedReel
                                      ) {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleAddReply(
                                          selectedReel.id,
                                          comment.id
                                        );
                                      }
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (selectedReel) {
                                        handleAddReply(
                                          selectedReel.id,
                                          comment.id
                                        );
                                      }
                                    }}
                                    disabled={
                                      !replyTexts[
                                        `${selectedReel.id}-${comment.id}`
                                      ]?.trim()
                                    }
                                    className="p-1 sm:p-1.5 bg-[#CB9729] text-white rounded-full hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Send
                                      size={12}
                                      className="sm:w-3.5 sm:h-3.5"
                                    />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={e => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      if (selectedReel) {
                                        setReplyingTo(prev => ({
                                          ...prev,
                                          [selectedReel.id]: null,
                                        }));
                                        setReplyTexts(prev => {
                                          const newState = { ...prev };
                                          delete newState[
                                            `${selectedReel.id}-${comment.id}`
                                          ];
                                          return newState;
                                        });
                                      }
                                    }}
                                    className="text-[10px] sm:text-xs text-gray-500 hover:text-black px-1 sm:px-2"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              )}
                          </div>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-black">
                      <MessageSquare
                        size={32}
                        className="sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 sm:mb-3 md:mb-4 opacity-50"
                      />
                      <p className="text-xs sm:text-sm">No comments yet</p>
                      <p className="text-[10px] sm:text-xs mt-1">
                        Be the first to comment!
                      </p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-black">
                    <MessageSquare
                      size={32}
                      className="sm:w-10 sm:h-10 md:w-12 md:h-12 mb-2 sm:mb-3 md:mb-4 opacity-50"
                    />
                    <p className="text-xs sm:text-sm">
                      Select a clip to view comments
                    </p>
                  </div>
                )}
              </div>

              {/* Comment Input */}
              <div className="p-2 sm:p-3 md:p-4 border-t border-gray-200 shrink-0">
                <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gray-300 overflow-hidden shrink-0 flex items-center justify-center border border-gray-200">
                    {currentUser?.profile_url &&
                    currentUser.profile_url.trim() !== '' ? (
                      <img
                        src={getProfileUrl(currentUser.profile_url)}
                        alt={currentUser.full_name || 'User'}
                        className="w-full h-full object-cover"
                        onError={e => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('span')) {
                            const fallback = document.createElement('span');
                            fallback.className =
                              'text-black font-semibold text-[10px] sm:text-xs';
                            fallback.textContent = currentUser?.full_name
                              ? currentUser.full_name
                                  .split(' ')
                                  .map(word => word[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)
                              : 'U';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <span className="text-black font-semibold text-[10px] sm:text-xs">
                        {currentUser?.full_name
                          ? currentUser.full_name
                              .split(' ')
                              .map(word => word[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)
                          : userData?.full_name
                            ? userData.full_name
                                .split(' ')
                                .map(word => word[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)
                            : 'U'}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="Write your comment here.."
                    value={commentTexts[selectedReel?.id || ''] || ''}
                    onChange={e =>
                      setCommentTexts(prev => ({
                        ...prev,
                        [selectedReel?.id || '']: e.target.value,
                      }))
                    }
                    className="flex-1 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 text-xs sm:text-sm text-black"
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey && selectedReel) {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAddComment(selectedReel.id);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (selectedReel) {
                        handleAddComment(selectedReel.id);
                      }
                    }}
                    disabled={!commentTexts[selectedReel?.id || '']?.trim()}
                    className="p-1.5 sm:p-2 bg-[#CB9729] text-white rounded-full hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send
                      size={14}
                      className="sm:w-4 sm:h-4 md:w-[18px] md:h-[18px]"
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Arrows - Below the comments box on the left side */}
          {reels.length > 0 && (
            <div
              className="hidden lg:flex absolute flex-col gap-2 md:gap-3 lg:gap-4"
              style={{
                right: 'calc(1rem + 320px)',
                top: 'calc(50% + calc(66.666667vh / 3) + 0.5rem)',
                transform: 'translateX(-10%)',
              }}
            >
              <button
                onClick={() => {
                  if (currentReelIndex > 0 && scrollContainerRef.current) {
                    const container = scrollContainerRef.current;
                    const reelHeight = container.clientHeight;
                    container.scrollTo({
                      top: (currentReelIndex - 1) * reelHeight,
                      behavior: 'smooth',
                    });
                  }
                }}
                disabled={currentReelIndex === 0}
                className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-white border border-gray-300 flex items-center justify-center transition-colors shadow-lg ${
                  currentReelIndex === 0
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-50'
                }`}
              >
                <ChevronUp
                  size={16}
                  className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-black"
                />
              </button>
              <button
                onClick={() => {
                  if (
                    currentReelIndex < reels.length - 1 &&
                    scrollContainerRef.current
                  ) {
                    const container = scrollContainerRef.current;
                    const reelHeight = container.clientHeight;
                    container.scrollTo({
                      top: (currentReelIndex + 1) * reelHeight,
                      behavior: 'smooth',
                    });
                  }
                }}
                disabled={currentReelIndex === reels.length - 1}
                className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-white border border-gray-300 flex items-center justify-center transition-colors shadow-lg ${
                  currentReelIndex === reels.length - 1
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-gray-50'
                }`}
              >
                <ChevronDown
                  size={16}
                  className="sm:w-5 sm:h-5 md:w-6 md:h-6 text-black"
                />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* File Upload Modal */}
      <FileUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onUpload={handleFileUpload}
        isUploading={isUploading}
      />

      {/* Share Modal */}
      {selectedReelForShare && (
        <ShareModal
          open={showShareModal}
          post={reelToPostData(selectedReelForShare)}
          onClose={() => {
            setShowShareModal(false);
            setSelectedReelForShare(null);
          }}
          onShare={handleShareComplete}
          currentUserId={currentUserId || undefined}
        />
      )}

      {/* Save Alert Modal */}
      {savedClipId && (
        <SaveModal
          postId={savedClipId}
          showAlert={showSaveAlert}
          alertMessage={saveAlertMessage}
          isSaved={savedClips[savedClipId] || false}
        />
      )}
    </div>
  );
}
