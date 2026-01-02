'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Play, X } from 'lucide-react';
import { type PostData } from '@/components/Post';
import Post from '@/components/Post';

interface PostsProps {
  posts: PostData[];
  currentUserId?: string;
  currentUserProfileUrl?: string;
  currentUsername?: string;
  loading?: boolean;
  onCommentCountUpdate?: () => void;
  onPostDeleted?: () => void;
}

export default function Posts({
  posts,
  currentUserId,
  currentUserProfileUrl,
  currentUsername,
  loading = false,
  onCommentCountUpdate,
  onPostDeleted,
}: PostsProps) {
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);

  // Filter posts: only show posts created by the current user
  // Filter by post type: photo, video, or text (not articles or events)
  const filteredPosts = posts.filter(post => {
    // Only show current user's posts
    if (currentUserId && post.user_id !== currentUserId) {
      return false;
    }
    // Only show photo, video, or text posts (not articles or events)
    return (
      post.post_type === 'photo' ||
      post.post_type === 'video' ||
      post.post_type === 'text'
    );
  });

  // Get thumbnail URL for a post with proper URL formatting
  const getThumbnailUrl = (post: PostData): string | null => {
    const mediaUrl = post.media_url || post.image_url;
    if (!mediaUrl) return null;

    // If URL already starts with http, return as is
    if (mediaUrl.startsWith('http')) return mediaUrl;

    // Otherwise, prepend the base URL
    return `https://qd9ngjg1-3001.inc1.devtunnels.ms${mediaUrl}`;
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">Loading posts...</div>
    );
  }

  if (filteredPosts.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">No posts found.</div>
    );
  }

  return (
    <>
      {/* Grid Layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredPosts.map(post => {
          const thumbnailUrl = getThumbnailUrl(post);
          const isVideo = post.post_type === 'video';

          return (
            <div
              key={post.id}
              onClick={() => setSelectedPost(post)}
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
                    <Image
                      src={thumbnailUrl}
                      alt={post.caption || 'Post image'}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                    />
                  )}
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 text-gray-400 p-2">
                  <span className="text-xs text-center line-clamp-3">
                    {post.caption || 'Text post'}
                  </span>
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
              <h2 className="text-xl font-bold text-gray-900">Post Details</h2>
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
