'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send } from 'lucide-react';
import type { PostData } from '../Post';

export interface CommentData {
  id: string;
  post_id: string;
  username: string;
  user_profile_url: string;
  comment: string;
  created_at: string;
  parent_comment_id?: string | null;
}

interface CommentsModalProps {
  open: boolean;
  post: PostData;
  currentUserProfileUrl?: string;
  currentUsername?: string;
  onClose: () => void;
  onCommentAdded?: () => void;
}

export default function CommentsModal({
  open,
  post,
  currentUserProfileUrl = '/assets/Header/profiledummy.jpeg',
  currentUsername = 'You',
  onClose,
  onCommentAdded,
}: CommentsModalProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  // Load comments from localStorage
  useEffect(() => {
    if (open) {
      loadComments();
    }
  }, [open, post.id]);

  // Scroll to bottom when comments change
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const loadComments = () => {
    const storedComments = localStorage.getItem(`athlinked_comments_${post.id}`);
    if (storedComments) {
      try {
        const parsedComments = JSON.parse(storedComments);
        setComments(parsedComments);
      } catch (error) {
        console.error('Error parsing comments:', error);
        setComments([]);
      }
    } else {
      setComments([]);
    }
  };

  // Organize comments into parent comments and replies
  const organizeComments = (allComments: CommentData[]) => {
    const parentComments = allComments.filter(c => !c.parent_comment_id);
    const replies = allComments.filter(c => c.parent_comment_id);
    
    return parentComments.map(parent => ({
      ...parent,
      replies: replies.filter(r => r.parent_comment_id === parent.id),
    }));
  };

  const getRepliesCount = (commentId: string) => {
    return comments.filter(c => c.parent_comment_id === commentId).length;
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;

    setIsLoading(true);

    const newComment: CommentData = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      post_id: post.id,
      username: currentUsername,
      user_profile_url: currentUserProfileUrl,
      comment: commentText.trim(),
      created_at: new Date().toISOString(),
      parent_comment_id: null,
    };

    // Get existing comments
    const existingComments = JSON.parse(
      localStorage.getItem(`athlinked_comments_${post.id}`) || '[]'
    );

    // Add new comment
    const updatedComments = [...existingComments, newComment];

    // Save to localStorage
    localStorage.setItem(
      `athlinked_comments_${post.id}`,
      JSON.stringify(updatedComments)
    );

    // Update state
    setComments(updatedComments);
    setCommentText('');

    // Update post comment count (only count parent comments)
    const parentCommentsCount = updatedComments.filter(c => !c.parent_comment_id).length;
    const posts = JSON.parse(localStorage.getItem('athlinked_posts') || '[]');
    const updatedPosts = posts.map((p: PostData) => {
      if (p.id === post.id) {
        return { ...p, comment_count: parentCommentsCount };
      }
      return p;
    });
    localStorage.setItem('athlinked_posts', JSON.stringify(updatedPosts));

    setIsLoading(false);

    if (onCommentAdded) {
      onCommentAdded();
    }
  };

  const handleReplyClick = (commentId: string) => {
    setReplyingTo(commentId);
    setShowReplies(prev => ({ ...prev, [commentId]: true }));
    // Focus on reply input after a brief delay
    setTimeout(() => {
      replyInputRef.current?.focus();
    }, 100);
  };

  const handleAddReply = (parentCommentId: string) => {
    if (!replyText.trim()) return;

    setIsLoading(true);

    const newReply: CommentData = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      post_id: post.id,
      username: currentUsername,
      user_profile_url: currentUserProfileUrl,
      comment: replyText.trim(),
      created_at: new Date().toISOString(),
      parent_comment_id: parentCommentId,
    };

    // Get existing comments
    const existingComments = JSON.parse(
      localStorage.getItem(`athlinked_comments_${post.id}`) || '[]'
    );

    // Add new reply
    const updatedComments = [...existingComments, newReply];

    // Save to localStorage
    localStorage.setItem(
      `athlinked_comments_${post.id}`,
      JSON.stringify(updatedComments)
    );

    // Update state
    setComments(updatedComments);
    setReplyText('');
    setReplyingTo(null);

    setIsLoading(false);

    if (onCommentAdded) {
      onCommentAdded();
    }
  };

  const toggleReplies = (commentId: string) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddComment();
    }
  };

  const handleReplyKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, parentCommentId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddReply(parentCommentId);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-5xl h-[70vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">Comments</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Side - Post Image (only if image exists) */}
          {post.image_url && (
            <div className="w-1/2 border-r border-gray-200 overflow-hidden bg-gray-100">
              <img
                src={post.image_url}
                alt={post.description || 'Post image'}
                className="w-full h-full object-contain"
              />
            </div>
          )}

          {/* Right Side - Comments */}
          <div className={`${post.image_url ? 'w-1/2' : 'w-full'} flex flex-col overflow-hidden`}>
            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4">
              {comments.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {organizeComments(comments).map(comment => {
                    const repliesCount = getRepliesCount(comment.id);
                    const isShowingReplies = showReplies[comment.id] ?? false;
                    const isReplying = replyingTo === comment.id;

                    return (
                      <div key={comment.id}>
                        {/* Parent Comment */}
                        <div className="flex gap-3">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border border-gray-200 flex-shrink-0">
                            <img
                              src={comment.user_profile_url}
                              alt={comment.username}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="font-semibold text-sm text-gray-900 mb-1">
                                {comment.username}
                              </p>
                              <p className="text-sm text-gray-700">{comment.comment}</p>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <button
                                onClick={() => handleReplyClick(comment.id)}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Reply
                              </button>
                              {repliesCount > 0 && (
                                <button
                                  onClick={() => toggleReplies(comment.id)}
                                  className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                  {isShowingReplies
                                    ? `Hide replies (${repliesCount})`
                                    : `View replies (${repliesCount})`}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Replies */}
                        {isShowingReplies && comment.replies && comment.replies.length > 0 && (
                          <div className="ml-11 mt-2 space-y-3 border-l-2 border-gray-200 pl-4">
                            {comment.replies.map(reply => (
                              <div key={reply.id} className="flex gap-3">
                                <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 border border-gray-200 flex-shrink-0">
                                  <img
                                    src={reply.user_profile_url}
                                    alt={reply.username}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1">
                                  <div className="bg-gray-50 rounded-lg p-2">
                                    <p className="font-semibold text-xs text-gray-900 mb-1">
                                      {reply.username}
                                    </p>
                                    <p className="text-xs text-gray-700">{reply.comment}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Reply Input */}
                        {isReplying && (
                          <div className="ml-11 mt-2">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 border border-gray-200 flex-shrink-0">
                                <img
                                  src={currentUserProfileUrl}
                                  alt={currentUsername}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <input
                                ref={replyInputRef}
                                type="text"
                                value={replyText}
                                onChange={e => setReplyText(e.target.value)}
                                onKeyPress={e => handleReplyKeyPress(e, comment.id)}
                                placeholder={`Reply to ${comment.username}...`}
                                className="flex-1 px-3 py-1.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#CB9729]/50 text-xs"
                                disabled={isLoading}
                              />
                              <button
                                onClick={() => handleAddReply(comment.id)}
                                disabled={!replyText.trim() || isLoading}
                                className="p-1.5 bg-[#CB9729] text-white rounded-full hover:bg-[#b78322] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                aria-label="Send reply"
                              >
                                <Send className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyText('');
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700 px-2"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={commentsEndRef} />
                </div>
              )}
            </div>

            {/* Add Comment Input */}
            <div className="border-t border-gray-200 p-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border border-gray-200 flex-shrink-0">
                  <img
                    src={currentUserProfileUrl}
                    alt={currentUsername}
                    className="w-full h-full object-cover"
                  />
                </div>
                <input
                  type="text"
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add comment"
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#CB9729]/50 text-sm"
                  disabled={isLoading}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || isLoading}
                  className="p-2 bg-[#CB9729] text-white rounded-full hover:bg-[#b78322] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Send comment"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

