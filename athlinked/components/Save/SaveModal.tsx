'use client';

import { useState, useEffect } from 'react';

interface SaveModalProps {
  postId: string;
  showAlert: boolean;
  alertMessage: string;
  isSaved: boolean;
}

export default function SaveModal({
  postId,
  showAlert,
  alertMessage,
  isSaved,
}: SaveModalProps) {
  if (!showAlert) return null;

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-top-2">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 min-w-[200px]">
        <div className="flex-shrink-0">
          {isSaved ? (
            <svg
              className="w-5 h-5 text-green-500"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
        </div>
        <p className="text-sm font-medium text-gray-900">{alertMessage}</p>
      </div>
    </div>
  );
}

// Export hook to check save status
export function useSaveStatus(postId: string) {
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const checkSavedStatus = () => {
      const savedPosts = JSON.parse(
        localStorage.getItem('athlinked_saved_posts') || '[]'
      );
      setIsSaved(savedPosts.includes(postId));
    };

    checkSavedStatus();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      checkSavedStatus();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [postId]);

  return isSaved;
}

// Export function to toggle save
export function toggleSave(postId: string): boolean {
  const savedPosts = JSON.parse(
    localStorage.getItem('athlinked_saved_posts') || '[]'
  );

  if (savedPosts.includes(postId)) {
    // Unsave
    const updatedSavedPosts = savedPosts.filter((id: string) => id !== postId);
    localStorage.setItem('athlinked_saved_posts', JSON.stringify(updatedSavedPosts));
    return false;
  } else {
    // Save
    const updatedSavedPosts = [...savedPosts, postId];
    localStorage.setItem('athlinked_saved_posts', JSON.stringify(updatedSavedPosts));
    return true;
  }
}

