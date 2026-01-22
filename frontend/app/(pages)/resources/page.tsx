'use client';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { Upload, X } from 'lucide-react';
import NavigationBar from '@/components/NavigationBar';
import RightSideBar from '@/components/RightSideBar';
import ResourceCard from '@/components/Resources/ResourceCard';
import ResourceModals from '@/components/Resources/ResourceModals';
import { getResourceUrl, apiGet, apiDelete, apiUpload } from '@/utils/api';

type TabType = 'guides' | 'videos' | 'templates';

interface Resource {
  id: string;
  title: string;
  image: string;
  link?: string;
  type?: 'image' | 'video' | 'pdf' | 'article';
}

interface Article {
  id: string;
  title: string;
  description?: string;
  article_link: string;
  user_id: string;
}

interface Video {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  video_duration?: number;
  user_id: string;
}

interface Template {
  id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  user_id: string;
}

export default function ManageResourcesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('guides');
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [articleUrl, setArticleUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{
    full_name?: string;
    profile_url?: string;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);

  // Fetch current user ID
  useEffect(() => {
    const fetchCurrentUserId = async () => {
      try {
        const userIdentifier = localStorage.getItem('userEmail');
        if (!userIdentifier) {
          return;
        }

        let data;
        if (userIdentifier.startsWith('username:')) {
          const username = userIdentifier.replace('username:', '');
          data = await apiGet<{
            success: boolean;
            user?: any;
          }>(`/signup/user-by-username/${encodeURIComponent(username)}`);
        } else {
          data = await apiGet<{
            success: boolean;
            user?: any;
          }>(`/signup/user/${encodeURIComponent(userIdentifier)}`);
        }

        if (data.success && data.user) {
          setCurrentUserId(data.user.id);
          setCurrentUser({
            full_name: data.user.full_name,
            profile_url: data.user.profile_url,
          });
        }
      } catch (error) {
        console.error('Error fetching current user ID:', error);
      }
    };

    fetchCurrentUserId();
  }, []);

  // Map database items to frontend resources
  const mapArticleToResource = (article: Article): Resource => {
    return {
      id: article.id,
      title: article.title || 'Untitled',
      image:
        'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&h=300&fit=crop',
      link: article.article_link,
      type: 'article',
    };
  };

  const mapVideoToResource = (video: Video): Resource => {
    const videoUrl = video.video_url
      ? video.video_url.startsWith('http')
        ? video.video_url
        : getResourceUrl(video.video_url) || video.video_url
      : undefined;

    return {
      id: video.id,
      title: video.title || 'Untitled',
      image:
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=300&fit=crop',
      link: videoUrl,
      type: 'video',
    };
  };

  const mapTemplateToResource = (template: Template): Resource => {
    const fileUrl = template.file_url
      ? template.file_url.startsWith('http')
        ? template.file_url
        : getResourceUrl(template.file_url) || template.file_url
      : undefined;

    return {
      id: template.id,
      title: template.title || 'Untitled',
      image:
        'https://images.unsplash.com/photo-1568667256549-094345857637?w=500&h=300&fit=crop',
      link: fileUrl,
      type: 'pdf',
    };
  };

  // Fetch resources from API
  const fetchResources = async () => {
    try {
      if (!currentUserId) {
        setLoading(false);
        setResources([]);
        return;
      }

      setLoading(true);
      let endpoint = '';

      // Use separate endpoints by default
      if (activeTab === 'guides') {
        endpoint = `/articles?user_id=${encodeURIComponent(currentUserId)}`;
      } else if (activeTab === 'videos') {
        endpoint = `/videos?user_id=${encodeURIComponent(currentUserId)}`;
      } else {
        endpoint = `/templates?user_id=${encodeURIComponent(currentUserId)}`;
      }

      const data = await apiGet<{
        success: boolean;
        articles?: any[];
        videos?: any[];
        templates?: any[];
      }>(endpoint);

      if (data.success) {
        let mappedResources: Resource[] = [];

        if (activeTab === 'guides' && data.articles) {
          mappedResources = data.articles.map(mapArticleToResource);
        } else if (activeTab === 'videos' && data.videos) {
          mappedResources = data.videos.map(mapVideoToResource);
        } else if (activeTab === 'templates' && data.templates) {
          mappedResources = data.templates.map(mapTemplateToResource);
        }

        setResources(mappedResources);
      } else {
        setResources([]);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
      setResources([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch resources when tab changes or component mounts
  useEffect(() => {
    if (currentUserId) {
      fetchResources();
    }
  }, [activeTab, currentUserId]);

  const handleDeleteClick = (id: string) => {
    setResourceToDelete(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!resourceToDelete) {
      setShowDeleteConfirm(false);
      setResourceToDelete(null);
      return;
    }

    try {
      // Fetch user data first (same pattern as Post component)
      const userIdentifier = localStorage.getItem('userEmail');
      if (!userIdentifier) {
        alert('User not logged in');
        setShowDeleteConfirm(false);
        setResourceToDelete(null);
        return;
      }

      let userData;
      if (userIdentifier.startsWith('username:')) {
        const username = userIdentifier.replace('username:', '');
        userData = await apiGet<{
          success: boolean;
          user?: any;
        }>(`/signup/user-by-username/${encodeURIComponent(username)}`);
      } else {
        userData = await apiGet<{
          success: boolean;
          user?: any;
        }>(`/signup/user/${encodeURIComponent(userIdentifier)}`);
      }

      if (!userData.success || !userData.user) {
        throw new Error('User not found');
      }

      // Determine endpoint based on active tab
      let endpoint = '';
      if (activeTab === 'guides') {
        endpoint = `/articles/${resourceToDelete}`;
      } else if (activeTab === 'videos') {
        endpoint = `/videos/${resourceToDelete}`;
      } else {
        endpoint = `/templates/${resourceToDelete}`;
      }

      // Use apiDelete to perform DELETE so token refresh is handled automatically
      const result = await apiDelete<{
        success: boolean;
        message?: string;
      }>(endpoint);
      if (result.success) {
        // Refresh resources after deletion
        await fetchResources();
        setShowDeleteConfirm(false);
        setResourceToDelete(null);
      } else {
        alert(result.message || 'Failed to delete resource');
        setShowDeleteConfirm(false);
        setResourceToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      alert('Failed to delete resource. Please try again.');
      setShowDeleteConfirm(false);
      setResourceToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
    setResourceToDelete(null);
  };

  const scrapeArticleMetadata = async (url: string) => {
    // First try server-side scraping to avoid CORS / network issues from the browser
    try {
      const res = await fetch(`/api/scrape-url?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.title) {
          return { title: data.title };
        }
      }
    } catch (e) {
      console.warn(
        'Server-side scrape failed, falling back to client proxy',
        e
      );
    }

    // Fallback: try AllOrigins raw endpoint, then last-resort default
    try {
      const proxyRaw = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyRaw);
      if (!response.ok) throw new Error('Proxy fetch failed');
      const html = await response.text();

      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const title =
        doc
          .querySelector('meta[property="og:title"]')
          ?.getAttribute('content') ||
        doc
          .querySelector('meta[name="twitter:title"]')
          ?.getAttribute('content') ||
        doc.querySelector('title')?.textContent ||
        'Untitled Article';

      return { title };
    } catch (error) {
      console.error('Error scraping article:', error);
      return {
        title: 'Article',
      };
    }
  };

  const handleAddArticle = async () => {
    if (!articleUrl.trim()) return;
    if (!currentUserId) {
      alert('You must be logged in to add resources');
      return;
    }

    setIsLoading(true);

    try {
      const { title } = await scrapeArticleMetadata(articleUrl);

      const { apiPost } = await import('@/utils/api');
      const data = await apiPost<{
        success: boolean;
        article?: any;
        message?: string;
      }>('/articles', {
        user_id: currentUserId,
        title: title,
        article_link: articleUrl,
      });

      if (data.success) {
        setShowUrlModal(false);
        setArticleUrl('');
        // Refresh resources
        fetchResources();
      } else {
        alert(data.message || 'Failed to add article');
      }
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

    if (!currentUserId) {
      alert('You must be logged in to upload resources');
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

    fileInput.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      const files = target.files;

      if (files) {
        for (const file of Array.from(files)) {
          try {
            setIsLoading(true);

            const formData = new FormData();
            formData.append('file', file);
            formData.append('user_id', currentUserId!);
            formData.append('title', file.name.replace(/\.[^/.]+$/, ''));

            if (activeTab === 'videos') {
              // For videos, we need to get duration
              formData.append('resource_type', 'video');
              const video = document.createElement('video');
              video.preload = 'metadata';
              video.src = URL.createObjectURL(file);

              video.onloadedmetadata = async () => {
                window.URL.revokeObjectURL(video.src);
                const duration = Math.floor(video.duration);

                formData.append('video_duration', duration.toString());

                try {
                  // Use apiUpload for file uploads (handles authentication automatically)
                  const data = await apiUpload<{
                    success: boolean;
                    message?: string;
                  }>('/videos', formData);

                  if (data.success) {
                    // Refresh resources after successful upload
                    await fetchResources();
                    alert('Video uploaded successfully!');
                  } else {
                    alert(data.message || 'Failed to upload video');
                  }
                } catch (uploadError: any) {
                  console.error('Error uploading video:', uploadError);
                  let errorMessage =
                    'Failed to upload video. Please try again.';

                  // Provide more specific error messages
                  if (uploadError.isNetworkError) {
                    errorMessage = `Network error: Unable to connect to the server. Please ensure the backend server is running.`;
                  } else if (uploadError.message) {
                    errorMessage = uploadError.message;
                  }

                  alert(errorMessage);
                } finally {
                  setIsLoading(false);
                }
              };

              video.onerror = () => {
                window.URL.revokeObjectURL(video.src);
                alert('Error loading video file');
                setIsLoading(false);
              };
            } else {
              // For templates (PDFs)
              formData.append('resource_type', 'template');
              formData.append('file_type', file.type);
              formData.append('file_size', file.size.toString());

              try {
                // Use apiUpload for file uploads (handles authentication automatically)
                const data = await apiUpload<{
                  success: boolean;
                  message?: string;
                }>('/templates', formData);

                if (data.success) {
                  // Refresh resources after successful upload
                  await fetchResources();
                  alert('Template uploaded successfully!');
                } else {
                  alert(data.message || 'Failed to upload template');
                }
              } catch (uploadError: any) {
                console.error('Error uploading template:', uploadError);
                let errorMessage =
                  'Failed to upload template. Please try again.';

                // Provide more specific error messages
                if (uploadError.isNetworkError) {
                  errorMessage = `Network error: Unable to connect to the server. Please ensure the backend server is running.`;
                } else if (uploadError.message) {
                  errorMessage = uploadError.message;
                }

                alert(errorMessage);
              } finally {
                setIsLoading(false);
              }
            }
          } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file. Please try again.');
            setIsLoading(false);
          }
        }
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

  // Construct profile URL - return undefined if no profileUrl exists
  const getProfileUrl = (profileUrl?: string | null): string | undefined => {
    if (!profileUrl || profileUrl.trim() === '') return undefined;
    if (profileUrl.startsWith('http')) return profileUrl;
    if (profileUrl.startsWith('/') && !profileUrl.startsWith('/assets')) {
      return getResourceUrl(profileUrl) || profileUrl;
    }
    return profileUrl;
  };

  return (
    <div className="h-screen bg-[#D4D4D4] flex flex-col overflow-hidden">
      <Header
        userName={currentUser?.full_name}
        userProfileUrl={getProfileUrl(currentUser?.profile_url)}
      />

      <div className="flex flex-1 w-full mt-5 overflow-hidden">
        {/* Navigation Bar */}
        <div className="hidden md:flex px-3">
          <NavigationBar activeItem="resource" />
        </div>

        <div className="flex-1 flex overflow-y-auto">
          <div className="flex-1 bg-white rounded-xl flex flex-col">
            {/* Tabs Navigation */}
            <div className="border-b border-gray-200">
              <div className="max-w-7xl mx-auto">
                <div className="flex justify-evenly">
                  <button
                    onClick={() => setActiveTab('guides')}
                    className={`px-6 py-4 text-md font-medium relative transition-colors border-r border-gray-300 ${
                      activeTab === 'guides'
                        ? 'text-[#CB9729]'
                        : 'text-black hover:text-black'
                    }`}
                  >
                    Guides & Articles
                    {activeTab === 'guides' && (
                      <div className="absolute bottom-0 left-0 right-4 h-0.5 bg-[#CB9729]" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('videos')}
                    className={`px-6 py-4 text-md font-medium relative transition-colors border-r border-gray-300 ${
                      activeTab === 'videos'
                        ? 'text-[#CB9729]'
                        : 'text-black hover:text-black'
                    }`}
                  >
                    Video Library
                    {activeTab === 'videos' && (
                      <div className="absolute bottom-0 left-0 right-4 h-0.5 bg-[#CB9729]" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveTab('templates')}
                    className={`px-6 py-4 text-nd font-medium relative transition-colors ${
                      activeTab === 'templates'
                        ? 'text-[#CB9729]'
                        : 'text-black hover:text-black'
                    }`}
                  >
                    Forms and Documents
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
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h1 className="text-2xl font-semibold text-black">
                    Manage Resources
                  </h1>
                  <button
                    onClick={handleUpload}
                    disabled={isLoading}
                    className="flex items-center gap-2 bg-[#CB9729] text-white px-5 py-2.5 rounded-lg hover:bg-[#B88624] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="font-medium">Upload</span>
                  </button>
                </div>

                {/* Resource Grid */}
                {loading ? (
                  <div className="text-center py-16">
                    <p className="text-black text-base">Loading resources...</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {resources.map(resource => (
                        <ResourceCard
                          key={resource.id}
                          id={resource.id}
                          title={resource.title}
                          image={resource.image}
                          link={resource.link}
                          type={resource.type}
                          onDelete={handleDeleteClick}
                          onClick={() => handleCardClick(resource)}
                        />
                      ))}
                    </div>

                    {/* Empty State */}

                    {resources.length === 0 && (
                      <div className="text-center py-16">
                        {activeTab === 'guides' && (
                          <>
                            <p className="text-black text-base mb-2">
                              No Guides & Articles yet, Upload your first
                              Article
                            </p>
                            <p className="text-black text-sm">
                              Click Upload to add article URL
                            </p>
                          </>
                        )}
                        {activeTab === 'videos' && (
                          <>
                            <p className="text-black text-base mb-2">
                              No Videos yet, Upload your first Video
                            </p>
                            <p className="text-black text-sm">
                              Click Upload to select video files
                            </p>
                          </>
                        )}
                        {activeTab === 'templates' && (
                          <>
                            <p className="text-black text-base mb-2">
                              No Forms and Documents yet, Upload your first Form
                              and Document
                            </p>
                            <p className="text-black text-sm">
                              Click Upload to select PDF files
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="hidden lg:flex ml-4 pr-3">
            <RightSideBar />
          </div>
        </div>
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

      {/* Delete Confirmation Modal */}
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleDeleteCancel}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Confirm Delete
              </h2>
              <button
                onClick={handleDeleteCancel}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <p className="text-gray-700 mb-6">
              Are you sure you want to delete this resource? This action cannot
              be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
