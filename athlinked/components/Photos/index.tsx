import { type ChangeEvent, useState, useRef } from 'react';
import { X, UploadCloud } from 'lucide-react';

type PhotosUploadModalProps = {
  open: boolean;
  onClose: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
};

export default function PhotosUploadModal({
  open,
  onClose,
  onFileChange,
}: PhotosUploadModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

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
    // Only set dragging to false if we're leaving the drop zone itself
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
      // Filter and validate file types
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      const validFiles = Array.from(droppedFiles).filter(file =>
        validTypes.includes(file.type)
      );

      if (validFiles.length > 0 && fileInputRef.current) {
        // Create a DataTransfer object to set files on the input
        const dataTransfer = new DataTransfer();
        validFiles.forEach(file => {
          dataTransfer.items.add(file);
        });

        // Set files on the input element using DataTransfer
        fileInputRef.current.files = dataTransfer.files;
        
        // Create a synthetic change event that properly exposes files
        const syntheticEvent = {
          target: {
            ...fileInputRef.current,
            files: dataTransfer.files,
          },
          currentTarget: fileInputRef.current,
        } as ChangeEvent<HTMLInputElement>;

        onFileChange(syntheticEvent);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-xl bg-white rounded-xl shadow-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">File Upload</h2>
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
              {isDragging ? 'Drop your files here' : 'Drag and drop your files'}
            </p>
            <p className="text-sm text-gray-500">JPEG, PNG, GIF up to 50MB</p>
            <label className="inline-flex">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={onFileChange}
                accept=".jpg,.jpeg,.png,.gif"
              />
              <span className="px-5 py-2 bg-white border border-gray-300 rounded-md text-sm font-semibold text-gray-700 hover:bg-gray-100 cursor-pointer">
                Browse Files
              </span>
            </label>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-4">
          Supported formats: JPEG, PNG, GIF
        </p>
      </div>
    </div>
  );
}

type PostDetailsModalProps = {
  open: boolean;
  filePreview: string | null;
  fileName: string;
  fileSizeLabel: string;
  description: string;
  privacy: string;
  onDescriptionChange: (value: string) => void;
  onPrivacyChange: (value: string) => void;
  onClose: () => void;
  onPost: () => void;
  onRemoveFile: () => void;
};

export function PostDetailsModal({
  open,
  filePreview,
  fileName,
  fileSizeLabel,
  description,
  privacy,
  onDescriptionChange,
  onPrivacyChange,
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
          <div className="flex flex-col md:flex-row gap-4 md:gap-6">
            <div className="flex gap-3">
              <div className="w-24 h-24 rounded-md overflow-hidden bg-gray-100 border border-gray-200 flex-shrink-0">
                {filePreview ? (
                  <img
                    src={filePreview}
                    alt={fileName}
                    className="w-full h-full object-cover"
                  />
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

            <div className="flex-1 flex flex-col gap-4">
              <textarea
                value={description}
                onChange={e => onDescriptionChange(e.target.value)}
                placeholder="Description..."
                className="w-full h-28 border border-gray-300 rounded-lg px-3 py-2 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#CB9729]/50"
              />

              <select
                value={privacy}
                onChange={e => onPrivacyChange(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#CB9729]/50"
              >
                <option value="Public">Public</option>
                <option value="Only Friends">Only Friends</option>
                <option value="Only me">Only me</option>
              </select>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Discard
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
