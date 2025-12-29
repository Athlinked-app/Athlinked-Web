'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import RightSideBar from '@/components/RightSideBar';
import Post, { type PostData } from '@/components/Post';
import EditProfileModal from '@/components/Profile/EditProfileModel';
import AboutMe from '@/components/Profile/AboutMe';
import SocialHandles, { type SocialHandle } from '@/components/Profile/SocialHandle';
import AcademicBackgrounds from '@/components/Profile/AcademicBackground';
import type { AcademicBackground } from '@/components/Profile/AcademicBackground';
import Achievements from '@/components/Profile/Achievements';
import type { Achievement } from '@/components/Profile/Achievements';
import AthleticAndPerformanceComponent from '@/components/Profile/AthleticandPerformance';
import type { AthleticAndPerformance } from '@/components/Profile/AthleticandPerformance';
import CompetitionAndClubComponent from '@/components/Profile/CompetitionandClub';
import type { CompetitionAndClub } from '@/components/Profile/CompetitionandClub';
import CharacterAndLeadershipComponent from '@/components/Profile/CharacterandLeadership';
import type { CharacterAndLeadership } from '@/components/Profile/CharacterandLeadership';
import HealthAndReadinessComponent from '@/components/Profile/HealthandReadiness';
import type { HealthAndReadiness } from '@/components/Profile/HealthandReadiness';
import VideoAndMediaComponent from '@/components/Profile/VideoandMedia';
import type { VideoAndMedia } from '@/components/Profile/VideoandMedia';


interface CurrentUser {
  id: string;
  full_name: string;
  profile_url?: string;
  username?: string;
}

interface ProfileData {
  userId: string;
  fullName: string | null;
  profileImage: string | null;
  coverImage: string | null;
  bio: string | null;
  education: string | null;
  primarySport: string | null;
  sportsPlayed: string | null;
}

export default function Profile() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'mysave'>('profile');
  const [userBio, setUserBio] = useState<string>('');
  const [socialHandles, setSocialHandles] = useState<SocialHandle[]>([]);
  const [academicBackgrounds, setAcademicBackgrounds] = useState<AcademicBackground[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [athleticAndPerformance, setAthleticAndPerformance] = useState<AthleticAndPerformance[]>([]);
  const [competitionAndClubs, setCompetitionAndClubs] = useState<CompetitionAndClub[]>([]);
  const [sportsPlayed, setSportsPlayed] = useState<string>('');
  const [characterAndLeadership, setCharacterAndLeadership] = useState<CharacterAndLeadership[]>([]);
  const [healthAndReadiness, setHealthAndReadiness] = useState<HealthAndReadiness[]>([]);
  const [videoAndMedia, setVideoAndMedia] = useState<VideoAndMedia[]>([]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/posts?page=1&limit=50');
      
      if (!response.ok) {
        console.error('Failed to fetch posts:', response.status, response.statusText);
        const text = await response.text();
        console.error('Response text:', text.substring(0, 200));
        setPosts([]);
        return;
      }

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response from posts API');
        const text = await response.text();
        console.error('Response text:', text.substring(0, 200));
        setPosts([]);
        return;
      }

      const data = await response.json();
      console.log('Posts API response:', data);
      
      if (data.success && data.posts) {
        const transformedPosts: PostData[] = data.posts.map((post: any) => ({
          id: post.id,
          username: post.username || 'User',
          user_profile_url: (post.user_profile_url && post.user_profile_url.trim() !== '') ? post.user_profile_url : null,
          user_id: post.user_id,
          post_type: post.post_type,
          caption: post.caption,
          media_url: post.media_url,
          article_title: post.article_title,
          article_body: post.article_body,
          event_title: post.event_title,
          event_date: post.event_date,
          event_location: post.event_location,
          like_count: post.like_count || 0,
          comment_count: post.comment_count || 0,
          save_count: post.save_count || 0,
          created_at: post.created_at,
        }));
        console.log('Transformed posts:', transformedPosts.length);
        setPosts(transformedPosts);
      } else {
        console.error('Posts API returned unsuccessful response:', data);
        setPosts([]);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId) {
      fetchProfileData();
    }
  }, [currentUserId]);

  const fetchProfileData = async () => {
    if (!currentUserId) return;
    
    try {
      console.log('Fetching profile data for userId:', currentUserId);
      const response = await fetch(`http://localhost:3001/api/profile/${currentUserId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Profile data fetched:', data);
        setProfileData(data);
      } else {
        console.log('No profile data found, will use defaults');
        setProfileData(null);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setProfileData(null);
    }
  };

  const fetchCurrentUser = async () => {
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

      if (!response.ok) {
        return;
      }

      const data = await response.json();
      if (data.success && data.user) {
        setCurrentUserId(data.user.id);
        setCurrentUser({
          id: data.user.id,
          full_name: data.user.full_name || data.user.username || 'User',
          profile_url: data.user.profile_url,
          username: data.user.username,
        });
        if (data.user.bio) {
          setUserBio(data.user.bio);
        }
        if (data.user.sports_played) {
          setSportsPlayed(data.user.sports_played);
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const handlePostCreated = () => {
    fetchPosts();
  };

  // Construct profile URL - return undefined if no profileUrl exists (don't use default)
  const getProfileUrl = (profileUrl?: string | null): string | undefined => {
    if (!profileUrl || profileUrl.trim() === '') return undefined;
    if (profileUrl.startsWith('http')) return profileUrl;
    if (profileUrl.startsWith('/') && !profileUrl.startsWith('/assets')) {
      return `http://localhost:3001${profileUrl}`;
    }
    return profileUrl;
  };
  
  // Get initials for placeholder
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="h-screen bg-[#D4D4D4] flex flex-col overflow-hidden">
      <Header
        userName={currentUser?.full_name}
        userProfileUrl={getProfileUrl(currentUser?.profile_url)}
      />

      <main className="flex flex-1 w-full mt-5 overflow-hidden">
        {/* Left Side - Edit Profile Modal and Tabs (3/4 width) */}
        <div className="hidden lg:block flex-[3] flex-shrink-0 border-r border-gray-200 overflow-hidden px-6 flex flex-col">
          <EditProfileModal
            open={true}
            asSidebar={true}
            onClose={() => setShowEditProfile(false)}
            userData={{
              full_name: currentUser?.full_name,
              username: currentUser?.username,
              profile_url: profileData?.profileImage 
                ? (profileData.profileImage.startsWith('http') 
                    ? profileData.profileImage 
                    : `http://localhost:3001${profileData.profileImage}`)
                : currentUser?.profile_url,
              background_image_url: profileData?.coverImage
                ? (profileData.coverImage.startsWith('http')
                    ? profileData.coverImage
                    : `http://localhost:3001${profileData.coverImage}`)
                : null,
              user_type: 'coach',
              location: 'Rochester, NY', // You can fetch this from user data
              age: 35, // You can fetch this from user data
              followers_count: 10000,
              sports_played: profileData?.sportsPlayed 
                ? profileData.sportsPlayed.replace(/[{}"']/g, '') // Remove curly brackets and quotes
                : '',
              primary_sport: profileData?.primarySport || '',
              profile_completion: 60,
              bio: profileData?.bio || '',
              education: profileData?.education || '',
            }}
            onSave={async (data) => {
              console.log('Profile saved:', data);

              try {
                if (!currentUserId) {
                  console.error('No user ID available');
                  return;
                }

                // Prepare data for API
                const profileData: {
                  userId: string;
                  bio?: string;
                  education?: string;
                  primarySport?: string;
                  profileImageUrl?: string;
                  coverImageUrl?: string;
                } = {
                  userId: currentUserId,
                };

                // Handle text fields - allow empty strings to clear the field
                console.log('Received data from EditProfilePopup:', {
                  bio: data.bio,
                  education: data.education,
                  bioUndefined: data.bio === undefined,
                  educationUndefined: data.education === undefined,
                });
                
                if (data.bio !== undefined) {
                  profileData.bio = data.bio || undefined; // Convert empty string to undefined
                }
                if (data.education !== undefined) {
                  profileData.education = data.education || undefined; // Convert empty string to undefined
                }
                
                console.log('Profile data being sent to API:', profileData);
                
                // Handle sports - parse from sports_played string (take first sport as primary)
                if (data.sports_played) {
                  const sports = data.sports_played.split(',').map(s => s.trim()).filter(Boolean);
                  if (sports.length > 0) profileData.primarySport = sports[0];
                }

                // Handle image files - upload them first
                if (data.profile_url instanceof File) {
                  const formData = new FormData();
                  formData.append('file', data.profile_url);
                  
                  // Upload profile image
                  const uploadResponse = await fetch('http://localhost:3001/api/profile/upload', {
                    method: 'POST',
                    body: formData,
                  });
                  
                  if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    if (uploadData.success && uploadData.fileUrl) {
                      profileData.profileImageUrl = uploadData.fileUrl;
                    }
                  }
                } else if (typeof data.profile_url === 'string') {
                  profileData.profileImageUrl = data.profile_url;
                }

                if (data.background_image_url instanceof File) {
                  const formData = new FormData();
                  formData.append('file', data.background_image_url);
                  
                  // Upload cover image
                  const uploadResponse = await fetch('http://localhost:3001/api/profile/upload', {
                    method: 'POST',
                    body: formData,
                  });
                  
                  if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    if (uploadData.success && uploadData.fileUrl) {
                      profileData.coverImageUrl = uploadData.fileUrl;
                    }
                  }
                } else if (typeof data.background_image_url === 'string') {
                  profileData.coverImageUrl = data.background_image_url;
                }

                // Call profile API
                const response = await fetch('http://localhost:3001/api/profile', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(profileData),
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  console.error('Failed to save profile:', errorData);
                  alert('Failed to save profile: ' + (errorData.message || 'Unknown error'));
                  return;
                }

                const result = await response.json();
                console.log('Profile saved successfully:', result);
                
                // Refresh user data and profile data
                fetchCurrentUser();
                fetchProfileData();
              } catch (error) {
                console.error('Error saving profile:', error);
                alert('Error saving profile. Please try again.');

              }
            }}
          />

          {/* Tab Navigation */}
          <div className="bg-white mt-4 rounded-lg flex flex-col flex-1 min-h-0">
            <div className="flex items-center border-b border-gray-200 flex-shrink-0">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 font-medium text-xl transition-colors relative ${
                  activeTab === 'profile'
                    ? 'text-[#CB9729]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Profile
                {activeTab === 'profile' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]"></div>
                )}
              </button>
              <div className="h-6 w-px bg-gray-200"></div>
              <button
                onClick={() => setActiveTab('activity')}
                className={`px-6 py-3 font-medium text-xl transition-colors relative ${
                  activeTab === 'activity'
                    ? 'text-[#CB9729]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Activity
                {activeTab === 'activity' && (
                  <div className="absolute bottom-0 text-xl  left-0 right-0 h-0.5 bg-[#CB9729]"></div>
                )}
              </button>
              <div className="h-6 w-px bg-gray-200"></div>
              <button
                onClick={() => setActiveTab('mysave')}
                className={`px-6 py-3 font-medium text-xl  transition-colors relative ${
                  activeTab === 'mysave'
                    ? 'text-[#CB9729]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                My Save
                {activeTab === 'mysave' && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]"></div>
                )}
              </button>
            </div>

            <div className="mt-4 space-y-4 overflow-y-auto flex-1 pb-4 px-1 max-h-[400px] lg:max-h-[450px]">
              {activeTab === 'profile' && (
                <>
                  <AboutMe bio={userBio} />
                  <SocialHandles
                    handles={socialHandles}
                    onHandlesChange={setSocialHandles}
                  />
                  <AcademicBackgrounds
                    backgrounds={academicBackgrounds}
                    onBackgroundsChange={setAcademicBackgrounds}
                  />
                  <Achievements
                    achievements={achievements}
                    onAchievementsChange={setAchievements}
                  />
                  <AthleticAndPerformanceComponent
                    athleticAndPerformance={athleticAndPerformance}
                    onAthleticAndPerformanceChange={setAthleticAndPerformance}
                    sportsPlayed={sportsPlayed}
                  />
                  <CompetitionAndClubComponent
                    clubs={competitionAndClubs}
                    onClubsChange={setCompetitionAndClubs}
                  />
                  <CharacterAndLeadershipComponent
                    characterAndLeadership={characterAndLeadership}
                    onCharacterAndLeadershipChange={setCharacterAndLeadership}
                  />
                  <HealthAndReadinessComponent
                    healthAndReadiness={healthAndReadiness}
                    onHealthAndReadinessChange={setHealthAndReadiness}
                  />
                  <VideoAndMediaComponent
                    videoAndMedia={videoAndMedia}
                    onVideoAndMediaChange={setVideoAndMedia}
                  />
                </>
              )}
              {activeTab === 'activity' && (
                <div className="w-full bg-white rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Activity</h2>
                  <p className="text-gray-700">Activity content will be displayed here.</p>
                </div>
              )}
              {activeTab === 'mysave' && (
                <div className="w-full bg-white rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">My Save</h2>
                  <p className="text-gray-700">Saved content will be displayed here.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side - Sidebar (1/4 width) */}
        <div className="hidden lg:flex flex-1 flex-shrink-0">
          <RightSideBar />
        </div>
      </main>
    </div>
  );
}
