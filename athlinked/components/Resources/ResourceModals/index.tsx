'use client';

import { X } from 'lucide-react';

interface ResourceModalsProps {
  // URL Modal props
  showUrlModal: boolean;
  articleUrl: string;
  isLoading: boolean;
  onUrlChange: (url: string) => void;
  onCloseUrlModal: () => void;
  onAddArticle: () => void;

  // Video Modal props
  selectedVideo: string | null;
  onCloseVideoModal: () => void;
}

export default function ResourceModals({
  showUrlModal,
  articleUrl,
  isLoading,
  onUrlChange,
  onCloseUrlModal,
  onAddArticle,
  selectedVideo,
  onCloseVideoModal,
}: ResourceModalsProps) {
  return (
    <>
      {/* Article URL Modal */}
      {showUrlModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          onClick={onCloseUrlModal}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Upload Article
              </h2>
              <button
                onClick={onCloseUrlModal}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="mb-4">
              <input
                type="url"
                value={articleUrl}
                onChange={e => onUrlChange(e.target.value)}
                placeholder="Enter URL"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#CB9729] focus:border-transparent outline-none"
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={onCloseUrlModal}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={onAddArticle}
                disabled={!articleUrl.trim() || isLoading}
                className="flex-1 px-4 py-2 bg-[#CB9729] text-white rounded-lg hover:bg-[#B88624] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Adding...' : 'Share'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={onCloseVideoModal}
        >
          <button
            onClick={onCloseVideoModal}
            className="absolute top-4 right-4 w-10 h-10 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors z-10"
            aria-label="Close video"
          >
            <X className="w-6 h-6 text-gray-600" />
          </button>
          <div className="w-full max-w-6xl" onClick={e => e.stopPropagation()}>
            <video
              src={selectedVideo}
              controls
              autoPlay
              className="w-full h-auto rounded-lg shadow-2xl"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      )}
    </>
  );
}
