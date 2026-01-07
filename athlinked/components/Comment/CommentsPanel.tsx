'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Send, Smile } from 'lucide-react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';
import type { PostData } from '../Post';
import MentionInputField from '../Mention/MentionInputField';

export interface CommentData {
  id: string;
  post_id: string;
  username: string;
  user_profile_url: string;
  comment: string;
  created_at: string;
  parent_comment_id?: string | null;
  parent_username?: string | null;
  replies?: CommentData[];
}

interface CommentsPanelProps {
  post: PostData;
  currentUserProfileUrl?: string;
  currentUsername?: string;
  currentUserId?: string;
  onClose: () => void;
  onCommentAdded?: () => void;
}

export default function CommentsPanel({
  post,
  currentUserProfileUrl,
  currentUsername = 'You',
  currentUserId,
  onClose,
  onCommentAdded,
}: CommentsPanelProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyText, setReplyText] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const replyInputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  useEffect(() => {
    loadComments();
  }, [post.id]);

  useEffect(() => {
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

  // Close emoji picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showEmojiPicker &&
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest(
          'button[aria-label="Toggle emoji picker"]'
        )
      ) {
        setShowEmojiPicker(false);
      }
    };

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showEmojiPicker]);

  const loadComments = async () => {
    try {
      const { apiGet } = await import('@/utils/api');
      const data = await apiGet<{
        success: boolean;
        comments?: CommentData[];
      }>(`/posts/${post.id}/comments`);
      if (data.success && data.comments) {
        // Backend already returns comments with nested replies
        setComments(data.comments);
      }
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const organizeComments = (allComments: CommentData[]) => {
    // Backend already returns comments with nested replies structure
    // Just return them as-is
    return allComments;
  };

  const getRepliesCount = (commentId: string) => {
    // Find the comment and count its nested replies
    const comment = comments.find(c => c.id === commentId);
    return comment?.replies?.length || 0;
  };

  const handleAddComment = async (
    e?: React.MouseEvent | React.KeyboardEvent
  ) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!commentText.trim()) return;

    setIsLoading(true);

    try {
      const { apiPost } = await import('@/utils/api');

      const result = await apiPost<{ success: boolean; message?: string }>(
        `/posts/${post.id}/comments`,
        {
          comment: commentText.trim(),
        }
      );

      if (result.success) {
        setCommentText('');
        await loadComments();
        if (onCommentAdded) {
          onCommentAdded();
        }
      } else {
        console.error('Comment failed:', result.message);
        alert(result.message || 'Failed to add comment');
      }
    } catch (error: any) {
      console.error('Error adding comment:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to add comment. Please try again.';
      alert(errorMessage);
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

  const handleAddReply = async (
    parentCommentId: string,
    e?: React.MouseEvent | React.KeyboardEvent
  ) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!replyText.trim()) return;

    setIsLoading(true);

    try {
      const { apiPost } = await import('@/utils/api');

      const requestBody: any = {
        comment: replyText.trim(),
      };

      // Add user_id if available (some backends might need it)
      if (currentUserId) {
        requestBody.user_id = currentUserId;
      }

      const response = await apiPost<{ success: boolean; message?: string }>(
        `/posts/comments/${parentCommentId}/reply`,
        requestBody
      );

      if (response.success) {
        setReplyText('');
        setReplyingTo(null);
        await loadComments();
        if (onCommentAdded) {
          onCommentAdded();
        }
      } else {
        console.error('Reply failed:', response.message);
        alert(response.message || 'Failed to add reply');
      }
    } catch (error: any) {
      console.error('Error adding reply:', error);
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to add reply. Please try again.';
      alert(errorMessage);
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
    }
  };

  const handleReplyKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>,
    parentCommentId: string
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      e.stopPropagation();
      handleAddReply(parentCommentId, e);
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
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
      <div
        className="flex-1 overflow-y-auto p-4"
        style={{ scrollbarWidth: 'thin' }}
      >
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
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border border-gray-200 shrink-0 flex items-center justify-center">
                      {comment.user_profile_url &&
                      comment.user_profile_url.trim() !== '' ? (
                        <img
                          src={
                            comment.user_profile_url.startsWith('http')
                              ? comment.user_profile_url
                              : `http://localhost:3001${comment.user_profile_url}`
                          }
                          alt={comment.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-600 font-semibold text-xs">
                          {getInitials(comment.username)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="font-semibold text-sm text-gray-900 mb-1">
                          {comment.username}
                        </p>
                        <p className="text-sm text-gray-700 wrap-break-word">
                          {comment.comment}
                        </p>
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
                  {isShowingReplies &&
                    comment.replies &&
                    comment.replies.length > 0 && (
                      <div className="ml-11 mt-2 space-y-3 border-l-2 border-gray-200 pl-4">
                        {comment.replies.map(reply => (
                          <div key={reply.id} className="flex gap-3">
                            <div className="w-7 h-7 rounded-full overflow-hidden bg-gray-200 border border-gray-200 shrink-0 flex items-center justify-center">
                              {reply.user_profile_url &&
                              reply.user_profile_url.trim() !== '' ? (
                                <img
                                  src={
                                    reply.user_profile_url.startsWith('http')
                                      ? reply.user_profile_url
                                      : `http://localhost:3001${reply.user_profile_url}`
                                  }
                                  alt={reply.username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-gray-600 font-semibold text-xs">
                                  {getInitials(reply.username)}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="bg-gray-50 rounded-lg p-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <p className="font-semibold text-xs text-gray-900">
                                    {reply.username}
                                  </p>
                                  {reply.parent_username && (
                                    <>
                                      <span className="text-xs text-gray-500">
                                        replying to
                                      </span>
                                      <p className="font-semibold text-xs text-[#CB9729]">
                                        {reply.parent_username}
                                      </p>
                                    </>
                                  )}
                                </div>
                                <p className="text-xs text-gray-700 break-words">
                                  {reply.comment}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Reply Input */}
                  {isReplying && (
                    <div
                      className="ml-11 mt-2"
                      onClick={e => e.stopPropagation()}
                      onKeyDown={e => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-200 border border-gray-200 shrink-0 flex items-center justify-center">
                          {currentUserProfileUrl ? (
                            <img
                              src={currentUserProfileUrl}
                              alt={currentUsername}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-gray-600 font-semibold text-xs">
                              {getInitials(currentUsername)}
                            </span>
                          )}
                        </div>
                        {currentUserId ? (
                          <MentionInputField
                            value={replyText}
                            onChange={setReplyText}
                            currentUserId={currentUserId}
                            placeholder={`Reply to ${comment.username}...`}
                            className="flex-1 px-3 py-1.5 rounded-full text-xs"
                            type="input"
                            onKeyDown={e => {
                              if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                e.stopPropagation();
                                handleAddReply(comment.id, e);
                              }
                            }}
                            disabled={isLoading}
                          />
                        ) : (
                          <input
                            ref={replyInputRef}
                            type="text"
                            value={replyText}
                            onChange={e => {
                              e.stopPropagation();
                              setReplyText(e.target.value);
                            }}
                            onKeyDown={e => handleReplyKeyPress(e, comment.id)}
                            placeholder={`Reply to ${comment.username}...`}
                            className="flex-1 px-3 py-1.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#CB9729]/50 text-xs text-gray-900"
                            disabled={isLoading}
                            onClick={e => e.stopPropagation()}
                          />
                        )}
                        <button
                          type="button"
                          onClick={e => handleAddReply(comment.id, e)}
                          disabled={!replyText.trim() || isLoading}
                          className="p-1.5 bg-[#CB9729] text-white rounded-full hover:bg-[#b78322] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Send reply"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
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
      <div
        className="border-t border-gray-200 p-4 shrink-0 w-full"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 w-full min-w-0">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border border-gray-200 shrink-0 flex items-center justify-center">
            {currentUserProfileUrl ? (
              <img
                src={currentUserProfileUrl}
                alt={currentUsername}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-gray-600 font-semibold text-xs">
                {getInitials(currentUsername)}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0 relative">
            {currentUserId ? (
              <MentionInputField
                value={commentText}
                onChange={setCommentText}
                currentUserId={currentUserId}
                placeholder="Add comment"
                className="w-full px-4 py-2 rounded-full text-sm"
                type="input"
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (commentText.trim() && !isLoading) {
                      handleAddComment(e);
                    }
                  }
                }}
                disabled={isLoading}
              />
            ) : (
              <input
                type="text"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    e.stopPropagation();
                    if (commentText.trim() && !isLoading) {
                      handleAddComment(e);
                    }
                  }
                }}
                placeholder="Add comment"
                className="flex-1 min-w-0 w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#CB9729]/50 text-sm text-gray-900"
                disabled={isLoading}
              />
            )}

            {showEmojiPicker && (
              <div
                ref={emojiPickerRef}
                className="absolute bottom-full left-0 mb-2 z-50"
                onClick={e => e.stopPropagation()}
              >
                <Picker
                  data={data}
                  onEmojiSelect={(emoji: any) => {
                    const symbol = emoji?.native || emoji?.unified || '';
                    if (!symbol) return;
                    setCommentText(prev => `${prev}${symbol}`);
                    // Keep picker open - don't close it
                  }}
                  onClickOutside={() => {
                    // This will be handled by our useEffect
                  }}
                  theme="light"
                />
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowEmojiPicker(prev => !prev)}
            className="p-2 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors shrink-0"
            aria-label="Toggle emoji picker"
          >
            <Smile className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={e => handleAddComment(e)}
            disabled={!commentText.trim() || isLoading}
            className="p-2 bg-[#CB9729] text-white rounded-full hover:bg-[#b78322] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            aria-label="Send comment"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
