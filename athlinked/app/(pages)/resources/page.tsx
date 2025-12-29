'use client';

import { useState, useEffect } from 'react';
import { Upload } from 'lucide-react';
import Header from '@/components/Header';
import NavigationBar from '@/components/NavigationBar';
import RightSideBar from '@/components/RightSideBar';
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
  const [currentUser, setCurrentUser] = useState<{ full_name?: string; profile_url?: string } | null>(null);
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

        let response;
        if (userIdentifier.startsWith('username:')) {
          const username = userIdentifier.replace('username:', '');
          response = await fetch(
            `http://localhost:3001/api/signup/user-by-username/${encodeURIComponent(username)}`
          );
        } else {
          response = await fetch(
            `http://localhost:3001/api/signup/user/${encodeURIComponent(userIdentifier)}`
          );
        }

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user) {
            setCurrentUserId(data.user.id);
            setCurrentUser({
              full_name: data.user.full_name,
              profile_url: data.user.profile_url,
            });
          }
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
      image: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=500&h=300&fit=crop',
      link: article.article_link,
      type: 'article',
    };
  };

  const mapVideoToResource = (video: Video): Resource => {
    const videoUrl = video.video_url
      ? (video.video_url.startsWith('http') ? video.video_url : `http://localhost:3001${video.video_url}`)
      : undefined;
    
    return {
      id: video.id,
      title: video.title || 'Untitled',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500&h=300&fit=crop',
      link: videoUrl,
      type: 'video',
    };
  };

  const mapTemplateToResource = (template: Template): Resource => {
    const fileUrl = template.file_url
      ? (template.file_url.startsWith('http') ? template.file_url : `http://localhost:3001${template.file_url}`)
      : undefined;
    
    return {
      id: template.id,
      title: template.title || 'Untitled',
      image: 'https://images.unsplash.com/photo-1568667256549-094345857637?w=500&h=300&fit=crop',
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
      
      if (activeTab === 'guides') {
        endpoint = `http://localhost:3001/api/articles?user_id=${encodeURIComponent(currentUserId)}`;
      } else if (activeTab === 'videos') {
        endpoint = `http://localhost:3001/api/videos?user_id=${encodeURIComponent(currentUserId)}`;
      } else {
        endpoint = `http://localhost:3001/api/templates?user_id=${encodeURIComponent(currentUserId)}`;
      }

      const response = await fetch(endpoint);

      if (!response.ok) {
        console.error('Failed to fetch resources');
        setResources([]);
        return;
      }

      const data = await response.json();
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

      let userResponse;
      if (userIdentifier.startsWith('username:')) {
        const username = userIdentifier.replace('username:', '');
        userResponse = await fetch(
          `http://localhost:3001/api/signup/user-by-username/${encodeURIComponent(username)}`
        );
      } else {
        userResponse = await fetch(
          `http://localhost:3001/api/signup/user/${encodeURIComponent(userIdentifier)}`
        );
      }

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user data');
      }

      const userData = await userResponse.json();
      if (!userData.success || !userData.user) {
        throw new Error('User not found');
      }

      // Determine endpoint based on active tab
      let endpoint = '';
      if (activeTab === 'guides') {
        endpoint = `http://localhost:3001/api/articles/${resourceToDelete}`;
      } else if (activeTab === 'videos') {
        endpoint = `http://localhost:3001/api/videos/${resourceToDelete}`;
      } else {
        endpoint = `http://localhost:3001/api/templates/${resourceToDelete}`;
      }

      // Send DELETE request with user_id in body (same pattern as Post component)
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData.user.id,
        }),
      });

      const result = await response.json();
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

      const response = await fetch('http://localhost:3001/api/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUserId,
          title: title,
          article_link: articleUrl,
        }),
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      let data;
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError);
          const text = await response.text();
          console.error('Response text:', text);
          throw new Error(`Failed to parse response: ${text.substring(0, 100)}`);
        }
      } else {
        // If not JSON, read as text to see what we got
        const text = await response.text();
        console.error('Non-JSON response (status:', response.status, '):', text.substring(0, 200));
        throw new Error(`Server returned non-JSON response (status: ${response.status}). Check backend logs.`);
      }

      if (response.ok) {
        if (data.success) {
          setShowUrlModal(false);
          setArticleUrl('');
          // Refresh resources
          fetchResources();
        } else {
          alert(data.message || 'Failed to add article');
        }
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
              const video = document.createElement('video');
              video.preload = 'metadata';
              video.src = URL.createObjectURL(file);

              video.onloadedmetadata = async () => {
                window.URL.revokeObjectURL(video.src);
                const duration = Math.floor(video.duration);

                formData.append('video_duration', duration.toString());

                const response = await fetch('http://localhost:3001/api/videos', {
                  method: 'POST',
                  body: formData,
                });

                // Check if response is JSON
                const contentType = response.headers.get('content-type');
                let data;
                
                if (contentType && contentType.includes('application/json')) {
                  try {
                    data = await response.json();
                  } catch (jsonError) {
                    console.error('JSON parse error:', jsonError);
                    const text = await response.text();
                    console.error('Response text:', text);
                    throw new Error(`Failed to parse response: ${text.substring(0, 100)}`);
                  }
                } else {
                  const text = await response.text();
                  console.error('Non-JSON response (status:', response.status, '):', text.substring(0, 200));
                  throw new Error(`Server returned non-JSON response (status: ${response.status}). Check backend logs.`);
                }

                if (response.ok) {
                  if (data.success) {
                    // Refresh resources after successful upload
                    await fetchResources();
                    alert('Video uploaded successfully!');
                  } else {
                    alert(data.message || 'Failed to upload video');
                  }
                } else {
                  alert(data.message || 'Failed to upload video');
                }
                setIsLoading(false);
              };

              video.onerror = () => {
                window.URL.revokeObjectURL(video.src);
                alert('Error loading video file');
                setIsLoading(false);
              };
            } else {
              // For templates (PDFs)
              formData.append('file_type', file.type);
              formData.append('file_size', file.size.toString());

              const response = await fetch('http://localhost:3001/api/templates', {
                method: 'POST',
                body: formData,
              });

              // Check if response is JSON
              const contentType = response.headers.get('content-type');
              let data;
              
              if (contentType && contentType.includes('application/json')) {
                try {
                  data = await response.json();
                } catch (jsonError) {
                  console.error('JSON parse error:', jsonError);
                  const text = await response.text();
                  console.error('Response text:', text);
                  throw new Error(`Failed to parse response: ${text.substring(0, 100)}`);
                }
              } else {
                const text = await response.text();
                console.error('Non-JSON response (status:', response.status, '):', text.substring(0, 200));
                throw new Error(`Server returned non-JSON response (status: ${response.status}). Check backend logs.`);
              }

              if (response.ok) {
                if (data.success) {
                  // Refresh resources after successful upload
                  await fetchResources();
                  alert('Template uploaded successfully!');
                } else {
                  alert(data.message || 'Failed to upload template');
                }
              } else {
                alert(data.message || 'Failed to upload template');
              }
              setIsLoading(false);
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
      return `http://localhost:3001${profileUrl}`;
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
        <div className="hidden md:flex px-6">
          <NavigationBar activeItem="resource" />
        </div>

        <div className="flex-1 flex overflow-y-auto">
          <div className="flex-1 bg-white rounded-xl flex flex-col">
          {/* Tabs Navigation */}
          <div className="border-b border-gray-200">
            <div className="max-w-7xl mx-auto">
              <div className="flex justify-center gap-20">
                <button
                  onClick={() => setActiveTab('guides')}
                  className={`pl-6 pr-10 py-4 text-base font-medium relative transition-colors border-r border-gray-300 ${
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
                  className={`pl-6 pr-10 py-4 text-base font-medium relative transition-colors border-r border-gray-300 ${
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
                  className={`px-6 py-4 text-base font-medium relative transition-colors ${
                    activeTab === 'templates'
                      ? 'text-[#CB9729]'
                      : 'text-black hover:text-black'
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
                      <p className="text-black text-base mb-2">
                        No resources available
                      </p>
                      <p className="text-black text-sm">
                        {activeTab === 'guides'
                          ? 'Click Upload to add article URL'
                          : 'Click Upload to add new content'}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:flex ml-5">
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
      {showDeleteConfirm && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={handleDeleteCancel}
          ></div>

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div
              className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 p-6"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-black mb-4">
                Confirm Delete
              </h3>
              <p className="text-black mb-6">
                Are you sure you want to delete this resource? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-black"
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
        </>
      )}
    </div>
  );
}
