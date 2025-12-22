'use client';

import { useState, useEffect } from 'react';
import {
  ThumbsUp,
  MessageSquare,
  Share2,
  Bookmark,
} from 'lucide-react';
import CommentsModal from '../Comment/CommentsModal';
import ShareModal from '../Share/ShareModal';
import SaveModal, { useSaveStatus, toggleSave } from '../Save/SaveModal';

export interface PostData {
  id: string;
  username: string;
  user_profile_url: string | null;
  image_url: string | null;
  description: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
}

interface PostProps {
  post: PostData;
  userProfileUrl?: string;
  currentUserProfileUrl?: string;
  currentUsername?: string;
  onCommentCountUpdate?: () => void;
}

export default function Post({
  post,
  userProfileUrl = '/assets/Header/profiledummy.jpeg',
  currentUserProfileUrl = '/assets/Header/profiledummy.jpeg',
  currentUsername = 'You',
  onCommentCountUpdate,
}: PostProps) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showSaveAlert, setShowSaveAlert] = useState(false);
  const [saveAlertMessage, setSaveAlertMessage] = useState('');

  // Update comment count from localStorage
  useEffect(() => {
    const updateCommentCount = () => {
      const storedComments = localStorage.getItem(`athlinked_comments_${post.id}`);
      if (storedComments) {
        try {
          const parsedComments = JSON.parse(storedComments);
          setCommentCount(parsedComments.length);
        } catch (error) {
          console.error('Error parsing comments:', error);
        }
      }
    };

    updateCommentCount();
    // Listen for storage changes
    window.addEventListener('storage', updateCommentCount);
    return () => window.removeEventListener('storage', updateCommentCount);
  }, [post.id]);

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

  const handleCommentAdded = () => {
    // Update comment count
    const storedComments = localStorage.getItem(`athlinked_comments_${post.id}`);
    if (storedComments) {
      try {
        const parsedComments = JSON.parse(storedComments);
        setCommentCount(parsedComments.length);
      } catch (error) {
        console.error('Error parsing comments:', error);
      }
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
      </div>
      {/* Description */}
      {post.description && (
        <p className="text-md text-gray-800 px-6 mb-4">
          {post.description}
        </p>
      )}
      
      {/* Image - Only show if image_url exists */}
      {post.image_url && (
        <div className="w-full aspect-auto px-12">
          <img
            src={post.image_url}
            alt={post.description || 'Post image'}
            className="w-full h-auto object-cover"
          />
        </div>
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

      {/* Comments Modal */}
      <CommentsModal
        open={showComments}
        post={post}
        currentUserProfileUrl={currentUserProfileUrl}
        currentUsername={currentUsername}
        onClose={() => setShowComments(false)}
        onCommentAdded={handleCommentAdded}
      />

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
    </div>
  );
}
