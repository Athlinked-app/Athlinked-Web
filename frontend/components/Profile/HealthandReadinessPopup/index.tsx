'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export interface HealthAndReadiness {
  id?: string;
  injuryHistory: string; // 'Yes' or 'No'
  restingHeartRate: string;
  enduranceMetric: string;
}

interface HealthAndReadinessPopupProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: HealthAndReadiness) => void;
  existingData?: HealthAndReadiness;
}

export default function HealthAndReadinessPopup({
  open,
  onClose,
  onSave,
  existingData,
}: HealthAndReadinessPopupProps) {
  const [injuryHistory, setInjuryHistory] = useState(
    existingData?.injuryHistory || ''
  );
  const [restingHeartRate, setRestingHeartRate] = useState(
    existingData?.restingHeartRate || ''
  );
  const [enduranceMetric, setEnduranceMetric] = useState(
    existingData?.enduranceMetric || ''
  );

  // Update form when existingData changes (for editing)
  useEffect(() => {
    if (open && existingData) {
      setInjuryHistory(existingData.injuryHistory || '');
      setRestingHeartRate(existingData.restingHeartRate || '');
      setEnduranceMetric(existingData.enduranceMetric || '');
    } else if (open && !existingData) {
      // Reset form when opening for new entry
      setInjuryHistory('');
      setRestingHeartRate('');
      setEnduranceMetric('');
    }
  }, [open, existingData]);

  if (!open) return null;

  const handleSave = () => {
    // Validate required fields
    if (!injuryHistory || !restingHeartRate.trim() || !enduranceMetric.trim()) {
      return; // Don't save if required fields are empty
    }

    onSave({
      injuryHistory,
      restingHeartRate,
      enduranceMetric,
    });
    // Reset form
    setInjuryHistory('');
    setRestingHeartRate('');
    setEnduranceMetric('');
    onClose();
  };

  // Check if all required fields are filled
  const isFormValid =
    injuryHistory && restingHeartRate.trim() && enduranceMetric.trim();

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
            Health and Readiness
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Injury History in Past 12 Months */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Injury History in Past 12 Months
            </label>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="injuryHistory"
                  value="Yes"
                  checked={injuryHistory === 'Yes'}
                  onChange={e => setInjuryHistory(e.target.value)}
                  className="w-4 h-4 text-[#CB9729] focus:ring-[#CB9729]"
                />
                <span className="text-gray-700">Yes</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="injuryHistory"
                  value="No"
                  checked={injuryHistory === 'No'}
                  onChange={e => setInjuryHistory(e.target.value)}
                  className="w-4 h-4 text-[#CB9729] focus:ring-[#CB9729]"
                />
                <span className="text-gray-700">No</span>
              </label>
            </div>
          </div>

          {/* Resting Heart Rate or Fitness Indicator */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resting Heart Rate or Fitness Indicator
            </label>
            <input
              type="number"
              value={restingHeartRate}
              onChange={e => setRestingHeartRate(e.target.value)}
              placeholder="60"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
            />
            <p className="mt-1 text-xs text-gray-500">Beats per minute (BPM)</p>
          </div>

          {/* Endurance Metric */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Endurance Metric
            </label>
            <input
              type="number"
              value={enduranceMetric}
              onChange={e => setEnduranceMetric(e.target.value)}
              placeholder="45.8"
              step="0.1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter your endurance metric (e.g., VO2 Max, Beep Test level)
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={!isFormValid}
            className={`px-6 py-2 rounded-lg transition-colors font-semibold ${
              isFormValid
                ? 'bg-[#CB9729] text-white hover:bg-[#b78322] cursor-pointer'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
