'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import SocialHandlePopup from '../SocialHandlePopup';

export interface SocialHandle {
  id?: string;
  platform: string;
  url: string;
}

interface SocialHandleProps {
  handles?: SocialHandle[];
  onHandlesChange?: (handles: SocialHandle[]) => void;
  userId?: string | null;
}

const getPlatformIcon = (platform: string) => {
  const lowerPlatform = platform.toLowerCase();
  if (lowerPlatform === 'facebook') {
    return (
      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center">
        <span className="text-white font-bold text-sm">f</span>
      </div>
    );
  } else if (lowerPlatform === 'instagram') {
    return (
      <div className="w-8 h-8 rounded-full border-2 border-red-500 flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-red-500"></div>
      </div>
    );
  } else if (lowerPlatform === 'twitter') {
    return (
      <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center">
        <span className="text-white font-bold text-xs">𝕏</span>
      </div>
    );
  } else if (lowerPlatform === 'tiktok') {
    return (
      <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
        <span className="text-white font-bold text-xs">TT</span>
      </div>
    );
  } else {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center">
        <span className="text-white font-bold text-xs">+</span>
      </div>
    );
  }
};

export default function SocialHandles({
  handles = [],
  onHandlesChange,
  userId,
}: SocialHandleProps) {
  const [socialHandles, setSocialHandles] = useState<SocialHandle[]>(handles);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);

  // Sync with props when handles change
  useEffect(() => {
    if (handles && handles.length > 0) {
      setSocialHandles(handles);
    }
  }, [handles]);

  // Fetch social handles when component mounts or userId changes
  useEffect(() => {
    if (userId) {
      fetchSocialHandles();
    }
  }, [userId]);

  const fetchSocialHandles = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:3001/api/profile/${userId}/social-handles`
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSocialHandles(data.data);
          if (onHandlesChange) {
            onHandlesChange(data.data);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching social handles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (newHandle: SocialHandle) => {
    if (!userId) {
      // If no userId, just update local state
      const updatedHandles = [...socialHandles, newHandle];
      setSocialHandles(updatedHandles);
      if (onHandlesChange) {
        onHandlesChange(updatedHandles);
      }
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/api/profile/${userId}/social-handles`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            platform: newHandle.platform,
            url: newHandle.url,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          const updatedHandles = [...socialHandles, result.data];
          setSocialHandles(updatedHandles);
          if (onHandlesChange) {
            onHandlesChange(updatedHandles);
          }
        }
      } else {
        const errorData = await response.json();
        alert(
          `Failed to save social handle: ${errorData.message || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error('Error saving social handle:', error);
      alert('Error saving social handle. Please try again.');
    }
  };

  const handleDelete = async (id: string | undefined, index: number) => {
    if (!id) {
      // If no ID, just update local state
      const updatedHandles = socialHandles.filter((_, i) => i !== index);
      setSocialHandles(updatedHandles);
      if (onHandlesChange) {
        onHandlesChange(updatedHandles);
      }
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/api/profile/social-handles/${id}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        const updatedHandles = socialHandles.filter((_, i) => i !== index);
        setSocialHandles(updatedHandles);
        if (onHandlesChange) {
          onHandlesChange(updatedHandles);
        }
      } else {
        const errorData = await response.json();
        alert(
          `Failed to delete social handle: ${errorData.message || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error('Error deleting social handle:', error);
      alert('Error deleting social handle. Please try again.');
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-lg p-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Social Handles</h2>
          <button
            onClick={() => setShowPopup(true)}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-6 h-6 text-gray-900" />
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 italic">Loading...</p>
        ) : socialHandles.length === 0 ? (
          <p className="text-gray-500 italic">
            No social handles added yet. Click the + button to add one.
          </p>
        ) : (
          <div className="space-y-3">
            {socialHandles.map((handle, index) => (
              <div
                key={handle.id || index}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                {getPlatformIcon(handle.platform)}
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {handle.platform}
                  </div>
                  <a
                    href={handle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 truncate block"
                  >
                    {handle.url}
                  </a>
                </div>
                <button
                  onClick={() => handleDelete(handle.id, index)}
                  className="p-2 rounded-full hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-600" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <SocialHandlePopup
        open={showPopup}
        onClose={() => setShowPopup(false)}
        onSave={handleAdd}
      />
    </>
  );
}
