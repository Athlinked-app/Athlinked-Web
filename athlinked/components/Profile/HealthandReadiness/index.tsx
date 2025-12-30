'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import HealthAndReadinessPopup, {
  type HealthAndReadiness,
} from '../HealthandReadinessPopup';

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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

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
      const response = await fetch(`http://localhost:3001/api/profile/${userId}/health-readiness`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setHealthAndReadinessList(data.data);
          if (onHealthAndReadinessChange) {
            onHealthAndReadinessChange(data.data);
          }
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
        const response = await fetch(`http://localhost:3001/api/profile/health-readiness/${existingData.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newData),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const updatedList = [...healthAndReadinessList];
            updatedList[editingIndex] = result.data;
            setHealthAndReadinessList(updatedList);
            if (onHealthAndReadinessChange) {
              onHealthAndReadinessChange(updatedList);
            }
            setEditingIndex(null);
          }
        } else {
          const errorData = await response.json();
          alert(`Failed to update health and readiness: ${errorData.message || 'Unknown error'}`);
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
        const response = await fetch(`http://localhost:3001/api/profile/${userId}/health-readiness`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newData),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const updatedList = [...healthAndReadinessList, result.data];
            setHealthAndReadinessList(updatedList);
            if (onHealthAndReadinessChange) {
              onHealthAndReadinessChange(updatedList);
            }
          }
        } else {
          const errorData = await response.json();
          alert(`Failed to save health and readiness: ${errorData.message || 'Unknown error'}`);
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
      const response = await fetch(`http://localhost:3001/api/profile/health-readiness/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const updatedList = healthAndReadinessList.filter((_, i) => i !== index);
        setHealthAndReadinessList(updatedList);
        if (onHealthAndReadinessChange) {
          onHealthAndReadinessChange(updatedList);
        }
      } else {
        const errorData = await response.json();
        alert(`Failed to delete health and readiness: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting health and readiness:', error);
      alert('Error deleting health and readiness. Please try again.');
    }
  };

  return (
    <>
      <div className="w-full bg-white rounded-lg p-6 mt-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">
            Health and Readiness
          </h2>
          <button
            onClick={() => {
              setEditingIndex(null);
              setShowPopup(true);
            }}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-6 h-6 text-gray-900" />
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500 italic">Loading...</p>
        ) : healthAndReadinessList.length === 0 ? (
          <p className="text-gray-500 italic">
            No health and readiness information added yet. Click the + button to
            add one.
          </p>
        ) : (
          <div className="space-y-4">
            {healthAndReadinessList.map((data, index) => (
              <div
                key={data.id || index}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
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
    </>
  );
}
