'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FileText, X } from 'lucide-react';
import { type PostData } from '@/components/Post';
import Post from '@/components/Post';

interface MySaveArticleProps {
  posts: PostData[];
  currentUserId?: string;
  currentUserProfileUrl?: string;
  currentUsername?: string;
  viewedUserId?: string | null;
  loading?: boolean;
  onCommentCountUpdate?: () => void;
  onPostDeleted?: () => void;
}

export default function MySaveArticle({
  posts,
  currentUserId,
  currentUserProfileUrl,
  currentUsername,
  viewedUserId,
  loading = false,
  onCommentCountUpdate,
  onPostDeleted,
}: MySaveArticleProps) {
  const [selectedArticle, setSelectedArticle] = useState<PostData | null>(null);
  const [savedPosts, setSavedPosts] = useState<PostData[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);

  // Fetch saved posts from backend if viewing another user's profile
  useEffect(() => {
    const fetchSavedPosts = async () => {
      if (viewedUserId && viewedUserId !== currentUserId) {
        setLoadingSaved(true);
        try {
          const response = await fetch(
            `https://qd9ngjg1-3001.inc1.devtunnels.ms/api/posts/saved/${viewedUserId}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.posts) {
              const transformedPosts: PostData[] = data.posts.map(
                (post: any) => ({
                  id: post.id,
                  username: post.username || 'User',
                  user_profile_url: post.user_profile_url || null,
                  user_id: post.user_id,
                  post_type: post.post_type,
                  caption: post.caption,
                  media_url: post.media_url,
                  article_title: post.article_title,
                  article_body: post.article_body,
                  event_title: post.event_title,
                  event_date: post.event_date,
                  event_location: post.event_location,
                  like_count: post.like_count || 0,
                  comment_count: post.comment_count || 0,
                  save_count: post.save_count || 0,
                  created_at: post.created_at,
                })
              );
              setSavedPosts(transformedPosts);
            }
          }
        } catch (error) {
          console.error('Error fetching saved posts:', error);
        } finally {
          setLoadingSaved(false);
        }
      } else {
        setSavedPosts([]);
      }
    };

    fetchSavedPosts();
  }, [viewedUserId, currentUserId]);

  // Get saved post IDs from localStorage (for own profile)
  const getSavedPostIds = (): string[] => {
    if (typeof window === 'undefined') return [];
    const savedPosts = localStorage.getItem('athlinked_saved_posts');
    return savedPosts ? JSON.parse(savedPosts) : [];
  };

  // Determine which posts to show
  let filteredArticles: PostData[] = [];

  if (viewedUserId && viewedUserId !== currentUserId) {
    // Show saved articles from backend for other users
    filteredArticles = savedPosts.filter(post => post.post_type === 'article');
  } else {
    // Show saved articles from localStorage for own profile
    const savedPostIds = getSavedPostIds();
    filteredArticles = posts.filter(post => {
      if (!savedPostIds.includes(post.id)) {
        return false;
      }
      return post.post_type === 'article';
    });
  }

  // Get thumbnail URL for an article with proper URL formatting
  const getThumbnailUrl = (post: PostData): string | null => {
    const mediaUrl = post.media_url || post.image_url;
    if (!mediaUrl) return null;

    // If URL already starts with http, return as is
    if (mediaUrl.startsWith('http')) return mediaUrl;

    // Otherwise, prepend the base URL
    return `https://qd9ngjg1-3001.inc1.devtunnels.ms${mediaUrl}`;
  };

  if (loading || loadingSaved) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading saved articles...
      </div>
    );
  }

  if (filteredArticles.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No saved articles found.
      </div>
    );
  }

  return (
    <>
      {/* Grid Layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredArticles.map(article => {
          const thumbnailUrl = getThumbnailUrl(article);

          return (
            <div
              key={article.id}
              onClick={() => setSelectedArticle(article)}
              className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg bg-gray-100 hover:opacity-90 transition-opacity"
            >
              {thumbnailUrl ? (
                <Image
                  src={thumbnailUrl}
                  alt={article.article_title || 'Article image'}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 text-gray-400 p-2">
                  <FileText className="w-12 h-12 mb-2 opacity-50" />
                  <span className="text-xs text-center line-clamp-3">
                    {article.article_title || 'Article'}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Article Detail Popup */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedArticle(null)}
          />
          <div className="relative z-10 w-full max-w-4xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Saved Article Details
              </h2>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <Post
                post={selectedArticle}
                currentUserProfileUrl={currentUserProfileUrl}
                currentUsername={currentUsername || 'User'}
                currentUserId={currentUserId}
                onCommentCountUpdate={onCommentCountUpdate}
                onPostDeleted={() => {
                  if (onPostDeleted) onPostDeleted();
                  setSelectedArticle(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
