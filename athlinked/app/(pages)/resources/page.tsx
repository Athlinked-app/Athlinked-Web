'use client';

import { useState } from 'react';
import { Upload, ExternalLink, X } from 'lucide-react';

type TabType = 'guides' | 'videos' | 'templates';

interface Resource {
  id: string;
  title: string;
  image: string;
  link?: string;
}

export default function ManageResourcesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('guides');

  // Initial data with real images from Unsplash (free to use)
  const initialGuidesData: Resource[] = [
    {
      id: '1',
      title: 'Varsity Soccer League Finals',
      image:
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&h=300&fit=crop',
    },
    {
      id: '2',
      title: 'Next-Gen Athlete Training',
      image:
        'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=500&h=300&fit=crop',
    },
    {
      id: '3',
      title: 'Holistic Wellness for Athletes',
      image:
        'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&h=300&fit=crop',
    },
    {
      id: '4',
      title: 'Mastering Mental Toughness',
      image:
        'https://images.unsplash.com/photo-1487956382158-bb926046304a?w=500&h=300&fit=crop',
    },
    {
      id: '5',
      title: 'Nutrition for Peak Performance',
      image:
        'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&h=300&fit=crop',
    },
    {
      id: '6',
      title: 'Effective Recovery Techniques',
      image:
        'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=500&h=300&fit=crop',
    },
  ];

  const initialVideosData: Resource[] = [
    {
      id: '1',
      title: 'Training Fundamentals',
      image:
        'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=500&h=300&fit=crop',
    },
    {
      id: '2',
      title: 'Strength & Conditioning',
      image:
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=300&fit=crop',
    },
    {
      id: '3',
      title: 'Game Strategy Analysis',
      image:
        'https://images.unsplash.com/photo-1519311965067-36d3e5f33d39?w=500&h=300&fit=crop',
    },
  ];

  const initialTemplatesData: Resource[] = [
    {
      id: '1',
      title: 'Training Schedule Template',
      image:
        'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=500&h=300&fit=crop',
    },
    {
      id: '2',
      title: 'Performance Tracking Sheet',
      image:
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&h=300&fit=crop',
    },
    {
      id: '3',
      title: 'Meal Plan Template',
      image:
        'https://images.unsplash.com/photo-1606787364406-46a8c770d784?w=500&h=300&fit=crop',
    },
  ];

  // State for each tab's data
  const [guidesData, setGuidesData] = useState<Resource[]>(initialGuidesData);
  const [videosData, setVideosData] = useState<Resource[]>(initialVideosData);
  const [templatesData, setTemplatesData] =
    useState<Resource[]>(initialTemplatesData);

  const getCurrentData = () => {
    switch (activeTab) {
      case 'guides':
        return guidesData;
      case 'videos':
        return videosData;
      case 'templates':
        return templatesData;
      default:
        return guidesData;
    }
  };

  const handleDelete = (id: string) => {
    // Remove the item based on active tab
    switch (activeTab) {
      case 'guides':
        setGuidesData(guidesData.filter(item => item.id !== id));
        break;
      case 'videos':
        setVideosData(videosData.filter(item => item.id !== id));
        break;
      case 'templates':
        setTemplatesData(templatesData.filter(item => item.id !== id));
        break;
    }
  };

  const handleUpload = () => {
    console.log('Upload new resource');
    // Add your upload logic here
  };

  const handleCardClick = (resource: Resource) => {
    console.log('Open resource:', resource);
    // Add your navigation/modal logic here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Tabs Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex">
            <button
              onClick={() => setActiveTab('guides')}
              className={`px-6 py-4 text-sm font-medium relative transition-colors ${
                activeTab === 'guides'
                  ? 'text-[#CB9729]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Guides & Articles
              {activeTab === 'guides' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('videos')}
              className={`px-6 py-4 text-sm font-medium relative transition-colors ${
                activeTab === 'videos'
                  ? 'text-[#CB9729]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Video Library
              {activeTab === 'videos' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-6 py-4 text-sm font-medium relative transition-colors ${
                activeTab === 'templates'
                  ? 'text-[#CB9729]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Templates
              {activeTab === 'templates' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Manage Resources
          </h1>
          <button
            onClick={handleUpload}
            className="flex items-center gap-2 bg-[#CB9729] text-white px-5 py-2.5 rounded-lg hover:bg-[#B88624] transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span className="font-medium">Upload</span>
          </button>
        </div>

        {/* Resource Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {getCurrentData().map(resource => (
            <div
              key={resource.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Image Container */}
              <div className="relative h-48 bg-gray-100">
                <img
                  src={resource.image}
                  alt={resource.title}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => handleCardClick(resource)}
                />
                {/* Delete Button */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    handleDelete(resource.id);
                  }}
                  className="absolute top-3 right-3 w-7 h-7 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors shadow-md z-10"
                  aria-label="Delete resource"
                >
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Card Content */}
              <div className="p-4">
                <h3 className="text-base font-medium text-gray-900 mb-3 line-clamp-2">
                  {resource.title}
                </h3>
                {/* External Link Icon */}
                <button
                  onClick={() => handleCardClick(resource)}
                  className="inline-flex items-center text-[#CB9729] hover:text-[#B88624] transition-colors"
                >
                  <ExternalLink className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {getCurrentData().length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-base mb-2">
              No resources available
            </p>
            <p className="text-gray-400 text-sm">
              Click Upload to add new content
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
