'use client';

import { useState, useEffect } from 'react';
import {
  ThumbsUp,
  MessageSquare,
  Share2,
  Bookmark,
  Trash2,
  MoreVertical,
} from 'lucide-react';
import CommentsPanel from '../Comment/CommentsPanel';
import ShareModal from '../Share/ShareModal';
import SaveModal, { useSaveStatus, toggleSave } from '../Save/SaveModal';

export interface PostData {
  id: string;
  username: string;
  user_profile_url: string | null;
  user_id?: string;
  post_type?: 'photo' | 'video' | 'article' | 'event';
  caption?: string | null;
  media_url?: string | null;
  article_title?: string | null;
  article_body?: string | null;
  event_title?: string | null;
  event_date?: string | null;
  event_location?: string | null;
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
  onCommentCountUpdate?: () => void;
  onPostDeleted?: () => void;
}

export default function Post({
  post,
  userProfileUrl = '/assets/Header/profiledummy.jpeg',
  currentUserProfileUrl = '/assets/Header/profiledummy.jpeg',
  currentUsername = 'You',
  currentUserId,
  onCommentCountUpdate,
  onPostDeleted,
}: PostProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [saveAlertMessage, setSaveAlertMessage] = useState('');
  const [showDeleteMenu, setShowDeleteMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch comment count from API
  useEffect(() => {
    const fetchCommentCount = async () => {
      try {
        const response = await fetch(`http://localhost:3001/api/posts/${post.id}/comments`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.comments) {
            // Count only parent comments (not replies)
            const parentComments = data.comments.filter((c: any) => !c.parent_comment_id);
            setCommentCount(parentComments.length);
          }
        }
      } catch (error) {
        console.error('Error fetching comment count:', error);
        // Fallback to post.comment_count if API fails
        setCommentCount(post.comment_count);
      }
    };

    fetchCommentCount();
  }, [post.id, post.comment_count]);

  // Check save status on mount
  useEffect(() => {
    const checkSavedStatus = () => {
      const savedPosts = JSON.parse(
        localStorage.getItem('athlinked_saved_posts') || '[]'
      );
      setIsSaved(savedPosts.includes(post.id));
    };

    checkSavedStatus();
  }, [post.id]);

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? prev - 1 : prev + 1);
  };

  const handleComment = () => {
    setShowComments(true);
  };

  const handleCommentAdded = async () => {
    // Fetch updated comment count from API
    try {
      const response = await fetch(`http://localhost:3001/api/posts/${post.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.comments) {
          // Count only parent comments (not replies)
          const parentComments = data.comments.filter((c: any) => !c.parent_comment_id);
          setCommentCount(parentComments.length);
        }
      }
    } catch (error) {
      console.error('Error fetching comment count:', error);
    }
    
    if (onCommentCountUpdate) {
      onCommentCountUpdate();
    }
  };

  const handleShare = () => {
    setShowShare(true);
  };

  const handleShareComplete = (selectedUsers: string[], message: string) => {
    console.log('Post shared with:', selectedUsers, 'Message:', message);
    // You can add additional logic here, like showing a success message
  };

  const handleSave = () => {
    const newSavedStatus = toggleSave(post.id);
    setIsSaved(newSavedStatus);
    
    // Show alert
    if (newSavedStatus) {
      setSaveAlertMessage('This post is saved');
    } else {
      setSaveAlertMessage('This post is unsaved');
    }
    
    setShowSaveAlert(true);
    setTimeout(() => {
      setShowSaveAlert(false);
    }, 2000);
  };

  const handleDelete = async () => {
    if (!currentUserId || post.user_id !== currentUserId) {
      return;
    }

    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
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

      const userData = await userResponse.json();
      if (!userData.success || !userData.user) {
        throw new Error('User not found');
      }

      const response = await fetch(`http://localhost:3001/api/posts/${post.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData.user.id,
        }),
      });

      const result = await response.json();
      if (result.success) {
        if (onPostDeleted) {
          onPostDeleted();
        }
      } else {
        alert(result.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteMenu(false);
    }
  };

  const isOwnPost = currentUserId && post.user_id && currentUserId === post.user_id;

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 mb-4">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border border-gray-200 flex-shrink-0">
          <img
            src={post.user_profile_url || userProfileUrl}
            alt={post.username}
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-500 font-medium">Athlete</p>
          <p className="text-base font-semibold text-gray-900">{post.username}</p>
        </div>
        {isOwnPost && (
          <div className="relative">
            <button
              onClick={() => setShowDeleteMenu(!showDeleteMenu)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              disabled={isDeleting}
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
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
      {/* Content based on post type */}
      {post.post_type === 'article' && (
        <>
          {post.article_title && (
            <div className="px-6 mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {post.article_title}
              </h3>
              {post.caption && (
                <p className="text-md text-gray-600 mb-3">
                  {post.caption}
                </p>
              )}
              {post.article_body && (
                <p className="text-md text-gray-800 whitespace-pre-wrap">
                  {post.article_body}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {post.post_type === 'event' && (
        <>
          {post.event_title && (
            <div className="px-6 mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {post.event_title}
              </h3>
              {post.caption && (
                <p className="text-md text-gray-600 mb-3">
                  {post.caption}
                </p>
              )}
              {post.event_date && (
                <p className="text-md text-gray-600 mb-1">
                  📅 {new Date(post.event_date).toLocaleDateString()}
                </p>
              )}
              {post.event_location && (
                <p className="text-md text-gray-600">
                  📍 {post.event_location}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {(post.post_type === 'photo' || post.post_type === 'video' || !post.post_type) && (
        <>
          {(post.caption || post.description) && (
            <p className="text-md text-gray-800 px-6 mb-4">
              {post.caption || post.description}
            </p>
          )}

          {(post.media_url || post.image_url) && (
            <div className="w-full aspect-auto px-12">
              {post.post_type === 'video' || (post.media_url && post.media_url.match(/\.(mp4|mov)$/i)) ? (
                <video
                  src={post.media_url && post.media_url.startsWith('http') ? post.media_url : `http://localhost:3001${post.media_url || post.image_url || ''}`}
                  controls
                  className="w-full h-auto object-cover"
                />
              ) : (
                <img
                  src={post.media_url && post.media_url.startsWith('http') ? post.media_url : `http://localhost:3001${post.media_url || post.image_url || ''}`}
                  alt={post.caption || post.description || 'Post media'}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    console.error('Error loading image:', post.media_url);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
            </div>
          )}
        </>
      )}

      {/* Footer */}
      <div className="p-4">
        {/* Likes and Comments Count */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-gray-600" fill="currentColor" />
            <span className="text-sm font-medium text-gray-600">{likeCount}</span>
          </div>
          <span className="text-sm text-gray-600">{commentCount} comments</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              liked
                ? 'text-[#CB9729] hover:bg-[#CB9729]/10'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ThumbsUp
              className={`w-5 h-5 ${liked ? 'fill-current' : ''}`}
            />
            <span className="text-sm font-medium">Like</span>
          </button>

          <button
            onClick={handleComment}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-sm font-medium">Comment</span>
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Share2 className="w-5 h-5" />
            <span className="text-sm font-medium">Share</span>
          </button>

          <button
            onClick={handleSave}
            className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
              isSaved
                ? 'text-[#CB9729] hover:bg-[#CB9729]/10'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Bookmark
              className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`}
            />
            <span className="text-sm font-medium">{isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        {/* Description */}
      </div>

      {/* Share Modal */}
      <ShareModal
        open={showShare}
        post={post}
        onClose={() => setShowShare(false)}
        onShare={handleShareComplete}
      />

      {/* Save Alert */}
      <SaveModal
        postId={post.id}
        showAlert={showSaveAlert}
        alertMessage={saveAlertMessage}
        isSaved={isSaved}
      />

      {/* Comments Modal */}
      {showComments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowComments(false)}
          />

          {/* Modal */}
          <div 
            className="relative z-10 w-full max-w-5xl h-[80vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-row"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Side - Post Image */}
            <div className="w-1/2 bg-black flex items-center justify-center">
              {post.media_url || post.image_url ? (
                post.post_type === 'video' || (post.media_url && post.media_url.match(/\.(mp4|mov)$/i)) ? (
                  <video
                    src={post.media_url && post.media_url.startsWith('http') ? post.media_url : `http://localhost:3001${post.media_url || post.image_url || ''}`}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={post.media_url && post.media_url.startsWith('http') ? post.media_url : `http://localhost:3001${post.media_url || post.image_url || ''}`}
                    alt={post.caption || post.description || 'Post media'}
                    className="w-full h-full object-contain"
                  />
                )
              ) : (
                <div className="text-white">No media available</div>
              )}
            </div>

            {/* Right Side - Comments */}
            <div className="w-1/2 flex flex-col">
              <CommentsPanel
                post={post}
                currentUserProfileUrl={currentUserProfileUrl}
                currentUsername={currentUsername}
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
