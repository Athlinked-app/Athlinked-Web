'use client';

import { ExternalLink, X, Play } from 'lucide-react';

interface ResourceCardProps {
  id: string;
  title: string;
  image: string;
  link?: string;
  type?: 'image' | 'video' | 'pdf' | 'article';
  onDelete: (id: string) => void;
  onClick: () => void;
}

export default function ResourceCard({
  id,
  title,
  image,
  type,
  onDelete,
  onClick,
}: ResourceCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Image Container */}
      <div className="relative h-48 bg-gray-100">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover cursor-pointer"
          onClick={onClick}
        />

        {/* Play Icon for Videos */}
        {type === 'video' && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 cursor-pointer"
            onClick={onClick}
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
              <Play className="w-8 h-8 text-white ml-1" fill="currentColor" />
            </div>
          </div>
        )}

        {/* Delete Button */}
        <button
          onClick={e => {
            e.stopPropagation();
            onDelete(id);
          }}
          className="absolute top-3 right-3 w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-md z-10"
          aria-label="Delete resource"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>
      </div>

      {/* Card Content */}
      {type === 'article' && (
        <div className="p-4">
          <h3 className="text-base font-medium text-gray-900 mb-3 line-clamp-2">
            {title}
          </h3>
          <button
            onClick={onClick}
            className="inline-flex items-center text-[#CB9729] hover:text-[#B88624] transition-colors"
          >
            <ExternalLink className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}
