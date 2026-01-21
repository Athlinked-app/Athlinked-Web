'use client';

import { Pencil } from 'lucide-react';
import type { AthleticAndPerformance } from '../AthleticandPerformance';

interface AthleticDataProps {
  athleticAndPerformance?: AthleticAndPerformance[];
  onClick?: () => void;
  isEditable?: boolean;
}

const AthleticData: React.FC<AthleticDataProps> = ({
  athleticAndPerformance = [],
  onClick,
  isEditable = false,
}) => {
  // Use the first entry as the "current" athletic profile
  const primary = athleticAndPerformance[0];

  const { height, weight, hand, arm } = primary || {};

  const items: { label: string; value?: string | number | null }[] = [
    { label: 'Height', value: height },
    { label: 'Weight', value: weight },
    { label: 'Hand', value: hand },
    { label: 'Arm', value: arm },
  ];

  return (
    <div className="mt-2 bg-white rounded-lg shadow-sm px-6 py-3 flex justify-between items-center relative">
      {items.map((item, index) => {
        const showDivider = index !== items.length - 1;

        return (
          <div key={item.label} className="flex-1 flex items-center">
            <div className="flex-1 text-center">
              <div className="text-xs font-medium text-gray-500 tracking-wide">
                {item.label}
              </div>
              <div className="mt-1 text-sm font-semibold text-gray-900">
                {item.value || '-'}
              </div>
            </div>
            {showDivider && (
              <div className="h-8 w-px bg-gray-200 ml-4" aria-hidden="true" />
            )}
          </div>
        );
      })}

      {isEditable && onClick && (
        <button
          onClick={e => {
            e.stopPropagation();
            onClick();
          }}
          className="absolute top-2 right-2 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Edit athletic data"
        >
          <Pencil className="w-4 h-4 text-gray-600" />
        </button>
      )}
    </div>
  );
};

export default AthleticData;
