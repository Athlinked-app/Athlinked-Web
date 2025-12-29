'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import SocialHandlePopup from '../SocialHandlePopup';

export interface SocialHandle {
  platform: string;
  url: string;
}

interface SocialHandleProps {
  handles?: SocialHandle[];
  onHandlesChange?: (handles: SocialHandle[]) => void;
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
}: SocialHandleProps) {
  const [socialHandles, setSocialHandles] = useState<SocialHandle[]>(handles);
  const [showPopup, setShowPopup] = useState(false);

  const handleAdd = (newHandle: SocialHandle) => {
    const updatedHandles = [...socialHandles, newHandle];
    setSocialHandles(updatedHandles);
    if (onHandlesChange) {
      onHandlesChange(updatedHandles);
    }
  };

  const handleDelete = (index: number) => {
    const updatedHandles = socialHandles.filter((_, i) => i !== index);
    setSocialHandles(updatedHandles);
    if (onHandlesChange) {
      onHandlesChange(updatedHandles);
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

        {socialHandles.length === 0 ? (
          <p className="text-gray-500 italic">
            No social handles added yet. Click the + button to add one.
          </p>
        ) : (
          <div className="space-y-3">
            {socialHandles.map((handle, index) => (
              <div
                key={index}
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
                  onClick={() => handleDelete(index)}
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
