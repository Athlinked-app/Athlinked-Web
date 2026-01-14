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
import Favourites from '@/components/Profile/Favourites';
import { apiGet, apiPost, apiUpload } from '@/utils/api';
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
  city: string | null;
  primarySport: string | null;
  sportsPlayed: string | null;
  dob: string | null;
}

function ProfileContent() {
  const searchParams = useSearchParams();
  const viewUserId = searchParams.get('userId');

  // Protect this route - check authentication
  useEffect(() => {
    const { isAuthenticated } = require('@/utils/auth');
    if (!isAuthenticated() && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }, []);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [viewUser, setViewUser] = useState<CurrentUser | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'profile' | 'activity' | 'mysave' | 'favourites'
  >('profile');
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
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [followingCount, setFollowingCount] = useState<number>(0);
  const [connectionRequestStatus, setConnectionRequestStatus] = useState<{
    exists: boolean;
    status: string | null;
  } | null>(null);

  const targetUserId = viewUserId || currentUserId;
  const isViewingOwnProfile = !viewUserId || viewUserId === currentUserId;

  // Reset to profile tab if viewing someone else's profile and on a restricted tab
  useEffect(() => {
    if (
      !isViewingOwnProfile &&
      (activeTab === 'activity' ||
        activeTab === 'mysave' ||
        activeTab === 'favourites')
    ) {
      setActiveTab('profile');
    }
  }, [isViewingOwnProfile, activeTab]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const { apiGet } = await import('@/utils/api');
      const data = await apiGet<{
        success: boolean;
        posts?: PostData[];
        data?: PostData[];
      }>('/posts?page=1&limit=50');

      console.log('Posts API response:', data);

      if (data.success) {
        const posts = data.posts || data.data || [];
        let transformedPosts: PostData[] = posts.map((post: any) => ({
          id: post.id,
          username: post.username || 'User',
          user_profile_url:
            post.user_profile_url && post.user_profile_url.trim() !== ''
              ? post.user_profile_url
              : null,
          user_id: post.user_id,
          user_type: post.user_type || 'athlete',
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
    // Only fetch view user if viewing another user's profile (not your own)
    if (viewUserId && viewUserId !== currentUserId) {
      fetchViewUser();
    }
  }, [viewUserId, currentUserId]);

  useEffect(() => {
    if (targetUserId) {
      fetchPosts();
    }
  }, [targetUserId]);

  useEffect(() => {
    setUserBio('');

    if (targetUserId) {
      // Always fetch profile data first (it has the most complete data)
      fetchProfileData();
      fetchFollowCounts();
      // Only fetch view user if viewing another user's profile (not your own)
      if (viewUserId && viewUserId !== currentUserId) {
        fetchViewUser();
      }
    }
  }, [targetUserId, viewUserId, currentUserId]);

  useEffect(() => {
    if (currentUserId && viewUserId && currentUserId !== viewUserId) {
      checkConnectionRequestStatus();
    } else {
      setConnectionRequestStatus(null);
    }
  }, [currentUserId, viewUserId, followersCount]);

  const fetchViewUser = async () => {
    if (!viewUserId) return;

    try {
      const { apiGet } = await import('@/utils/api');
      const data = await apiGet<{
        success: boolean;
        users?: any[];
      }>('/signup/users?limit=1000');

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
          // Only update sports_played if:
          // 1. The user object has sports_played data
          // 2. We're viewing another user's profile (not our own)
          // 3. We don't already have sports data from profile API
          // This prevents overwriting correct profile data with incomplete data from /signup/users
          if (user.sports_played && viewUserId !== currentUserId) {
            setSportsPlayed(prevSports => {
              // If we already have sports data from profile API, don't overwrite it
              // The /signup/users endpoint doesn't reliably return sports_played
              if (prevSports && prevSports.trim() !== '') {
                return prevSports;
              }
              
              let sportsString = user.sports_played;
              if (typeof sportsString === 'string') {
                if (sportsString.startsWith('{') && sportsString.endsWith('}')) {
                  sportsString = sportsString.slice(1, -1).replace(/["']/g, '');
                }
                return sportsString;
              } else if (Array.isArray(sportsString)) {
                return sportsString.join(', ');
              }
              return '';
            });
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
      const { apiGet } = await import('@/utils/api');
      const data = await apiGet<{
        userId?: string;
        fullName?: string | null;
        profileImage?: string | null;
        coverImage?: string | null;
        bio?: string | null;
        education?: string | null;
        city?: string | null;
        primarySport?: string | null;
        sportsPlayed?: string | string[] | null;
        dob?: string | null;
      }>(`/profile/${targetUserId}`);

      console.log('Profile data fetched:', data);

      let processedSportsPlayed: string | null = null;
      if (data.sportsPlayed !== undefined && data.sportsPlayed !== null) {
        if (Array.isArray(data.sportsPlayed)) {
          processedSportsPlayed = data.sportsPlayed.join(', ');
        } else if (typeof data.sportsPlayed === 'string') {
          let sportsString = data.sportsPlayed;
          if (sportsString.startsWith('{') && sportsString.endsWith('}')) {
            sportsString = sportsString.slice(1, -1).replace(/["']/g, '');
          }
          processedSportsPlayed = sportsString;
        }
      }

      setProfileData({
        userId: data.userId || targetUserId || '',
        fullName: data.fullName ?? null,
        profileImage: data.profileImage ?? null,
        coverImage: data.coverImage ?? null,
        bio: data.bio ?? null,
        education: data.education ?? null,
        city: data.city ?? null,
        primarySport: data.primarySport ?? null,
        sportsPlayed: processedSportsPlayed,
        dob: data.dob ?? null,
      });
      setUserBio(data.bio || '');
      // Update sportsPlayed from profile data
      // Profile data is ALWAYS the authoritative source - it comes directly from the database
      // When profile data is fetched, it should always be used, even if it overwrites existing data
      // This ensures consistency after page refresh
      if (processedSportsPlayed !== null && processedSportsPlayed !== undefined) {
        // Always use profile data if it exists (even if empty string)
        // This ensures that after refresh, we show what's actually in the database
        if (processedSportsPlayed.trim() !== '') {
          setSportsPlayed(processedSportsPlayed);
        } else {
          // Profile data says no sports, so clear it
          setSportsPlayed('');
        }
      } else {
        // Profile data returned null/undefined for sports, which means no sports in database
        setSportsPlayed('');
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setProfileData(null);
      setUserBio('');
    }
  };

  const fetchFollowCounts = async () => {
    if (!targetUserId) return;

    try {
      console.log('Fetching follow counts for userId:', targetUserId);
      const { apiGet } = await import('@/utils/api');
      const data = await apiGet<{
        success: boolean;
        followers?: number;
        following?: number;
      }>(`/network/counts/${targetUserId}`);
      console.log('Follow counts fetched:', data);
      if (data.success) {
        setFollowersCount(data.followers || 0);
        setFollowingCount(data.following || 0);
      } else {
        setFollowersCount(0);
        setFollowingCount(0);
      }
    } catch (error) {
      console.error('Error fetching follow counts:', error);
      setFollowersCount(0);
      setFollowingCount(0);
    }
  };

  const checkConnectionRequestStatus = async () => {
    if (!currentUserId || !viewUserId || currentUserId === viewUserId) {
      setConnectionRequestStatus(null);
      return;
    }

    try {
      const { apiGet } = await import('@/utils/api');
      const data = await apiGet<{
        success: boolean;
        exists?: boolean;
        status?: string | null;
      }>(
        `/network/connection-status/${viewUserId}?requester_id=${currentUserId}`
      );
      if (data.success) {
        setConnectionRequestStatus({
          exists: data.exists || false,
          status: data.status || null,
        });
      }
    } catch (error) {
      console.error('Error checking connection request status:', error);
    }
  };

  useEffect(() => {
    if (currentUserId && viewUserId && currentUserId !== viewUserId) {
      checkConnectionRequestStatus();
    }
  }, [currentUserId, viewUserId, followersCount]);

  const handleSendConnectionRequest = async () => {
    if (!currentUserId || !viewUserId) {
      alert('Unable to send connection request');
      return;
    }

    try {
      const userIdentifier = localStorage.getItem('userEmail');
      if (!userIdentifier) {
        alert('User not logged in');
        return;
      }

      const { apiGet, apiPost } = await import('@/utils/api');
      let userDataResponse;
      if (userIdentifier.startsWith('username:')) {
        const username = userIdentifier.replace('username:', '');
        userDataResponse = await apiGet<{
          success: boolean;
          user?: { id: string };
        }>(`/signup/user-by-username/${encodeURIComponent(username)}`);
      } else {
        userDataResponse = await apiGet<{
          success: boolean;
          user?: { id: string };
        }>(`/signup/user/${encodeURIComponent(userIdentifier)}`);
      }

      if (!userDataResponse.success || !userDataResponse.user) {
        throw new Error('User not found');
      }

      const result = await apiPost<{
        success: boolean;
        message?: string;
      }>(`/network/connect/${viewUserId}`, {
        user_id: userDataResponse.user.id,
      });
      if (result.success) {
        setConnectionRequestStatus({ exists: true, status: 'pending' });
        alert('Connection request sent!');
      } else {
        alert(result.message || 'Failed to send connection request');
      }
    } catch (error) {
      console.error('Error sending connection request:', error);
      alert('Failed to send connection request. Please try again.');
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const userIdentifier = localStorage.getItem('userEmail');
      if (!userIdentifier) {
        return;
      }

      const { apiGet } = await import('@/utils/api');
      let data;
      if (userIdentifier.startsWith('username:')) {
        const username = userIdentifier.replace('username:', '');
        data = await apiGet<{
          success: boolean;
          user?: {
            id: string;
            full_name?: string;
            username?: string;
            profile_url?: string;
            user_type?: string;
          };
        }>(`/signup/user-by-username/${encodeURIComponent(username)}`);
      } else {
        data = await apiGet<{
          success: boolean;
          user?: {
            id: string;
            full_name?: string;
            username?: string;
            profile_url?: string;
            user_type?: string;
          };
        }>(`/signup/user/${encodeURIComponent(userIdentifier)}`);
      }
      if (data.success && data.user) {
        setCurrentUserId(data.user.id);
        setCurrentUser({
          id: data.user.id,
          full_name: data.user.full_name || data.user.username || 'User',
          profile_url: data.user.profile_url,
          username: data.user.username,
          user_type: data.user.user_type,
        });
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const _handlePostCreated = () => {
    fetchPosts();
  };

  const calculateAge = (dob: string | null | undefined): number | null => {
    if (!dob) return null;

    try {
      let birthDate: Date;

      if (dob.includes('-')) {
        birthDate = new Date(dob);
      } else if (dob.includes('/')) {
        const parts = dob.split('/');
        if (parts.length === 3) {
          const month = parseInt(parts[0], 10) - 1;
          const day = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          birthDate = new Date(year, month, day);
        } else {
          return null;
        }
      } else {
        birthDate = new Date(dob);
      }

      if (isNaN(birthDate.getTime())) {
        return null;
      }

      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      return age;
    } catch (error) {
      console.error('Error calculating age:', error);
      return null;
    }
  };

  const getProfileUrl = (profileUrl?: string | null): string | undefined => {
    if (!profileUrl || profileUrl.trim() === '') return undefined;
    if (profileUrl.startsWith('http')) return profileUrl;
    if (profileUrl.startsWith('/') && !profileUrl.startsWith('/assets')) {
      return `http://localhost:3001${profileUrl}`;
    }
    return profileUrl;
  };
  const _getInitials = (name?: string) => {
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
        <div className="  flex-[3] flex-shrink-0 border-r border-gray-200 overflow-hidden px-6 flex flex-col">
          <EditProfileModal
            key={`${viewUserId || currentUserId}-${profileData?.profileImage}-${profileData?.bio}-${profileData?.education}-${profileData?.city}`}
            open={true}
            asSidebar={true}
            onClose={() => setShowEditProfile(false)}
            currentUserId={currentUserId}
            viewedUserId={viewUserId || currentUserId}
            connectionRequestStatus={connectionRequestStatus}
            onSendConnectionRequest={handleSendConnectionRequest}
            userData={{
              full_name: viewUserId
                ? viewUser?.full_name || ''
                : currentUser?.full_name || '',
              username: viewUserId
                ? viewUser?.username || ''
                : currentUser?.username || '',
              profile_url: profileData?.profileImage
                ? profileData.profileImage.startsWith('http')
                  ? profileData.profileImage
                  : `http://localhost:3001${profileData.profileImage}`
                : viewUserId
                  ? viewUser?.profile_url || null
                  : currentUser?.profile_url || null,
              background_image_url: profileData?.coverImage
                ? profileData.coverImage.startsWith('http')
                  ? profileData.coverImage
                  : `http://localhost:3001${profileData.coverImage}`
                : null,
              user_type: viewUserId
                ? viewUser?.user_type || 'athlete'
                : currentUser?.user_type || 'athlete',
              location: profileData?.city || '',
              age: calculateAge(profileData?.dob) || undefined,
              followers_count: followersCount,
              sports_played: (() => {
                if (sportsPlayed) return sportsPlayed;
                if (
                  profileData?.sportsPlayed !== undefined &&
                  profileData?.sportsPlayed !== null
                ) {
                  const sports = profileData.sportsPlayed;
                  if (typeof sports === 'string') {
                    return sports.replace(/[{}"']/g, '');
                  }
                  if (Array.isArray(sports)) {
                    return (sports as string[]).join(', ');
                  }
                }
                return '';
              })(),
              primary_sport: profileData?.primarySport || '',
              profile_completion: 60,
              bio: userBio || profileData?.bio || '',
              education: profileData?.education || '',
              city: profileData?.city || '',
            }}
            profileSections={{
              bio: userBio || profileData?.bio || '',
              socialHandles: socialHandles,
              academicBackgrounds: academicBackgrounds,
              achievements: achievements,
              athleticAndPerformance: athleticAndPerformance,
              competitionAndClubs: competitionAndClubs,
              characterAndLeadership: characterAndLeadership,
              healthAndReadiness: healthAndReadiness,
              videoAndMedia: videoAndMedia,
            }}
            onSave={async (data: {
              profile_url?: File;
              background_image_url?: File;
              sports_played?: string;
              education?: string;
              city?: string;
              bio?: string;
            }) => {
              if (viewUserId && viewUserId !== currentUserId) {
                console.log("Cannot save another user's profile");
                return;
              }

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
                  city?: string;
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
                  city: data.city,
                  bioUndefined: data.bio === undefined,
                  educationUndefined: data.education === undefined,
                });

                if (data.bio !== undefined) {
                  profileData.bio = data.bio || undefined;
                }
                if (data.education !== undefined) {
                  profileData.education = data.education || undefined;
                }
                if (data.city !== undefined) {
                  profileData.city = data.city || undefined;
                }

                console.log('Profile data being sent to API:', profileData);
                if (data.sports_played !== undefined) {
                  profileData.sportsPlayed = data.sports_played || undefined;
                  if (data.sports_played) {
                    const sports = data.sports_played
                      .split(',')
                      .map(s => s.trim())
                      .filter(Boolean);
                    if (sports.length > 0) profileData.primarySport = sports[0];
                  }
                }
                if (data.profile_url instanceof File) {
                  const formData = new FormData();
                  formData.append('file', data.profile_url);
                  try {
                    const uploadData = await apiUpload<{
                      success: boolean;
                      fileUrl?: string;
                    }>('/profile/upload', formData);

                    if (uploadData.success && uploadData.fileUrl) {
                      profileData.profileImageUrl = uploadData.fileUrl;
                    }
                  } catch (error) {
                    console.error('Error uploading profile image:', error);
                  }
                } else if (typeof data.profile_url === 'string') {
                  profileData.profileImageUrl = data.profile_url;
                }

                if (data.background_image_url instanceof File) {
                  const formData = new FormData();
                  formData.append('file', data.background_image_url);
                  try {
                    const uploadData = await apiUpload<{
                      success: boolean;
                      fileUrl?: string;
                    }>('/profile/upload', formData);

                    if (uploadData.success && uploadData.fileUrl) {
                      profileData.coverImageUrl = uploadData.fileUrl;
                    }
                  } catch (error) {
                    console.error('Error uploading cover image:', error);
                  }
                } else if (typeof data.background_image_url === 'string') {
                  profileData.coverImageUrl = data.background_image_url;
                }

                const result = await apiPost<{
                  success: boolean;
                  message?: string;
                }>('/profile', profileData);

                if (!result.success) {
                  console.error('Failed to save profile:', result);
                  alert(
                    'Failed to save profile: ' +
                      (result.message || 'Unknown error')
                  );
                  return;
                }

                console.log('Profile saved successfully:', result);

                // Refresh profile data from server FIRST to get latest values from database
                // This ensures we have the most up-to-date data including sports_played
                if (targetUserId) {
                  await fetchProfileData();
                }

                // Also update local state immediately for better UX
                if (data.sports_played !== undefined) {
                  setSportsPlayed(data.sports_played || '');
                }

                if (data.bio !== undefined) {
                  setUserBio(data.bio || '');
                }

                if (
                  profileData.bio !== undefined ||
                  profileData.education !== undefined ||
                  profileData.city !== undefined ||
                  profileData.profileImageUrl !== undefined ||
                  profileData.coverImageUrl !== undefined
                ) {
                  setProfileData(prev => {
                    if (!prev) {
                      return {
                        userId: currentUserId,
                        fullName: null,
                        profileImage: profileData.profileImageUrl || null,
                        coverImage: profileData.coverImageUrl || null,
                        bio:
                          profileData.bio !== undefined
                            ? profileData.bio
                            : null,
                        education:
                          profileData.education !== undefined
                            ? profileData.education
                            : null,
                        city:
                          profileData.city !== undefined
                            ? profileData.city
                            : null,
                        primarySport: profileData.primarySport || null,
                        sportsPlayed: profileData.sportsPlayed || null,
                        dob: null,
                      };
                    }
                    return {
                      ...prev,
                      profileImage:
                        profileData.profileImageUrl !== undefined
                          ? profileData.profileImageUrl
                          : prev.profileImage,
                      coverImage:
                        profileData.coverImageUrl !== undefined
                          ? profileData.coverImageUrl
                          : prev.coverImage,
                      bio:
                        profileData.bio !== undefined
                          ? profileData.bio
                          : prev.bio,
                      education:
                        profileData.education !== undefined
                          ? profileData.education
                          : prev.education,
                      city:
                        profileData.city !== undefined
                          ? profileData.city
                          : prev.city,
                      primarySport: profileData.primarySport || prev.primarySport,
                      sportsPlayed: profileData.sportsPlayed || prev.sportsPlayed,
                    };
                  });
                }

                if (profileData.profileImageUrl !== undefined && currentUser) {
                  setCurrentUser(prev =>
                    prev
                      ? {
                          ...prev,
                          profile_url:
                            profileData.profileImageUrl || prev.profile_url,
                        }
                      : prev
                  );
                }

                await fetchCurrentUser();
                await fetchProfileData();
                if (viewUserId) {
                  await fetchViewUser();
                }
              } catch (error) {
                console.error('Error saving profile:', error);
                alert('Error saving profile. Please try again.');
              }
            }}
          />
          <div className="bg-white mt-2 rounded-lg flex flex-col flex-1 min-h-0">
            <div className="flex items-center border-b border-gray-200 flex-shrink-0">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 font-medium text-sm transition-colors relative ${
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
              {/* Show Activity, My Save, and Favourites tabs only when viewing own profile */}
              {isViewingOwnProfile && (
                <>
                  <div className="h-6 w-px bg-gray-200"></div>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`px-6 py-3 font-medium text-sm transition-colors relative ${
                      activeTab === 'activity'
                        ? 'text-[#CB9729]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Activity
                    {activeTab === 'activity' && (
                      <div className="absolute bottom-0 text-sm  left-0 right-0 h-0.5 bg-[#CB9729]"></div>
                    )}
                  </button>
                  <div className="h-6 w-px bg-gray-200"></div>
                  <button
                    onClick={() => setActiveTab('mysave')}
                    className={`px-6 py-3 font-medium text-sm  transition-colors relative ${
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
                  {/* Show Favourites tab only for coaches */}
                  {currentUser?.user_type === 'coach' && (
                    <>
                      <div className="h-6 w-px bg-gray-200"></div>
                      <button
                        onClick={() => setActiveTab('favourites')}
                        className={`px-6 py-3 font-medium text-xl transition-colors relative ${
                          activeTab === 'favourites'
                            ? 'text-[#CB9729]'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        Favourites
                        {activeTab === 'favourites' && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]"></div>
                        )}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>

            <div className="mt-4 space-y-4 overflow-y-auto flex-1 pb-8 px-1">
              {activeTab === 'profile' && (
                <>
                  <AboutMe bio={userBio || profileData?.bio || ''} />
                  <SocialHandles
                    handles={socialHandles}
                    onHandlesChange={setSocialHandles}
                    userId={targetUserId}
                  />
                  <AcademicBackgrounds
                    backgrounds={academicBackgrounds}
                    onBackgroundsChange={setAcademicBackgrounds}
                    userId={targetUserId}
                  />
                  <Achievements
                    achievements={achievements}
                    onAchievementsChange={setAchievements}
                    userId={targetUserId}
                  />
                  <AthleticAndPerformanceComponent
                    athleticAndPerformance={athleticAndPerformance}
                    onAthleticAndPerformanceChange={setAthleticAndPerformance}
                    sportsPlayed={sportsPlayed}
                    userId={targetUserId}
                  />
                  <CompetitionAndClubComponent
                    clubs={competitionAndClubs}
                    onClubsChange={setCompetitionAndClubs}
                    userId={targetUserId}
                  />
                  <CharacterAndLeadershipComponent
                    characterAndLeadership={characterAndLeadership}
                    onCharacterAndLeadershipChange={setCharacterAndLeadership}
                    userId={targetUserId}
                  />
                  <HealthAndReadinessComponent
                    healthAndReadiness={healthAndReadiness}
                    onHealthAndReadinessChange={setHealthAndReadiness}
                    userId={targetUserId}
                  />
                  <VideoAndMediaComponent
                    videoAndMedia={videoAndMedia}
                    onVideoAndMediaChange={setVideoAndMedia}
                    userId={targetUserId}
                  />
                </>
              )}
              {activeTab === 'activity' && (
                <div className="w-full bg-white rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Activity
                  </h2>

                  {/* Filter Buttons */}
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={() => setActiveFilter('posts')}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        activeFilter === 'posts'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Posts
                    </button>
                    <button
                      onClick={() => setActiveFilter('clips')}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        activeFilter === 'clips'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Clips
                    </button>
                    <button
                      onClick={() => setActiveFilter('article')}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        activeFilter === 'article'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Article
                    </button>
                    <button
                      onClick={() => setActiveFilter('event')}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        activeFilter === 'event'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Event
                    </button>
                  </div>

                  {/* Filtered Content */}
                  {activeFilter === 'posts' && (
                    <Posts
                      posts={posts}
                      currentUserId={currentUserId || undefined}
                      currentUserProfileUrl={getProfileUrl(
                        viewUserId
                          ? viewUser?.profile_url || null
                          : currentUser?.profile_url || null
                      )}
                      currentUsername={
                        viewUserId
                          ? viewUser?.full_name || 'User'
                          : currentUser?.full_name || 'User'
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
                        viewUserId
                          ? viewUser?.profile_url || null
                          : currentUser?.profile_url || null
                      )}
                      currentUsername={
                        viewUserId
                          ? viewUser?.full_name || 'User'
                          : currentUser?.full_name || 'User'
                      }
                      onClipDeleted={() => {
                        window.location.reload();
                      }}
                    />
                  )}
                  {activeFilter === 'article' && (
                    <Article
                      posts={posts}
                      currentUserId={currentUserId || undefined}
                      currentUserProfileUrl={getProfileUrl(
                        viewUserId
                          ? viewUser?.profile_url || null
                          : currentUser?.profile_url || null
                      )}
                      currentUsername={
                        viewUserId
                          ? viewUser?.full_name || 'User'
                          : currentUser?.full_name || 'User'
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
                        viewUserId
                          ? viewUser?.profile_url || null
                          : currentUser?.profile_url || null
                      )}
                      currentUsername={
                        viewUserId
                          ? viewUser?.full_name || 'User'
                          : currentUser?.full_name || 'User'
                      }
                      loading={loading}
                      onCommentCountUpdate={fetchPosts}
                      onPostDeleted={fetchPosts}
                    />
                  )}
                </div>
              )}
              {activeTab === 'mysave' && (
                <div className="w-full bg-white rounded-lg p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    My Save
                  </h2>

                  {/* Filter Buttons */}
                  <div className="flex gap-3 mb-6">
                    <button
                      onClick={() => setActiveSaveFilter('posts')}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        activeSaveFilter === 'posts'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Posts
                    </button>
                    <button
                      onClick={() => setActiveSaveFilter('clips')}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        activeSaveFilter === 'clips'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Clips
                    </button>
                    <button
                      onClick={() => setActiveSaveFilter('article')}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        activeSaveFilter === 'article'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Article
                    </button>
                    <button
                      onClick={() => setActiveSaveFilter('opportunities')}
                      className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                        activeSaveFilter === 'opportunities'
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
                        viewUserId
                          ? viewUser?.profile_url || null
                          : currentUser?.profile_url || null
                      )}
                      currentUsername={
                        viewUserId
                          ? viewUser?.full_name || 'User'
                          : currentUser?.full_name || 'User'
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
                        viewUserId
                          ? viewUser?.profile_url || null
                          : currentUser?.profile_url || null
                      )}
                      currentUsername={
                        viewUserId
                          ? viewUser?.full_name || 'User'
                          : currentUser?.full_name || 'User'
                      }
                      viewedUserId={viewUserId}
                      onClipDeleted={() => {
                        window.location.reload();
                      }}
                    />
                  )}
                  {activeSaveFilter === 'article' && (
                    <MySaveArticle
                      posts={posts}
                      currentUserId={currentUserId || undefined}
                      currentUserProfileUrl={getProfileUrl(
                        viewUserId
                          ? viewUser?.profile_url || null
                          : currentUser?.profile_url || null
                      )}
                      currentUsername={
                        viewUserId
                          ? viewUser?.full_name || 'User'
                          : currentUser?.full_name || 'User'
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
              {activeTab === 'favourites' && currentUserId && (
                <Favourites coachId={currentUserId} />
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
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-gray-600">Loading...</div>
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
