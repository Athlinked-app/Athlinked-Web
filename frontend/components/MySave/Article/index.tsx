'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FileText, X } from 'lucide-react';
import { type PostData } from '@/components/Post';
import Post from '@/components/Post';
import { getResourceUrl } from '@/utils/api';
import { API_BASE_URL } from '@/utils/config';

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

  // Get saved post IDs from localStorage
  const getSavedPostIds = (): string[] => {
    if (typeof window === 'undefined') return [];
    const savedPosts = JSON.parse(
      localStorage.getItem('athlinked_saved_posts') || '[]'
    );
    return savedPosts;
  };

  // Filter posts to show only saved articles
  const savedPostIds = getSavedPostIds();
  const filteredArticles = posts.filter(
    post => savedPostIds.includes(post.id) && post.post_type === 'article'
  );

  // Get thumbnail URL for an article with proper URL formatting
  const getThumbnailUrl = (post: PostData): string | null => {
    const mediaUrl = post.media_url || post.image_url;
    if (!mediaUrl) return null;

    // If URL already starts with http, return as is
    if (mediaUrl.startsWith('http')) return mediaUrl;

    // Otherwise, prepend the base URL
    return getResourceUrl(mediaUrl) || mediaUrl;
  };

  if (loading) {
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
