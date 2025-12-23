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

interface CommentsPanelProps {
  post: PostData;
  currentUserProfileUrl?: string;
  currentUsername?: string;
  onClose: () => void;
  onCommentAdded?: () => void;
}

export default function CommentsPanel({
  post,
  currentUserProfileUrl = '/assets/Header/profiledummy.jpeg',
  currentUsername = 'You',
  onClose,
  onCommentAdded,
}: CommentsPanelProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);

  // Load comments from API
  useEffect(() => {
    loadComments();
  }, [post.id]);

  // Scroll to bottom when comments change
  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  const loadComments = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/posts/${post.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.comments) {
          setComments(data.comments);
        }
      }
    } catch (error) {
      console.error('Error loading comments:', error);
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

  const handleAddComment = async () => {
    if (!commentText.trim()) return;

    setIsLoading(true);

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

      const response = await fetch(`http://localhost:3001/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData.user.id,
          comment: commentText.trim(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setCommentText('');
        await loadComments();
        if (onCommentAdded) {
          onCommentAdded();
        }
      } else {
        alert(result.message || 'Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplyClick = (commentId: string) => {
    setReplyingTo(commentId);
    setShowReplies(prev => ({ ...prev, [commentId]: true }));
    setTimeout(() => {
      replyInputRef.current?.focus();
    }, 100);
  };

  const handleAddReply = async (parentCommentId: string) => {
    if (!replyText.trim()) return;

    setIsLoading(true);

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

      const response = await fetch(`http://localhost:3001/api/posts/comments/${parentCommentId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData.user.id,
          comment: replyText.trim(),
        }),
      });

      const result = await response.json();
      if (result.success) {
        setReplyText('');
        setReplyingTo(null);
        await loadComments();
        if (onCommentAdded) {
          onCommentAdded();
        }
      } else {
        alert(result.message || 'Failed to add reply');
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('Failed to add reply. Please try again.');
    } finally {
      setIsLoading(false);
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
      e.stopPropagation();
      if (commentText.trim() && !isLoading) {
        handleAddComment();
      }
      return false;
    }
  };

  const handleReplyKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, parentCommentId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddReply(parentCommentId);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
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

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4" style={{ scrollbarWidth: 'thin' }}>
        {comments.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <p className="text-sm">No comments yet. Be the first to comment!</p>
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
                        src={comment.user_profile_url?.startsWith('http') ? comment.user_profile_url : (comment.user_profile_url || '/assets/Header/profiledummy.jpeg')}
                        alt={comment.username}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = '/assets/Header/profiledummy.jpeg';
                        }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-semibold text-sm text-gray-900 mb-1">
                          {comment.username}
                        </p>
                        <p className="text-sm text-gray-700 break-words">{comment.comment}</p>
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
                              src={reply.user_profile_url?.startsWith('http') ? reply.user_profile_url : (reply.user_profile_url || '/assets/Header/profiledummy.jpeg')}
                              alt={reply.username}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/assets/Header/profiledummy.jpeg';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="bg-gray-50 rounded-lg p-2">
                              <p className="font-semibold text-xs text-gray-900 mb-1">
                                {reply.username}
                              </p>
                              <p className="text-xs text-gray-700 break-words">{reply.comment}</p>
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
                          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#CB9729]/50 text-xs text-gray-900"
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
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                if (commentText.trim() && !isLoading) {
                  handleAddComment();
                }
              }
            }}
            placeholder="Add comment"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#CB9729]/50 text-sm text-gray-900"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddComment();
            }}
            disabled={!commentText.trim() || isLoading}
            className="p-2 bg-[#CB9729] text-white rounded-full hover:bg-[#b78322] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send comment"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

