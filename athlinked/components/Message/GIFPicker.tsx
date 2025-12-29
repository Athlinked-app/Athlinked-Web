'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X } from 'lucide-react';

interface GIFPickerProps {
  onGIFSelect: (gifUrl: string) => void;
}

const GIPHY_API_KEY = 'r9acJyFZnOSfyH1XrOx2QlqrVJtxwjUi';
const GIPHY_BASE_URL = 'https://api.giphy.com/v1/gifs';

interface GIF {
  id: string;
  images: {
    fixed_height: {
      url: string;
    };
    original: {
      url: string;
    };
  };
  title: string;
}

export default function GIFPicker({ onGIFSelect }: GIFPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [gifs, setGifs] = useState<GIF[]>([]);
  const [loading, setLoading] = useState(false);
  const [trending, setTrending] = useState<GIF[]>([]);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      if (trending.length === 0) {
        fetchTrendingGIFs();
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const timeoutId = setTimeout(() => {
        searchGIFs(searchQuery);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      setGifs([]);
    }
  }, [searchQuery]);

  const fetchTrendingGIFs = async () => {
    try {
      setLoading(true);
      setTrending([]);
    } catch (error) {
      console.error('Error fetching trending GIFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchGIFs = async (query: string) => {
    try {
      setLoading(true);
      setGifs([]);
    } catch (error) {
      console.error('Error searching GIFs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGIFClick = (gif: GIF) => {
    onGIFSelect(gif.images.original.url);
    setIsOpen(false);
  };

  const displayGIFs = searchQuery.trim() ? gifs : trending;

  return (
    <div className="relative" ref={pickerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
      >
        <span className="text-sm font-semibold">GIF</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full right-0 left-10 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl z-[9999] w-96 h-96 flex flex-col">
          <div className="flex items-center justify-between p-2 border-b border-gray-200">
            <span className="text-sm font-semibold text-gray-700">Search GIFs</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>

          <div className="p-2 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search GIFs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-sm"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">Loading...</div>
              </div>
            ) : displayGIFs.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-500">
                  <p className="mb-2">No GIFs found</p>
                  <p className="text-xs">Add your Giphy API key to enable GIF search</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {displayGIFs.map((gif) => (
                  <button
                    key={gif.id}
                    type="button"
                    onClick={() => handleGIFClick(gif)}
                    className="relative aspect-square rounded overflow-hidden hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={gif.images.fixed_height.url}
                      alt={gif.title}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

