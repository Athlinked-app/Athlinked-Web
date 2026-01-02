'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import AthleticAndPerformancePopup, {
  type AthleticAndPerformance,
} from '../AthleticandPerformancePopup';
import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';

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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

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
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
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
                  </div>
                  <div className="flex items-center gap-2 ml-4">
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
    </>
  );
}
