'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X } from 'lucide-react';

interface HomePopupProps {
  profileCompletion?: number;
  onCompleteProfile?: () => void;
  userId?: string | null;
}

export default function HomePopup({
  profileCompletion = 20,
  onCompleteProfile,
  userId,
}: HomePopupProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Only check if we have a userId
    if (!userId) return;

    // Check if this specific user has opted to not show this again
    // Using user-specific key so it persists across logins
    const storageKey = `athlinked_hide_profile_popup_${userId}`;
    const hidePopup = localStorage.getItem(storageKey);

    if (!hidePopup) {
      // Show popup after a small delay for better UX
      const timer = setTimeout(() => {
        setShowPopup(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [userId]);

  const handleSkip = () => {
    if (dontShowAgain && userId) {
      // Store preference with user-specific key
      const storageKey = `athlinked_hide_profile_popup_${userId}`;
      localStorage.setItem(storageKey, 'true');
    }
    setShowPopup(false);
  };

  const handleCompleteProfile = () => {
    if (dontShowAgain && userId) {
      // Store preference with user-specific key
      const storageKey = `athlinked_hide_profile_popup_${userId}`;
      localStorage.setItem(storageKey, 'true');
    }
    setShowPopup(false);
    if (onCompleteProfile) {
      onCompleteProfile();
    } else {
      router.push('/profile');
    }
  };

  if (!showPopup) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        {/* Title */}
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
          Finish Strong
        </h2>

        {/* Progress Indicator */}
        <div className="mb-6 relative">
          {/* Runner Icon - positioned above the progress bar, moves with progress */}
          <div
            className="absolute bottom-full  transition-all duration-500 z-10"
            style={{ left: `calc(${profileCompletion}% - 20px)` }}
          >
            <img
              src="/assets/Homescreen/Human.png"
              alt="Runner"
              className="w-10 h-10 object-contain"
            />
          </div>
          <div className="absolute right-0 top-[-10px] -translate-y-1/2">
            <img
              src="/assets/Homescreen/Flag.png"
              alt="Finish Flag"
              className="w-6 h-6 object-contain"
            />
          </div>

          <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden mt-12">
            {/* Track */}
            <div className="absolute inset-0 bg-[#CB9729]/20 rounded-full" />
            {/* Progress */}
            <div
              className="absolute left-0 top-0 h-full bg-[#CB9729] rounded-full transition-all duration-500"
              style={{ width: `${profileCompletion}%` }}
            />

            {/* Finish Flag */}
          </div>
        </div>

        {/* Motivational Message */}
        <p className="font-bold sm:text-md text-gray-900 mb-4">
          You've conquered{' '}
          <span className="font-bold text-[#CB9729]">{profileCompletion}%</span>{' '}
          of your race, push harder, the finish line's waiting!
        </p>

        {/* Call to Action */}
        <p className="text-sm sm:text-base text-gray-600 mb-6">
          Push past the finish line today! A complete profile gives you the edge
          to be noticed by coaches, scouts, and top teams.
        </p>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={handleSkip}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={handleCompleteProfile}
            className="flex-1 px-4 py-2.5 bg-[#CB9729] text-white rounded-lg font-medium hover:bg-[#b78322] transition-colors"
          >
            Complete Profile
          </button>
        </div>

        {/* Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={e => setDontShowAgain(e.target.checked)}
            className="w-4 h-4 text-[#CB9729] border-gray-300 rounded focus:ring-[#CB9729]"
          />
          <span className="text-sm text-gray-600">Do not show this again</span>
        </label>
      </div>
    </div>
  );
}
