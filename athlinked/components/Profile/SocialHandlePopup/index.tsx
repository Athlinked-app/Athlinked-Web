'use client';
import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface SocialHandle {
  platform: string;
  url: string;
}

interface SocialHandlePopupProps {
  open: boolean;
  onClose: () => void;
  onSave: (handle: SocialHandle) => void;
}

const socialPlatforms = [
  'Facebook',
  'Instagram',
  'Twitter',
  'Tiktok',
  'Others',
];

export default function SocialHandlePopup({
  open,
  onClose,
  onSave,
}: SocialHandlePopupProps) {
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [url, setUrl] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  if (!open) return null;

  const handleSubmit = () => {
    if (selectedPlatform && url.trim()) {
      onSave({
        platform: selectedPlatform,
        url: url.trim(),
      });
      setSelectedPlatform('');
      setUrl('');
      onClose();
    }
  };

  const handlePlatformSelect = (platform: string) => {
    setSelectedPlatform(platform);
    setShowDropdown(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Add Social Handles
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4">
          {/* Platform Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Social Handles
            </label>
            <div
              onClick={() => setShowDropdown(!showDropdown)}
              className={`w-full px-4 py-2 border rounded-lg cursor-pointer flex items-center justify-between ${
                showDropdown
                  ? 'border-[#CB9729] ring-2 ring-[#CB9729]'
                  : 'border-gray-300'
              }`}
            >
              <span
                className={selectedPlatform ? 'text-gray-900' : 'text-gray-500'}
              >
                {selectedPlatform || 'Select Social Handles'}
              </span>
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  showDropdown ? 'transform rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {socialPlatforms.map(platform => (
                  <div
                    key={platform}
                    onClick={() => handlePlatformSelect(platform)}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                  >
                    {platform}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Social Handle URL
            </label>
            <input
              type="text"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="Social Handle URL"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={!selectedPlatform || !url.trim()}
            className="px-6 py-2 bg-[#CB9729] text-white rounded-lg hover:bg-[#b78322] transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
