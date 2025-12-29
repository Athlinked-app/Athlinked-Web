'use client';

import { useState, useRef, useEffect } from 'react';
import { X, ChevronDown } from 'lucide-react';

export interface VideoAndMedia {
  highlightVideoLink: string;
  videoStatus: string;
  verifiedMediaProfile: string;
}

interface VideoAndMediaPopupProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: VideoAndMedia) => void;
  existingData?: VideoAndMedia;
}

const videoStatusOptions = ['Viewable', 'Broken', 'Pending'];
const verifiedMediaProfileOptions = ['HUDL', 'AAU', 'MaxPreps', 'None'];

export default function VideoAndMediaPopup({
  open,
  onClose,
  onSave,
  existingData,
}: VideoAndMediaPopupProps) {
  const [highlightVideoLink, setHighlightVideoLink] = useState(
    existingData?.highlightVideoLink || ''
  );
  const [videoStatus, setVideoStatus] = useState(
    existingData?.videoStatus || ''
  );
  const [verifiedMediaProfile, setVerifiedMediaProfile] = useState(
    existingData?.verifiedMediaProfile || ''
  );

  const [showVideoStatusDropdown, setShowVideoStatusDropdown] = useState(false);
  const [
    showVerifiedMediaProfileDropdown,
    setShowVerifiedMediaProfileDropdown,
  ] = useState(false);

  const videoStatusRef = useRef<HTMLDivElement>(null);
  const verifiedMediaProfileRef = useRef<HTMLDivElement>(null);

  // Update form when existingData changes (for editing)
  useEffect(() => {
    if (open && existingData) {
      setHighlightVideoLink(existingData.highlightVideoLink || '');
      setVideoStatus(existingData.videoStatus || '');
      setVerifiedMediaProfile(existingData.verifiedMediaProfile || '');
    } else if (open && !existingData) {
      // Reset form when opening for new entry
      setHighlightVideoLink('');
      setVideoStatus('');
      setVerifiedMediaProfile('');
    }
  }, [open, existingData]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        videoStatusRef.current &&
        !videoStatusRef.current.contains(event.target as Node)
      ) {
        setShowVideoStatusDropdown(false);
      }
      if (
        verifiedMediaProfileRef.current &&
        !verifiedMediaProfileRef.current.contains(event.target as Node)
      ) {
        setShowVerifiedMediaProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!open) return null;

  const handleSave = () => {
    // Validate required fields
    if (!highlightVideoLink.trim() || !videoStatus || !verifiedMediaProfile) {
      return; // Don't save if required fields are empty
    }

    onSave({
      highlightVideoLink,
      videoStatus,
      verifiedMediaProfile,
    });
    // Reset form
    setHighlightVideoLink('');
    setVideoStatus('');
    setVerifiedMediaProfile('');
    onClose();
  };

  // Check if all required fields are filled
  const isFormValid =
    highlightVideoLink.trim() && videoStatus && verifiedMediaProfile;

  const DropdownField = ({
    label,
    value,
    placeholder,
    options,
    showDropdown,
    setShowDropdown,
    onSelect,
    ref,
    helperText,
  }: {
    label: string;
    value: string;
    placeholder: string;
    options: string[];
    showDropdown: boolean;
    setShowDropdown: (show: boolean) => void;
    onSelect: (value: string) => void;
    ref: React.RefObject<HTMLDivElement | null>;
    helperText?: string;
  }) => (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>
      <div
        onClick={() => setShowDropdown(!showDropdown)}
        className={`w-full px-4 py-2 border rounded-lg cursor-pointer flex items-center justify-between ${
          showDropdown
            ? 'border-[#CB9729] ring-2 ring-[#CB9729]'
            : 'border-gray-300'
        }`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'transform rotate-180' : ''}`}
        />
      </div>
      {showDropdown && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {options.map(option => (
            <div
              key={option}
              onClick={() => {
                onSelect(option);
                setShowDropdown(false);
              }}
              className={`px-4 py-2 hover:bg-gray-50 cursor-pointer ${
                value === option ? 'bg-blue-50' : ''
              }`}
            >
              {option}
            </div>
          ))}
        </div>
      )}
      {helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-2xl max-h-[200vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Video and Media</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Highlight Video or Game Film Link */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Highlight Video or Game Film Link
            </label>
            <input
              type="url"
              value={highlightVideoLink}
              onChange={e => setHighlightVideoLink(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter a YouTube, HUDL, or Vimeo link to your highlight video
            </p>
          </div>

          {/* Video Status */}
          <DropdownField
            label="Video Status"
            value={videoStatus}
            placeholder="Select status"
            options={videoStatusOptions}
            showDropdown={showVideoStatusDropdown}
            setShowDropdown={setShowVideoStatusDropdown}
            onSelect={setVideoStatus}
            ref={videoStatusRef}
            helperText="This will be system-assigned but you can set it manually for now"
          />

          {/* Verified Media Profile */}
          <DropdownField
            label="Verified Media Profile"
            value={verifiedMediaProfile}
            placeholder="Select status"
            options={verifiedMediaProfileOptions}
            showDropdown={showVerifiedMediaProfileDropdown}
            setShowDropdown={setShowVerifiedMediaProfileDropdown}
            onSelect={setVerifiedMediaProfile}
            ref={verifiedMediaProfileRef}
          />
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={!isFormValid}
            className={`px-6 py-2 rounded-lg transition-colors font-semibold ${
              isFormValid
                ? 'bg-[#CB9729] text-white hover:bg-[#b78322] cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
