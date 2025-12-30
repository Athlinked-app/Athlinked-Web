'use client';

import { X } from 'lucide-react';

interface ConnectionPopupProps {
  open: boolean;
  onClose: () => void;
  username: string;
}

export default function ConnectionPopup({
  open,
  onClose,
  username,
}: ConnectionPopupProps) {
  if (!open) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Connection Required
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-700 mb-6">
          Please connect with <span className="font-semibold">{username}</span> to
          message with them.
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#CB9729] text-white rounded-lg hover:bg-[#b78322] transition-colors font-medium"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

