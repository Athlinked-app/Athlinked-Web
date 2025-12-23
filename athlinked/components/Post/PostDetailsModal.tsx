'use client';

import { X } from 'lucide-react';

type PostDetailsModalProps = {
  open: boolean;
  postType: 'photo' | 'video';
  filePreview: string | null;
  fileName: string;
  fileSizeLabel: string;
  caption: string;
  onCaptionChange: (value: string) => void;
  onClose: () => void;
  onPost: () => void;
  onRemoveFile: () => void;
};

export default function PostDetailsModal({
  open,
  postType,
  filePreview,
  fileName,
  fileSizeLabel,
  caption,
  onCaptionChange,
  onClose,
  onPost,
  onRemoveFile,
}: PostDetailsModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative z-10 w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">Post Details</h2>

          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div className="border border-dashed border-gray-300 rounded-lg p-4 md:p-5">
          <div className="flex flex-col gap-4">
            <div className="flex gap-3">
              <div className="w-24 h-24 rounded-md overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                {filePreview ? (
                  postType === 'video' ? (
                    <video
                      src={filePreview}
                      className="w-full h-full object-cover"
                      controls
                    />
                  ) : (
                    <img
                      src={filePreview}
                      alt={fileName}
                      className="w-full h-full object-cover"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">
                    No preview
                  </div>
                )}
              </div>
              <div className="flex flex-col text-gray-800">
                <span className="font-semibold text-base">{fileName}</span>
                <span className="text-sm text-gray-500">{fileSizeLabel}</span>
                <button
                  type="button"
                  onClick={onRemoveFile}
                  className="mt-2 text-sm text-[#CB9729] hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={caption}
                onChange={e => onCaptionChange(e.target.value)}
                placeholder="Write a caption or description..."
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CB9729]/50 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onPost}
            className="px-6 py-2 rounded-md bg-[#CB9729] text-white font-semibold hover:bg-[#b78322] transition-colors"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}

