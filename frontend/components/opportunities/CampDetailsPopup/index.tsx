'use client';

import { X, ExternalLink } from 'lucide-react';
import { useState } from 'react';

interface CampDetails {
  title: string;
  image: string;
  date: string;
  location: string;
  description: string;
  applyLink: string;
}

interface CampDetailsPopupProps {
  show: boolean;
  loading: boolean;
  campDetails: CampDetails | null;
  onClose: () => void;
}

export default function CampDetailsPopup({
  show,
  loading,
  campDetails,
  onClose,
}: CampDetailsPopupProps) {
  const [showFullDescription, setShowFullDescription] = useState(false);

  if (!show) return null;

  // Truncate description to 150 characters
  const truncateDescription = (text: string, maxLength: number = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const shouldShowReadMore =
    campDetails && campDetails.description.length > 150;

  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full h-[600px] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-900">Camp Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">Loading details...</p>
            </div>
          )}

          {!loading && campDetails && (
            <div className="space-y-4">
              <img
                src={campDetails.image}
                alt={campDetails.title}
                className="w-full h-48 object-cover rounded-lg"
              />

              <h3 className="text-xl font-semibold text-gray-900">
                {campDetails.title}
              </h3>

              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-700 min-w-[80px]">
                    Date:
                  </span>
                  <span className="text-gray-600">{campDetails.date}</span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="font-semibold text-gray-700 min-w-[80px]">
                    Location:
                  </span>
                  <span className="text-gray-600">{campDetails.location}</span>
                </div>

                <div>
                  <span className="font-semibold text-gray-700 block mb-1">
                    Description:
                  </span>
                  <p className="text-gray-600">
                    {showFullDescription
                      ? campDetails.description
                      : truncateDescription(campDetails.description)}
                  </p>
                  {shouldShowReadMore && (
                    <button
                      onClick={() =>
                        setShowFullDescription(!showFullDescription)
                      }
                      className="text-[#CB9729] hover:text-[#B88624] font-medium text-sm mt-2 transition-colors"
                    >
                      {showFullDescription ? 'Read less' : 'Read more'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {!loading && !campDetails && (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No details available</p>
            </div>
          )}
        </div>

        {/* Footer with Apply Button */}
        {!loading && campDetails && (
          <div className="p-6 border-t border-gray-200">
            <a
              href={campDetails.applyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#CB9729] text-white py-3 px-6 rounded-lg font-medium hover:bg-[#B88624] transition-colors"
            >
              Apply Now
              <ExternalLink className="w-5 h-5" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
