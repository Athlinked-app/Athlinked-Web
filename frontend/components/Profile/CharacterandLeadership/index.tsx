'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import CharacterAndLeadershipPopup, {
  type CharacterAndLeadership,
} from '../CharacterandLeadershipPopup';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';
import { getCurrentUserId } from '@/utils/auth';

export type { CharacterAndLeadership };

interface CharacterAndLeadershipProps {
  characterAndLeadership?: CharacterAndLeadership[];
  onCharacterAndLeadershipChange?: (data: CharacterAndLeadership[]) => void;
  userId?: string | null;
}

export default function CharacterAndLeadershipComponent({
  characterAndLeadership = [],
  onCharacterAndLeadershipChange,
  userId,
}: CharacterAndLeadershipProps) {
  const [characterAndLeadershipList, setCharacterAndLeadershipList] = useState<
    CharacterAndLeadership[]
  >(characterAndLeadership);
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

  // Sync with props when characterAndLeadership changes
  useEffect(() => {
    if (characterAndLeadership && characterAndLeadership.length > 0) {
      setCharacterAndLeadershipList(characterAndLeadership);
    }
  }, [characterAndLeadership]);

  // OPTIMIZED: Data is now passed as props from parent (fetchProfileComplete)
  // No need to fetch here - parent component handles all data fetching
  // This component only manages add/edit/delete operations

  const handleAdd = async (newData: CharacterAndLeadership) => {
    if (editingIndex !== null) {
      // Update existing entry
      const existingData = characterAndLeadershipList[editingIndex];
      if (!userId || !existingData.id) {
        // If no userId or ID, just update local state
        const updatedList = [...characterAndLeadershipList];
        updatedList[editingIndex] = newData;
        setCharacterAndLeadershipList(updatedList);
        if (onCharacterAndLeadershipChange) {
          onCharacterAndLeadershipChange(updatedList);
        }
        setEditingIndex(null);
        return;
      }

      try {
        const result = await apiPut<{
          success: boolean;
          data?: CharacterAndLeadership;
          message?: string;
        }>(`/profile/character-leadership/${existingData.id}`, newData);

        if (result.success && result.data) {
          const updatedList = [...characterAndLeadershipList];
          updatedList[editingIndex] = result.data;
          setCharacterAndLeadershipList(updatedList);
          if (onCharacterAndLeadershipChange) {
            onCharacterAndLeadershipChange(updatedList);
          }
          setEditingIndex(null);
        } else {
          alert(
            `Failed to update character and leadership: ${result.message || 'Unknown error'}`
          );
        }
      } catch (error) {
        console.error('Error updating character and leadership:', error);
        alert('Error updating character and leadership. Please try again.');
      }
    } else {
      // Add new entry
      if (!userId) {
        // If no userId, just update local state
        const updatedList = [...characterAndLeadershipList, newData];
        setCharacterAndLeadershipList(updatedList);
        if (onCharacterAndLeadershipChange) {
          onCharacterAndLeadershipChange(updatedList);
        }
        return;
      }

      try {
        const result = await apiPost<{
          success: boolean;
          data?: CharacterAndLeadership;
          message?: string;
        }>(`/profile/${userId}/character-leadership`, newData);

        if (result.success && result.data) {
          const updatedList = [...characterAndLeadershipList, result.data];
          setCharacterAndLeadershipList(updatedList);
          if (onCharacterAndLeadershipChange) {
            onCharacterAndLeadershipChange(updatedList);
          }
        } else {
          alert(
            `Failed to save character and leadership: ${result.message || 'Unknown error'}`
          );
        }
      } catch (error) {
        console.error('Error saving character and leadership:', error);
        alert('Error saving character and leadership. Please try again.');
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
      const updatedList = characterAndLeadershipList.filter(
        (_, i) => i !== index
      );
      setCharacterAndLeadershipList(updatedList);
      if (onCharacterAndLeadershipChange) {
        onCharacterAndLeadershipChange(updatedList);
      }
      return;
    }

    try {
      const result = await apiDelete<{
        success: boolean;
        message?: string;
      }>(`/profile/character-leadership/${id}`);

      if (result.success) {
        const updatedList = characterAndLeadershipList.filter(
          (_, i) => i !== index
        );
        setCharacterAndLeadershipList(updatedList);
        if (onCharacterAndLeadershipChange) {
          onCharacterAndLeadershipChange(updatedList);
        }
      } else {
        alert(
          `Failed to delete character and leadership: ${result.message || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error('Error deleting character and leadership:', error);
      alert('Error deleting character and leadership. Please try again.');
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-lg px-1 md:px-3 py-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">
            Character and Leadership
          </h2>
          {isOwnProfile && (
            <button
              onClick={() => {
                // If there's existing data, show the first entry for editing
                // Otherwise, open empty form for new entry
                if (characterAndLeadershipList.length > 0) {
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
        ) : characterAndLeadershipList.length === 0 ? (
          <p className="text-gray-500 italic text-base">
            No character and leadership information added yet. Click the +
            button to add one.
          </p>
        ) : (
          <div className="space-y-4">
            {characterAndLeadershipList.map((data, index) => (
              <div
                key={data.id || index}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleView(index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {data.teamCaptain && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Team Captain:</span>{' '}
                        {data.teamCaptain}
                      </p>
                    )}
                    {data.leadershipRoles && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Leadership Roles:</span>{' '}
                        {data.leadershipRoles}
                      </p>
                    )}
                    {data.languagesSpoken &&
                      data.languagesSpoken.length > 0 && (
                        <p className="text-sm text-gray-600 mb-1">
                          <span className="font-medium">Languages Spoken:</span>{' '}
                          {data.languagesSpoken.join(', ')}
                        </p>
                      )}
                    {data.communityService && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Community Service:</span>{' '}
                        {data.communityService}
                      </p>
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
                        onClick={() => handleDelete(data.id, index)}
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

      <CharacterAndLeadershipPopup
        open={showPopup}
        onClose={handleClose}
        onSave={handleAdd}
        existingData={
          editingIndex !== null
            ? characterAndLeadershipList[editingIndex]
            : undefined
        }
      />

      {/* View Popup */}
      {showViewPopup && viewingIndex !== null && (
        <ViewCharacterAndLeadershipPopup
          open={showViewPopup}
          onClose={handleCloseView}
          data={characterAndLeadershipList[viewingIndex]}
        />
      )}
    </>
  );
}

// View-only popup component
function ViewCharacterAndLeadershipPopup({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: CharacterAndLeadership;
}) {
  if (!open) return null;

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
            Character and Leadership Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">
          {data.teamCaptain && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Team Captain
              </label>
              <p className="text-gray-900">{data.teamCaptain}</p>
            </div>
          )}

          {data.leadershipRoles && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Leadership Roles
              </label>
              <p className="text-gray-900">{data.leadershipRoles}</p>
            </div>
          )}

          {data.languagesSpoken && data.languagesSpoken.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Languages Spoken
              </label>
              <p className="text-gray-900">{data.languagesSpoken.join(', ')}</p>
            </div>
          )}

          {data.communityService && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Community Service
              </label>
              <p className="text-gray-900 whitespace-pre-wrap">
                {data.communityService}
              </p>
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
