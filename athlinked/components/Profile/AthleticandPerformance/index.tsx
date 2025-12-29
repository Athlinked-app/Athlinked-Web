'use client';

import { useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import AthleticAndPerformancePopup, {
  type AthleticAndPerformance,
} from '../AthleticandPerformancePopup';

export type { AthleticAndPerformance };

interface AthleticAndPerformanceProps {
  athleticAndPerformance?: AthleticAndPerformance[];
  onAthleticAndPerformanceChange?: (data: AthleticAndPerformance[]) => void;
  sportsPlayed?: string; // Comma-separated string of sports
}

export default function AthleticAndPerformanceComponent({
  athleticAndPerformance = [],
  onAthleticAndPerformanceChange,
  sportsPlayed = '',
}: AthleticAndPerformanceProps) {
  const [athleticAndPerformanceList, setAthleticAndPerformanceList] = useState<
    AthleticAndPerformance[]
  >(athleticAndPerformance);
  const [showPopup, setShowPopup] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAdd = (newData: AthleticAndPerformance) => {
    if (editingIndex !== null) {
      // Update existing entry
      const updatedList = [...athleticAndPerformanceList];
      updatedList[editingIndex] = newData;
      setAthleticAndPerformanceList(updatedList);
      if (onAthleticAndPerformanceChange) {
        onAthleticAndPerformanceChange(updatedList);
      }
      setEditingIndex(null);
    } else {
      // Add new entry
      const updatedList = [...athleticAndPerformanceList, newData];
      setAthleticAndPerformanceList(updatedList);
      if (onAthleticAndPerformanceChange) {
        onAthleticAndPerformanceChange(updatedList);
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
    const updatedList = athleticAndPerformanceList.filter(
      (_, i) => i !== index
    );
    setAthleticAndPerformanceList(updatedList);
    if (onAthleticAndPerformanceChange) {
      onAthleticAndPerformanceChange(updatedList);
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
              setEditingIndex(null);
              setShowPopup(true);
            }}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-6 h-6 text-gray-900" />
          </button>
        </div>

        {athleticAndPerformanceList.length === 0 ? (
          <p className="text-gray-500 italic">
            No athletic and performance data added yet. Click the + button to
            add one.
          </p>
        ) : (
          <div className="space-y-4">
            {athleticAndPerformanceList.map((data, index) => (
              <div
                key={index}
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
