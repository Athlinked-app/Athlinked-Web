'use client';

import { useState, useEffect } from 'react';
import { Play, X } from 'lucide-react';
import { getResourceUrl } from '@/utils/api';
import { API_BASE_URL } from '@/utils/config';

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
  user_id?: string;
}

interface MySaveClipsProps {
  currentUserId?: string;
  currentUserProfileUrl?: string;
  currentUsername?: string;
  viewedUserId?: string | null;
  onClipDeleted?: () => void;
}

export default function MySaveClips({
  currentUserId,
  currentUserProfileUrl,
  currentUsername,
  onClipDeleted,
}: MySaveClipsProps) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null);

  // Get saved clip IDs from localStorage
  const getSavedClipIds = (): string[] => {
    if (typeof window === 'undefined') return [];
    const savedClips = JSON.parse(
      localStorage.getItem('athlinked_saved_clips') || '[]'
    );
    return savedClips;
  };

  // Fetch all clips from API
  useEffect(() => {
    const fetchClips = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/clips?page=1&limit=50`);

        if (!response.ok) {
          console.error(
            'Failed to fetch clips:',
            response.status,
            response.statusText
          );
          setClips([]);
          return;
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.error('Non-JSON response from clips API');
          setClips([]);
          return;
        }

        const data = await response.json();
        console.log('Clips API response:', data);

        if (data.success && data.clips) {
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
            user_id: clip.user_id,
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
  }, [currentUsername]);

  // Filter clips to show only saved clips
  const savedClipIds = getSavedClipIds();
  const filteredClips = clips.filter(clip => {
    return savedClipIds.includes(clip.id);
  });

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500">
        Loading saved clips...
      </div>
    );
  }

  if (filteredClips.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No saved clips found.
      </div>
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

      {/* Clip Detail Popup */}
      {selectedClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedClip(null)}
          />
          <div className="relative z-10 w-full max-w-4xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Saved Clip Details
              </h2>
              <button
                onClick={() => setSelectedClip(null)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-6">
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
                        {selectedClip.timestamp}
                      </p>
                    </div>
                  </div>

                  {selectedClip.caption && (
                    <p className="text-gray-700">{selectedClip.caption}</p>
                  )}

                  <div className="flex items-center gap-6 text-gray-600">
                    <span className="flex items-center gap-1">
                      <span className="font-semibold">
                        {selectedClip.likes}
                      </span>{' '}
                      likes
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-semibold">
                        {selectedClip.commentCount}
                      </span>{' '}
                      comments
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-semibold">
                        {selectedClip.shares}
                      </span>{' '}
                      shares
                    </span>
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
