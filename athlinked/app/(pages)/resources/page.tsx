'use client';

import { useState } from 'react';
import { Upload } from 'lucide-react';
import NavigationBar from '@/components/NavigationBar';
import RightSideBar from '@/components/RightSideBar';
import Header from '@/components/Header';
import ResourceCard from '@/components/Resources/ResourceCard';
import ResourceModals from '@/components/Resources/ResourceModals';

type TabType = 'guides' | 'videos' | 'templates';

interface Resource {
  id: string;
  title: string;
  image: string;
  link?: string;
  type?: 'image' | 'video' | 'pdf' | 'article';
}

export default function ManageResourcesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('guides');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [articleUrl, setArticleUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initial data with real images from Unsplash (free to use)
  const initialGuidesData: Resource[] = [
    {
      id: '1',
      title: 'Varsity Soccer League Finals',
      image:
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&h=300&fit=crop',
      link: 'https://example.com/article-1',
      type: 'article',
    },
    {
      id: '2',
      title: 'Next-Gen Athlete Training',
      image:
        'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=500&h=300&fit=crop',
      link: 'https://example.com/article-2',
      type: 'article',
    },
    {
      id: '3',
      title: 'Holistic Wellness for Athletes',
      image:
        'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&h=300&fit=crop',
      link: 'https://example.com/article-3',
      type: 'article',
    },
    {
      id: '4',
      title: 'Mastering Mental Toughness',
      image:
        'https://images.unsplash.com/photo-1487956382158-bb926046304a?w=500&h=300&fit=crop',
      link: 'https://example.com/article-4',
      type: 'article',
    },
    {
      id: '5',
      title: 'Nutrition for Peak Performance',
      image:
        'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=500&h=300&fit=crop',
      link: 'https://example.com/article-5',
      type: 'article',
    },
    {
      id: '6',
      title: 'Effective Recovery Techniques',
      image:
        'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=500&h=300&fit=crop',
      link: 'https://example.com/article-6',
      type: 'article',
    },
  ];

  const initialVideosData: Resource[] = [
    {
      id: '1',
      title: 'Basketball Training Fundamentals',
      image:
        'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=500&h=300&fit=crop',
      link: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      type: 'video',
    },
    {
      id: '2',
      title: 'Soccer Skills & Techniques',
      image:
        'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=500&h=300&fit=crop',
      link: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      type: 'video',
    },
    {
      id: '3',
      title: 'Strength & Conditioning Workout',
      image:
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=300&fit=crop',
      link: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      type: 'video',
    },
    {
      id: '4',
      title: 'Track & Field Sprint Training',
      image:
        'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=500&h=300&fit=crop',
      link: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      type: 'video',
    },
  ];

  const initialTemplatesData: Resource[] = [
    {
      id: '1',
      title: 'Training Schedule Template',
      image:
        'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=500&h=300&fit=crop',
      link: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      type: 'pdf',
    },
    {
      id: '2',
      title: 'Performance Tracking Sheet',
      image:
        'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&h=300&fit=crop',
      link: 'https://www.africau.edu/images/default/sample.pdf',
      type: 'pdf',
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

  const scrapeArticleMetadata = async (url: string) => {
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      const data = await response.json();
      const html = data.contents;

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      let title =
        doc
          .querySelector('meta[property="og:title"]')
          ?.getAttribute('content') ||
        doc
          .querySelector('meta[name="twitter:title"]')
          ?.getAttribute('content') ||
        doc.querySelector('title')?.textContent ||
        'Untitled Article';

      let image =
        doc
          .querySelector('meta[property="og:image"]')
          ?.getAttribute('content') ||
        doc
          .querySelector('meta[name="twitter:image"]')
          ?.getAttribute('content') ||
        doc.querySelector('img')?.getAttribute('src') ||
        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&h=300&fit=crop';

      if (image && !image.startsWith('http')) {
        const urlObj = new URL(url);
        image = urlObj.origin + (image.startsWith('/') ? '' : '/') + image;
      }

      return { title, image };
    } catch (error) {
      console.error('Error scraping article:', error);
      return {
        title: 'Article',
        image:
          'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&h=300&fit=crop',
      };
    }
  };

  const handleAddArticle = async () => {
    if (!articleUrl.trim()) return;

    setIsLoading(true);

    try {
      const { title, image } = await scrapeArticleMetadata(articleUrl);

      const newArticle: Resource = {
        id: Date.now().toString() + Math.random(),
        title: title,
        image: image,
        link: articleUrl,
        type: 'article',
      };

      setGuidesData([...guidesData, newArticle]);
      setShowUrlModal(false);
      setArticleUrl('');
    } catch (error) {
      console.error('Error adding article:', error);
      alert('Failed to add article. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = () => {
    if (activeTab === 'guides') {
      setShowUrlModal(true);
      return;
    }

    const fileInput = document.createElement('input');
    fileInput.type = 'file';

    switch (activeTab) {
      case 'videos':
        fileInput.accept = 'video/*';
        break;
      case 'templates':
        fileInput.accept = '.pdf,application/pdf';
        break;
    }

    fileInput.multiple = true;

    fileInput.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;

      if (files) {
        Array.from(files).forEach(file => {
          if (file.type === 'application/pdf') {
            const blobUrl = URL.createObjectURL(file);
            const thumbnailUrl =
              'https://images.unsplash.com/photo-1568667256549-094345857637?w=500&h=300&fit=crop';

            const newResource: Resource = {
              id: Date.now().toString() + Math.random(),
              title: file.name.replace(/\.[^/.]+$/, ''),
              image: thumbnailUrl,
              link: blobUrl,
              type: 'pdf',
            };

            setTemplatesData(prev => [...prev, newResource]);
          } else if (file.type.startsWith('video/')) {
            const blobUrl = URL.createObjectURL(file);

            const video = document.createElement('video');
            video.src = blobUrl;
            video.currentTime = 1;

            video.onloadeddata = () => {
              const canvas = document.createElement('canvas');
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
              const ctx = canvas.getContext('2d');

              if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const thumbnailUrl = canvas.toDataURL('image/jpeg');

                const newResource: Resource = {
                  id: Date.now().toString() + Math.random(),
                  title: file.name.replace(/\.[^/.]+$/, ''),
                  image: thumbnailUrl,
                  link: blobUrl,
                  type: 'video',
                };

                setVideosData(prev => [...prev, newResource]);
              }
            };
          }
        });
      }
    };

    fileInput.click();
  };

  const handleCardClick = (resource: Resource) => {
    if (resource.type === 'video' && resource.link) {
      setSelectedVideo(resource.link);
    } else if (resource.type === 'pdf' && resource.link) {
      window.open(resource.link, '_blank');
    } else if (resource.type === 'article' && resource.link) {
      window.open(resource.link, '_blank');
    }
  };

  const closeVideoModal = () => {
    setSelectedVideo(null);
  };

  const closeUrlModal = () => {
    setShowUrlModal(false);
    setArticleUrl('');
  };

  return (
    <div className="min-h-screen bg-gray-200">
      <Header userName="Athlete Name" />

      <div className="flex p-5 flex-1">
        <NavigationBar activeItem="resource" userName="Athlete Name" />

        <div className="flex-1 bg-white mt-0 ml-5 mr-5 mb-5 rounded-xl flex flex-col">
          {/* Tabs Navigation */}
          <div className="border-b border-gray-200">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-center gap-20">
                <button
                  onClick={() => setActiveTab('guides')}
                  className={`pl-6 pr-10 py-4 text-base font-medium relative transition-colors border-r border-gray-300 ${
                    activeTab === 'guides'
                      ? 'text-[#CB9729]'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Guides & Articles
                  {activeTab === 'guides' && (
                    <div className="absolute bottom-0 left-0 right-4 h-0.5 bg-[#CB9729]" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('videos')}
                  className={`pl-6 pr-10 py-4 text-base font-medium relative transition-colors border-r border-gray-300 ${
                    activeTab === 'videos'
                      ? 'text-[#CB9729]'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Video Library
                  {activeTab === 'videos' && (
                    <div className="absolute bottom-0 left-0 right-4 h-0.5 bg-[#CB9729]" />
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('templates')}
                  className={`px-6 py-4 text-base font-medium relative transition-colors ${
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
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-6">
              {/* Header - Only show for Guides & Articles tab */}
              {activeTab === 'guides' && (
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
              )}

              {/* Resource Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {getCurrentData().map(resource => (
                  <ResourceCard
                    key={resource.id}
                    id={resource.id}
                    title={resource.title}
                    image={resource.image}
                    link={resource.link}
                    type={resource.type}
                    onDelete={handleDelete}
                    onClick={() => handleCardClick(resource)}
                  />
                ))}
              </div>

              {/* Empty State */}
              {getCurrentData().length === 0 && (
                <div className="text-center py-16">
                  <p className="text-gray-500 text-base mb-2">
                    No resources available
                  </p>
                  <p className="text-gray-400 text-sm">
                    {activeTab === 'guides'
                      ? 'Click Add Article URL to add new content'
                      : 'Click Upload to add new content'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <RightSideBar />
      </div>

      <ResourceModals
        showUrlModal={showUrlModal}
        articleUrl={articleUrl}
        isLoading={isLoading}
        onUrlChange={setArticleUrl}
        onCloseUrlModal={closeUrlModal}
        onAddArticle={handleAddArticle}
        selectedVideo={selectedVideo}
        onCloseVideoModal={closeVideoModal}
      />
    </div>
  );
}
