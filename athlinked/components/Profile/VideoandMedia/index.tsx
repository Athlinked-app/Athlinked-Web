'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, ExternalLink } from 'lucide-react';
import VideoAndMediaPopup, { type VideoAndMedia } from '../VideoandMediaPopup';

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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

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
      const response = await fetch(
        `http://localhost:3001/api/profile/${userId}/video-media`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setVideoAndMediaList(data.data);
          if (onVideoAndMediaChange) {
            onVideoAndMediaChange(data.data);
          }
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
        const response = await fetch(
          `http://localhost:3001/api/profile/video-media/${existingData.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newData),
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const updatedList = [...videoAndMediaList];
            updatedList[editingIndex] = result.data;
            setVideoAndMediaList(updatedList);
            if (onVideoAndMediaChange) {
              onVideoAndMediaChange(updatedList);
            }
            setEditingIndex(null);
          }
        } else {
          const errorData = await response.json();
          alert(
            `Failed to update video and media: ${errorData.message || 'Unknown error'}`
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
        const response = await fetch(
          `http://localhost:3001/api/profile/${userId}/video-media`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newData),
          }
        );

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const updatedList = [...videoAndMediaList, result.data];
            setVideoAndMediaList(updatedList);
            if (onVideoAndMediaChange) {
              onVideoAndMediaChange(updatedList);
            }
          }
        } else {
          const errorData = await response.json();
          alert(
            `Failed to save video and media: ${errorData.message || 'Unknown error'}`
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
      const response = await fetch(
        `http://localhost:3001/api/profile/video-media/${id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        const updatedList = videoAndMediaList.filter((_, i) => i !== index);
        setVideoAndMediaList(updatedList);
        if (onVideoAndMediaChange) {
          onVideoAndMediaChange(updatedList);
        }
      } else {
        const errorData = await response.json();
        alert(
          `Failed to delete video and media: ${errorData.message || 'Unknown error'}`
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
          <button
            onClick={() => {
              setEditingIndex(null);
              setShowPopup(true);
            }}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-6 h-6 text-gray-900" />
          </button>
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
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
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
                  <div className="flex items-center gap-2 ml-4">
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
    </>
  );
}
