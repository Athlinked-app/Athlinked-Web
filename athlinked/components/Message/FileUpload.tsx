'use client';

import { useRef, useState } from 'react';
import { Paperclip, Image as ImageIcon, Video, File, X } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File, type: 'image' | 'video' | 'file') => void;
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleFileClick = (type: 'image' | 'video' | 'file') => {
    if (type === 'image' && imageInputRef.current) {
      imageInputRef.current.click();
    } else if (type === 'video' && videoInputRef.current) {
      videoInputRef.current.click();
    } else if (type === 'file' && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'file') => {
    const file = event.target.files?.[0];
      if (file) {
        onFileSelect(file, type);
        setIsOpen(false);
        event.target.value = '';
      }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <Paperclip size={20} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] p-2 min-w-[200px]">
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => handleFileClick('image')}
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 rounded transition-colors text-left"
            >
              <ImageIcon size={20} className="text-gray-600" />
              <span className="text-sm text-gray-700">Photo</span>
            </button>
            <button
              type="button"
              onClick={() => handleFileClick('video')}
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 rounded transition-colors text-left"
            >
              <Video size={20} className="text-gray-600" />
              <span className="text-sm text-gray-700">Video</span>
            </button>
            <button
              type="button"
              onClick={() => handleFileClick('file')}
              className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 rounded transition-colors text-left"
            >
              <File size={20} className="text-gray-600" />
              <span className="text-sm text-gray-700">File</span>
            </button>
          </div>
        </div>
      )}

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'image')}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'video')}
      />
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(e) => handleFileChange(e, 'file')}
      />
    </div>
  );
}

