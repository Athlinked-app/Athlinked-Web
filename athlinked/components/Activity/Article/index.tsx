'use client';

import { useState } from 'react';
import Image from 'next/image';
import { FileText, X } from 'lucide-react';
import { type PostData } from '@/components/Post';
import Post from '@/components/Post';

interface ArticleProps {
  posts: PostData[];
  currentUserId?: string;
  currentUserProfileUrl?: string;
  currentUsername?: string;
  loading?: boolean;
  onCommentCountUpdate?: () => void;
  onPostDeleted?: () => void;
}

export default function Article({
  posts,
  currentUserId,
  currentUserProfileUrl,
  currentUsername,
  loading = false,
  onCommentCountUpdate,
  onPostDeleted,
}: ArticleProps) {
  const [selectedArticle, setSelectedArticle] = useState<PostData | null>(null);

  // Filter posts: only show articles created by the current user
  const filteredArticles = posts.filter(post => {
    // Only show current user's articles
    if (currentUserId && post.user_id !== currentUserId) {
      return false;
    }
    // Only show article posts
    return post.post_type === 'article';
  });

  // Get thumbnail URL for an article with proper URL formatting
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
      <div className="text-center py-8 text-gray-500">Loading articles...</div>
    );
  }

  if (filteredArticles.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">No articles found.</div>
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
              className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg bg-gray-100 hover:opacity-90 transition-opacity flex flex-col"
            >
              {thumbnailUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={thumbnailUrl}
                    alt={article.article_title || 'Article image'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <FileText className="w-12 h-12 text-white opacity-80" />
                  </div>
                  {/* Title overlay at bottom */}
                  {article.article_title && (
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                      <p className="text-white font-bold text-sm line-clamp-2">
                        {article.article_title}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 text-gray-900 p-2">
                  <FileText className="w-12 h-12 mb-2 text-gray-400" />
                  <span className="text-sm text-center line-clamp-3 font-bold">
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
                Article Details
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
