'use client';

import { useState, useEffect } from 'react';
import { Play, X, Send, MessageSquare } from 'lucide-react';
import { apiGet, apiPost, getResourceUrl } from '@/utils/api';

interface Comment {
  id: string;
  author: string;
  authorAvatar: string | null;
  text: string;
  hasReplies?: boolean;
  replies?: Comment[];
  parent_username?: string | null;
}

interface Clip {
  id: string;
  videoUrl: string;
  author: string;
  authorAvatar: string | null;
  caption: string;
  timestamp: string;
  likes: number;
  shares: number;
  commentCount: number;
  comments?: Comment[];
  user_id?: string;
  user_type?: string;
}

interface ClipsProps {
  currentUserId?: string;
  currentUserProfileUrl?: string;
  currentUsername?: string;
  onClipDeleted?: () => void;
}

export default function Clips({
  currentUserId,
  currentUserProfileUrl,
  currentUsername,
  onClipDeleted,
}: ClipsProps) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);
  const [commentText, setCommentText] = useState('');
  const [replyTexts, setReplyTexts] = useState<{ [key: string]: string }>({});
  const [showReplies, setShowReplies] = useState<{ [key: string]: boolean }>({});
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  // Fetch clips for the current user (Activity tab)
  useEffect(() => {
    const fetchClips = async () => {
      if (!currentUserId) return;
      try {
        setLoading(true);
        const data = await apiGet<{
          success: boolean;
          clips?: any[];
          message?: string;
        }>(`/my-activity/${currentUserId}?limit=50`);

        console.log('My activity (clips) API response:', data);

        if (data.success && Array.isArray(data.clips)) {
          const fallbackName = currentUsername || 'User';
          const transformedClips: Clip[] = data.clips.map((clip: any) => ({
            id: clip.id,
            videoUrl: clip.video_url?.startsWith('http')
              ? clip.video_url
              : getResourceUrl(clip.video_url) || clip.video_url,
            author: clip.username || fallbackName,
            authorAvatar: clip.user_profile_url || null,
            caption: clip.description || '',
            timestamp: clip.created_at || '',
            likes: clip.like_count || 0,
            shares: 0,
            commentCount: clip.comment_count || 0,
            comments: [],
            user_id: clip.user_id ?? clip.userId ?? clip.user?.id,
            user_type: clip.user_type || clip.user?.user_type,
          }));
          setClips(transformedClips);
        } else {
          console.error('Clips API returned unsuccessful response:', data);
          setClips([]);
        }
      } catch (error) {
        console.error('Error fetching clips:', error);
        setClips([]);
      } finally {
        setLoading(false);
      }
    };

    fetchClips();
  }, [currentUserId, currentUsername]);

  // Fetch comments when a clip is selected
  useEffect(() => {
    const fetchComments = async () => {
      if (!selectedClip) return;

      try {
        const data = await apiGet<{ success: boolean; comments?: any[] }>(
          `/clips/${selectedClip.id}/comments`
        );

        if (data.success && data.comments) {
          const transformedComments: Comment[] = data.comments.map((comment: any) => ({
            id: comment.id,
            author: comment.username || 'User',
            authorAvatar: comment.user_profile_url && comment.user_profile_url.trim() !== ''
              ? comment.user_profile_url
              : null,
            text: comment.comment,
            hasReplies: comment.replies && comment.replies.length > 0,
            replies: comment.replies
              ? comment.replies.map((reply: any) => ({
                id: reply.id,
                author: reply.username || 'User',
                authorAvatar: reply.user_profile_url && reply.user_profile_url.trim() !== ''
                  ? reply.user_profile_url
                  : null,
                text: reply.comment,
                parent_username: reply.parent_username || null,
              }))
              : [],
          }));

          // Show all replies by default
          const newShowReplies: { [key: string]: boolean } = {};
          transformedComments.forEach(comment => {
            if (comment.hasReplies && comment.replies && comment.replies.length > 0) {
              newShowReplies[comment.id] = true;
            }
          });
          setShowReplies(newShowReplies);

          // Update selected clip with comments
          setSelectedClip(prev => prev ? { ...prev, comments: transformedComments } : null);
        }
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    fetchComments();
  }, [selectedClip?.id]);

  // Add comment handler
  const handleAddComment = async () => {
    if (!selectedClip || !commentText.trim() || !currentUserId) return;

    try {
      const result = await apiPost<{ success: boolean; message?: string }>(
        `/clips/${selectedClip.id}/comments`,
        {
          comment: commentText.trim(),
          user_id: currentUserId,
        }
      );

      if (result.success) {
        setCommentText('');
        // Refetch comments
        const data = await apiGet<{ success: boolean; comments?: any[] }>(
          `/clips/${selectedClip.id}/comments`
        );
        if (data.success && data.comments) {
          const transformedComments: Comment[] = data.comments.map((comment: any) => ({
            id: comment.id,
            author: comment.username || 'User',
            authorAvatar: comment.user_profile_url || null,
            text: comment.comment,
            hasReplies: comment.replies && comment.replies.length > 0,
            replies: comment.replies?.map((reply: any) => ({
              id: reply.id,
              author: reply.username || 'User',
              authorAvatar: reply.user_profile_url || null,
              text: reply.comment,
              parent_username: reply.parent_username || null,
            })) || [],
          }));
          setSelectedClip(prev => prev ? { ...prev, comments: transformedComments, commentCount: transformedComments.length } : null);
        }
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Failed to add comment');
    }
  };

  // Add reply handler
  const handleAddReply = async (commentId: string) => {
    const text = replyTexts[commentId] || '';
    if (!text.trim() || !currentUserId || !selectedClip) return;

    try {
      const result = await apiPost<{ success: boolean; message?: string }>(
        `/clips/comments/${commentId}/reply`,
        {
          comment: text.trim(),
          user_id: currentUserId,
        }
      );

      if (result.success) {
        setReplyTexts(prev => {
          const newState = { ...prev };
          delete newState[commentId];
          return newState;
        });
        setReplyingTo(null);
        // Refetch comments
        const data = await apiGet<{ success: boolean; comments?: any[] }>(
          `/clips/${selectedClip.id}/comments`
        );
        if (data.success && data.comments) {
          const transformedComments: Comment[] = data.comments.map((comment: any) => ({
            id: comment.id,
            author: comment.username || 'User',
            authorAvatar: comment.user_profile_url || null,
            text: comment.comment,
            hasReplies: comment.replies && comment.replies.length > 0,
            replies: comment.replies?.map((reply: any) => ({
              id: reply.id,
              author: reply.username || 'User',
              authorAvatar: reply.user_profile_url || null,
              text: reply.comment,
              parent_username: reply.parent_username || null,
            })) || [],
          }));
          setSelectedClip(prev => prev ? { ...prev, comments: transformedComments } : null);
        }
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      alert('Failed to add reply');
    }
  };

  const toggleReplies = (commentId: string) => {
    setShowReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const handleReplyClick = (commentId: string) => {
    setReplyingTo(commentId);
    setShowReplies(prev => ({ ...prev, [commentId]: true }));
  };

  // Calculate total comment count (main comments + all replies)
  const getTotalCommentCount = (comments?: Comment[]): number => {
    if (!comments) return 0;
    return comments.reduce((total, comment) => {
      return total + 1 + (comment.replies?.length || 0);
    }, 0);
  };

  // Filter clips: only show clips created by the current user
  const filteredClips = clips.filter(clip => {
    if (
      currentUserId &&
      clip.user_id != null &&
      String(clip.user_id) !== String(currentUserId)
    ) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">Loading clips...</div>
    );
  }

  if (filteredClips.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">No clips found.</div>
    );
  }

  return (
    <>
      {/* Grid Layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredClips.map(clip => {
          return (
            <div
              key={clip.id}
              onClick={() => setSelectedClip(clip)}
              className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg bg-gray-100 hover:opacity-90 transition-opacity"
            >
              {clip.videoUrl ? (
                <div className="relative w-full h-full">
                  <video
                    src={clip.videoUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
                    <Play
                      className="w-12 h-12 text-white opacity-80"
                      fill="white"
                    />
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 text-gray-400 p-2">
                  <Play className="w-12 h-12 mb-2" />
                  <span className="text-xs text-center line-clamp-3">
                    {clip.caption || 'Video clip'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Clip Detail Popup with Comments */}
      {selectedClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => {
              setSelectedClip(null);
              setCommentText('');
              setReplyTexts({});
              setReplyingTo(null);
            }}
          />
          <div className="relative z-10 w-full max-w-6xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex-shrink-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Clip Details</h2>
              <button
                onClick={() => {
                  setSelectedClip(null);
                  setCommentText('');
                  setReplyTexts({});
                  setReplyingTo(null);
                }}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Content - Split Layout */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left: Video & Info */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {/* Video Player */}
                  <div className="w-full">
                    <video
                      src={selectedClip.videoUrl}
                      controls
                      className="w-full h-auto rounded-lg"
                    />
                  </div>

                  {/* Clip Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {selectedClip.authorAvatar ? (
                        <img
                          src={selectedClip.authorAvatar}
                          alt={selectedClip.author}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-gray-600 font-semibold">
                            {selectedClip.author.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">
                          {selectedClip.author}
                        </p>
                        <p className="text-sm text-gray-500">
                          {selectedClip.timestamp
                            ? new Date(selectedClip.timestamp).toLocaleDateString('en-CA')
                            : 'Unknown date'}
                        </p>
                      </div>
                    </div>

                    {selectedClip.caption && (
                      <p className="text-gray-700">{selectedClip.caption}</p>
                    )}

                    <div className="flex items-center gap-6 text-gray-600">
                      <span className="flex items-center gap-1">
                        <span className="font-semibold">{selectedClip.likes}</span> likes
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-semibold">{getTotalCommentCount(selectedClip.comments)}</span> comments
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="font-semibold">{selectedClip.shares}</span> shares
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Comments Section */}
              <div className="md:w-96 border-l border-gray-200 flex flex-col bg-gray-50">
                {/* Comments Header */}
                <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-white">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Comments ({getTotalCommentCount(selectedClip.comments)})
                  </h3>
                </div>

                {/* Comments List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedClip.comments && selectedClip.comments.length > 0 ? (
                    selectedClip.comments.map(comment => (
                      <div key={comment.id} className="space-y-2">
                        {/* Main Comment */}
                        <div className="flex gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                            {comment.authorAvatar ? (
                              <img src={comment.authorAvatar} alt={comment.author} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-600 font-semibold text-xs">
                                {comment.author.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900">{comment.author}</p>
                            <p className="text-sm text-gray-700 break-words">{comment.text}</p>
                            <div className="flex items-center gap-3 mt-1">
                              <button
                                onClick={() => handleReplyClick(comment.id)}
                                className="text-xs text-gray-500 hover:text-gray-700"
                              >
                                Reply
                              </button>
                              {comment.hasReplies && (
                                <button
                                  onClick={() => toggleReplies(comment.id)}
                                  className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                  {showReplies[comment.id] ? 'Hide' : 'View'} replies ({comment.replies?.length || 0})
                                </button>
                              )}
                            </div>

                            {/* Replies */}
                            {showReplies[comment.id] && comment.replies && comment.replies.length > 0 && (
                              <div className="mt-3 ml-4 space-y-3 border-l-2 border-gray-300 pl-3">
                                {comment.replies.map(reply => (
                                  <div key={reply.id} className="flex gap-2">
                                    <div className="w-6 h-6 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                                      {reply.authorAvatar ? (
                                        <img src={reply.authorAvatar} alt={reply.author} className="w-full h-full object-cover" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-600 font-semibold text-xs">
                                          {reply.author.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-xs text-gray-900">
                                        {reply.author}
                                        {reply.parent_username && (
                                          <span className="text-gray-500 font-normal"> replying to <span className="text-yellow-600">@{reply.parent_username}</span></span>
                                        )}
                                      </p>
                                      <p className="text-xs text-gray-700 break-words">{reply.text}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reply Input */}
                            {replyingTo === comment.id && (
                              <div className="mt-2 flex items-center gap-2">
                                <input
                                  type="text"
                                  placeholder={`Reply to ${comment.author}...`}
                                  value={replyTexts[comment.id] || ''}
                                  onChange={(e) => setReplyTexts(prev => ({ ...prev, [comment.id]: e.target.value }))}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleAddReply(comment.id);
                                    }
                                  }}
                                  className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
                                />
                                <button
                                  onClick={() => handleAddReply(comment.id)}
                                  disabled={!replyTexts[comment.id]?.trim()}
                                  className="p-1.5 bg-yellow-600 text-white rounded-full hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Send className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setReplyTexts(prev => {
                                      const newState = { ...prev };
                                      delete newState[comment.id];
                                      return newState;
                                    });
                                  }}
                                  className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No comments yet</p>
                      <p className="text-xs mt-1">Be the first to comment!</p>
                    </div>
                  )}
                </div>

                {/* Add Comment Input */}
                <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-white">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden">
                      {currentUserProfileUrl ? (
                        <img src={currentUserProfileUrl} alt="You" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600 font-semibold text-xs">
                          {currentUsername?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                        </div>
                      )}
                    </div>
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment();
                        }
                      }}
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    />
                    <button
                      onClick={handleAddComment}
                      disabled={!commentText.trim()}
                      className="p-2 bg-yellow-600 text-white rounded-full hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}