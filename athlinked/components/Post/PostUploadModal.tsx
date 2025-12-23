'use client';

import { useState, useRef, type ChangeEvent } from 'react';
import { X, UploadCloud } from 'lucide-react';

type PostUploadModalProps = {
  open: boolean;
  postType: 'photo' | 'video' | 'article' | 'event';
  onClose: () => void;
  onFileSelect: (file: File) => void;
};

export default function PostUploadModal({
  open,
  postType,
  onClose,
  onFileSelect,
}: PostUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const getAcceptTypes = () => {
    if (postType === 'photo') return 'image/jpeg,image/jpg,image/png,image/gif';
    if (postType === 'video') return 'video/mp4,video/mov';
    return '';
  };

  const getFileExtensions = () => {
    if (postType === 'photo') return 'JPEG, PNG, GIF';
    if (postType === 'video') return 'MP4, MOV';
    return '';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles && droppedFiles.length > 0) {
      const file = droppedFiles[0];
      if (postType === 'photo' && file.type.startsWith('image/')) {
        onFileSelect(file);
      } else if (postType === 'video' && file.type.startsWith('video/')) {
        onFileSelect(file);
      }
    }
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  if (postType === 'article' || postType === 'event') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-xl bg-white rounded-xl shadow-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Upload {postType === 'photo' ? 'Photo' : 'Video'}
            </h2>
            <p className="text-sm text-gray-600">
              Drag & drop or choose a file to upload (max 50MB).
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg px-4 py-10 text-center transition-colors ${
            isDragging
              ? 'border-[#CB9729] bg-[#CB9729]/10'
              : 'border-gray-200 bg-gray-50'
          }`}
        >
          <div className="flex flex-col items-center gap-3">
            <UploadCloud
              className={`w-10 h-10 transition-colors ${
                isDragging ? 'text-[#CB9729]' : 'text-gray-500'
              }`}
            />
            <p className="text-base font-semibold text-gray-800">
              {isDragging ? 'Drop your file here' : 'Drag and drop your file'}
            </p>
            <p className="text-sm text-gray-500">
              {getFileExtensions()} up to 50MB
            </p>
            <label className="inline-flex">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept={getAcceptTypes()}
              />
              <span className="px-5 py-2 bg-white border border-gray-300 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer">
                Browse Files
              </span>
            </label>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Supported formats: {getFileExtensions()}
        </p>
      </div>
    </div>
  );
}

