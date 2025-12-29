'use client';

import { X, ExternalLink } from 'lucide-react';

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
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Camp Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading details...</p>
          </div>
        )}

        {!loading && campDetails && (
          <div>
            <img
              src={campDetails.image}
              alt={campDetails.title}
              className="w-full h-64 object-cover rounded-lg mb-4"
            />

            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {campDetails.title}
            </h3>

            <div className="space-y-3 mb-6">
              <div className="flex items-start gap-2">
                <span className="font-semibold text-gray-700">Date:</span>
                <span className="text-gray-600">{campDetails.date}</span>
              </div>

              <div className="flex items-start gap-2">
                <span className="font-semibold text-gray-700">Location:</span>
                <span className="text-gray-600">{campDetails.location}</span>
              </div>

              <div>
                <span className="font-semibold text-gray-700">
                  Description:
                </span>
                <p className="text-gray-600 mt-1">{campDetails.description}</p>
              </div>
            </div>

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

        {!loading && !campDetails && (
          <div className="text-center py-12">
            <p className="text-gray-500">No details available</p>
          </div>
        )}
      </div>
    </div>
  );
}
