'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import RightSideBar from '@/components/RightSideBar';
import { type PostData } from '@/components/Post';
import EditProfileModal from '@/components/Profile/EditProfileModel';
import AboutMe from '@/components/Profile/AboutMe';
import SocialHandles, {
  type SocialHandle,
} from '@/components/Profile/SocialHandle';
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
import Posts from '@/components/Activity/Posts';
import Clips from '@/components/Activity/Clips';
import Article from '@/components/Activity/Article';
import Event from '@/components/Activity/Event';
import MySavePost from '@/components/MySave/Post';
import MySaveClips from '@/components/MySave/Clips';
import MySaveArticle from '@/components/MySave/Article';
import MySaveOpportunity from '@/components/MySave/Opportunity';
import Favorite from '@/components/Favorite';
interface CurrentUser {
  id: string;
  full_name: string;
  profile_url?: string;
  username?: string;
  user_type?: string;
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

function ProfileContent() {
  const searchParams = useSearchParams();
  const viewUserId = searchParams.get('userId');

  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [viewUser, setViewUser] = useState<CurrentUser | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'activity' | 'mysave' | 'favourite'>(
    'profile'
  );
  const [activeFilter, setActiveFilter] = useState<
    'posts' | 'clips' | 'article' | 'event'
  >('posts');
  const [activeSaveFilter, setActiveSaveFilter] = useState<
    'posts' | 'clips' | 'article' | 'opportunities'
  >('posts');
  const [userBio, setUserBio] = useState<string>('');
  const [socialHandles, setSocialHandles] = useState<SocialHandle[]>([]);
  const [academicBackgrounds, setAcademicBackgrounds] = useState<
    AcademicBackground[]
  >([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [athleticAndPerformance, setAthleticAndPerformance] = useState<
    AthleticAndPerformance[]
  >([]);
  const [competitionAndClubs, setCompetitionAndClubs] = useState<
    CompetitionAndClub[]
  >([]);
  const [sportsPlayed, setSportsPlayed] = useState<string>('');
  const [characterAndLeadership, setCharacterAndLeadership] = useState<
    CharacterAndLeadership[]
  >([]);
  const [healthAndReadiness, setHealthAndReadiness] = useState<
    HealthAndReadiness[]
  >([]);
  const [videoAndMedia, setVideoAndMedia] = useState<VideoAndMedia[]>([]);
  const [favouritedUsers, setFavouritedUsers] = useState<CurrentUser[]>([]);
  const [loadingFavourites, setLoadingFavourites] = useState(false);
  const targetUserId = viewUserId || currentUserId;

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        'http://localhost:3001/api/posts?page=1&limit=50'
      );

      if (!response.ok) {
        console.error(
          'Failed to fetch posts:',
          response.status,
          response.statusText
        );
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
        let transformedPosts: PostData[] = data.posts.map((post: any) => ({
          id: post.id,
          username: post.username || 'User',
          user_profile_url:
            post.user_profile_url && post.user_profile_url.trim() !== ''
              ? post.user_profile_url
              : null,
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
        if (targetUserId && viewUserId) {
          transformedPosts = transformedPosts.filter(
            post => post.user_id === targetUserId
          );
        }

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
    fetchCurrentUser();
    if (viewUserId) {
      fetchViewUser();
    }
  }, [viewUserId]);

  useEffect(() => {
    if (targetUserId) {
      fetchPosts();
    }
  }, [targetUserId]);

  useEffect(() => {
    if (targetUserId) {
      fetchProfileData();
      if (viewUserId) {
        fetchViewUser();
      }
    }
  }, [targetUserId, viewUserId]);

  useEffect(() => {
    const isOwnProfile = !viewUserId || (currentUserId && viewUserId === currentUserId);
    if (!isOwnProfile && (activeTab === 'mysave' || activeTab === 'favourite')) {
      setActiveTab('profile');
    }
  }, [viewUserId, currentUserId, activeTab]);
  const fetchViewUser = async () => {
    if (!viewUserId) return;

    try {
      const response = await fetch(
        `http://localhost:3001/api/signup/users?limit=1000`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.users) {
          const user = data.users.find((u: any) => u.id === viewUserId);
          if (user) {
            setViewUser({
              id: user.id,
              full_name: user.full_name || user.username || 'User',
              profile_url: user.profile_url,
              username: user.username,
              user_type: user.user_type,
            });
            if (user.bio) {
              setUserBio(user.bio);
            }
            if (user.sports_played) {
              setSportsPlayed(user.sports_played);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching view user:', error);
    }
  };

  const fetchProfileData = async () => {
    if (!targetUserId) return;

    try {
      console.log('Fetching profile data for userId:', targetUserId);
      const response = await fetch(
        `http://localhost:3001/api/profile/${targetUserId}`
      );
      if (response.ok) {
        const data = await response.json();
        console.log('Profile data fetched:', data);
        setProfileData(data);
        if (data.bio) {
          setUserBio(data.bio);
        }
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
      if (typeof window === 'undefined') {
        return;
      }

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
          user_type: data.user.user_type,
        });
        if (data.user.bio) {
          setUserBio(data.user.bio);
        }
        if (
          data.user.sports_played !== undefined &&
          data.user.sports_played !== null
        ) {
          let sportsString = data.user.sports_played;
          if (
            typeof sportsString === 'string' &&
            sportsString.startsWith('{') &&
            sportsString.endsWith('}')
          ) {
            sportsString = sportsString.slice(1, -1).replace(/["']/g, '');
          }
          setSportsPlayed(sportsString);
        } else {
          setSportsPlayed('');
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const handlePostCreated = () => {
    fetchPosts();
  };

  const fetchFavouritedUsers = async () => {
    const userIdToFetch = targetUserId || currentUserId;

    if (!userIdToFetch) return;

    try {
      setLoadingFavourites(true);
      const response = await fetch(
        `http://localhost:3001/api/favourites/${userIdToFetch}`
      );

      let favouritedUserIds: string[] = [];

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.favourites) {
          favouritedUserIds = data.favourites.map((f: any) => f.favourite_user_id || f.user_id);
        }
      } else if (response.status === 404) {
        const storageKey = `favourites_${userIdToFetch}`;
        favouritedUserIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
      }

      if (favouritedUserIds.length > 0) {
        const usersResponse = await fetch(
          `http://localhost:3001/api/signup/users?limit=1000`
        );

        if (usersResponse.ok) {
          const usersData = await usersResponse.json();
          if (usersData.success && usersData.users) {
            const favouritedUsersList = usersData.users
              .filter((u: any) => favouritedUserIds.includes(u.id))
              .map((u: any) => ({
                id: u.id,
                full_name: u.full_name || u.username || 'User',
                profile_url: u.profile_url,
                username: u.username,
                user_type: u.user_type,
              }));
            setFavouritedUsers(favouritedUsersList);
          }
        }
      } else {
        setFavouritedUsers([]);
      }
    } catch (error) {
      console.error('Error fetching favourited users:', error);
      try {
        const storageKey = `favourites_${userIdToFetch}`;
        const favouritedUserIds = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (favouritedUserIds.length > 0) {
          const usersResponse = await fetch(
            `http://localhost:3001/api/signup/users?limit=1000`
          );
          if (usersResponse.ok) {
            const usersData = await usersResponse.json();
            if (usersData.success && usersData.users) {
              const favouritedUsersList = usersData.users
                .filter((u: any) => favouritedUserIds.includes(u.id))
                .map((u: any) => ({
                  id: u.id,
                  full_name: u.full_name || u.username || 'User',
                  profile_url: u.profile_url,
                  username: u.username,
                  user_type: u.user_type,
                }));
              setFavouritedUsers(favouritedUsersList);
            }
          }
        } else {
          setFavouritedUsers([]);
        }
      } catch (e) {
        setFavouritedUsers([]);
      }
    } finally {
      setLoadingFavourites(false);
    }
  };

  useEffect(() => {
    const isOwnProfile = !viewUserId || (currentUserId && viewUserId === currentUserId);
    if (activeTab === 'favourite' && isOwnProfile && currentUserId) {
      fetchFavouritedUsers();
    } else if (activeTab === 'favourite' && !isOwnProfile) {
      setActiveTab('profile');
    }
  }, [activeTab, targetUserId, currentUserId, viewUserId]);
  const getProfileUrl = (profileUrl?: string | null): string | undefined => {
    if (!profileUrl || profileUrl.trim() === '') return undefined;
    if (profileUrl.startsWith('http')) return profileUrl;
    if (profileUrl.startsWith('/') && !profileUrl.startsWith('/assets')) {
      return `http://localhost:3001${profileUrl}`;
    }
    return profileUrl;
  };
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
        userProfileUrl={getProfileUrl(
          currentUser?.profile_url
        )}
      />

      <main className="flex flex-1 w-full mt-5 overflow-hidden">
        <div className="hidden lg:block flex-[3] flex-shrink-0 border-r border-gray-200 overflow-hidden px-6 flex flex-col">
          <EditProfileModal
            open={true}
            asSidebar={true}
            onClose={() => setShowEditProfile(false)}
            currentUserId={currentUserId ?? null}
            viewedUserId={viewUserId ?? currentUserId ?? null}
            onFavouriteChange={() => {
              if (activeTab === 'favourite') {
                fetchFavouritedUsers();
              }
            }}
            userData={{
              full_name: viewUser?.full_name || currentUser?.full_name,
              username: viewUser?.username || currentUser?.username,
              profile_url: profileData?.profileImage
                ? profileData.profileImage.startsWith('http')
                  ? profileData.profileImage
                  : `http://localhost:3001${profileData.profileImage}`
                : viewUser?.profile_url || currentUser?.profile_url,
              background_image_url: profileData?.coverImage
                ? profileData.coverImage.startsWith('http')
                  ? profileData.coverImage
                  : `http://localhost:3001${profileData.coverImage}`
                : null,
              user_type:
                viewUser?.user_type || currentUser?.user_type || 'athlete',
              location: 'Rochester, NY',
              age: 35,
              followers_count: 10000,
              sports_played:
                profileData?.sportsPlayed !== undefined &&
                  profileData?.sportsPlayed !== null
                  ? typeof profileData.sportsPlayed === 'string'
                    ? profileData.sportsPlayed.replace(/[{}"']/g, '')
                    : ''
                  : '',
              primary_sport: profileData?.primarySport || '',
              profile_completion: 60,
              bio: profileData?.bio || '',
              education: profileData?.education || '',
            }}
            onSave={async data => {
              console.log('Profile saved:', data);

              try {
                if (!currentUserId) {
                  console.error('No user ID available');
                  return;
                }
                const profileData: {
                  userId: string;
                  bio?: string;
                  education?: string;
                  primarySport?: string;
                  sportsPlayed?: string;
                  profileImageUrl?: string;
                  coverImageUrl?: string;
                } = {
                  userId: currentUserId,
                };
                console.log('Received data from EditProfilePopup:', {
                  bio: data.bio,
                  education: data.education,
                  bioUndefined: data.bio === undefined,
                  educationUndefined: data.education === undefined,
                });

                if (data.bio !== undefined) {
                  profileData.bio = data.bio || undefined;
                }
                if (data.education !== undefined) {
                  profileData.education = data.education || undefined;
                }

                console.log('Profile data being sent to API:', profileData);
                if (data.sports_played) {
                  const sports = data.sports_played
                    .split(',')
                    .map(s => s.trim())
                    .filter(Boolean);
                  if (sports.length > 0) profileData.primarySport = sports[0];
                }
                if (data.profile_url instanceof File) {
                  const formData = new FormData();
                  formData.append('file', data.profile_url);
                  const uploadResponse = await fetch(
                    'http://localhost:3001/api/profile/upload',
                    {
                      method: 'POST',
                      body: formData,
                    }
                  );

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
                  const uploadResponse = await fetch(
                    'http://localhost:3001/api/profile/upload',
                    {
                      method: 'POST',
                      body: formData,
                    }
                  );

                  if (uploadResponse.ok) {
                    const uploadData = await uploadResponse.json();
                    if (uploadData.success && uploadData.fileUrl) {
                      profileData.coverImageUrl = uploadData.fileUrl;
                    }
                  }
                } else if (typeof data.background_image_url === 'string') {
                  profileData.coverImageUrl = data.background_image_url;
                }
                const response = await fetch(
                  'http://localhost:3001/api/profile',
                  {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(profileData),
                  }
                );

                if (!response.ok) {
                  const errorData = await response.json();
                  console.error('Failed to save profile:', errorData);
                  alert(
                    'Failed to save profile: ' +
                    (errorData.message || 'Unknown error')
                  );
                  return;
                }

                const result = await response.json();
                console.log('Profile saved successfully:', result);
                if (data.bio !== undefined) {
                  setUserBio(data.bio || '');
                }
                if (
                  profileData.bio !== undefined ||
                  profileData.education !== undefined
                ) {
                  setProfileData(prev => {
                    if (!prev) {
                      return {
                        userId: currentUserId,
                        fullName: null,
                        profileImage: null,
                        coverImage: null,
                        bio:
                          profileData.bio !== undefined
                            ? profileData.bio
                            : null,
                        education:
                          profileData.education !== undefined
                            ? profileData.education
                            : null,
                        primarySport: null,
                        sportsPlayed: null,
                      };
                    }
                    return {
                      ...prev,
                      bio:
                        profileData.bio !== undefined
                          ? profileData.bio
                          : prev.bio,
                      education:
                        profileData.education !== undefined
                          ? profileData.education
                          : prev.education,
                    };
                  });
                }

                fetchCurrentUser();
                fetchProfileData();
              } catch (error) {
                console.error('Error saving profile:', error);
                alert('Error saving profile. Please try again.');
              }
            }}
          />
          <div className="bg-white mt-4 rounded-lg flex flex-col flex-1 min-h-0">
            <div className="flex items-center border-b border-gray-200 flex-shrink-0">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 font-medium text-xl transition-colors relative ${activeTab === 'profile'
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
                className={`px-6 py-3 font-medium text-xl transition-colors relative ${activeTab === 'activity'
                    ? 'text-[#CB9729]'
                    : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Activity
                {activeTab === 'activity' && (
                  <div className="absolute bottom-0 text-xl  left-0 right-0 h-0.5 bg-[#CB9729]"></div>
                )}
              </button>
              {/* Only show My Save and Favourite tabs for current user's own profile */}
              {(!viewUserId || (currentUserId && viewUserId === currentUserId)) && (
                <>
                  <div className="h-6 w-px bg-gray-200"></div>
                  <button
                    onClick={() => setActiveTab('mysave')}
                    className={`px-6 py-3 font-medium text-xl  transition-colors relative ${activeTab === 'mysave'
                        ? 'text-[#CB9729]'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    My Save
                    {activeTab === 'mysave' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]"></div>
                    )}
                  </button>
                  <div className="h-6 w-px bg-gray-200"></div>
                  <button
                    onClick={() => setActiveTab('favourite')}
                    className={`px-6 py-3 font-medium text-xl transition-colors relative ${activeTab === 'favourite'
                        ? 'text-[#CB9729]'
                        : 'text-gray-500 hover:text-gray-700'
                      }`}
                  >
                    Favourite
                    {activeTab === 'favourite' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]"></div>
                    )}
                  </button>
                </>
              )}
            </div>

            <div className="mt-4 space-y-4 overflow-y-auto flex-1 pb-4 px-1 max-h-[400px] lg:max-h-[450px] ">
              {activeTab === 'profile' && (
                <>
                  <AboutMe bio={userBio || profileData?.bio || ''} />
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
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Activity
                  </h2>
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={() => setActiveFilter('posts')}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeFilter === 'posts'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      Posts
                    </button>
                    <button
                      onClick={() => setActiveFilter('clips')}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeFilter === 'clips'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      Clips
                    </button>
                    <button
                      onClick={() => setActiveFilter('article')}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeFilter === 'article'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      Article
                    </button>
                    <button
                      onClick={() => setActiveFilter('event')}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeFilter === 'event'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      Event
                    </button>
                  </div>
                  {activeFilter === 'posts' && (
                    <Posts
                      posts={posts}
                      currentUserId={currentUserId || undefined}
                      currentUserProfileUrl={getProfileUrl(
                        viewUser?.profile_url || currentUser?.profile_url
                      )}
                      currentUsername={
                        viewUser?.full_name || currentUser?.full_name || 'User'
                      }
                      loading={loading}
                      onCommentCountUpdate={fetchPosts}
                      onPostDeleted={fetchPosts}
                    />
                  )}
                  {activeFilter === 'clips' && (
                    <Clips
                      currentUserId={targetUserId || undefined}
                      currentUserProfileUrl={getProfileUrl(
                        viewUser?.profile_url || currentUser?.profile_url
                      )}
                      currentUsername={
                        viewUser?.full_name || currentUser?.full_name || 'User'
                      }
                      onClipDeleted={() => {
                        if (typeof window !== 'undefined') {
                          window.location.reload();
                        }
                      }}
                    />
                  )}
                  {activeFilter === 'article' && (
                    <Article
                      posts={posts}
                      currentUserId={currentUserId || undefined}
                      currentUserProfileUrl={getProfileUrl(
                        viewUser?.profile_url || currentUser?.profile_url
                      )}
                      currentUsername={
                        viewUser?.full_name || currentUser?.full_name || 'User'
                      }
                      loading={loading}
                      onCommentCountUpdate={fetchPosts}
                      onPostDeleted={fetchPosts}
                    />
                  )}
                  {activeFilter === 'event' && (
                    <Event
                      posts={posts}
                      currentUserId={currentUserId || undefined}
                      currentUserProfileUrl={getProfileUrl(
                        viewUser?.profile_url || currentUser?.profile_url
                      )}
                      currentUsername={
                        viewUser?.full_name || currentUser?.full_name || 'User'
                      }
                      loading={loading}
                      onCommentCountUpdate={fetchPosts}
                      onPostDeleted={fetchPosts}
                    />
                  )}
                </div>
              )}

              {activeTab === 'mysave' && (!viewUserId || (currentUserId && viewUserId === currentUserId)) && (
                <div className="w-full bg-white rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    My Save
                  </h2>
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={() => setActiveSaveFilter('posts')}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeSaveFilter === 'posts'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      Posts
                    </button>
                    <button
                      onClick={() => setActiveSaveFilter('clips')}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeSaveFilter === 'clips'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      Clips
                    </button>
                    <button
                      onClick={() => setActiveSaveFilter('article')}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeSaveFilter === 'article'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      Article
                    </button>
                    <button
                      onClick={() => setActiveSaveFilter('opportunities')}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${activeSaveFilter === 'opportunities'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      Opportunities
                    </button>
                  </div>
                  {activeSaveFilter === 'posts' && (
                    <MySavePost
                      posts={posts}
                      currentUserId={currentUserId || undefined}
                      currentUserProfileUrl={getProfileUrl(
                        viewUser?.profile_url || currentUser?.profile_url
                      )}
                      currentUsername={
                        viewUser?.full_name || currentUser?.full_name || 'User'
                      }
                      viewedUserId={viewUserId}
                      loading={loading}
                      onCommentCountUpdate={fetchPosts}
                      onPostDeleted={fetchPosts}
                    />
                  )}
                  {activeSaveFilter === 'clips' && (
                    <MySaveClips
                      currentUserId={currentUserId || undefined}
                      currentUserProfileUrl={getProfileUrl(
                        viewUser?.profile_url || currentUser?.profile_url
                      )}
                      currentUsername={
                        viewUser?.full_name || currentUser?.full_name || 'User'
                      }
                      viewedUserId={viewUserId}
                      onClipDeleted={() => {
                        if (typeof window !== 'undefined') {
                          window.location.reload();
                        }
                      }}
                    />
                  )}
                  {activeSaveFilter === 'article' && (
                    <MySaveArticle
                      posts={posts}
                      currentUserId={currentUserId || undefined}
                      currentUserProfileUrl={getProfileUrl(
                        viewUser?.profile_url || currentUser?.profile_url
                      )}
                      currentUsername={
                        viewUser?.full_name || currentUser?.full_name || 'User'
                      }
                      viewedUserId={viewUserId}
                      loading={loading}
                      onCommentCountUpdate={fetchPosts}
                      onPostDeleted={fetchPosts}
                    />
                  )}
                  {activeSaveFilter === 'opportunities' && (
                    <MySaveOpportunity
                      currentUserId={currentUserId || undefined}
                      currentUserProfileUrl={getProfileUrl(
                        viewUser?.profile_url || currentUser?.profile_url
                      )}
                      currentUsername={
                        viewUser?.full_name || currentUser?.full_name || 'User'
                      }
                      viewedUserId={viewUserId}
                      loading={loading}
                      onCommentCountUpdate={fetchPosts}
                      onPostDeleted={fetchPosts}
                    />
                  )}
                </div>
              )}
              {activeTab === 'favourite' && (!viewUserId || (currentUserId && viewUserId === currentUserId)) && (
                <Favorite
                  favouritedUsers={favouritedUsers}
                  loadingFavourites={loadingFavourites}
                  getProfileUrl={getProfileUrl}
                  getInitials={getInitials}
                />
              )}
            </div>
          </div>
        </div>
        <div className="hidden lg:flex flex-1 flex-shrink-0">
          <RightSideBar />
        </div>
      </main>
    </div>
  );
}
export default function Profile() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#D4D4D4]">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
