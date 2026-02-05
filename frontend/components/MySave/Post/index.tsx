'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Play, X, Calendar } from 'lucide-react';
import { type PostData } from '@/components/Post';
import Post from '@/components/Post';
import { apiGet, getResourceUrl } from '@/utils/api';

interface MySavePostProps {
  posts: PostData[];
  currentUserId?: string;
  currentUserProfileUrl?: string;
  currentUsername?: string;
  viewedUserId?: string | null;
  loading?: boolean;
  onCommentCountUpdate?: () => void;
  onPostDeleted?: () => void;
}

export default function MySavePost({
  posts,
  currentUserId,
  currentUserProfileUrl,
  currentUsername,
  viewedUserId,
  loading = false,
  onCommentCountUpdate,
  onPostDeleted,
}: MySavePostProps) {
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [savedPosts, setSavedPosts] = useState<PostData[]>([]);
  const [savedPostsLoading, setSavedPostsLoading] = useState(true);

  useEffect(() => {
    const fetchSavedPosts = async () => {
      if (!currentUserId) {
        setSavedPosts([]);
        setSavedPostsLoading(false);
        return;
      }

      try {
        setSavedPostsLoading(true);
        const data = await apiGet<{
          success: boolean;
          posts?: PostData[];
          message?: string;
        }>(`/posts/saved/${currentUserId}?limit=50`);

        if (data.success && Array.isArray(data.posts)) {
          setSavedPosts(data.posts);
        } else {
          console.error(
            'Saved posts API returned unsuccessful response:',
            data
          );
          setSavedPosts([]);
        }
      } catch (error) {
        console.error('Error fetching saved posts:', error);
        setSavedPosts([]);
      } finally {
        setSavedPostsLoading(false);
      }
    };

    fetchSavedPosts();
  }, [currentUserId]);

  // Filter posts to show only saved posts (photo, video, text, and event posts, not articles)
  const filteredPosts = savedPosts.filter(
    post =>
      post.post_type === 'photo' ||
      post.post_type === 'video' ||
      post.post_type === 'text' ||
      post.post_type === 'event'
  );

  // Get thumbnail URL for a post with proper URL formatting
  const getThumbnailUrl = (post: PostData): string | null => {
    const mediaUrl = post.media_url || post.image_url;
    if (!mediaUrl) return null;

    // If URL already starts with http, return as is
    if (mediaUrl.startsWith('http')) return mediaUrl;

    // Otherwise, prepend the base URL
    return getResourceUrl(mediaUrl) || mediaUrl;
  };

  // When opening a saved post, fetch the latest data (including like_count)
  const handlePostClick = async (post: PostData) => {
    try {
      const data = await apiGet<{
        success: boolean;
        post?: any;
        message?: string;
      }>(`/posts/${post.id}`);

      if (data.success && data.post) {
        const p = data.post;
        const transformed: PostData = {
          id: p.id,
          username: p.username || post.username || 'User',
          user_profile_url:
            p.user_profile_url && p.user_profile_url.trim() !== ''
              ? p.user_profile_url
              : post.user_profile_url || null,
          user_id: p.user_id ?? post.user_id,
          user_type: p.user_type || post.user_type,
          post_type: p.post_type || post.post_type,
          caption: p.caption ?? post.caption,
          media_url: p.media_url ?? post.media_url,
          article_title: p.article_title ?? post.article_title,
          article_body: p.article_body ?? post.article_body,
          event_title: p.event_title ?? post.event_title,
          event_date: p.event_date ?? post.event_date,
          event_location: p.event_location ?? post.event_location,
          event_type: p.event_type ?? post.event_type,
          image_url: p.image_url ?? post.image_url,
          description: p.description ?? post.description,
          like_count: p.like_count ?? post.like_count ?? 0,
          comment_count: p.comment_count ?? post.comment_count ?? 0,
          save_count: p.save_count ?? post.save_count,
          created_at: p.created_at ?? post.created_at,
        };
        setSelectedPost(transformed);
      } else {
        // Fallback to existing post data if API fails
        setSelectedPost(post);
      }
    } catch (_error) {
      // On any error, just open with existing (possibly slightly stale) data
      setSelectedPost(post);
    }
  };

  if (loading || savedPostsLoading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading saved posts...
      </div>
    );
  }

  if (filteredPosts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No saved posts found.
      </div>
    );
  }

  return (
    <>
      {/* Grid Layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPosts.map(post => {
          const thumbnailUrl = getThumbnailUrl(post);
          const isVideo = post.post_type === 'video';
          const isEvent = post.post_type === 'event';

          return (
            <div
              key={post.id}
              onClick={() => handlePostClick(post)}
              className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg bg-gray-100 hover:opacity-90 transition-opacity"
            >
              {thumbnailUrl ? (
                <>
                  {isVideo ? (
                    <div className="relative w-full h-full">
                      <video
                        src={thumbnailUrl}
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
                    <div className="relative w-full h-full">
                      <Image
                        src={thumbnailUrl}
                        alt={post.caption || post.event_title || 'Post image'}
                        fill
                        className="object-contain group-hover:scale-105 transition-transform duration-300"
                        unoptimized
                      />
                      {isEvent && (
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <Calendar className="w-12 h-12 text-white opacity-80" />
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 text-gray-400 p-2">
                  {isEvent ? (
                    <>
                      <Calendar className="w-12 h-12 mb-2" />
                      <span className="text-xs text-center line-clamp-3">
                        {post.event_title || 'Event'}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-center line-clamp-3">
                      {post.caption || 'Text post'}
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Post Detail Popup */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedPost(null)}
          />
          <div className="relative z-10 w-full max-w-4xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Saved Post Details
              </h2>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <Post
                post={selectedPost}
                currentUserProfileUrl={currentUserProfileUrl}
                currentUsername={currentUsername || 'User'}
                currentUserId={currentUserId}
                onCommentCountUpdate={onCommentCountUpdate}
                onPostDeleted={() => {
                  if (onPostDeleted) onPostDeleted();
                  setSelectedPost(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
