'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ThumbsUp,
  MessageSquare,
  Share2,
  Bookmark,
  Trash2,
  MoreVertical,
  Briefcase,
  Plane,
  Trophy,
  Heart,
  Stethoscope,
  GraduationCap,
  Smile,
  Flag,
  ChevronRight,
  X,
  Download,
} from 'lucide-react';
import CommentsPanel from '../Comment/CommentsPanel';
import ShareModal from '../Share/ShareModal';
import SaveModal, { useSaveStatus, toggleSave } from '../Save/SaveModal';
import { getResourceUrl } from '@/utils/api';

export interface PostData {
  id: string;
  username: string;
  user_profile_url: string | null;
  user_id?: string;
  user_type?: string;
  post_type?: 'photo' | 'video' | 'article' | 'event' | 'text';
  caption?: string | null;
  media_url?: string | null;
  article_title?: string | null;
  article_body?: string | null;
  event_title?: string | null;
  event_date?: string | null;
  event_location?: string | null;
  event_type?: string | null;
  image_url?: string | null;
  description?: string | null;
  like_count: number;
  comment_count: number;
  save_count?: number;
  created_at: string;
}

interface PostProps {
  post: PostData;
  userProfileUrl?: string;
  currentUserProfileUrl?: string;
  currentUsername?: string;
  currentUserId?: string;
  currentUserType?: string;
  athleteIds?: string[]; // Array of athlete IDs if current user is a parent
  onCommentCountUpdate?: () => void;
  onPostDeleted?: () => void;
}

export default function Post({
  post,
  userProfileUrl,
  currentUserProfileUrl,
  currentUsername = 'You',
  currentUserId,
  currentUserType,
  athleteIds = [],
  onCommentCountUpdate,
  onPostDeleted,
}: PostProps) {
  const router = useRouter();
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProfileUrl = (profileUrl?: string | null): string | null => {
    if (!profileUrl || profileUrl.trim() === '') return null;
    if (profileUrl.startsWith('http://') || profileUrl.startsWith('https://')) {
      return profileUrl;
    }
    if (profileUrl.startsWith('/')) {
      if (profileUrl.startsWith('/assets')) {
        return profileUrl;
      }
      return getResourceUrl(profileUrl) || profileUrl;
    }
    return getResourceUrl(`/${profileUrl}`) || `/${profileUrl}`;
  };

  const getEventTypeIcon = (eventType: string | null | undefined) => {
    const iconMap: Record<
      string,
      React.ComponentType<{ className?: string }>
    > = {
      work: Briefcase,
      travel: Plane,
      sports: Trophy,
      relationship: Heart,
      health: Stethoscope,
      academy: GraduationCap,
      feeling: Smile,
      custom: Flag,
    };
    const normalizedType = eventType?.toLowerCase() || '';
    return iconMap[normalizedType] || Briefcase;
  };
  const [liked, setLiked] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [saveAlertMessage, setSaveAlertMessage] = useState('');
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showArticleModal, setShowArticleModal] = useState(false);

  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        const { apiGet } = await import('@/utils/api');
        try {
          const data = await apiGet<{
            success: boolean;
            comments?: any[];
          }>(`/posts/${post.id}/comments`);
          if (data.success && data.comments) {
            // Count all comments including replies
            let totalCount = data.comments.length;
            // Also count nested replies
            data.comments.forEach((c: any) => {
              if (c.replies && Array.isArray(c.replies)) {
                totalCount += c.replies.length;
              }
            });
            setCommentCount(totalCount);
          } else {
            // Use fallback count if API doesn't return success
            setCommentCount(post.comment_count);
          }
        } catch (apiError: any) {
          // Silently handle errors - use fallback count from post data
          // This is a non-critical feature and errors are expected for some user types
          setCommentCount(post.comment_count);
          return; // Exit early to prevent error propagation
        }
      } catch (error: any) {
        // Outer catch - completely silent error handling
        // Use fallback count from post data
        setCommentCount(post.comment_count);
        return;
      }
    };

    fetchCommentCount();
  }, [post.id, post.comment_count]);

  useEffect(() => {
    const checkSavedStatus = async () => {
      if (!currentUserId) return;

      try {
        const { apiGet } = await import('@/utils/api');
        const data = await apiGet<{
          success: boolean;
          isSaved?: boolean;
        }>(`/posts/${post.id}/save-status?user_id=${currentUserId}`);

        if (data.success) {
          setIsSaved(data.isSaved || false);
        }
      } catch (error) {
        console.error('Error checking save status:', error);
        // Fallback to localStorage for backward compatibility
        const savedPosts = JSON.parse(
          localStorage.getItem('athlinked_saved_posts') || '[]'
        );
        setIsSaved(savedPosts.includes(post.id));
      }
    };

    checkSavedStatus();
  }, [post.id, currentUserId]);

  // Check if current user has liked this post
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!currentUserId) return;

      try {
        const { apiGet } = await import('@/utils/api');
        const data = await apiGet<{
          success: boolean;
          isLiked?: boolean;
        }>(`/posts/${post.id}/like-status?user_id=${currentUserId}`);

        if (data.success) {
          setLiked(data.isLiked || false);
        }
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };

    checkLikeStatus();

    // Set up WebSocket for real-time like updates
    const { getSocket } = require('@/utils/useSocket');
    const socket = getSocket();

    if (socket) {
      const handleLikeUpdate = (data: {
        postId: string;
        likeCount: number;
      }) => {
        if (data.postId === post.id) {
          setLikeCount(data.likeCount);
        }
      };

      socket.on('post_like_update', handleLikeUpdate);

      return () => {
        socket.off('post_like_update', handleLikeUpdate);
      };
    }
  }, [post.id, currentUserId]);

  const handleLike = async () => {
    if (!currentUserId) {
      alert('Please log in to like posts');
      return;
    }
  
    // Prevent multiple simultaneous requests
    if (isLiking) return;
  
    const wasLiked = liked;
    setIsLiking(true);
    
    // Optimistic update
    setLiked(!liked);
    setLikeCount(prev => (liked ? prev - 1 : prev + 1));
  
    try {
      const { apiPost } = await import('@/utils/api');
  
      // Call like or unlike API based on current state
      const endpoint = wasLiked
        ? `/posts/${post.id}/unlike`
        : `/posts/${post.id}/like`;
  
      const result = await apiPost<{
        success: boolean;
        like_count?: number;
        message?: string;
      }>(endpoint, {
        user_id: currentUserId,
      });
  
      if (result.success) {
        // Update like count from API response
        if (result.like_count !== undefined) {
          setLikeCount(result.like_count);
        }
      } else {
        // Revert optimistic update on error
        setLiked(wasLiked);
        setLikeCount(prev => (wasLiked ? prev + 1 : prev - 1));
        alert(result.message || 'Failed to update like status');
      }
    } catch (error) {
      console.error('Error updating like status:', error);
      // Revert optimistic update on error
      setLiked(wasLiked);
      setLikeCount(prev => (wasLiked ? prev + 1 : prev - 1));
      alert('Failed to update like status. Please try again.');
    } finally {
      setIsLiking(false);
    }
  };

  const handleComment = () => {
    setShowComments(true);
  };

  const handleCommentAdded = async () => {
    try {
      const { apiGet } = await import('@/utils/api');
      try {
        const data = await apiGet<{
          success: boolean;
          comments?: any[];
        }>(`/posts/${post.id}/comments`);
        if (data.success && data.comments) {
          // Count all comments including replies
          let totalCount = data.comments.length;
          // Also count nested replies
          data.comments.forEach((c: any) => {
            if (c.replies && Array.isArray(c.replies)) {
              totalCount += c.replies.length;
            }
          });
          setCommentCount(totalCount);
        }
      } catch (apiError: any) {
        // Silently handle errors - this is a non-critical feature
        // Don't log errors to avoid console noise
      }
    } catch (error: any) {
      // Outer catch - completely silent error handling
      // Don't log errors
    }

    // IMPORTANT: Do not force parent refresh while the comments modal is open,
    // otherwise the Post component may re-mount and close the popup.
    if (onCommentCountUpdate && !showComments) {
      onCommentCountUpdate();
    }

    // Don't change showComments state - keep it as is
  };
  const handleShare = () => {
    setShowShare(true);
  };

  const handleShareComplete = () => {};

  const handleSave = async () => {
    if (!currentUserId) {
      alert('Please log in to save posts');
      return;
    }

    const wasSaved = isSaved;
    // Optimistic update
    setIsSaved(!isSaved);
    setSaveAlertMessage(
      wasSaved ? 'This post is unsaved' : 'This post is saved'
    );
    setShowSaveAlert(true);

    try {
      const { apiPost } = await import('@/utils/api');
      const endpoint = wasSaved ? '/save/unsave' : '/save';

      const result = await apiPost<{
        success: boolean;
        message?: string;
      }>(endpoint, {
        type: 'post',
        id: post.id,
        user_id: currentUserId,
      });

      if (!result.success) {
        // Revert optimistic update on error
        setIsSaved(wasSaved);
        alert(result.message || 'Failed to update save status');
      }
    } catch (error) {
      console.error('Error updating save status:', error);
      // Revert optimistic update on error
      setIsSaved(wasSaved);
      alert('Failed to update save status. Please try again.');
    }

    setTimeout(() => {
      setShowSaveAlert(false);
    }, 2000);
  };

  const handleDelete = async () => {
    // Check if user owns the post or is a parent of the post author
    const canDelete =
      (currentUserId && post.user_id && currentUserId === post.user_id) ||
      (currentUserType === 'parent' &&
        post.user_id &&
        athleteIds.includes(post.user_id));

    if (!canDelete) {
      return;
    }

    const confirmMessage =
      currentUserType === 'parent' && post.user_id !== currentUserId
        ? "Are you sure you want to delete this athlete's post? This action cannot be undone."
        : 'Are you sure you want to delete this post? This action cannot be undone.';

    if (!confirm(confirmMessage)) {
      return;
    }

    setIsDeleting(true);
    try {
      if (!currentUserId) {
        alert('User not logged in');
        return;
      }

      const { apiDelete } = await import('@/utils/api');
      const result = await apiDelete<{
        success: boolean;
        message?: string;
      }>(`/posts/${post.id}`);
      if (result.success) {
        if (onPostDeleted) {
          onPostDeleted();
        }
      } else {
        alert(result.message || 'Failed to delete post');
      }
    } catch (error: any) {
      console.error('Error deleting post:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to delete post. Please try again.';
      alert(errorMessage);
    } finally {
      setIsDeleting(false);
      setShowDeleteMenu(false);
    }
  };

  const isOwnPost =
    currentUserId && post.user_id && currentUserId === post.user_id;

  // Check if current user is a parent and this post belongs to their athlete
  const isAthletePost =
    currentUserType === 'parent' &&
    post.user_id &&
    athleteIds.includes(post.user_id);

  // Show delete option if user owns the post or is a parent of the post author
  const canDeletePost = isOwnPost || isAthletePost;

  const handleDownloadPDF = () => {
    if (!post.article_body) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const pdfTitle = 'Article';

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${pdfTitle}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
              line-height: 1.6;
            }
            .author { color: #666; margin-bottom: 20px; }
            .content { margin-top: 30px; }
            .content h1, .content h2, .content h3, .content h4 {
              margin-top: 20px;
              margin-bottom: 10px;
            }
            .content p { margin-bottom: 15px; }
            @media print {
              body { margin: 0; padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="author">
            <strong>Author:</strong> ${post.username}<br>
            <strong>Date:</strong> ${new Date(post.created_at).toLocaleDateString()}
          </div>
          <div class="content">
            ${post.article_body}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-lg sm:rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-gray-200 mb-2 sm:mb-4">
        <button
          type="button"
          onClick={() => {
            if (!post.user_id) return;
            router.push(`/profile?userId=${encodeURIComponent(post.user_id)}`);
          }}
          disabled={!post.user_id}
          className={`flex items-center gap-2 sm:gap-3 flex-1 text-left ${
            post.user_id ? 'cursor-pointer' : 'cursor-default'
          }`}
          aria-label="Open user profile"
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-gray-200 border border-gray-200 shrink-0 flex items-center justify-center">
            {(() => {
              const profileUrl = getProfileUrl(post.user_profile_url);
              if (profileUrl) {
                return (
                  <img
                    src={profileUrl}
                    alt={post.username}
                    className="w-full h-full object-cover"
                    onError={e => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('span')) {
                        const fallback = document.createElement('span');
                        fallback.className =
                          'text-gray-600 font-semibold text-xs';
                        fallback.textContent = getInitials(post.username);
                        parent.appendChild(fallback);
                      }
                    }}
                  />
                );
              }
              return (
                <span className="text-gray-600 font-semibold text-xs">
                  {getInitials(post.username)}
                </span>
              );
            })()}
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-500 font-medium">
              {post.user_type
                ? post.user_type.charAt(0).toUpperCase() +
                  post.user_type.slice(1).toLowerCase()
                : 'Athlete'}
            </p>
            <p className="text-base font-semibold text-gray-900 hover:underline">
              {post.username}
            </p>
          </div>
        </button>
        {canDeletePost && (
          <div className="relative">
            <button
              onClick={() => setShowDeleteMenu(!showDeleteMenu)}
              className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors"
              disabled={isDeleting}
            >
              <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            {showDeleteMenu && (
              <>
                <div
                  className="fixed inset-0 z-0"
                  onClick={() => setShowDeleteMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? 'Deleting...' : 'Delete Post'}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
      {post.post_type === 'article' && (
        <>
          {(post.media_url || post.image_url) && (
            <div className="w-full px-3 sm:px-6 md:px-8">
              <img
                src={
                  post.media_url && post.media_url.startsWith('http')
                    ? post.media_url
                    : getResourceUrl(post.media_url || post.image_url || '') ||
                      ''
                }
                alt="Article media"
                className="w-full h-auto object-cover rounded-lg sm:rounded-none"
                onError={e => {
                  if (process.env.NODE_ENV === 'development') {
                    const attemptedUrl =
                      post.media_url && post.media_url.startsWith('http')
                        ? post.media_url
                        : getResourceUrl(
                            post.media_url || post.image_url || ''
                          ) || '';
                    console.warn('Image failed to load:', attemptedUrl);
                  }
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}

          {post.article_body && (
            <div className="px-3 sm:px-6 md:px-8 py-3 sm:py-4">
              <div className="mb-4">
                {(() => {
                  const textContent = post.article_body.replace(/<[^>]*>/g, '');
                  const previewLength = 200;
                  const shouldTruncate = textContent.length > previewLength;
                  const preview = shouldTruncate
                    ? textContent.substring(0, previewLength) + '...'
                    : textContent;

                  return (
                    <>
                      {shouldTruncate ? (
                        <p className="text-sm sm:text-base text-gray-800 mb-2 sm:mb-3">
                          {preview}
                        </p>
                      ) : (
                        <div
                          className="text-sm sm:text-base text-gray-800 prose max-w-none mb-2 sm:mb-3 prose-sm sm:prose-base"
                          dangerouslySetInnerHTML={{
                            __html: post.article_body,
                          }}
                        />
                      )}
                      <div className="flex justify-end gap-2 sm:gap-3 mt-3 sm:mt-4">
                        <button
                          onClick={() => setShowArticleModal(true)}
                          className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base bg-[#CB9729] text-white rounded-md hover:bg-[#b78322] transition-colors"
                        >
                          Read more
                          <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            </div>
          )}
        </>
      )}

      {post.post_type === 'event' && (
        <>
          {(post.media_url || post.image_url) && (
            <div className="w-full relative px-3 sm:px-6 md:px-8">
              {(post.media_url && post.media_url.match(/\.(mp4|mov)$/i)) ||
              (post.image_url && post.image_url.match(/\.(mp4|mov)$/i)) ? (
                <video
                  src={
                    post.media_url && post.media_url.startsWith('http')
                      ? post.media_url
                      : getResourceUrl(
                          post.media_url || post.image_url || ''
                        ) || ''
                  }
                  controls
                  className="w-full h-auto object-cover"
                />
              ) : (
                <img
                  src={
                    post.media_url && post.media_url.startsWith('http')
                      ? post.media_url
                      : getResourceUrl(
                          post.media_url || post.image_url || ''
                        ) || ''
                  }
                  alt={post.event_title || 'Event image'}
                  className="w-full h-auto object-cover"
                  onError={e => {
                    if (process.env.NODE_ENV === 'development') {
                      const attemptedUrl =
                        post.media_url && post.media_url.startsWith('http')
                          ? post.media_url
                          : getResourceUrl(
                              post.media_url || post.image_url || ''
                            ) || '';
                      console.warn('Image failed to load:', attemptedUrl);
                    }
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-10">
                <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-blue-500 rounded-full flex items-center justify-center shadow-xl border-2 md:border-4 border-white">
                  {(() => {
                    const IconComponent = getEventTypeIcon(post.event_type);
                    return (
                      <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {post.event_title && (
            <div
              className={`px-3 sm:px-6 text-center ${post.media_url || post.image_url ? 'pt-8 sm:pt-10 md:pt-12 pb-4 sm:pb-6' : 'py-4 sm:py-6'}`}
            >
              {!(post.media_url || post.image_url) && (
                <div className="flex justify-center mb-3 sm:mb-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-blue-500 rounded-full flex items-center justify-center shadow-xl border-2 md:border-4 border-white">
                    {(() => {
                      const IconComponent = getEventTypeIcon(post.event_type);
                      return (
                        <IconComponent className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-white" />
                      );
                    })()}
                  </div>
                </div>
              )}
              <h3 className="text-md sm:text-xl md:text-2xl font-bold text-gray-900 mb-2 ">
                {post.event_title}
              </h3>
              {post.caption && (
                <p className="text-sm sm:text-base text-gray-600 mb-2 ">
                  {post.caption}
                </p>
              )}
              {post.event_date && (
                <p className="text-xs sm:text-sm md:text-md text-gray-600 mb-2">
                  {new Date(post.event_date).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              )}
              {post.event_location && (
                <p className="text-xs sm:text-sm md:text-md text-gray-600 ">
                  📍 {post.event_location}
                </p>
              )}
              {post.caption && (
                <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                  {post.caption}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {(post.post_type === 'photo' ||
        post.post_type === 'video' ||
        post.post_type === 'text' ||
        !post.post_type) && (
        <>
          {(post.caption || post.description) && (
            <p className="text-sm sm:text-base text-gray-800 px-3 sm:px-6 mb-3 sm:mb-4">
              {post.caption || post.description}
            </p>
          )}

          {(post.media_url || post.image_url) && post.post_type !== 'text' && (
            <div className="w-full aspect-auto px-3 sm:px-6 md:px-12">
              {post.post_type === 'video' ||
              (post.media_url && post.media_url.match(/\.(mp4|mov)$/i)) ? (
                <video
                  src={
                    post.media_url && post.media_url.startsWith('http')
                      ? post.media_url
                      : getResourceUrl(
                          post.media_url || post.image_url || ''
                        ) || ''
                  }
                  controls
                  className="w-full h-auto object-cover"
                />
              ) : (
                <img
                  src={
                    post.media_url && post.media_url.startsWith('http')
                      ? post.media_url
                      : getResourceUrl(
                          post.media_url || post.image_url || ''
                        ) || ''
                  }
                  alt={post.caption || post.description || 'Post media'}
                  className="w-full h-auto object-cover"
                  onError={e => {
                    // Only log in development, and log the full URL that was attempted
                    if (process.env.NODE_ENV === 'development') {
                      const attemptedUrl =
                        post.media_url && post.media_url.startsWith('http')
                          ? post.media_url
                          : getResourceUrl(
                              post.media_url || post.image_url || ''
                            ) || '';
                      console.warn('Image failed to load:', attemptedUrl);
                    }
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>
          )}
        </>
      )}

      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2 sm:mb-3 pb-2 sm:pb-3 border-b border-gray-200">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <ThumbsUp
              className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600"
              fill="currentColor"
            />
            <span className="text-xs sm:text-sm font-medium text-gray-600">
              {likeCount}
            </span>
          </div>
          <span className="text-xs sm:text-sm text-gray-600">
            {commentCount} comments
          </span>
        </div>

        <div className="flex items-center justify-between gap-14 sm:gap-2">
        <button
  onClick={handleLike}
  disabled={isLiking}
  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md transition-colors flex-1 sm:flex-none ${
    liked
      ? 'text-[#CB9729] hover:bg-[#CB9729]/10'
      : 'text-gray-600 hover:bg-gray-50'
  } disabled:opacity-50 `}
>
  <ThumbsUp
    className={`w-4 h-4 sm:w-5 sm:h-5 ${liked ? 'fill-current' : ''}`}
  />
  <span className="text-xs sm:text-sm font-medium hidden sm:inline">
    Like
  </span>
</button>

          <button
            onClick={handleComment}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-gray-600 hover:bg-gray-50 transition-colors flex-1 sm:flex-none"
          >
            <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">
              Comment
            </span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md text-gray-600 hover:bg-gray-50 transition-colors flex-1 sm:flex-none"
          >
            <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">
              Share
            </span>
          </button>

          <button
            onClick={handleSave}
            className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-md transition-colors flex-1 sm:flex-none ${
              isSaved
                ? 'text-[#CB9729] hover:bg-[#CB9729]/10'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Bookmark
              className={`w-4 h-4 sm:w-5 sm:h-5 ${isSaved ? 'fill-current' : ''}`}
            />
            <span className="text-xs sm:text-sm font-medium hidden sm:inline">
              {isSaved ? 'Saved' : 'Save'}
            </span>
          </button>
        </div>
      </div>

      <ShareModal
        open={showShare}
        post={post}
        onClose={() => setShowShare(false)}
        onShare={handleShareComplete}
        currentUserId={currentUserId}
      />

      <SaveModal
        postId={post.id}
        showAlert={showSaveAlert}
        alertMessage={saveAlertMessage}
        isSaved={isSaved}
      />

      {showArticleModal && post.post_type === 'article' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowArticleModal(false)}
          />
          <div className="relative z-10 w-full max-w-4xl bg-white rounded-lg sm:rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
                Article
              </h2>
              <button
                type="button"
                onClick={() => setShowArticleModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200 flex items-center gap-2 sm:gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden bg-gray-200 border border-gray-200 shrink-0 flex items-center justify-center">
                {(() => {
                  const profileUrl = getProfileUrl(post.user_profile_url);
                  if (profileUrl) {
                    return (
                      <img
                        src={profileUrl}
                        alt={post.username}
                        className="w-full h-full object-cover"
                        onError={e => {
                          const target = e.currentTarget;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('span')) {
                            const fallback = document.createElement('span');
                            fallback.className =
                              'text-gray-600 font-semibold text-sm';
                            fallback.textContent = getInitials(post.username);
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    );
                  }
                  return (
                    <span className="text-gray-600 font-semibold text-sm">
                      {getInitials(post.username)}
                    </span>
                  );
                })()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{post.username}</p>
                <p className="text-sm text-gray-600">
                  {post.user_type
                    ? post.user_type.charAt(0).toUpperCase() +
                      post.user_type.slice(1).toLowerCase()
                    : 'Athlete'}
                </p>
              </div>
            </div>

            {(post.media_url || post.image_url) && (
              <div className="w-full">
                <img
                  src={
                    post.media_url && post.media_url.startsWith('http')
                      ? post.media_url
                      : getResourceUrl(
                          post.media_url || post.image_url || ''
                        ) || ''
                  }
                  alt="Article media"
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            <div className="px-4 sm:px-6 py-4 sm:py-6">
              {post.article_body && (
                <div
                  className="prose max-w-none text-gray-800"
                  dangerouslySetInnerHTML={{ __html: post.article_body }}
                />
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-3 sm:py-4 flex justify-end">
              <button
                onClick={handleDownloadPDF}
                className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-[#CB9729] text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-1.5 sm:gap-2"
              >
                <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Download PDF File</span>
                <span className="sm:hidden">PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {showComments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowComments(false)}
          />

          <div
            className="relative z-10 w-full max-h-[80vh] h-full sm:max-h-none sm:h-[80vh] sm:max-w-5xl bg-white sm:rounded-xl shadow-2xl overflow-hidden flex flex-col sm:flex-row mx-3 sm:mx-0"
            onClick={e => e.stopPropagation()}
          >
            {/* Image/media: hidden on mobile, show from sm up */}
            <div className="hidden sm:flex w-full sm:w-1/2 h-1/3 sm:h-full bg-black items-center justify-center">
              {post.media_url || post.image_url ? (
                (() => {
                  const src =
                    post.media_url && post.media_url.startsWith('http')
                      ? post.media_url
                      : getResourceUrl(
                          post.media_url || post.image_url || ''
                        ) || '';
                  const isVideo =
                    post.post_type === 'video' ||
                    (post.media_url && post.media_url.match(/\.(mp4|mov)$/i));

                  if (isVideo) {
                    return (
                      <video
                        src={src}
                        controls
                        className="w-full h-full object-contain"
                      />
                    );
                  }

                  // Image: keep black theme, but add a blurred cover background so it looks nicer
                  return (
                    <div className="relative w-full h-full bg-black overflow-hidden ">
                      <img
                        src={src}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-60"
                      />
                      <div className="absolute inset-0 bg-white" />
                      <img
                        src={src}
                        alt={post.caption || post.description || 'Post media'}
                        className="relative w-full h-full object-contain"
                      />
                    </div>
                  );
                })()
              ) : (
                <div className="text-white">No media available</div>
              )}
            </div>
            {/* Comment panel: full width/height on mobile, half on sm+ */}
            <div className="w-full sm:w-1/2 h-full flex flex-col min-h-0">
              <CommentsPanel
                post={post}
                currentUserProfileUrl={currentUserProfileUrl}
                currentUsername={currentUsername}
                currentUserId={currentUserId}
                onClose={() => setShowComments(false)}
                onCommentAdded={handleCommentAdded}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
