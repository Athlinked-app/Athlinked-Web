'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import SocialHandlePopup from '../SocialHandlePopup';
import { apiGet, apiPost, apiDelete } from '@/utils/api';
import { getCurrentUserId } from '@/utils/auth';

export interface SocialHandle {
  id?: string;
  platform: string;
  url: string;
}

interface SocialHandleProps {
  handles?: SocialHandle[];
  onHandlesChange?: (handles: SocialHandle[]) => void;
  userId?: string | null;
  isOwnProfile?: boolean;
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
  isOwnProfile: propIsOwnProfile,
}: SocialHandleProps) {
  const [socialHandles, setSocialHandles] = useState<SocialHandle[]>(handles);
  const [showPopup, setShowPopup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  // Check if viewing own profile (client-side only to avoid hydration issues)
  useEffect(() => {
    if (propIsOwnProfile !== undefined) {
      setIsOwnProfile(propIsOwnProfile);
    } else {
      const currentUserId = getCurrentUserId();
      setIsOwnProfile(userId === currentUserId);
    }
  }, [userId, propIsOwnProfile]);

  // Sync with props when handles change
  useEffect(() => {
    if (handles && handles.length > 0) {
      setSocialHandles(handles);
    }
  }, [handles]);

  // OPTIMIZED: Data is now passed as props from parent (fetchProfileComplete)
  // No need to fetch here - parent component handles all data fetching
  // This component only manages add/edit/delete operations

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
      const result = await apiPost<{
        success: boolean;
        data?: SocialHandle;
        message?: string;
      }>(`/profile/${userId}/social-handles`, {
        platform: newHandle.platform,
        url: newHandle.url,
      });

      if (result.success && result.data) {
        const updatedHandles = [...socialHandles, result.data];
        setSocialHandles(updatedHandles);
        if (onHandlesChange) {
          onHandlesChange(updatedHandles);
        }
      } else {
        alert(
          `Failed to save social handle: ${result.message || 'Unknown error'}`
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
      const result = await apiDelete<{
        success: boolean;
        message?: string;
      }>(`/profile/social-handles/${id}`);

      if (result.success) {
        const updatedHandles = socialHandles.filter((_, i) => i !== index);
        setSocialHandles(updatedHandles);
        if (onHandlesChange) {
          onHandlesChange(updatedHandles);
        }
      } else {
        alert(
          `Failed to delete social handle: ${result.message || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error('Error deleting social handle:', error);
      alert('Error deleting social handle. Please try again.');
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-lg px-1 md:px-3 py-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Social Handles</h2>
          {isOwnProfile && (
            <button
              onClick={() => setShowPopup(true)}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Plus className="w-5 h-5 text-gray-900" />
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500 italic text-base">Loading...</p>
        ) : socialHandles.length === 0 ? (
          <p className="text-gray-500 italic text-base">
            {isOwnProfile
              ? 'No social handles added yet. Click the + button to add one.'
              : 'No social handles added yet.'}
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
                {isOwnProfile && (
                  <button
                    onClick={() => handleDelete(handle.id, index)}
                    className="p-2 rounded-full hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                )}
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
