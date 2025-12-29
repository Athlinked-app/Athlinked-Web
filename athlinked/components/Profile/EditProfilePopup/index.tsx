'use client';

import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { X, Camera, Pencil, GraduationCap } from 'lucide-react';

interface EditProfilePopupProps {
  open: boolean;
  onClose: () => void;
  userData?: {
    full_name?: string;
    profile_url?: string | null;
    background_image_url?: string | null;
    sports_played?: string;
    education?: string;
    bio?: string;
  };
  onSave?: (data: {
    profile_url?: File;
    background_image_url?: File;
    sports_played?: string;
    education?: string;
    bio?: string;
  }) => void;
}

export default function EditProfilePopup({
  open,
  onClose,
  userData,
  onSave,
}: EditProfilePopupProps) {
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    userData?.profile_url || null
  );
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(
    userData?.background_image_url || null
  );
  const [sportsPlayed, setSportsPlayed] = useState(userData?.sports_played || '');
  const [education, setEducation] = useState(userData?.education || '');
  const [bio, setBio] = useState(userData?.bio || '');
  const [showSportsDropdown, setShowSportsDropdown] = useState(false);
  const [selectedSports, setSelectedSports] = useState<string[]>(() => {
    if (userData?.sports_played) {
      return userData.sports_played.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [];
  });

  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);
  const sportsDropdownRef = useRef<HTMLDivElement>(null);

  const sportsList = [
    'Football',
    'Basketball',
    'Baseball',
    'Swimming',
    'Soccer',
    'Track & Field',
    'Wrestling',
    'Tennis',
    'Golf',
    'Lacrosse',
    'Hockey',
    'Volleyball',
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sportsDropdownRef.current && !sportsDropdownRef.current.contains(event.target as Node)) {
        setShowSportsDropdown(false);
      }
    };

    if (showSportsDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSportsDropdown]);

  if (!open) return null;

  const handleProfileImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImage(file);
      setProfileImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCoverImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setCoverImage(file);
      setCoverImagePreview(URL.createObjectURL(file));
    }
  };

  const handleProfileImageClick = () => {
    profileImageInputRef.current?.click();
  };

  const handleCoverImageClick = () => {
    coverImageInputRef.current?.click();
  };

  const handleSportToggle = (sport: string) => {
    setSelectedSports(prev => {
      const isSelected = prev.includes(sport);
      const newSports = isSelected
        ? prev.filter(s => s !== sport)
        : [...prev, sport];
      setSportsPlayed(newSports.join(', '));
      return newSports;
    });
  };

  const handleSave = () => {
    if (onSave) {
      onSave({
        profile_url: profileImage || undefined,
        background_image_url: coverImage || undefined,
        sports_played: sportsPlayed,
        education: education,
        bio: bio,
      });
    }
    onClose();
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AL';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">Edit Your Profile</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Profile Image Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Profile Image
            </label>
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-gray-500 bg-gray-200 flex items-center justify-center">
                  {profileImagePreview ? (
                    <img
                      src={profileImagePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl font-bold text-white">
                      {getInitials(userData?.full_name)}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleProfileImageClick}
                  className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 rounded-full p-2 border-4 border-white transition-colors"
                >
                  <Camera className="w-4 h-4 text-white" />
                </button>
                <input
                  ref={profileImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleProfileImageSelect}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Cover Image Section */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Cover Image
            </label>
            <div
              onClick={handleCoverImageClick}
              className="w-full  bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-[#CB9729] transition-colors relative overflow-hidden"
            >
              {coverImagePreview ? (
                <>
                  <img
                    src={coverImagePreview}
                    alt="Cover"
                    className="w-full h-full object-fill"
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </>
              ) : (
                <div className="text-center">
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Click to upload cover image</p>
                </div>
              )}
              <input
                ref={coverImageInputRef}
                type="file"
                accept="image/*"
                onChange={handleCoverImageSelect}
                className="hidden"
              />
            </div>
          </div>

          {/* Sports Section */}
          <div className="relative" ref={sportsDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sports
            </label>
            <div className="relative">
              <input
                type="text"
                value={sportsPlayed}
                readOnly
                onClick={() => setShowSportsDropdown(!showSportsDropdown)}
                placeholder="Football, Basketball, Baseball"
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900 cursor-pointer"
              />
              <div 
                className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none"
                onClick={() => setShowSportsDropdown(!showSportsDropdown)}
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Dropdown */}
            {showSportsDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                <div className="p-2 space-y-1">
                  {sportsList.map((sport) => (
                    <label
                      key={sport}
                      className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer rounded"
                    >
                      <input
                        type="checkbox"
                        checked={selectedSports.includes(sport)}
                        onChange={() => handleSportToggle(sport)}
                        className="w-4 h-4 text-[#CB9729] border-gray-300 rounded focus:ring-[#CB9729] focus:ring-2"
                      />
                      <span className="ml-3 text-sm text-gray-700">{sport}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Tell us about you</h3>
            <p className="text-sm text-gray-600 mb-4">
              Please add your photo and biography to tell us about yourself.
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Education
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={education}
                  onChange={e => setEducation(e.target.value)}
                  placeholder="Ex: Stanford University"
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Bio Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Bio
              </label>
              <div className="relative">
                <textarea
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Write here......"
                  rows={6}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900 resize-none"
                />
                <button
                  type="button"
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-[#CB9729] text-white rounded-lg hover:bg-[#b78322] transition-colors font-semibold"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

