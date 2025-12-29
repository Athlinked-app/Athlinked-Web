'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Calendar, X } from 'lucide-react';
import { type PostData } from '@/components/Post';
import Post from '@/components/Post';

interface MySaveOpportunityProps {
  posts: PostData[];
  currentUserId?: string;
  currentUserProfileUrl?: string;
  currentUsername?: string;
  loading?: boolean;
  onCommentCountUpdate?: () => void;
  onPostDeleted?: () => void;
}

export default function MySaveOpportunity({
  posts,
  currentUserId,
  currentUserProfileUrl,
  currentUsername,
  loading = false,
  onCommentCountUpdate,
  onPostDeleted,
}: MySaveOpportunityProps) {
  const [selectedEvent, setSelectedEvent] = useState<PostData | null>(null);

  // Get saved post IDs from localStorage
  const getSavedPostIds = (): string[] => {
    if (typeof window === 'undefined') return [];
    const savedPosts = localStorage.getItem('athlinked_saved_posts');
    return savedPosts ? JSON.parse(savedPosts) : [];
  };

  // Filter posts: only show saved events
  const savedPostIds = getSavedPostIds();
  const filteredEvents = posts.filter(post => {
    // Only show saved posts
    if (!savedPostIds.includes(post.id)) {
      return false;
    }
    // Only show event posts
    return post.post_type === 'event';
  });

  // Get thumbnail URL for an event with proper URL formatting
  const getThumbnailUrl = (post: PostData): string | null => {
    const mediaUrl = post.media_url || post.image_url;
    if (!mediaUrl) return null;
    
    // If URL already starts with http, return as is
    if (mediaUrl.startsWith('http')) return mediaUrl;
    
    // Otherwise, prepend the base URL
    return `http://localhost:3001${mediaUrl}`;
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading saved events...
      </div>
    );
  }

  if (filteredEvents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No saved events found.
      </div>
    );
  }

  return (
    <>
      {/* Grid Layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredEvents.map(event => {
          const thumbnailUrl = getThumbnailUrl(event);
          
          return (
            <div
              key={event.id}
              onClick={() => setSelectedEvent(event)}
              className="relative aspect-square cursor-pointer group overflow-hidden rounded-lg bg-gray-100 hover:opacity-90 transition-opacity"
            >
              {thumbnailUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={thumbnailUrl}
                    alt={event.event_title || 'Event image'}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <Calendar className="w-12 h-12 text-white opacity-80" />
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-200 text-gray-400 p-2">
                  <Calendar className="w-12 h-12 mb-2" />
                  <span className="text-xs text-center line-clamp-3">{event.event_title || 'Event'}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Event Detail Popup */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          />
          <div className="relative z-10 w-full max-w-4xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Saved Event Details</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <Post
                post={selectedEvent}
                currentUserProfileUrl={currentUserProfileUrl}
                currentUsername={currentUsername || 'User'}
                currentUserId={currentUserId}
                onCommentCountUpdate={onCommentCountUpdate}
                onPostDeleted={() => {
                  if (onPostDeleted) onPostDeleted();
                  setSelectedEvent(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

