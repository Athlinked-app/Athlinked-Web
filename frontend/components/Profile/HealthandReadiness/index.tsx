'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil, X } from 'lucide-react';
import HealthAndReadinessPopup, {
  type HealthAndReadiness,
} from '../HealthandReadinessPopup';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';
import { getCurrentUserId } from '@/utils/auth';

export type { HealthAndReadiness };

interface HealthAndReadinessProps {
  healthAndReadiness?: HealthAndReadiness[];
  onHealthAndReadinessChange?: (data: HealthAndReadiness[]) => void;
  userId?: string | null;
}

export default function HealthAndReadinessComponent({
  healthAndReadiness = [],
  onHealthAndReadinessChange,
  userId,
}: HealthAndReadinessProps) {
  const [healthAndReadinessList, setHealthAndReadinessList] =
    useState<HealthAndReadiness[]>(healthAndReadiness);
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

  // Sync with props when healthAndReadiness changes
  useEffect(() => {
    if (healthAndReadiness && healthAndReadiness.length > 0) {
      setHealthAndReadinessList(healthAndReadiness);
    }
  }, [healthAndReadiness]);

  // Fetch health and readiness data when component mounts or userId changes
  useEffect(() => {
    if (userId) {
      fetchHealthReadiness();
    }
  }, [userId]);

  const fetchHealthReadiness = async () => {
    if (!userId) return;

    try {
      setLoading(true);
      const data = await apiGet<{
        success: boolean;
        data?: HealthAndReadiness[];
      }>(`/profile/${userId}/health-readiness`);
      if (data.success && data.data) {
        setHealthAndReadinessList(data.data);
        if (onHealthAndReadinessChange) {
          onHealthAndReadinessChange(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching health and readiness:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (newData: HealthAndReadiness) => {
    if (editingIndex !== null) {
      // Update existing entry
      const existingData = healthAndReadinessList[editingIndex];
      if (!userId || !existingData.id) {
        // If no userId or ID, just update local state
        const updatedList = [...healthAndReadinessList];
        updatedList[editingIndex] = newData;
        setHealthAndReadinessList(updatedList);
        if (onHealthAndReadinessChange) {
          onHealthAndReadinessChange(updatedList);
        }
        setEditingIndex(null);
        return;
      }

      try {
        const result = await apiPut<{
          success: boolean;
          data?: HealthAndReadiness;
          message?: string;
        }>(`/profile/health-readiness/${existingData.id}`, newData);

        if (result.success && result.data) {
          const updatedList = [...healthAndReadinessList];
          updatedList[editingIndex] = result.data;
          setHealthAndReadinessList(updatedList);
          if (onHealthAndReadinessChange) {
            onHealthAndReadinessChange(updatedList);
          }
          setEditingIndex(null);
        } else {
          alert(
            `Failed to update health and readiness: ${result.message || 'Unknown error'}`
          );
        }
      } catch (error) {
        console.error('Error updating health and readiness:', error);
        alert('Error updating health and readiness. Please try again.');
      }
    } else {
      // Add new entry
      if (!userId) {
        // If no userId, just update local state
        const updatedList = [...healthAndReadinessList, newData];
        setHealthAndReadinessList(updatedList);
        if (onHealthAndReadinessChange) {
          onHealthAndReadinessChange(updatedList);
        }
        return;
      }

      try {
        const result = await apiPost<{
          success: boolean;
          data?: HealthAndReadiness;
          message?: string;
        }>(`/profile/${userId}/health-readiness`, newData);

        if (result.success && result.data) {
          const updatedList = [...healthAndReadinessList, result.data];
          setHealthAndReadinessList(updatedList);
          if (onHealthAndReadinessChange) {
            onHealthAndReadinessChange(updatedList);
          }
        } else {
          alert(
            `Failed to save health and readiness: ${result.message || 'Unknown error'}`
          );
        }
      } catch (error) {
        console.error('Error saving health and readiness:', error);
        alert('Error saving health and readiness. Please try again.');
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
      const updatedList = healthAndReadinessList.filter((_, i) => i !== index);
      setHealthAndReadinessList(updatedList);
      if (onHealthAndReadinessChange) {
        onHealthAndReadinessChange(updatedList);
      }
      return;
    }

    try {
      const result = await apiDelete<{
        success: boolean;
        message?: string;
      }>(`/profile/health-readiness/${id}`);

      if (result.success) {
        const updatedList = healthAndReadinessList.filter(
          (_, i) => i !== index
        );
        setHealthAndReadinessList(updatedList);
        if (onHealthAndReadinessChange) {
          onHealthAndReadinessChange(updatedList);
        }
      } else {
        alert(
          `Failed to delete health and readiness: ${result.message || 'Unknown error'}`
        );
      }
    } catch (error) {
      console.error('Error deleting health and readiness:', error);
      alert('Error deleting health and readiness. Please try again.');
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-lg px-6 py-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">
            Health and Readiness
          </h2>
          {isOwnProfile && (
            <button
              onClick={() => {
                // If there's existing data, show the first entry for editing
                // Otherwise, open empty form for new entry
                if (healthAndReadinessList.length > 0) {
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
        ) : healthAndReadinessList.length === 0 ? (
          <p className="text-gray-500 italic text-base">
            No health and readiness information added yet. Click the + button to
            add one.
          </p>
        ) : (
          <div className="space-y-4">
            {healthAndReadinessList.map((data, index) => (
              <div
                key={data.id || index}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleView(index)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {data.injuryHistory && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">
                          Injury History (Past 12 Months):
                        </span>{' '}
                        {data.injuryHistory}
                      </p>
                    )}
                    {data.restingHeartRate && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Resting Heart Rate:</span>{' '}
                        {data.restingHeartRate} BPM
                      </p>
                    )}
                    {data.enduranceMetric && (
                      <p className="text-sm text-gray-600 mb-1">
                        <span className="font-medium">Endurance Metric:</span>{' '}
                        {data.enduranceMetric}
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

      <HealthAndReadinessPopup
        open={showPopup}
        onClose={handleClose}
        onSave={handleAdd}
        existingData={
          editingIndex !== null
            ? healthAndReadinessList[editingIndex]
            : undefined
        }
      />

      {/* View Popup */}
      {showViewPopup && viewingIndex !== null && (
        <ViewHealthAndReadinessPopup
          open={showViewPopup}
          onClose={handleCloseView}
          data={healthAndReadinessList[viewingIndex]}
        />
      )}
    </>
  );
}

// View-only popup component
function ViewHealthAndReadinessPopup({
  open,
  onClose,
  data,
}: {
  open: boolean;
  onClose: () => void;
  data: HealthAndReadiness;
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
            Health and Readiness Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-4">
          {data.injuryHistory && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Injury History (Past 12 Months)
              </label>
              <p className="text-gray-900">{data.injuryHistory}</p>
            </div>
          )}

          {data.restingHeartRate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Resting Heart Rate
              </label>
              <p className="text-gray-900">{data.restingHeartRate} BPM</p>
            </div>
          )}

          {data.enduranceMetric && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endurance Metric
              </label>
              <p className="text-gray-900">{data.enduranceMetric}</p>
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
