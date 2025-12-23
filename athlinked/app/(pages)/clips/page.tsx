'use client';

import { useState, useEffect, useRef } from 'react';
import NavigationBar from '@/components/NavigationBar';
import FileUploadModal from '@/components/Clips/FileUploadModal';
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
} from 'lucide-react';

interface UserData {
  full_name: string;
  email: string;
}

interface Comment {
  id: string;
  author: string;
  authorAvatar: string;
  text: string;
  hasReplies?: boolean;
}

interface Reel {
  id: string;
  videoUrl: string;
  author: string;
  authorAvatar: string;
  caption: string;
  timestamp: string;
  likes: number;
  shares: number;
  comments: Comment[];
  commentCount: number;
}

export default function ClipsPage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentReelIndex, setCurrentReelIndex] = useState(0);
  const [mutedReels, setMutedReels] = useState<{ [key: string]: boolean }>({});
  const [likedReels, setLikedReels] = useState<{ [key: string]: boolean }>({});
  const [selectedReelId, setSelectedReelId] = useState<string | null>(null);
  const [showComments, setShowComments] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [commentTexts, setCommentTexts] = useState<{ [key: string]: string }>(
    {}
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: string]: HTMLVideoElement | null }>({});

  const [reels, setReels] = useState<Reel[]>([]);
  useEffect(() => {
    const initialMuted: { [key: string]: boolean } = {};
    reels.forEach(reel => {
      initialMuted[reel.id] = true;
    });
    setMutedReels(initialMuted);
  }, []);

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

      // Pause all videos except the current one
      reels.forEach((reel, index) => {
        const video = videoRefs.current[reel.id];
        if (video) {
          if (index === currentIndex) {
            video.play();
          } else {
            video.pause();
          }
        }
      });
    };

    container.addEventListener('scroll', handleScroll);

    if (reels.length > 0 && !selectedReelId) {
      setSelectedReelId(reels[0].id);
    }

    return () => container.removeEventListener('scroll', handleScroll);
  }, [reels, selectedReelId]);

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
    setReels(prev =>
      prev.map(reel => {
        if (reel.id === reelId) {
          return { ...reel, shares: reel.shares + 1 };
        }
        return reel;
      })
    );
  };

  const handleToggleMute = (reelId: string) => {
    setMutedReels(prev => ({
      ...prev,
      [reelId]: !prev[reelId],
    }));
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
            authorAvatar: 'https://via.placeholder.com/40',
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
          authorAvatar:
            clip.user_profile_url || 'https://via.placeholder.com/40',
          caption: clip.description || '',
          timestamp: formatTimestamp(clip.created_at),
          likes: clip.like_count || 0,
          shares: 0,
          commentCount: clip.comment_count || 0,
          comments: [],
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

      const response = await fetch('http://localhost:3001/api/clips', {
        method: 'POST',
        body: formData, // Don't set Content-Type, browser will set it with boundary
      });

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

  useEffect(() => {
    if (!loading && userData) {
      fetchClips();
    }
  }, [loading, userData]);

  const selectedReel = reels.find(r => r.id === selectedReelId) || null;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-200 items-center justify-center">
        <div className="text-gray-600">Loading...</div>
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
        <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
          <img
            src="https://via.placeholder.com/40"
            alt="Profile"
            className="w-full h-full object-cover"
          />
        </div>
      </header>

      {/* Content Area with Navigation and Main Content */}
      <div className="flex flex-1 overflow-hidden">
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
            <div
              ref={scrollContainerRef}
              className="w-full h-full overflow-y-scroll snap-y snap-mandatory hide-scrollbar"
              style={{
                scrollBehavior: 'smooth',
                scrollSnapType: 'y mandatory',
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
                          videoRefs.current[reel.id] = el;
                        }}
                        className="w-full h-full object-contain"
                        controls={false}
                        muted={mutedReels[reel.id] ?? true}
                        loop
                        playsInline
                        autoPlay={index === 0}
                      >
                        <source src={reel.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>

                      {/* Bottom Section - Profile, Username, and Description */}
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent z-10">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0 border-2 border-white">
                            <img
                              src={reel.authorAvatar}
                              alt={reel.author}
                              className="w-full h-full object-cover"
                            />
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
                      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6">
                        <button
                          onClick={() => handleLike(reel.id)}
                          className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
                        >
                          <Heart
                            size={28}
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
                          <Share2 size={28} />
                          <span className="text-xs font-medium">
                            {reel.shares}
                          </span>
                        </button>

                        <button
                          onClick={() => handleToggleMute(reel.id)}
                          className="flex flex-col items-center gap-1 text-white hover:scale-110 transition-transform"
                        >
                          {mutedReels[reel.id] ? (
                            <VolumeX size={28} />
                          ) : (
                            <Volume2 size={28} />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <div className="text-center text-gray-500">
                    <p className="text-lg mb-2">No videos yet</p>
                    <p className="text-sm">
                      Use the Create button to add your first video
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Create Button - Top Right */}
          <div className="absolute top-2 right-4 z-20">
            <button
              onClick={() => setShowUploadModal(true)}
              className="bg-[#CB9729] hover:bg-yellow-600 text-white rounded-full px-4 py-2 flex items-center gap-2 shadow-lg transition-colors"
            >
              <Plus size={20} />
              <span className="text-sm font-medium">Create</span>
            </button>
          </div>

          {/* Comments Section - Visible when comment button is pressed */}
          {showComments && (
            <div
              className="absolute top-1/2 transform -translate-y-1/2 bg-white border-l border-gray-200 flex flex-col z-10 shadow-lg"
              style={{
                right: '11.5rem', // Reduced from 2rem to 0.5rem to reduce gap
                width: 'calc(25.5rem * 1.1)', // Increased w-90 (22.5rem/360px) by 10%
                height: 'calc(66.666667vh * 1.1)', // Increased h-2/3 by 10%
              }}
            >
              {/* Comments Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <h2 className="text-lg font-semibold text-gray-900">
                  Comments
                </h2>
                <button
                  onClick={() => setShowComments(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 relative">
                {selectedReel && selectedReel.comments.length > 0 ? (
                  <>
                    {selectedReel.comments.map(comment => (
                      <div key={comment.id} className="flex gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                          <img
                            src={comment.authorAvatar}
                            alt={comment.author}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="mb-1">
                            <span className="font-semibold text-gray-900 text-sm">
                              {comment.author}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">
                            {comment.text}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <button className="hover:text-gray-700">
                              Reply
                            </button>
                            {comment.hasReplies && (
                              <button className="hover:text-gray-700">
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
                        <ChevronUp size={20} className="text-gray-600" />
                      </button>
                      <button className="w-10 h-10 rounded-full bg-white border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm">
                        <ChevronDown size={20} className="text-gray-600" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <MessageSquare size={48} className="mb-4 opacity-50" />
                    <p className="text-sm">No comments yet</p>
                    <p className="text-xs mt-1">Be the first to comment!</p>
                  </div>
                )}
              </div>

              {/* Comment Input */}
              <div className="p-4 border-t border-gray-200 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden flex-shrink-0">
                    <img
                      src="https://via.placeholder.com/32"
                      alt="Your profile"
                      className="w-full h-full object-cover"
                    />
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
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm text-gray-900"
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
    </div>
  );
}
