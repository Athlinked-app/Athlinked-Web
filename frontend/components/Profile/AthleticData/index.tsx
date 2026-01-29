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
    <>
      {/* Desktop/Tablet View - Hidden on mobile */}
      <div className="hidden md:block mt-2 bg-white rounded-lg shadow-sm px-4 lg:px-6 py-3 relative">
        <div className="flex justify-between items-center">
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
                  <div
                    className="h-8 w-px bg-gray-200 ml-4"
                    aria-hidden="true"
                  />
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
      </div>

      {/* Mobile View - Grid Layout matching the design */}
      <div className="md:hidden mt-4 px-6">
        <div className="grid grid-cols-4 gap-3">
          {items.map(item => (
            <div key={item.label} className="text-center">
              <p className="text-xs text-gray-500 mb-1">{item.label}</p>
              <p className="text-sm font-semibold text-gray-900">
                {item.value || '-'}
              </p>
            </div>
          ))}
        </div>
        {isEditable && onClick && (
          <button
            onClick={e => {
              e.stopPropagation();
              onClick();
            }}
            className="mt-3 w-full py-2 text-xs text-gray-600 hover:text-gray-900 transition-colors flex items-center justify-center gap-1.5"
            aria-label="Edit athletic data"
          >
            <Pencil className="w-3 h-3" />
            <span>Edit Athletic Data</span>
          </button>
        )}
      </div>
    </>
  );
};

export default AthleticData;
