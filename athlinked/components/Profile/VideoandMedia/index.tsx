'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, ExternalLink, X } from 'lucide-react';
import VideoAndMediaPopup, { type VideoAndMedia } from '../VideoandMediaPopup';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';
import { getCurrentUserId } from '@/utils/auth';

export type { VideoAndMedia };

interface VideoAndMediaProps {
  videoAndMedia?: VideoAndMedia[];
  onVideoAndMediaChange?: (data: VideoAndMedia[]) => void;
  userId?: string | null;
}

export default function VideoAndMediaComponent({
  videoAndMedia = [],
  onVideoAndMediaChange,
  userId,
}: VideoAndMediaProps) {
  const [videoAndMediaList, setVideoAndMediaList] =
    useState<VideoAndMedia[]>(videoAndMedia);
  const [showPopup, setShowPopup] = useState(false);
  const [showViewPopup, setShowViewPopup] = useState(false);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Check if viewing own profile (client-side only to avoid hydration issues)
  useEffect(() => {
    const currentUserId = getCurrentUserId();
    setIsOwnProfile(userId === currentUserId);
  }, [userId]);

  // Sync with props when videoAndMedia changes
  useEffect(() => {
    if (videoAndMedia && videoAndMedia.length > 0) {
      setVideoAndMediaList(videoAndMedia);
    }
  }, [videoAndMedia]);

  // Fetch video and media data when component mounts or userId changes
  useEffect(() => {
    if (userId) {
      fetchVideoMedia();
    }
  }, [userId]);

  const fetchVideoMedia = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const data = await apiGet<{
        success: boolean;
        data?: VideoAndMedia[];
      }>(`/profile/${userId}/video-media`);
      if (data.success && data.data) {
        setVideoAndMediaList(data.data);
        if (onVideoAndMediaChange) {
          onVideoAndMediaChange(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching video and media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (newData: VideoAndMedia) => {
    if (editingIndex !== null) {
      // Update existing entry
      const existingData = videoAndMediaList[editingIndex];
      if (!userId || !existingData.id) {
        // If no userId or ID, just update local state
        const updatedList = [...videoAndMediaList];
        updatedList[editingIndex] = newData;
        setVideoAndMediaList(updatedList);
        if (onVideoAndMediaChange) {
          onVideoAndMediaChange(updatedList);
        }
        setEditingIndex(null);
        return;
      }

      try {
        const result = await apiPut<{
          success: boolean;
          data?: VideoAndMedia;
          message?: string;
        }>(`/profile/video-media/${existingData.id}`, newData);

        if (result.success && result.data) {
          const updatedList = [...videoAndMediaList];
          updatedList[editingIndex] = result.data;
          setVideoAndMediaList(updatedList);
          if (onVideoAndMediaChange) {
            onVideoAndMediaChange(updatedList);
          }
          setEditingIndex(null);
        } else {
          alert(
            `Failed to update video and media: ${result.message || 'Unknown error'}`
          );
        }
      } catch (error) {
        console.error('Error updating video and media:', error);
        alert('Error updating video and media. Please try again.');
      }
    } else {
      // Add new entry
      if (!userId) {
        // If no userId, just update local state
        const updatedList = [...videoAndMediaList, newData];
        setVideoAndMediaList(updatedList);
        if (onVideoAndMediaChange) {
          onVideoAndMediaChange(updatedList);
        }
        return;
      }

      try {
        const result = await apiPost<{
          success: boolean;
          data?: VideoAndMedia;
          message?: string;
        }>(`/profile/${userId}/video-media`, newData);

        if (result.success && result.data) {
          const updatedList = [...videoAndMediaList, result.data];
          setVideoAndMediaList(updatedList);
          if (onVideoAndMediaChange) {
            onVideoAndMediaChange(updatedList);
          }
        } else {
          alert(
            `Failed to save video and media: ${result.message || 'Unknown error'}`
          );
        }
      } catch (error) {
        console.error('Error saving video and media:', error);
        alert('Error saving video and media. Please try again.');
      }
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setShowPopup(true);
  };

  const handleClose = () => {
    setShowPopup(false);
    setEditingIndex(null);
  };

  const handleView = (index: number) => {
    setViewingIndex(index);
    setShowViewPopup(true);
  };

  const handleCloseView = () => {
    setShowViewPopup(false);
    setViewingIndex(null);
  };

  const handleDelete = async (id: string | undefined, index: number) => {
    if (!id) {
      // If no ID, just update local state
      const updatedList = videoAndMediaList.filter((_, i) => i !== index);
      setVideoAndMediaList(updatedList);
      if (onVideoAndMediaChange) {
        onVideoAndMediaChange(updatedList);
      }
      return;
    }

    try {
      const result = await apiDelete<{
        success: boolean;
        message?: string;
      }>(`/profile/video-media/${id}`);

      if (result.success) {
        const updatedList = videoAndMediaList.filter((_, i) => i !== index);
        setVideoAndMediaList(updatedList);
        if (onVideoAndMediaChange) {
          onVideoAndMediaChange(updatedList);
        }
      } else {
        alert(
          `Failed to delete video and media: ${result.message || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error('Error deleting video and media:', error);
      alert('Error deleting video and media. Please try again.');
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-lg p-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Video and Media</h2>
          {isOwnProfile && (
            <button
              onClick={() => {
                // If there's existing data, show the first entry for editing
                // Otherwise, open empty form for new entry
                if (videoAndMediaList.length > 0) {
                  setEditingIndex(0);
                } else {
                  setEditingIndex(null);
                }
                setShowPopup(true);
              }}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-6 h-6 text-gray-900" />
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500 italic">Loading...</p>
        ) : videoAndMediaList.length === 0 ? (
          <p className="text-gray-500 italic">
            No video and media added yet. Click the + button to add one.
          </p>
        ) : (
          <div className="space-y-4">
            {videoAndMediaList.map((data, index) => (
              <div
                key={data.id || index}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleView(index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {data.highlightVideoLink && (
                      <div className="mb-2">
                        <p className="text-sm font-medium text-gray-700 mb-1">
                          Highlight Video Link:
                        </p>
                        <a
                          href={data.highlightVideoLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {data.highlightVideoLink}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}
                    {data.videoStatus && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Video Status:</span>{' '}
                        {data.videoStatus}
                      </p>
                    )}
                    {data.verifiedMediaProfile && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">
                          Verified Media Profile:
                        </span>{' '}
                        {data.verifiedMediaProfile}
                      </p>
                    )}
                  </div>
                  {isOwnProfile && (
                    <div className="flex items-center gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleEdit(index)}
                        className="p-2 rounded-full hover:bg-blue-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(data.id, index)}
                        className="p-2 rounded-full hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <VideoAndMediaPopup
        open={showPopup}
        onClose={handleClose}
        onSave={handleAdd}
        existingData={
          editingIndex !== null ? videoAndMediaList[editingIndex] : undefined
        }
      />

      {/* View Popup */}
      {showViewPopup && viewingIndex !== null && (
        <ViewVideoAndMediaPopup
          open={showViewPopup}
          onClose={handleCloseView}
          data={videoAndMediaList[viewingIndex]}
        />
      )}
    </>
  );
}

// View-only popup component
function ViewVideoAndMediaPopup({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: VideoAndMedia;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Video and Media Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">
          {data.highlightVideoLink && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Highlight Video Link
              </label>
              <a
                href={data.highlightVideoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center gap-2 break-all"
              >
                {data.highlightVideoLink}
                <ExternalLink className="w-4 h-4 flex-shrink-0" />
              </a>
            </div>
          )}

          {data.videoStatus && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Video Status
              </label>
              <p className="text-gray-900">{data.videoStatus}</p>
            </div>
          )}

          {data.verifiedMediaProfile && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verified Media Profile
              </label>
              <p className="text-gray-900">{data.verifiedMediaProfile}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#CB9729] text-white rounded-lg hover:bg-[#b78322] transition-colors font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
