'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import AthleticAndPerformancePopup, {
  type AthleticAndPerformance,
} from '../AthleticandPerformancePopup';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';
import { getCurrentUserId } from '@/utils/auth';

export type { AthleticAndPerformance };

interface AthleticAndPerformanceProps {
  athleticAndPerformance?: AthleticAndPerformance[];
  onAthleticAndPerformanceChange?: (data: AthleticAndPerformance[]) => void;
  sportsPlayed?: string; // Comma-separated string of sports
  userId?: string | null;
}

export default function AthleticAndPerformanceComponent({
  athleticAndPerformance = [],
  onAthleticAndPerformanceChange,
  sportsPlayed = '',
  userId,
}: AthleticAndPerformanceProps) {
  const [athleticAndPerformanceList, setAthleticAndPerformanceList] = useState<
    AthleticAndPerformance[]
  >(athleticAndPerformance);
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

  // Sync with props when athleticAndPerformance changes
  useEffect(() => {
    if (athleticAndPerformance && athleticAndPerformance.length > 0) {
      setAthleticAndPerformanceList(athleticAndPerformance);
    }
  }, [athleticAndPerformance]);

  // Fetch athletic performance data when component mounts or userId changes
  useEffect(() => {
    if (userId) {
      fetchAthleticPerformance();
    }
  }, [userId]);

  const fetchAthleticPerformance = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const data = await apiGet<{
        success: boolean;
        data?: AthleticAndPerformance[];
      }>(`/profile/${userId}/athletic-performance`);
      if (data.success && data.data) {
        setAthleticAndPerformanceList(data.data);
        if (onAthleticAndPerformanceChange) {
          onAthleticAndPerformanceChange(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching athletic performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (newData: AthleticAndPerformance) => {
    if (editingIndex !== null) {
      // Update existing entry
      const existingData = athleticAndPerformanceList[editingIndex];
      if (!userId || !existingData.id) {
        // If no userId or ID, just update local state
        const updatedList = [...athleticAndPerformanceList];
        updatedList[editingIndex] = newData;
        setAthleticAndPerformanceList(updatedList);
        if (onAthleticAndPerformanceChange) {
          onAthleticAndPerformanceChange(updatedList);
        }
        setEditingIndex(null);
        return;
      }

      try {
        const result = await apiPut<{
          success: boolean;
          data?: AthleticAndPerformance;
          message?: string;
        }>(`/profile/athletic-performance/${existingData.id}`, newData);

        if (result.success && result.data) {
          const updatedList = [...athleticAndPerformanceList];
          updatedList[editingIndex] = result.data;
          setAthleticAndPerformanceList(updatedList);
          if (onAthleticAndPerformanceChange) {
            onAthleticAndPerformanceChange(updatedList);
          }
          setEditingIndex(null);
        } else {
          alert(
            `Failed to update athletic performance: ${result.message || 'Unknown error'}`
          );
        }
      } catch (error) {
        console.error('Error updating athletic performance:', error);
        alert('Error updating athletic performance. Please try again.');
      }
    } else {
      // Add new entry
      if (!userId) {
        // If no userId, just update local state
        const updatedList = [...athleticAndPerformanceList, newData];
        setAthleticAndPerformanceList(updatedList);
        if (onAthleticAndPerformanceChange) {
          onAthleticAndPerformanceChange(updatedList);
        }
        return;
      }

      try {
        const result = await apiPost<{
          success: boolean;
          data?: AthleticAndPerformance;
          message?: string;
        }>(`/profile/${userId}/athletic-performance`, newData);

        if (result.success && result.data) {
          const updatedList = [...athleticAndPerformanceList, result.data];
          setAthleticAndPerformanceList(updatedList);
          if (onAthleticAndPerformanceChange) {
            onAthleticAndPerformanceChange(updatedList);
          }
        } else {
          alert(
            `Failed to save athletic performance: ${result.message || 'Unknown error'}`
          );
        }
      } catch (error) {
        console.error('Error saving athletic performance:', error);
        alert('Error saving athletic performance. Please try again.');
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
      const updatedList = athleticAndPerformanceList.filter(
        (_, i) => i !== index
      );
      setAthleticAndPerformanceList(updatedList);
      if (onAthleticAndPerformanceChange) {
        onAthleticAndPerformanceChange(updatedList);
      }
      return;
    }

    try {
      const result = await apiDelete<{
        success: boolean;
        message?: string;
      }>(`/profile/athletic-performance/${id}`);

      if (result.success) {
        const updatedList = athleticAndPerformanceList.filter(
          (_, i) => i !== index
        );
        setAthleticAndPerformanceList(updatedList);
        if (onAthleticAndPerformanceChange) {
          onAthleticAndPerformanceChange(updatedList);
        }
      } else {
        alert(
          `Failed to delete athletic performance: ${result.message || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error('Error deleting athletic performance:', error);
      alert('Error deleting athletic performance. Please try again.');
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-lg p-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Athletic and Performance Data
          </h2>
          {isOwnProfile && (
            <button
              onClick={() => {
                // If there's existing data, show the first entry for editing
                // Otherwise, open empty form for new entry
                if (athleticAndPerformanceList.length > 0) {
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
          <p className="text-gray-500 italic">Loading...</p>
        ) : athleticAndPerformanceList.length === 0 ? (
          <p className="text-gray-500 italic">
            No athletic and performance data added yet. Click the + button to
            add one.
          </p>
        ) : (
          <div className="space-y-4">
            {athleticAndPerformanceList.map((data, index) => (
              <div
                key={data.id || index}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleView(index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {data.sport && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Sport:</span> {data.sport}
                      </p>
                    )}
                    {data.height && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Height:</span>{' '}
                        {data.height} cm
                      </p>
                    )}
                    {data.weight && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Weight:</span>{' '}
                        {data.weight} lbs
                      </p>
                    )}
                    {data.athleteHandedness && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Handedness:</span>{' '}
                        {data.athleteHandedness}
                      </p>
                    )}
                    {data.dominantSideOrFoot && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Dominant Side/Foot:</span>{' '}
                        {data.dominantSideOrFoot}
                      </p>
                    )}
                    {data.jerseyNumber && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Jersey Number:</span>{' '}
                        {data.jerseyNumber}
                      </p>
                    )}
                    {data.trainingHoursPerWeek && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">
                          Training Hours/Week:
                        </span>{' '}
                        {data.trainingHoursPerWeek}
                      </p>
                    )}
                    {data.multiSportAthlete && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">
                          Multi-Sport Athlete:
                        </span>{' '}
                        {data.multiSportAthlete}
                      </p>
                    )}
                    {data.coachVerifiedProfile && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">
                          Coach Verified Profile:
                        </span>{' '}
                        {data.coachVerifiedProfile}
                      </p>
                    )}
                    {(data.hand || data.arm) && (
                      <div className=" space-y-1">
                        {data.hand && (
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Hand:</span>{' '}
                            {data.hand}
                          </p>
                        )}
                        {data.arm && (
                          <p className="text-sm text-gray-600 mb-1">
                            <span className="font-medium">Arm:</span> {data.arm}
                          </p>
                        )}
                      </div>
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

      <AthleticAndPerformancePopup
        open={showPopup}
        onClose={handleClose}
        onSave={handleAdd}
        existingData={
          editingIndex !== null
            ? athleticAndPerformanceList[editingIndex]
            : undefined
        }
        sportsPlayed={sportsPlayed}
      />

      {/* View Popup */}
      {showViewPopup && viewingIndex !== null && (
        <ViewAthleticAndPerformancePopup
          open={showViewPopup}
          onClose={handleCloseView}
          data={athleticAndPerformanceList[viewingIndex]}
        />
      )}
    </>
  );
}

// View-only popup component
function ViewAthleticAndPerformancePopup({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: AthleticAndPerformance;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            Athletic and Performance Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">
          {data.sport && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sport
              </label>
              <p className="text-gray-900">{data.sport}</p>
            </div>
          )}

          {data.height && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height
              </label>
              <p className="text-gray-900">{data.height} cm</p>
            </div>
          )}

          {data.weight && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Weight
              </label>
              <p className="text-gray-900">{data.weight} lbs</p>
            </div>
          )}

          {data.athleteHandedness && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Handedness
              </label>
              <p className="text-gray-900">{data.athleteHandedness}</p>
            </div>
          )}

          {data.dominantSideOrFoot && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dominant Side/Foot
              </label>
              <p className="text-gray-900">{data.dominantSideOrFoot}</p>
            </div>
          )}

          {data.jerseyNumber && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jersey Number
              </label>
              <p className="text-gray-900">{data.jerseyNumber}</p>
            </div>
          )}

          {data.trainingHoursPerWeek && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Training Hours Per Week
              </label>
              <p className="text-gray-900">{data.trainingHoursPerWeek}</p>
            </div>
          )}

          {data.multiSportAthlete && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Multi-Sport Athlete
              </label>
              <p className="text-gray-900">{data.multiSportAthlete}</p>
            </div>
          )}

          {data.coachVerifiedProfile && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Coach Verified Profile
              </label>
              <p className="text-gray-900">{data.coachVerifiedProfile}</p>
            </div>
          )}

          {data.hand && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hand
              </label>
              <p className="text-gray-900">{data.hand}</p>
            </div>
          )}

          {data.arm && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arm
              </label>
              <p className="text-gray-900">{data.arm}</p>
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
