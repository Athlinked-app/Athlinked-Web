'use client';

import { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import HealthAndReadinessPopup, {
  type HealthAndReadiness,
} from '../HealthandReadinessPopup';

export type { HealthAndReadiness };

interface HealthAndReadinessProps {
  healthAndReadiness?: HealthAndReadiness[];
  onHealthAndReadinessChange?: (data: HealthAndReadiness[]) => void;
}

export default function HealthAndReadinessComponent({
  healthAndReadiness = [],
  onHealthAndReadinessChange,
}: HealthAndReadinessProps) {
  const [healthAndReadinessList, setHealthAndReadinessList] =
    useState<HealthAndReadiness[]>(healthAndReadiness);
  const [showPopup, setShowPopup] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAdd = (newData: HealthAndReadiness) => {
    if (editingIndex !== null) {
      // Update existing entry
      const updatedList = [...healthAndReadinessList];
      updatedList[editingIndex] = newData;
      setHealthAndReadinessList(updatedList);
      if (onHealthAndReadinessChange) {
        onHealthAndReadinessChange(updatedList);
      }
      setEditingIndex(null);
    } else {
      // Add new entry
      const updatedList = [...healthAndReadinessList, newData];
      setHealthAndReadinessList(updatedList);
      if (onHealthAndReadinessChange) {
        onHealthAndReadinessChange(updatedList);
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

  const handleDelete = (index: number) => {
    const updatedList = healthAndReadinessList.filter((_, i) => i !== index);
    setHealthAndReadinessList(updatedList);
    if (onHealthAndReadinessChange) {
      onHealthAndReadinessChange(updatedList);
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

        {healthAndReadinessList.length === 0 ? (
          <p className="text-gray-500 italic">
            No health and readiness information added yet. Click the + button to
            add one.
          </p>
        ) : (
          <div className="space-y-4">
            {healthAndReadinessList.map((data, index) => (
              <div
                key={index}
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
                      onClick={() => handleDelete(index)}
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
