'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import NavigationBar from '@/components/NavigationBar';
import RightSideBar from '@/components/RightSideBar';
import Header from '@/components/Header';
import { MoreVertical, ChevronDown, ChevronUp, Trash2, Play, X } from 'lucide-react';
import { apiGet, apiDelete } from '@/utils/api';
import { getResourceUrl } from '@/utils/config';
import Post, { type PostData } from '@/components/Post';

interface Athlete {
  id: string;
  name: string;
  profileUrl: string | null;
  username?: string | null;
  email?: string | null;
  primary_sport?: string | null;
}

interface AthleteActivities {
  posts: PostData[];
  clips: any[];
  articles: any[];
  videos: any[];
  templates: any[];
}

export default function MyAthletesPage() {
  const [myAthletes, setMyAthletes] = useState<Athlete[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState<Record<string, AthleteActivities>>({});
  const [expandedAthletes, setExpandedAthletes] = useState<Set<string>>(new Set());
  const [athleteIds, setAthleteIds] = useState<string[]>([]);
  const [selectedClip, setSelectedClip] = useState<any>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'posts' | 'clips' | 'articles' | 'videos' | 'templates'>('all');
  const router = useRouter();

  async function fetchChildren() {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        console.error('No access token found');
        setLoading(false);
        return;
      }

      const data = await apiGet<{
        success: boolean;
        children?: any[];
      }>('/signup/my-children');

      if (data.success && data.children) {
        // Transform children data to match Athlete interface
        const children = data.children.map((child: any) => ({
          id: child.id,
          name: child.full_name || child.username || 'Unknown',
          profileUrl: child.profile_url || null,
          username: child.username,
          email: child.email,
          primary_sport: child.primary_sport,
        }));
        setMyAthletes(children);
        setAthleteIds(children.map((c: any) => c.id));
        
        // Fetch activities for all children
        await fetchChildrenActivities(children.map((c: any) => c.id));
      } else {
        setMyAthletes([]);
        setAthleteIds([]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching children:', error);
      setMyAthletes([]);
      setAthleteIds([]);
      setLoading(false);
    }
  }

  async function fetchChildrenActivities(childrenIds: string[]) {
    try {
      // Only fetch if we have children
      if (!childrenIds || childrenIds.length === 0) {
        setActivities({});
        return;
      }

      const data = await apiGet<{
        success: boolean;
        activities?: Record<string, AthleteActivities>;
      }>('/signup/my-children/activities');

      console.log('fetchChildrenActivities - API response:', {
        success: data.success,
        activitiesCount: data.activities ? Object.keys(data.activities).length : 0,
        activities: data.activities,
      });

      if (data.success && data.activities) {
        setActivities(data.activities);
        // Log each athlete's activity count
        Object.entries(data.activities).forEach(([athleteId, activities]) => {
          console.log(`Athlete ${athleteId} activities:`, {
            posts: activities.posts?.length || 0,
            clips: activities.clips?.length || 0,
            articles: activities.articles?.length || 0,
          });
        });
      } else {
        console.warn('fetchChildrenActivities - No activities or unsuccessful response');
        setActivities({});
      }
    } catch (error: any) {
      console.error('Error fetching children activities:', error);
      console.error('Error details:', error.message, error.status, error.response);
      // Don't show error to user, just set empty activities
      // The error is likely due to no children or permission issues
      setActivities({});
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await apiDelete<{ success: boolean; message?: string }>(`/posts/${postId}`);
      if (result.success) {
        // Refresh activities
        await fetchChildrenActivities(athleteIds);
      } else {
        alert(result.message || 'Failed to delete post');
      }
    } catch (error: any) {
      console.error('Error deleting post:', error);
      alert(error?.response?.data?.message || 'Failed to delete post. Please try again.');
    }
  };

  const handleDeleteClip = async (clipId: string) => {
    if (!confirm('Are you sure you want to delete this clip? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await apiDelete<{ success: boolean; message?: string }>(`/clips/${clipId}`);
      if (result.success) {
        // Refresh activities
        await fetchChildrenActivities(athleteIds);
      } else {
        alert(result.message || 'Failed to delete clip');
      }
    } catch (error: any) {
      console.error('Error deleting clip:', error);
      alert(error?.response?.data?.message || 'Failed to delete clip. Please try again.');
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm('Are you sure you want to delete this article? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await apiDelete<{ success: boolean; message?: string }>(`/articles/${articleId}`);
      if (result.success) {
        // Refresh activities
        await fetchChildrenActivities(athleteIds);
      } else {
        alert(result.message || 'Failed to delete article');
      }
    } catch (error: any) {
      console.error('Error deleting article:', error);
      alert(error?.response?.data?.message || 'Failed to delete article. Please try again.');
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await apiDelete<{ success: boolean; message?: string }>(`/videos/${videoId}`);
      if (result.success) {
        // Refresh activities
        await fetchChildrenActivities(athleteIds);
      } else {
        alert(result.message || 'Failed to delete video');
      }
    } catch (error: any) {
      console.error('Error deleting video:', error);
      alert(error?.response?.data?.message || 'Failed to delete video. Please try again.');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await apiDelete<{ success: boolean; message?: string }>(`/templates/${templateId}`);
      if (result.success) {
        // Refresh activities
        await fetchChildrenActivities(athleteIds);
      } else {
        alert(result.message || 'Failed to delete template');
      }
    } catch (error: any) {
      console.error('Error deleting template:', error);
      alert(error?.response?.data?.message || 'Failed to delete template. Please try again.');
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await apiDelete<{ success: boolean; message?: string }>(`/resources/${resourceId}`);
      if (result.success) {
        // Refresh activities
        await fetchChildrenActivities(athleteIds);
      } else {
        alert(result.message || 'Failed to delete resource');
      }
    } catch (error: any) {
      console.error('Error deleting resource:', error);
      alert(error?.response?.data?.message || 'Failed to delete resource. Please try again.');
    }
  };

  const toggleAthleteExpanded = (athleteId: string) => {
    const newExpanded = new Set(expandedAthletes);
    if (newExpanded.has(athleteId)) {
      newExpanded.delete(athleteId);
    } else {
      newExpanded.add(athleteId);
    }
    setExpandedAthletes(newExpanded);
  };

  async function fetchData() {
    try {
      // Fetch current user
      const userIdentifier = localStorage.getItem('userEmail');
      if (userIdentifier) {
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
          setCurrentUser(data.user);

          // If user is a parent, fetch their children
          if (data.user.user_type === 'parent') {
            await fetchChildren();
          } else {
            // If not a parent, show empty or redirect
            setMyAthletes([]);
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProfileUrl = (profileUrl?: string | null): string | undefined => {
    if (!profileUrl || profileUrl.trim() === '') return undefined;
    if (profileUrl.startsWith('http')) return profileUrl;
    if (profileUrl.startsWith('/') && !profileUrl.startsWith('/assets')) {
      return getResourceUrl(profileUrl) || profileUrl;
    }
    return profileUrl;
  };

  const handleAthleteClick = (athleteId: string) => {
    router.push(`/profile?userId=${athleteId}`);
  };

  if (loading) {
    return (
      <div className="h-screen bg-[#D4D4D4] flex flex-col overflow-hidden">
        <Header />
        <main className="flex flex-1 w-full mt-5 overflow-hidden items-center justify-center">
          <p className="text-gray-600">Loading...</p>
        </main>
      </div>
    );
  }

  // If user is not a parent, show message
  if (currentUser && currentUser.user_type !== 'parent') {
    return (
      <div className="h-screen bg-[#D4D4D4] flex flex-col overflow-hidden">
        <Header />
        <main className="flex flex-1 w-full mt-5 overflow-hidden">
          <div className="hidden md:flex px-6">
            <NavigationBar activeItem="my_athletes" />
          </div>
          <div className="flex-1 flex flex-col px-4 overflow-hidden min-w-0 items-center justify-center">
            <p className="text-gray-600">
              This page is only available for parents.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#D4D4D4] flex flex-col overflow-hidden">
      <Header />

      <main className="flex flex-1 w-full mt-5 overflow-hidden">
        <div className="hidden md:flex px-3">
          <NavigationBar activeItem="my_athletes" />
        </div>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto pr-3 min-h-0 flex justify-center">
            <div className="flex flex-col gap-4 pb-4 w-full max-w-full">
              {/* My Children Section */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    My Children & Their Activity
                  </h2>
                  {myAthletes.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => setActiveFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          activeFilter === 'all'
                            ? 'bg-[#CB9729] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setActiveFilter('posts')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          activeFilter === 'posts'
                            ? 'bg-[#CB9729] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Posts
                      </button>
                      <button
                        onClick={() => setActiveFilter('clips')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          activeFilter === 'clips'
                            ? 'bg-[#CB9729] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Clips
                      </button>
                      <button
                        onClick={() => setActiveFilter('articles')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          activeFilter === 'articles'
                            ? 'bg-[#CB9729] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Articles
                      </button>
                      <button
                        onClick={() => setActiveFilter('videos')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          activeFilter === 'videos'
                            ? 'bg-[#CB9729] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Videos
                      </button>
                      <button
                        onClick={() => setActiveFilter('templates')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          activeFilter === 'templates'
                            ? 'bg-[#CB9729] text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Templates
                      </button>
                    </div>
                  )}
                </div>
                {myAthletes.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No children found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myAthletes.map(athlete => {
                      const profileImageUrl = getProfileUrl(athlete.profileUrl);
                      const isExpanded = expandedAthletes.has(athlete.id);
                      const athleteActivities = activities[athlete.id] || { posts: [], clips: [], articles: [] };
                      const totalActivities = 
                        (athleteActivities.posts?.length || 0) + 
                        (athleteActivities.clips?.length || 0) + 
                        (athleteActivities.articles?.length || 0);

                      return (
                        <div
                          key={athlete.id}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          {/* Athlete Header */}
                          <div
                            className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => toggleAthleteExpanded(athlete.id)}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-12 h-12 rounded-full bg-teal-400 overflow-hidden flex items-center justify-center flex-shrink-0">
                                {profileImageUrl ? (
                                  <img
                                    src={profileImageUrl}
                                    alt={athlete.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-white font-semibold text-sm">
                                    {getInitials(athlete.name)}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-xs text-gray-500">
                                  {athlete.primary_sport
                                    ? athlete.primary_sport
                                        .charAt(0)
                                        .toUpperCase() +
                                      athlete.primary_sport.slice(1).toLowerCase()
                                    : 'Athlete'}
                                </p>
                                <p className="text-sm font-semibold text-gray-900">
                                  {athlete.name}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {totalActivities} {totalActivities === 1 ? 'activity' : 'activities'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                className="text-gray-400 hover:text-gray-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAthleteClick(athlete.id);
                                }}
                                title="View Profile"
                              >
                                <MoreVertical size={20} />
                              </button>
                              <button
                                className="text-gray-400 hover:text-gray-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAthleteExpanded(athlete.id);
                                }}
                              >
                                {isExpanded ? (
                                  <ChevronUp size={20} />
                                ) : (
                                  <ChevronDown size={20} />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Activities Section */}
                          {isExpanded && (
                            <div className="border-t border-gray-200 p-4 bg-gray-50">
                              {totalActivities === 0 ? (
                                <p className="text-center text-gray-500 py-4">
                                  No activities yet.
                                </p>
                              ) : (
                                <div className="space-y-6">
                                  {/* Posts */}
                                  {(activeFilter === 'all' || activeFilter === 'posts') && 
                                   athleteActivities.posts && athleteActivities.posts.length > 0 && (
                                    <div>
                                      {activeFilter === 'all' && (
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                          Posts ({athleteActivities.posts.length})
                                        </h3>
                                      )}
                                      <div className="space-y-2">
                                        {athleteActivities.posts.map((post: PostData) => (
                                          <div key={post.id} className="bg-white rounded-lg p-2 border border-gray-200 flex items-start gap-3">
                                            {/* Compact post preview */}
                                            <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-gray-100">
                                              {post.media_url || post.image_url ? (
                                                post.post_type === 'video' || (post.media_url && post.media_url.match(/\.(mp4|mov)$/i)) ? (
                                                  <video
                                                    src={post.media_url?.startsWith('http') ? post.media_url : getResourceUrl(post.media_url || post.image_url || '') || ''}
                                                    className="w-full h-full object-cover"
                                                    muted
                                                  />
                                                ) : (
                                                  <img
                                                    src={post.media_url?.startsWith('http') ? post.media_url : getResourceUrl(post.media_url || post.image_url || '') || ''}
                                                    alt="Post"
                                                    className="w-full h-full object-cover"
                                                  />
                                                )
                                              ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                                  {post.post_type === 'article' ? '📄' : post.post_type === 'event' ? '📅' : '📝'}
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <p className="text-xs text-gray-500 mb-1">
                                                {post.post_type ? post.post_type.charAt(0).toUpperCase() + post.post_type.slice(1) : 'Post'}
                                              </p>
                                              <p className="text-sm text-gray-900 line-clamp-2 mb-1">
                                                {post.caption || post.article_title || post.event_title || 'No caption'}
                                              </p>
                                              <p className="text-xs text-gray-400">
                                                {post.created_at ? new Date(post.created_at).toLocaleDateString() : ''}
                                              </p>
                                            </div>
                                            <div className="flex-shrink-0 flex flex-col gap-1">
                                              <button
                                                onClick={() => handleDeletePost(post.id)}
                                                className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                title="Delete post"
                                              >
                                                <Trash2 size={14} />
                                              </button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Clips */}
                                  {(activeFilter === 'all' || activeFilter === 'clips') && 
                                   athleteActivities.clips && athleteActivities.clips.length > 0 && (
                                    <div>
                                      {activeFilter === 'all' && (
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                          Clips ({athleteActivities.clips.length})
                                        </h3>
                                      )}
                                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {athleteActivities.clips.map((clip: any) => {
                                          const clipVideoUrl = clip.video_url?.startsWith('http') ? clip.video_url : getResourceUrl(clip.video_url) || clip.video_url;
                                          return (
                                            <div 
                                              key={clip.id} 
                                              className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-square cursor-pointer"
                                              onClick={() => setSelectedClip(clip)}
                                            >
                                              <video
                                                src={clipVideoUrl}
                                                className="w-full h-full object-cover"
                                                muted
                                                playsInline
                                              />
                                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="white" />
                                              </div>
                                              <div className="absolute top-2 right-2">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteClip(clip.id);
                                                  }}
                                                  className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
                                                  title="Delete clip"
                                                >
                                                  <Trash2 size={14} />
                                                </button>
                                              </div>
                                              {clip.description && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                                  <p className="text-white text-xs line-clamp-2">{clip.description}</p>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Articles */}
                                  {(activeFilter === 'all' || activeFilter === 'articles') && 
                                   athleteActivities.articles && athleteActivities.articles.length > 0 && (
                                    <div>
                                      {activeFilter === 'all' && (
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                          Articles ({athleteActivities.articles.length})
                                        </h3>
                                      )}
                                      <div className="space-y-3">
                                        {athleteActivities.articles.map((article: any) => (
                                          <div key={article.id} className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                                            <div className="flex-1">
                                              <h4 className="font-semibold text-gray-900">{article.title}</h4>
                                              {article.description && (
                                                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{article.description}</p>
                                              )}
                                              {article.article_link && (
                                                <a
                                                  href={article.article_link}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                                >
                                                  View Article →
                                                </a>
                                              )}
                                            </div>
                                            <button
                                              onClick={() => handleDeleteArticle(article.id)}
                                              className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                              title="Delete article"
                                            >
                                              <Trash2 size={18} />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  {/* Videos */}
                                  {(activeFilter === 'all' || activeFilter === 'videos') && 
                                   athleteActivities.videos && athleteActivities.videos.length > 0 && (
                                    <div>
                                      {activeFilter === 'all' && (
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                          Videos ({athleteActivities.videos.length})
                                        </h3>
                                      )}
                                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                        {athleteActivities.videos.map((video: any) => {
                                          const videoUrl = video.video_url?.startsWith('http') ? video.video_url : getResourceUrl(video.video_url) || video.video_url;
                                          const isResource = video.resource_type === 'video' || (video.resource_type && video.video_url);
                                          return (
                                            <div 
                                              key={video.id} 
                                              className="relative group bg-gray-100 rounded-lg overflow-hidden aspect-video cursor-pointer"
                                              onClick={() => {
                                                // Open video in modal or new tab
                                                if (videoUrl) {
                                                  window.open(videoUrl, '_blank');
                                                }
                                              }}
                                            >
                                              <video
                                                src={videoUrl}
                                                className="w-full h-full object-cover"
                                                muted
                                                playsInline
                                              />
                                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                <Play className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="white" />
                                              </div>
                                              <div className="absolute top-2 right-2">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (isResource) {
                                                      handleDeleteResource(video.id);
                                                    } else {
                                                      handleDeleteVideo(video.id);
                                                    }
                                                  }}
                                                  className="opacity-0 group-hover:opacity-100 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all"
                                                  title="Delete video"
                                                >
                                                  <Trash2 size={14} />
                                                </button>
                                              </div>
                                              {video.title && (
                                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                                  <p className="text-white text-xs line-clamp-2 font-semibold">{video.title}</p>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* Templates */}
                                  {(activeFilter === 'all' || activeFilter === 'templates') && 
                                   athleteActivities.templates && athleteActivities.templates.length > 0 && (
                                    <div>
                                      {activeFilter === 'all' && (
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                                          Templates ({athleteActivities.templates.length})
                                        </h3>
                                      )}
                                      <div className="space-y-3">
                                        {athleteActivities.templates.map((template: any) => {
                                          const isResource = template.resource_type === 'template' || (template.resource_type && template.file_url);
                                          return (
                                            <div key={template.id} className="bg-white rounded-lg p-4 border border-gray-200 flex items-center justify-between">
                                              <div className="flex items-center gap-3 flex-1">
                                                <div className="flex-shrink-0 w-12 h-12 rounded bg-gray-100 flex items-center justify-center">
                                                  <span className="text-2xl">📄</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                  <h4 className="font-semibold text-gray-900">{template.title || 'Untitled Template'}</h4>
                                                  {template.description && (
                                                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.description}</p>
                                                  )}
                                                  {template.file_type && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                      Type: {template.file_type}
                                                    </p>
                                                  )}
                                                  {template.created_at && (
                                                    <p className="text-xs text-gray-400 mt-1">
                                                      {new Date(template.created_at).toLocaleDateString()}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                {template.file_url && (
                                                  <a
                                                    href={template.file_url?.startsWith('http') ? template.file_url : getResourceUrl(template.file_url) || template.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                                                    onClick={(e) => e.stopPropagation()}
                                                  >
                                                    View
                                                  </a>
                                                )}
                                                <button
                                                  onClick={() => {
                                                    if (isResource) {
                                                      handleDeleteResource(template.id);
                                                    } else {
                                                      handleDeleteTemplate(template.id);
                                                    }
                                                  }}
                                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                  title="Delete template"
                                                >
                                                  <Trash2 size={18} />
                                                </button>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}

                                  {/* No results message when filtered */}
                                  {activeFilter !== 'all' && (
                                    (activeFilter === 'posts' && (!athleteActivities.posts || athleteActivities.posts.length === 0)) ||
                                    (activeFilter === 'clips' && (!athleteActivities.clips || athleteActivities.clips.length === 0)) ||
                                    (activeFilter === 'articles' && (!athleteActivities.articles || athleteActivities.articles.length === 0)) ||
                                    (activeFilter === 'videos' && (!athleteActivities.videos || athleteActivities.videos.length === 0)) ||
                                    (activeFilter === 'templates' && (!athleteActivities.templates || athleteActivities.templates.length === 0))
                                  ) && (
                                    <div className="text-center py-8 text-gray-500">
                                      <p>No {activeFilter} found for this athlete.</p>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="hidden lg:flex pr-3">
          <RightSideBar />
        </div>
      </main>

      {/* Clip Detail Modal */}
      {selectedClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setSelectedClip(null)}
          />
          <div className="relative z-10 w-full max-w-4xl bg-white rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Clip Details</h2>
              <button
                onClick={() => setSelectedClip(null)}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {/* Video Player */}
                <div className="w-full">
                  <video
                    src={selectedClip.video_url?.startsWith('http') ? selectedClip.video_url : getResourceUrl(selectedClip.video_url) || selectedClip.video_url}
                    controls
                    className="w-full h-auto rounded-lg"
                  />
                </div>

                {/* Clip Info */}
                <div className="space-y-2">
                  {selectedClip.description && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-1">Description</p>
                      <p className="text-gray-700">{selectedClip.description}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-6 text-gray-600 text-sm">
                    <span className="flex items-center gap-1">
                      <span className="font-semibold">{selectedClip.like_count || 0}</span> likes
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="font-semibold">{selectedClip.comment_count || 0}</span> comments
                    </span>
                    {selectedClip.created_at && (
                      <span className="text-gray-500">
                        {new Date(selectedClip.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200 flex gap-2">
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this clip? This action cannot be undone.')) {
                          handleDeleteClip(selectedClip.id);
                          setSelectedClip(null);
                        }
                      }}
                      className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Delete Clip
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
