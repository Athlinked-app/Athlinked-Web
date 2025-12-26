'use client';

import { useState, useEffect, useRef } from 'react';
import NavigationBar from '@/components/NavigationBar';
import FileUploadModal from '@/components/Clips/FileUploadModal';
import ShareModal from '@/components/Share/ShareModal';
import type { PostData } from '@/components/Post';
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
  X,
  Trash2,
  MoreVertical,
} from 'lucide-react';

interface UserData {
  full_name: string;
  email: string;
}

interface Comment {
  id: string;
  author: string;
  authorAvatar: string | null;
  text: string;
  hasReplies?: boolean;
}

interface Reel {
  id: string;
  videoUrl: string;
  author: string;
  authorAvatar: string | null;
  caption: string;
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
  const [loading, setLoading] = useState(true);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [mutedReels, setMutedReels] = useState<{ [key: string]: boolean }>({});
  const [likedReels, setLikedReels] = useState<{ [key: string]: boolean }>({});
  const [pausedReels, setPausedReels] = useState<{ [key: string]: boolean }>({});
  const [selectedReelId, setSelectedReelId] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedReelForShare, setSelectedReelForShare] = useState<Reel | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [commentTexts, setCommentTexts] = useState<{ [key: string]: string }>(
    {}
  );
  const [showDeleteMenu, setShowDeleteMenu] = useState<{ [key: string]: boolean }>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});
  const playPromisesRef = useRef<{ [key: string]: Promise<void> | null }>({});

  const [reels, setReels] = useState<Reel[]>([]);
  useEffect(() => {
    const initialMuted: { [key: string]: boolean } = {};
    reels.forEach(reel => {
      // Start videos unmuted by default for audio
      initialMuted[reel.id] = false;
    });
    setMutedReels(initialMuted);
  }, [reels]);

  // Update video muted property when mutedReels state changes
  useEffect(() => {
    Object.keys(mutedReels).forEach(reelId => {
      const video = videoRefs.current[reelId];
      if (video) {
        video.muted = mutedReels[reelId];
        // Ensure volume is set to 1 when unmuted
        if (!mutedReels[reelId]) {
          video.volume = 1;
        }
        // Only try to play with audio if user has interacted
        if (!video.paused && !mutedReels[reelId] && userHasInteracted) {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromisesRef.current[reelId] = playPromise;
            playPromise.catch(err => {
              // Silently handle autoplay errors
              if (err.name !== 'AbortError') {
                console.error('Error playing video with audio:', err);
              }
            }).finally(() => {
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
      }

      // Play/pause videos based on current index and paused state
      reels.forEach((reel, index) => {
        const video = videoRefs.current[reel.id];
        if (video) {
          if (index === currentIndex && !pausedReels[reel.id]) {
            // Try to play with audio by default
            const shouldBeMuted = mutedReels[reel.id] ?? false;
            video.muted = shouldBeMuted;
            if (!shouldBeMuted) {
              video.volume = 1;
            }
            
            // Cancel any pending play promise
            if (playPromisesRef.current[reel.id]) {
              playPromisesRef.current[reel.id] = null;
            }
            
            const playPromise = video.play();
            if (playPromise !== undefined) {
              playPromisesRef.current[reel.id] = playPromise;
              playPromise.catch(err => {
                // If autoplay with audio fails, try multiple strategies to enable audio
                if (err.name === 'NotAllowedError' && !shouldBeMuted) {
                  video.muted = true;
                  const mutedPlayPromise = video.play();
                  if (mutedPlayPromise !== undefined) {
                    mutedPlayPromise.then(() => {
                      // Try multiple times with different delays to enable audio
                      const tryEnableAudio = (attempt: number) => {
                        if (attempt > 5) return; // Max 5 attempts
                        
                        setTimeout(() => {
                          if (!video.paused && !mutedReels[reel.id]) {
                            video.muted = false;
                            video.volume = 1;
                            video.play().then(() => {
                              // Success! Audio is now enabled
                            }).catch(() => {
                              // Try again with longer delay
                              tryEnableAudio(attempt + 1);
                            });
                          }
                        }, attempt * 50); // Increasing delay: 50ms, 100ms, 150ms, etc.
                      };
                      
                      tryEnableAudio(1);
                    }).catch(mutedErr => {
                      if (mutedErr.name !== 'AbortError') {
                        console.error('Error playing muted video:', mutedErr);
                      }
                    });
                  }
                } else if (err.name !== 'AbortError') {
                  console.error('Error playing video:', err);
                }
              }).finally(() => {
                playPromisesRef.current[reel.id] = null;
              });
            }
          } else {
            // Cancel any pending play promise before pausing
            if (playPromisesRef.current[reel.id]) {
              playPromisesRef.current[reel.id] = null;
            }
            video.pause();
          }
        }
      });
    };

    container.addEventListener('scroll', handleScroll);

    if (reels.length > 0 && !selectedReelId) {
      setSelectedReelId(reels[0].id);
    }

    // Play the first video on initial load
    if (reels.length > 0 && currentReelIndex === 0) {
      const firstVideo = videoRefs.current[reels[0].id];
      if (firstVideo && !pausedReels[reels[0].id]) {
        firstVideo.muted = mutedReels[reels[0].id] ?? false;
        if (!mutedReels[reels[0].id]) {
          firstVideo.volume = 1;
        }
        const playPromise = firstVideo.play();
        if (playPromise !== undefined) {
          playPromisesRef.current[reels[0].id] = playPromise;
          playPromise.then(() => {
            // If play succeeds, ensure audio is enabled if it should be
            if (!mutedReels[reels[0].id] && firstVideo.muted) {
              firstVideo.muted = false;
              firstVideo.volume = 1;
            }
          }).catch(err => {
            // If autoplay with audio fails, try multiple strategies to enable audio
            if (err.name === 'NotAllowedError' && !firstVideo.muted) {
              // Strategy 1: Play muted first, then try to unmute immediately
              firstVideo.muted = true;
              firstVideo.play().then(() => {
                // Try multiple times with different delays to enable audio
                const tryEnableAudio = (attempt: number) => {
                  if (attempt > 5) return; // Max 5 attempts
                  
                  setTimeout(() => {
                    if (!firstVideo.paused && !mutedReels[reels[0].id]) {
                      firstVideo.muted = false;
                      firstVideo.volume = 1;
                      firstVideo.play().then(() => {
                        // Success! Audio is now enabled
                      }).catch(() => {
                        // Try again with longer delay
                        tryEnableAudio(attempt + 1);
                      });
                    }
                  }, attempt * 50); // Increasing delay: 50ms, 100ms, 150ms, etc.
                };
                
                tryEnableAudio(1);
              }).catch(() => {});
            }
          }).finally(() => {
            playPromisesRef.current[reels[0].id] = null;
          });
        }
      }
    }

    return () => container.removeEventListener('scroll', handleScroll);
  }, [reels, selectedReelId, pausedReels, currentReelIndex, mutedReels, userHasInteracted]);

  // Enable audio on any page interaction (makes it feel automatic)
  useEffect(() => {
    const enableAudioOnInteraction = () => {
      if (!userHasInteracted) {
        setUserHasInteracted(true);
        // Enable audio for current video
        if (reels.length > 0 && currentReelIndex >= 0 && currentReelIndex < reels.length) {
          const currentReel = reels[currentReelIndex];
          const video = videoRefs.current[currentReel.id];
          if (video && !mutedReels[currentReel.id] && video.muted) {
            video.muted = false;
            video.volume = 1;
            if (!video.paused) {
              video.play().catch(() => {});
            }
          }
        }
      }
    };

    // Listen for any user interaction on the page
    document.addEventListener('click', enableAudioOnInteraction, { once: true });
    document.addEventListener('touchstart', enableAudioOnInteraction, { once: true });
    document.addEventListener('keydown', enableAudioOnInteraction, { once: true });

    return () => {
      document.removeEventListener('click', enableAudioOnInteraction);
      document.removeEventListener('touchstart', enableAudioOnInteraction);
      document.removeEventListener('keydown', enableAudioOnInteraction);
    };
  }, [userHasInteracted, reels, currentReelIndex, mutedReels]);

  // Ensure current video plays when reels are loaded or current index changes
  useEffect(() => {
    if (reels.length > 0 && currentReelIndex >= 0 && currentReelIndex < reels.length) {
      const currentReel = reels[currentReelIndex];
      const video = videoRefs.current[currentReel.id];
      if (video && !pausedReels[currentReel.id]) {
        video.muted = mutedReels[currentReel.id] ?? false;
        if (!mutedReels[currentReel.id]) {
          video.volume = 1;
        }
        
        // Cancel any pending play promise
        if (playPromisesRef.current[currentReel.id]) {
          playPromisesRef.current[currentReel.id] = null;
        }
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromisesRef.current[currentReel.id] = playPromise;
          playPromise.then(() => {
            // If play succeeds, ensure audio is enabled if it should be
            if (!mutedReels[currentReel.id] && video.muted) {
              video.muted = false;
              video.volume = 1;
            }
          }).catch(err => {
            // If autoplay with audio fails, try multiple strategies to enable audio
            if (err.name === 'NotAllowedError' && !video.muted) {
              // Strategy 1: Play muted first, then try to unmute immediately
              video.muted = true;
              video.play().then(() => {
                // Try multiple times with different delays to enable audio
                const tryEnableAudio = (attempt: number) => {
                  if (attempt > 5) return; // Max 5 attempts
                  
                  setTimeout(() => {
                    if (!video.paused && !mutedReels[currentReel.id]) {
                      video.muted = false;
                      video.volume = 1;
                      video.play().then(() => {
                        // Success! Audio is now enabled
                      }).catch(() => {
                        // Try again with longer delay
                        tryEnableAudio(attempt + 1);
                      });
                    }
                  }, attempt * 50); // Increasing delay: 50ms, 100ms, 150ms, etc.
                };
                
                tryEnableAudio(1);
              }).catch(() => {});
            }
          }).finally(() => {
            playPromisesRef.current[currentReel.id] = null;
          });
        }
      }
    }
  }, [reels, currentReelIndex, pausedReels, mutedReels]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userIdentifier = localStorage.getItem('userEmail');

        if (!userIdentifier) {
          console.error('No user identifier found');
          setLoading(false);
          return;
        }

        let response;
        if (userIdentifier.startsWith('username:')) {
          const username = userIdentifier.replace('username:', '');
          response = await fetch(
            `http://localhost:3001/api/signup/user-by-username/${encodeURIComponent(username)}`
          );
        } else {
          response = await fetch(
            `http://localhost:3001/api/signup/user/${encodeURIComponent(userIdentifier)}`
          );
        }

        const data = await response.json();

        if (data.success && data.user) {
          setUserData(data.user);
          setCurrentUserId(data.user.id);
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
  const displayName = userData?.full_name?.split(' ')[0] || 'User';

  const handleLike = (reelId: string) => {
    setReels(prev =>
      prev.map(reel => {
        if (reel.id === reelId) {
          const isLiked = likedReels[reelId];
          return {
            ...reel,
            likes: isLiked ? reel.likes - 1 : reel.likes + 1,
          };
        }
        return reel;
      })
    );
    setLikedReels(prev => ({
      ...prev,
      [reelId]: !prev[reelId],
    }));
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
            return { ...reel, shares: reel.shares + 1 };
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
      // Update video muted state immediately - only affects audio, not playback
      const video = videoRefs.current[reelId];
      if (video) {
        // Only toggle the muted property - video continues playing
        video.muted = newMuted;
        // Set volume when unmuting
        if (!newMuted) {
          video.volume = 1;
        }
        // Don't call play() if video is already playing - just toggle mute
        // The video will continue playing with or without audio based on muted state
      }
      return {
        ...prev,
        [reelId]: newMuted,
      };
    });
  };

  const handleVideoClick = (e: React.MouseEvent<HTMLVideoElement>, reelId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const video = videoRefs.current[reelId];
    if (video) {
      if (video.paused) {
        // Ensure muted state and volume are correct (default to unmuted)
        const shouldBeMuted = mutedReels[reelId] ?? false;
        video.muted = shouldBeMuted;
        if (!shouldBeMuted) {
          video.volume = 1;
        }
        
        // Cancel any pending play promise
        if (playPromisesRef.current[reelId]) {
          playPromisesRef.current[reelId] = null;
        }
        
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromisesRef.current[reelId] = playPromise;
          playPromise.catch(err => {
            if (err.name !== 'AbortError') {
              console.error('Error playing video:', err);
            }
          }).finally(() => {
            playPromisesRef.current[reelId] = null;
          });
        }
        setPausedReels(prev => ({ ...prev, [reelId]: false }));
      } else {
        // Cancel any pending play promise before pausing
        if (playPromisesRef.current[reelId]) {
          playPromisesRef.current[reelId] = null;
        }
        video.pause();
        setPausedReels(prev => ({ ...prev, [reelId]: true }));
      }
    }
  };

  const handleComment = async (reelId: string) => {
    setSelectedReelId(reelId);
    setShowComments(true);
    await fetchComments(reelId);
  };

      const fetchComments = async (clipId: string) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/clips/${clipId}/comments`
      );

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        return;
      }

      const data = await response.json();

      if (data.success && data.comments) {
        const transformedComments: Comment[] = data.comments.map(
          (comment: any) => ({
            id: comment.id,
            author:
              comment.username || userData?.full_name?.split(' ')[0] || 'User',
            authorAvatar: (comment.user_profile_url && comment.user_profile_url.trim() !== '') ? comment.user_profile_url : null,
            text: comment.comment,
            hasReplies: comment.replies && comment.replies.length > 0,
          })
        );

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
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleAddComment = async (reelId: string) => {
    const text = commentTexts[reelId] || '';
    if (!text.trim()) {
      return;
    }

    try {
      const userIdentifier = localStorage.getItem('userEmail');
      if (!userIdentifier) {
        alert('User not logged in');
        return;
      }

      // Get user data to get user_id
      let userResponse;
      if (userIdentifier.startsWith('username:')) {
        const username = userIdentifier.replace('username:', '');
        userResponse = await fetch(
          `http://localhost:3001/api/signup/user-by-username/${encodeURIComponent(username)}`
        );
      } else {
        userResponse = await fetch(
          `http://localhost:3001/api/signup/user/${encodeURIComponent(userIdentifier)}`
        );
      }
      const userDataResponse = await userResponse.json();

      if (!userDataResponse.success || !userDataResponse.user) {
        throw new Error('Failed to get user data');
      }

      const response = await fetch(
        `http://localhost:3001/api/clips/${reelId}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            comment: text,
            user_id: userDataResponse.user.id,
          }),
        }
      );

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        alert('Failed to add comment. Please try again.');
        return;
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to add comment');
      }

      setCommentTexts(prev => ({ ...prev, [reelId]: '' }));
      await fetchComments(reelId);
    } catch (error) {
      console.error('Error adding comment:', error);
      alert(error instanceof Error ? error.message : 'Failed to add comment');
    }
  };

  const fetchClips = async () => {
    try {
      const response = await fetch(
        'http://localhost:3001/api/clips?page=1&limit=50'
      );

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        return;
      }

      const data = await response.json();

      if (data.success && data.clips) {
        const fallbackName = userData?.full_name?.split(' ')[0] || 'User';

        // Transform backend data to frontend format
        const transformedClips: Reel[] = data.clips.map((clip: any) => ({
          id: clip.id,
          videoUrl: clip.video_url?.startsWith('http')
            ? clip.video_url
            : `http://localhost:3001${clip.video_url}`,
          author: clip.username || fallbackName,
          authorAvatar: (clip.user_profile_url && clip.user_profile_url.trim() !== '') ? clip.user_profile_url : null,
          caption: clip.description || '',
          timestamp: formatTimestamp(clip.created_at),
          likes: clip.like_count || 0,
          shares: 0,
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
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const handleFileUpload = async (file: File, description: string) => {
    setIsUploading(true);
    try {
      const userIdentifier = localStorage.getItem('userEmail');
      if (!userIdentifier) {
        throw new Error('User not logged in');
      }

      // Get user data to get user_id
      let userResponse;
      if (userIdentifier.startsWith('username:')) {
        const username = userIdentifier.replace('username:', '');
        userResponse = await fetch(
          `http://localhost:3001/api/signup/user-by-username/${encodeURIComponent(username)}`
        );
      } else {
        userResponse = await fetch(
          `http://localhost:3001/api/signup/user/${encodeURIComponent(userIdentifier)}`
        );
      }
      const userData = await userResponse.json();

      if (!userData.success || !userData.user) {
        throw new Error('Failed to get user data');
      }

      const formData = new FormData();
      formData.append('video', file);
      formData.append('description', description);
      formData.append('user_id', userData.user.id);

      // Upload clip via API (multipart/form-data)
      const response = await fetch(
        'http://localhost:3001/api/clips',
        {
          method: 'POST',
          body: formData, // Don't set Content-Type, browser will set it with boundary
        }
      );

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        throw new Error(
          'Failed to upload clip. Server returned invalid response.'
        );
      }

      const result = await response.json();

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

    if (!confirm('Are you sure you want to delete this clip? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const userIdentifier = localStorage.getItem('userEmail');
      if (!userIdentifier) {
        alert('User not logged in');
        return;
      }

      let userResponse;
      if (userIdentifier.startsWith('username:')) {
        const username = userIdentifier.replace('username:', '');
        userResponse = await fetch(
          `http://localhost:3001/api/signup/user-by-username/${encodeURIComponent(username)}`
        );
      } else {
        userResponse = await fetch(
          `http://localhost:3001/api/signup/user/${encodeURIComponent(userIdentifier)}`
        );
      }

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      // Check if user response is JSON
      const userContentType = userResponse.headers.get('content-type');
      let userDataResponse;
      
      if (userContentType && userContentType.includes('application/json')) {
        try {
          userDataResponse = await userResponse.json();
        } catch (jsonError) {
          console.error('JSON parse error for user data:', jsonError);
          const text = await userResponse.text();
          console.error('User response text:', text);
          throw new Error('Failed to parse user data response');
        }
      } else {
        const text = await userResponse.text();
        console.error('Non-JSON user response (status:', userResponse.status, '):', text.substring(0, 200));
        throw new Error('Server returned non-JSON response for user data');
      }

      if (!userDataResponse.success || !userDataResponse.user) {
        throw new Error('User not found');
      }

      const response = await fetch(`http://localhost:3001/api/clips/${clipId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userDataResponse.user.id,
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let result;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          result = await response.json();
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError);
          const text = await response.text();
          console.error('Response text:', text);
          throw new Error(`Failed to parse response: ${text.substring(0, 100)}`);
        }
      } else {
        // If not JSON, read as text to see what we got
        const text = await response.text();
        console.error('Non-JSON response (status:', response.status, '):', text.substring(0, 200));
        throw new Error(`Server returned non-JSON response (status: ${response.status}). Check backend logs.`);
      }

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
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
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

  return (
    <div className="flex flex-col min-h-screen bg-gray-200">
      {/* Header - Full Width */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center w-full z-10">
        <div className="flex items-center">
          <img src="/Frame 171.png" alt="ATHLINKED" className="h-8 w-auto" />
        </div>
        <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex items-center justify-center">
          {userData?.full_name ? (
            <span className="text-black font-semibold text-xs">
              {userData.full_name
                .split(' ')
                .map(word => word[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </span>
          ) : (
            <span className="text-black font-semibold text-xs">U</span>
          )}
        </div>
      </header>

      {/* Content Area with Navigation and Main Content */}
      <div className="flex flex-1 overflow-hidden mt-5 ml-5">
        {/* Navigation Sidebar */}
        <NavigationBar
          activeItem="clips"
          userName={userData?.full_name || ''}
        />

        {/* Main Content Area - Scrollable Reels with Comments */}
        <div
          className="flex-1 relative bg-gray-200 overflow-hidden"
          style={{ height: 'calc(100vh - 73px)' }}
        >
          {/* Scrollable Reels Container */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${showComments ? 'right-[calc(396px+0.5rem)]' : 'right-0'}`}
          >
            {/* Create Button - Fixed on video container when videos exist */}
            {reels.length > 0 && (
              <div 
                className="absolute top-15 z-30"
                style={{ left: 'calc(50% - 250px + 20px)' }}
              >
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="bg-[#CB9729] hover:bg-yellow-600 text-white rounded-full px-4 py-2 flex items-center gap-2 shadow-lg transition-colors"
                >
                  <Plus size={20} />
                  <span className="text-sm font-medium">Create</span>
                </button>
              </div>
            )}
            <div
              ref={scrollContainerRef}
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
                    className="w-full h-full snap-start flex items-center justify-center relative"
                    style={{ minHeight: '100%' }}
                  >
                    {/* Video Container - Larger Size */}
                    <div
                      className="relative bg-black rounded-lg overflow-hidden shadow-2xl"
                      style={{ width: '500px', aspectRatio: '9/16' }}
                    >

                      <video
                        ref={el => {
                          if (el) {
                            videoRefs.current[reel.id] = el;
                            // Start unmuted by default for audio
                            el.muted = mutedReels[reel.id] ?? false;
                            el.volume = 1;
                          }
                        }}
                        onClick={(e) => handleVideoClick(e, reel.id)}
                        className="w-full h-full object-contain cursor-pointer"
                        style={{ pointerEvents: 'auto' }}
                        controls={false}
                        muted={mutedReels[reel.id] ?? false}
                        loop
                        playsInline
                        autoPlay={true}
                      >
                        <source src={reel.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>

                      {/* Top Right - Delete Button (only for clips owned by current user) */}
                      {reel.user_id === currentUserId && (
                        <div className="absolute top-10 right-4 z-20">
                          <div className="relative">
                            <button
                              onClick={() => setShowDeleteMenu(prev => ({
                                ...prev,
                                [reel.id]: !prev[reel.id],
                              }))}
                              className="p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors backdrop-blur-sm"
                            >
                              <MoreVertical size={20} />
                            </button>
                            {showDeleteMenu[reel.id] && (
                              <div className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg overflow-hidden z-30 min-w-[150px]">
                                <button
                                  onClick={() => {
                                    setShowDeleteMenu({});
                                    handleDelete(reel.id);
                                  }}
                                  disabled={isDeleting}
                                  className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 transition-colors w-full text-left"
                                >
                                  <Trash2 size={18} />
                                  <span className="text-sm font-medium">
                                    {isDeleting ? 'Deleting...' : 'Delete Clip'}
                                  </span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Bottom Section - Profile, Username, and Description */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10" style={{ pointerEvents: 'none' }}>
                        <div className="flex items-start gap-3" style={{ pointerEvents: 'auto' }}>
                          <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0 border-2 border-white flex items-center justify-center">
                            {reel.authorAvatar ? (
                              <img
                                src={reel.authorAvatar}
                                alt={reel.author}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-semibold text-xs">
                                {reel.author
                                  .split(' ')
                                  .map(word => word[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="mb-1">
                              <span className="font-semibold text-white text-sm">
                                {reel.author}
                              </span>
                            </div>
                            <p className="text-white text-sm leading-relaxed">
                              {reel.caption}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Right Side - Interaction Buttons */}
                      <div className="absolute right-4 bottom-15 flex flex-col items-center gap-6" style={{ pointerEvents: 'auto' }}>
                        <button
                          onClick={() => handleLike(reel.id)}
                          className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
                        >
                          <Heart
                            size={25}
                            fill={likedReels[reel.id] ? 'currentColor' : 'none'}
                          />
                          <span className="text-xs font-medium">
                            {reel.likes}
                          </span>
                        </button>

                        <button
                          onClick={() => handleComment(reel.id)}
                          className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
                        >
                          <MessageSquare size={28} />
                          <span className="text-xs font-medium">
                            {reel.commentCount}
                          </span>
                        </button>

                        <button
                          onClick={() => handleShare(reel.id)}
                          className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
                        >
                          <Share2 size={25} />
                          <span className="text-xs font-medium">
                            {reel.shares}
                          </span>
                        </button>

                        <button
                          onClick={() => handleToggleMute(reel.id)}
                          className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
                        >
                          {mutedReels[reel.id] ? (
                            <VolumeX size={25} />
                          ) : (
                            <Volume2 size={25} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <div className="text-center text-black">
                    <p className="text-lg mb-2">No videos yet</p>
                    <p className="text-sm mb-4">
                      Use the Create button to add your first video
                    </p>
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="bg-[#CB9729] hover:bg-yellow-600 text-white rounded-full px-4 py-2 flex items-center gap-2 shadow-lg transition-colors mx-auto"
                    >
                      <Plus size={20} />
                      <span className="text-sm font-medium">Create</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comments Section - Visible when comment button is pressed */}
          {showComments && (
            <div
              className="absolute top-1/2 transform -translate-y-1/2 bg-white border-l border-gray-200 flex flex-col z-10 shadow-lg"
              style={{
                right: '6.5rem', // Reduced from 2rem to 0.5rem to reduce gap
                width: 'calc(25.5rem * 1.1)', // Increased w-90 (22.5rem/360px) by 10%
                height: 'calc(66.666667vh * 1.1)', // Increased h-2/3 by 10%
              }}
            >
              {/* Comments Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <h2 className="text-lg font-semibold text-black">
                  Comments
                </h2>
                <button
                  onClick={() => setShowComments(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-black" />
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                {selectedReel && selectedReel.comments.length > 0 ? (
                  <>
                    {selectedReel.comments.map(comment => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0 flex items-center justify-center">
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
                        <div className="flex-1">
                          <div className="mb-1">
                            <span className="font-semibold text-black text-sm">
                              {comment.author}
                            </span>
                          </div>
                          <p className="text-sm text-black mb-2">
                            {comment.text}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-black">
                            <button className="hover:text-black">
                              Reply
                            </button>
                            {comment.hasReplies && (
                              <button className="hover:text-black">
                                View replies
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {/* Scroll Arrows */}
                    <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex flex-col gap-2">
                      <button className="w-10 h-10 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
                        <ChevronUp size={20} className="text-black" />
                      </button>
                      <button className="w-10 h-10 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
                        <ChevronDown size={20} className="text-black" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-black">
                    <MessageSquare size={48} className="mb-4 opacity-50" />
                    <p className="text-sm">No comments yet</p>
                    <p className="text-xs mt-1">Be the first to comment!</p>
                  </div>
                )}
              </div>

              {/* Comment Input */}
              <div className="p-4 border-t border-gray-200 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {userData?.full_name ? (
                      <span className="text-black font-semibold text-xs">
                        {userData.full_name
                          .split(' ')
                          .map(word => word[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </span>
                    ) : (
                      <span className="text-black font-semibold text-xs">U</span>
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
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm text-black"
                    onKeyPress={e => {
                      if (e.key === 'Enter' && selectedReel) {
                        handleAddComment(selectedReel.id);
                      }
                    }}
                  />
                  <button
                    onClick={() =>
                      selectedReel && handleAddComment(selectedReel.id)
                    }
                    className="p-2 bg-[#CB9729] text-white rounded-full hover:bg-yellow-600 transition-colors"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
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
    </div>
  );
}
