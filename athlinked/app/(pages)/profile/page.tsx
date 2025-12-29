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

export default function Profile() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
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
              profile_url: currentUser?.profile_url,
              user_type: 'coach',
              location: 'Rochester, NY', // You can fetch this from user data
              age: 35, // You can fetch this from user data
              followers_count: 10000,
              sports_played: 'Basketball, Football',
              primary_sport: 'Basketball',
              profile_completion: 60,
            }}
            onSave={(data) => {
              console.log('Profile saved:', data);
              if (data.bio) {
                setUserBio(data.bio);
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
