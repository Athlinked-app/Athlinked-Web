'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, FileText, Pencil, X } from 'lucide-react';
import AchievementsPopup, { type Achievement } from '../AchievementsPopup';
import {
  apiGet,
  apiPost,
  apiPut,
  apiDelete,
  apiUpload,
  apiRequest,
} from '@/utils/api';
import { getResourceUrl } from '@/utils/api';
import { getCurrentUserId } from '@/utils/auth';

export type { Achievement };

interface AchievementsProps {
  achievements?: Achievement[];
  onAchievementsChange?: (achievements: Achievement[]) => void;
  userId?: string | null;
}

export default function Achievements({
  achievements = [],
  onAchievementsChange,
  userId,
}: AchievementsProps) {
  const [achievementsList, setAchievementsList] =
    useState<Achievement[]>(achievements);
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

  // Sync with props when achievements change
  useEffect(() => {
    if (achievements && achievements.length > 0) {
      setAchievementsList(achievements);
    }
  }, [achievements]);

  // OPTIMIZED: Data is now passed as props from parent (fetchProfileComplete)
  // No need to fetch here - parent component handles all data fetching
  // This component only manages add/edit/delete operations

  const handleAdd = async (newAchievement: Achievement) => {
    // Check if there's a PDF file to upload
    const hasPdfFile = newAchievement.mediaPdf instanceof File;

    if (editingIndex !== null) {
      // Update existing achievement
      const existingAchievement = achievementsList[editingIndex];
      if (!userId || !existingAchievement.id) {
        // If no userId or ID, just update local state
        const updatedAchievements = [...achievementsList];
        updatedAchievements[editingIndex] = newAchievement;
        setAchievementsList(updatedAchievements);
        if (onAchievementsChange) {
          onAchievementsChange(updatedAchievements);
        }
        setEditingIndex(null);
        return;
      }

      try {
        let result;
        if (hasPdfFile) {
          // Use FormData for file upload
          const formData = new FormData();
          formData.append('mediaPdf', newAchievement.mediaPdf as File);
          // Add other fields as JSON string or individual fields
          Object.keys(newAchievement).forEach(key => {
            if (key !== 'mediaPdf' && key !== 'id') {
              const value = (newAchievement as any)[key];
              if (value !== undefined && value !== null) {
                formData.append(key, String(value));
              }
            }
          });

          // Use apiRequest directly for PUT with FormData
          const response = await apiRequest(
            `/profile/achievements/${existingAchievement.id}`,
            {
              method: 'PUT',
              body: formData,
            }
          );
          result = await response.json();
        } else {
          result = await apiPut<{
            success: boolean;
            data?: Achievement;
            message?: string;
          }>(`/profile/achievements/${existingAchievement.id}`, newAchievement);
        }

        if (result.success && result.data) {
          const updatedAchievements = [...achievementsList];
          updatedAchievements[editingIndex] = result.data;
          setAchievementsList(updatedAchievements);
          if (onAchievementsChange) {
            onAchievementsChange(updatedAchievements);
          }
          setEditingIndex(null);
        } else {
          alert(
            `Failed to update achievement: ${result.message || 'Unknown error'}`
          );
        }
      } catch (error) {
        console.error('Error updating achievement:', error);
        alert('Error updating achievement. Please try again.');
      }
    } else {
      // Add new achievement
      if (!userId) {
        // If no userId, just update local state
        const updatedAchievements = [...achievementsList, newAchievement];
        setAchievementsList(updatedAchievements);
        if (onAchievementsChange) {
          onAchievementsChange(updatedAchievements);
        }
        return;
      }

      try {
        let result;
        if (hasPdfFile) {
          // Use FormData for file upload
          const formData = new FormData();
          formData.append('mediaPdf', newAchievement.mediaPdf as File);
          // Add other fields
          Object.keys(newAchievement).forEach(key => {
            if (key !== 'mediaPdf' && key !== 'id') {
              const value = (newAchievement as any)[key];
              if (value !== undefined && value !== null) {
                formData.append(key, String(value));
              }
            }
          });

          result = await apiUpload<{
            success: boolean;
            data?: Achievement;
            message?: string;
          }>(`/profile/${userId}/achievements`, formData);
        } else {
          result = await apiPost<{
            success: boolean;
            data?: Achievement;
            message?: string;
          }>(`/profile/${userId}/achievements`, newAchievement);
        }

        if (result.success && result.data) {
          const updatedAchievements = [...achievementsList, result.data];
          setAchievementsList(updatedAchievements);
          if (onAchievementsChange) {
            onAchievementsChange(updatedAchievements);
          }
        } else {
          alert(
            `Failed to save achievement: ${result.message || 'Unknown error'}`
          );
        }
      } catch (error) {
        console.error('Error saving achievement:', error);
        alert('Error saving achievement. Please try again.');
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
      const updatedAchievements = achievementsList.filter(
        (_, i) => i !== index
      );
      setAchievementsList(updatedAchievements);
      if (onAchievementsChange) {
        onAchievementsChange(updatedAchievements);
      }
      return;
    }

    try {
      const result = await apiDelete<{
        success: boolean;
        message?: string;
      }>(`/profile/achievements/${id}`);

      if (result.success) {
        const updatedAchievements = achievementsList.filter(
          (_, i) => i !== index
        );
        setAchievementsList(updatedAchievements);
        if (onAchievementsChange) {
          onAchievementsChange(updatedAchievements);
        }
      } else {
        alert(
          `Failed to delete achievement: ${result.message || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error('Error deleting achievement:', error);
      alert('Error deleting achievement. Please try again.');
    }
  };

  const getPdfUrl = (mediaPdf: Achievement['mediaPdf']): string | null => {
    if (!mediaPdf) return null;
    if (typeof mediaPdf === 'string') {
      if (mediaPdf.startsWith('http://') || mediaPdf.startsWith('https://')) {
        return mediaPdf;
      }
      return getResourceUrl(mediaPdf) || mediaPdf;
    }
    return URL.createObjectURL(mediaPdf);
  };

  const getPdfName = (pdfUrlOrName: string): string => {
    // If it's already a filename, just return it.
    if (!pdfUrlOrName.includes('/')) return pdfUrlOrName;

    try {
      const u = new URL(pdfUrlOrName);
      const last = u.pathname.split('/').filter(Boolean).pop();
      return decodeURIComponent(last || 'document.pdf');
    } catch {
      const clean = pdfUrlOrName.split('?')[0];
      const last = clean.split('/').filter(Boolean).pop();
      return decodeURIComponent(last || 'document.pdf');
    }
  };

  const openPdf = (mediaPdf: Achievement['mediaPdf']) => {
    const url = getPdfUrl(mediaPdf);
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div className="w-full bg-white rounded-lg px-1 md:px-3 py-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Achievements</h2>
          {isOwnProfile && (
            <button
              onClick={() => {
                // If there's existing data, show the first entry for editing
                // Otherwise, open empty form for new entry
                if (achievementsList.length > 0) {
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
          <p className="text-gray-500 italic text-base">Loading...</p>
        ) : achievementsList.length === 0 ? (
          <p className="text-gray-500 italic text-base">
            No achievements added yet. Click the + button to add one.
          </p>
        ) : (
          <div className="space-y-4">
            {achievementsList.map((achievement, index) => (
              <div
                key={achievement.id || index}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleView(index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-gray-800 uppercase">
                      <h3 className="text-sm text-gray-600">
                        {achievement.title}
                      </h3>
                      {achievement.organization && (
                        <span className="text-sm text-gray-600">
                          - {achievement.organization}
                        </span>
                      )}
                    </div>
                    {achievement.sport && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Sport:</span>{' '}
                        {achievement.sport}
                      </p>
                    )}
                    {achievement.achievementType && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Type:</span>{' '}
                        {achievement.achievementType}
                      </p>
                    )}
                    {achievement.level && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Level:</span>{' '}
                        {achievement.level}
                      </p>
                    )}
                    {achievement.dateAwarded && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Date Awarded:</span>{' '}
                        {achievement.dateAwarded}
                      </p>
                    )}
                    {achievement.location && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Location:</span>{' '}
                        {achievement.location}
                      </p>
                    )}
                    {achievement.description && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Description:</span>{' '}
                        {achievement.description}
                      </p>
                    )}
                    {achievement.mediaPdf && (
                      <button
                        type="button"
                        className="flex items-center gap-2 mt-2 text-sm text-gray-600 hover:underline"
                        onClick={e => {
                          e.stopPropagation();
                          openPdf(achievement.mediaPdf);
                        }}
                      >
                        <FileText className="w-4 h-4" />
                        <span className="break-all">
                          {getPdfName(
                            typeof achievement.mediaPdf === 'string'
                              ? achievement.mediaPdf
                              : achievement.mediaPdf.name
                          )}
                        </span>
                      </button>
                    )}
                  </div>
                  {isOwnProfile && (
                    <div
                      className="flex items-center gap-2 ml-4"
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleEdit(index)}
                        className="p-2 rounded-full hover:bg-blue-50 transition-colors"
                      >
                        <Pencil className="w-4 h-4 text-blue-600" />
                      </button>
                      <button
                        onClick={() => handleDelete(achievement.id, index)}
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

      <AchievementsPopup
        open={showPopup}
        onClose={handleClose}
        onSave={handleAdd}
        existingData={
          editingIndex !== null ? achievementsList[editingIndex] : undefined
        }
      />

      {/* View Popup */}
      {showViewPopup && viewingIndex !== null && (
        <ViewAchievementPopup
          open={showViewPopup}
          onClose={handleCloseView}
          data={achievementsList[viewingIndex]}
        />
      )}
    </>
  );
}

// View-only popup component
function ViewAchievementPopup({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: Achievement;
}) {
  if (!open) return null;

  const getPdfUrl = (mediaPdf: Achievement['mediaPdf']): string | null => {
    if (!mediaPdf) return null;
    if (typeof mediaPdf === 'string') {
      if (mediaPdf.startsWith('http://') || mediaPdf.startsWith('https://')) {
        return mediaPdf;
      }
      return getResourceUrl(mediaPdf) || mediaPdf;
    }
    return URL.createObjectURL(mediaPdf);
  };

  const getPdfName = (pdfUrlOrName: string): string => {
    if (!pdfUrlOrName.includes('/')) return pdfUrlOrName;

    try {
      const u = new URL(pdfUrlOrName);
      const last = u.pathname.split('/').filter(Boolean).pop();
      return decodeURIComponent(last || 'document.pdf');
    } catch {
      const clean = pdfUrlOrName.split('?')[0];
      const last = clean.split('/').filter(Boolean).pop();
      return decodeURIComponent(last || 'document.pdf');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl m-7 lg:m-0 bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Achievement Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {data.title && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <p className="text-gray-900">{data.title}</p>
            </div>
          )}

          {data.organization && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization
              </label>
              <p className="text-gray-900">{data.organization}</p>
            </div>
          )}

          {data.sport && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sport
              </label>
              <p className="text-gray-900">{data.sport}</p>
            </div>
          )}

          {data.positionEvent && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position/Event
              </label>
              <p className="text-gray-900">{data.positionEvent}</p>
            </div>
          )}

          {data.achievementType && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Achievement Type
              </label>
              <p className="text-gray-900">{data.achievementType}</p>
            </div>
          )}

          {data.level && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level
              </label>
              <p className="text-gray-900">{data.level}</p>
            </div>
          )}

          {data.dateAwarded && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date Awarded
              </label>
              <p className="text-gray-900">{data.dateAwarded}</p>
            </div>
          )}

          {data.location && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <p className="text-gray-900">{data.location}</p>
            </div>
          )}

          {data.description && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <p className="text-gray-900 whitespace-pre-wrap">
                {data.description}
              </p>
            </div>
          )}

          {data.mediaPdf && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Media PDF
              </label>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-gray-600" />
                <a
                  href={getPdfUrl(data.mediaPdf) || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:underline break-all"
                >
                  {getPdfName(
                    typeof data.mediaPdf === 'string'
                      ? data.mediaPdf
                      : data.mediaPdf.name
                  )}
                </a>
              </div>
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
