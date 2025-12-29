'use client';

import { useState, useEffect } from 'react';
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

export interface PostData {
  id: string;
  username: string;
  user_profile_url: string | null;
  user_id?: string;
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
  onCommentCountUpdate?: () => void;
  onPostDeleted?: () => void;
}

export default function Post({
  post,
  userProfileUrl,
  currentUserProfileUrl,
  currentUsername = 'You',
  currentUserId,
  onCommentCountUpdate,
  onPostDeleted,
}: PostProps) {
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getEventTypeIcon = (eventType: string | null | undefined) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
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
        const response = await fetch(`http://localhost:3001/api/posts/${post.id}/comments`);
        if (response.ok) {
        const data = await response.json();
        if (data.success && data.comments) {
          const parentComments = data.comments.filter((c: any) => !c.parent_comment_id);
            setCommentCount(parentComments.length);
          }
        }
      } catch (error) {
        console.error('Error fetching comment count:', error);
        setCommentCount(post.comment_count);
      }
    };

    fetchCommentCount();
  }, [post.id, post.comment_count]);

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
    try {
      const response = await fetch(`http://localhost:3001/api/posts/${post.id}/comments`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.comments) {
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

  const handleShareComplete = () => {
  };

  const handleSave = () => {
    const newSavedStatus = toggleSave(post.id);
    setIsSaved(newSavedStatus);
    
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

  const handleDownloadPDF = () => {
    if (!post.article_title || !post.article_body) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${post.article_title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              max-width: 800px;
              margin: 40px auto;
              padding: 20px;
              line-height: 1.6;
            }
            h1 { color: #333; border-bottom: 2px solid #CB9729; padding-bottom: 10px; }
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
          <h1>${post.article_title}</h1>
          <div class="author">
            <strong>Author:</strong> ${post.username}<br>
            <strong>Date:</strong> ${new Date(post.created_at).toLocaleDateString()}
          </div>
          ${post.caption ? `<p><em>${post.caption}</em></p>` : ''}
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
    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 p-4 border-b border-gray-200 mb-4">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border border-gray-200 flex-shrink-0 flex items-center justify-center">
          {post.user_profile_url && post.user_profile_url.trim() !== '' ? (
            <img
              src={post.user_profile_url}
              alt={post.username}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-600 font-semibold text-xs">
              {getInitials(post.username)}
            </span>
          )}
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
      {post.post_type === 'article' && (
        <>
          {(post.media_url || post.image_url) && (
            <div className="w-full">
              <img
                src={post.media_url && post.media_url.startsWith('http') ? post.media_url : `http://localhost:3001${post.media_url || post.image_url || ''}`}
                alt={post.article_title || 'Article image'}
                className="w-full h-auto object-cover"
                onError={(e) => {
                  console.error('Error loading image:', post.media_url);
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
          
          {post.article_title && (
            <div className="px-6 py-4">
              <h3 className="text-3xl font-bold text-gray-900 mb-3">
                {post.article_title}
              </h3>
              {post.caption && (
                <p className="text-lg text-gray-600 mb-4">
                  {post.caption}
                </p>
              )}
              {post.article_body && (
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
                          <p className="text-base text-gray-800 mb-3">{preview}</p>
                        ) : (
                          <div 
                            className="text-base text-gray-800 prose max-w-none mb-3"
                            dangerouslySetInnerHTML={{ __html: post.article_body }}
                          />
                        )}
                        <div className="flex justify-end gap-3 mt-4">
                          <button
                            onClick={() => setShowArticleModal(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[#CB9729] text-white rounded-md hover:bg-[#b78322] transition-colors"
                          >
                            Read more
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {post.post_type === 'event' && (
        <>
          {(post.media_url || post.image_url) && (
            <div className="w-full relative">
              {(post.media_url && post.media_url.match(/\.(mp4|mov)$/i)) || (post.image_url && post.image_url.match(/\.(mp4|mov)$/i)) ? (
                <video
                  src={post.media_url && post.media_url.startsWith('http') ? post.media_url : `http://localhost:3001${post.media_url || post.image_url || ''}`}
                  controls
                  className="w-full h-auto object-cover"
                />
              ) : (
                <img
                  src={post.media_url && post.media_url.startsWith('http') ? post.media_url : `http://localhost:3001${post.media_url || post.image_url || ''}`}
                  alt={post.event_title || 'Event image'}
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    console.error('Error loading image:', post.media_url);
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-10">
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                  {(() => {
                    const IconComponent = getEventTypeIcon(post.event_type);
                    return <IconComponent className="w-10 h-10 text-white" />;
                  })()}
                </div>
              </div>
            </div>
          )}

          {post.event_title && (
            <div className={`px-6 text-center ${(post.media_url || post.image_url) ? 'pt-12 pb-6' : 'py-6'}`}>
              {!(post.media_url || post.image_url) && (
                <div className="flex justify-center mb-4">
                  <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center shadow-xl border-4 border-white">
                    {(() => {
                      const IconComponent = getEventTypeIcon(post.event_type);
                      return <IconComponent className="w-10 h-10 text-white" />;
                    })()}
                  </div>
                </div>
              )}
              <h3 className="text-4xl font-bold text-gray-900 mb-3">
                {post.event_title}
              </h3>
              {post.event_date && (
                <p className="text-xl text-gray-600 mb-3">
                  {new Date(post.event_date).toLocaleDateString('en-US', { 
                    month: 'long', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </p>
              )}
              {post.event_location && (
                <p className="text-lg text-gray-600 mb-4">
                  📍 {post.event_location}
                </p>
              )}
              {post.caption && (
                <p className="text-base text-gray-700 leading-relaxed">
                  {post.caption}
                </p>
              )}
            </div>
          )}
        </>
      )}

      {(post.post_type === 'photo' || post.post_type === 'video' || post.post_type === 'text' || !post.post_type) && (
        <>
          {(post.caption || post.description) && (
            <p className="text-md text-gray-800 px-6 mb-4">
              {post.caption || post.description}
            </p>
          )}

          {(post.media_url || post.image_url) && post.post_type !== 'text' && (
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

      <div className="p-4">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-gray-600" fill="currentColor" />
            <span className="text-sm font-medium text-gray-600">{likeCount}</span>
          </div>
          <span className="text-sm text-gray-600">{commentCount} comments</span>
        </div>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowArticleModal(false)}
          />
          <div className="relative z-10 w-full max-w-4xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Article</h2>
              <button
                type="button"
                onClick={() => setShowArticleModal(false)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                {post.user_profile_url && post.user_profile_url.trim() !== '' ? (
                  <img
                    src={post.user_profile_url}
                    alt={post.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-gray-600 font-semibold text-sm">
                    {getInitials(post.username)}
                  </span>
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{post.username}</p>
                <p className="text-sm text-gray-600">Athlete</p>
              </div>
            </div>

            {(post.media_url || post.image_url) && (
              <div className="w-full">
                <img
                  src={post.media_url && post.media_url.startsWith('http') ? post.media_url : `http://localhost:3001${post.media_url || post.image_url || ''}`}
                  alt={post.article_title || 'Article image'}
                  className="w-full h-auto object-cover"
                />
              </div>
            )}

            <div className="px-6 py-6">
              {post.article_title && (
                <h3 className="text-3xl font-bold text-gray-900 mb-4">
                  {post.article_title}
                </h3>
              )}
              {post.caption && (
                <p className="text-lg text-gray-600 mb-6">
                  {post.caption}
                </p>
              )}
              {post.article_body && (
                <div 
                  className="prose max-w-none text-gray-800"
                  dangerouslySetInnerHTML={{ __html: post.article_body }}
                />
              )}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
              <button
                onClick={handleDownloadPDF}
                className="px-6 py-2 bg-[#CB9729] text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                Download PDF File
              </button>
            </div>
          </div>
        </div>
      )}

      {showComments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowComments(false)}
          />

          <div 
            className="relative z-10 w-full max-w-5xl h-[80vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-row"
            onClick={(e) => e.stopPropagation()}
          >
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
