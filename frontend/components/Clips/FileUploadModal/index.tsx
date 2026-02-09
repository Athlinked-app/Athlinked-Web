'use client';

import { useState, useRef, ChangeEvent } from 'react';
import { X, Upload } from 'lucide-react';

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, description: string) => Promise<void>;
  isUploading?: boolean;
}

export default function FileUploadModal({
  isOpen,
  onClose,
  onUpload,
  isUploading = false,
}: FileUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Maximum file size in bytes (50MB)
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

  if (!isOpen) return null;

  const handleFileSelect = (file: File) => {
    // Check file size first (50MB limit)
    if (file.size > MAX_FILE_SIZE) {
      alert('File size too large. Maximum size is 50MB');
      return;
    }

    // Allow ONLY videos (mp4/mov)
    const isAllowedVideoType =
      file &&
      (file.type === 'video/mp4' ||
        file.type === 'video/quicktime' ||
        file.name.toLowerCase().endsWith('.mp4') ||
        file.name.toLowerCase().endsWith('.mov'));

    if (isAllowedVideoType) {
      setSelectedFile(file);

      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      alert('Please select a valid video file (MP4 or MOV only)');
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleShare = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    try {
      await onUpload(selectedFile, description);
      // Reset form
      setSelectedFile(null);
      setPreviewUrl(null);
      setDescription('');
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setDescription('');
    onClose();
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 md:p-0"
        onClick={handleClose}
      >
        {/* Modal */}
        <div
          className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">File Upload</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              disabled={isUploading}
            >
              <X size={24} className="text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 flex-1 overflow-y-auto">
            <p className="text-gray-600 mb-4 text-sm">
              Choose a file and upload securely to proceed.
            </p>

            <div className="flex gap-4">
              {/* Left Side - File Preview/Upload Area */}
              <div className="w-1/2 flex flex-col">
                <label className="text-sm font-semibold text-gray-900 mb-2">
                  Preview
                </label>
                {previewUrl ? (
                  <div className="w-full flex flex-col gap-2">
                    <div className="w-full aspect-[4/5] bg-black rounded-lg overflow-hidden max-h-96">
                      {selectedFile?.type.startsWith('video/') ? (
                        <video
                          src={previewUrl}
                          className="w-full h-full object-cover"
                          controls
                        />
                      ) : (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    {/* File info */}
                    {selectedFile && (
                      <div className="text-xs text-gray-600">
                        <p className="truncate">{selectedFile.name}</p>
                        <p>Size: {formatFileSize(selectedFile.size)}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className={`w-full aspect-[4/5] border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors max-h-96 ${
                      isDragging
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={handleBrowseClick}
                  >
                    <div className="text-4xl mb-3">🏔️</div>
                    <p className="text-sm md:text-base font-medium text-gray-700 mb-1">
                      Drag and drop your files
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      MP4 and MOV formats up to 50MB
                    </p>
                    <button
                      type="button"
                      className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium text-sm"
                      onClick={e => {
                        e.stopPropagation();
                        handleBrowseClick();
                      }}
                    >
                      Browse Files
                    </button>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/quicktime,.mp4,.mov"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <p className="text-xs text-gray-500 mt-2">
                  *Supported formats: MP4, MOV (Max 50MB)
                </p>
              </div>

              {/* Right Side - Description */}
              <div className="w-1/2 flex flex-col">
                <label className="text-sm font-semibold text-gray-900 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Enter description for your clip..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none text-sm h-96 text-gray-900"
                  disabled={isUploading}
                />
              </div>
            </div>
          </div>

          {/* Footer - Action Buttons */}
          <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={handleClose}
              disabled={isUploading}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm text-black disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={!selectedFile || isUploading}
              className="px-6 py-2 bg-[#CB9729] hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Uploading...' : 'Share'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
