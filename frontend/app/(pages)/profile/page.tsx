'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
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
import AthleticData from '@/components/Profile/AthleticData';
import StatsTab from '@/components/Profile/StatsTab';
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
import { getResourceUrl } from '@/utils/config';

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
    'profile' | 'stats' | 'activity' | 'mysave' | 'favourites'
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
  const [openAthleticPopup, setOpenAthleticPopup] = useState(false);

  const targetUserId = viewUserId || currentUserId;
  const isViewingOwnProfile = !viewUserId || viewUserId === currentUserId;

  // Determine the user type for the profile being viewed
  const profileUserType = viewUserId
    ? viewUser?.user_type || 'athlete'
    : currentUser?.user_type || 'athlete';
  const isAthlete = profileUserType === 'athlete';

  // Track previous targetUserId to prevent unnecessary state clears
  const prevTargetUserIdRef = useRef<string | null>(null);

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

  // Ensure "stats" tab is only usable on other user's athlete profile
  useEffect(() => {
    const canViewStats = !isViewingOwnProfile && isAthlete;
    if (!canViewStats && activeTab === 'stats') {
      setActiveTab('profile');
    }
  }, [isViewingOwnProfile, isAthlete, activeTab]);

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
  }, [viewUserId, currentUserId]);

  useEffect(() => {
    if (!targetUserId) return;

    const prevTargetUserId = prevTargetUserIdRef.current;
    const targetUserIdChanged = prevTargetUserId !== targetUserId;

    if (targetUserIdChanged) {
      console.log(
        'Profile page: targetUserId changed from',
        prevTargetUserId,
        'to',
        targetUserId
      );
      console.log('Profile page: Clearing state and fetching fresh data');
      setUserBio('');
      setSportsPlayed('');
      prevTargetUserIdRef.current = targetUserId;
    } else {
      console.log(
        'Profile page: targetUserId unchanged, skipping state clear:',
        targetUserId
      );
    }

    fetchProfileComplete();
  }, [targetUserId]);

  const fetchProfileCompleteFallback = async (
    userId: string,
    viewUid: string | null,
    currentUid: string | null
  ) => {
    const { apiGet } = await import('@/utils/api');
    const base = { success: true };

    const [profileRes, countsRes, connectionRes, ...sectionRes] =
      await Promise.all([
        apiGet<{
          userId?: string;
          fullName?: string | null;
          profileImage?: string | null;
          coverImage?: string | null;
          bio?: string | null;
          education?: string | null;
          city?: string | null;
          primarySport?: string | null;
          sportsPlayed?: string | null;
          dob?: string | null;
          userType?: string;
        }>(`/profile/${userId}`).catch(() => null),
        apiGet<{ success?: boolean; followers?: number; following?: number }>(
          `/network/counts/${userId}`
        ).catch(() => ({ success: false, followers: 0, following: 0 })),
        viewUid && currentUid && viewUid !== currentUid
          ? apiGet<{ success?: boolean; exists?: boolean; status?: string }>(
              `/network/connection-status/${viewUid}?requester_id=${currentUid}`
            ).catch(() => null)
          : Promise.resolve(null),
        apiGet<{ success?: boolean; data?: any[] }>(
          `/profile/${userId}/social-handles`
        ).catch(() => ({ success: false, data: [] })),
        apiGet<{ success?: boolean; data?: any[] }>(
          `/profile/${userId}/academic-backgrounds`
        ).catch(() => ({ success: false, data: [] })),
        apiGet<{ success?: boolean; data?: any[] }>(
          `/profile/${userId}/achievements`
        ).catch(() => ({ success: false, data: [] })),
        apiGet<{ success?: boolean; data?: any[] }>(
          `/profile/${userId}/athletic-performance`
        ).catch(() => ({ success: false, data: [] })),
        apiGet<{ success?: boolean; data?: any[] }>(
          `/profile/${userId}/competition-clubs`
        ).catch(() => ({ success: false, data: [] })),
        apiGet<{ success?: boolean; data?: any[] }>(
          `/profile/${userId}/character-leadership`
        ).catch(() => ({ success: false, data: [] })),
        apiGet<{ success?: boolean; data?: any[] }>(
          `/profile/${userId}/health-readiness`
        ).catch(() => ({ success: false, data: [] })),
        apiGet<{ success?: boolean; data?: any[] }>(
          `/profile/${userId}/video-media`
        ).catch(() => ({ success: false, data: [] })),
      ]);

    const [
      socialHandlesRes,
      academicRes,
      achievementsRes,
      athleticRes,
      clubsRes,
      charRes,
      healthRes,
      videoRes,
    ] = sectionRes;

    let sportsPlayed: string | null = null;
    if (
      profileRes?.sportsPlayed != null &&
      typeof profileRes.sportsPlayed === 'string'
    ) {
      sportsPlayed = profileRes.sportsPlayed;
    } else if (Array.isArray(profileRes?.sportsPlayed)) {
      sportsPlayed = (profileRes.sportsPlayed as string[])
        .filter(Boolean)
        .join(', ');
    }

    const postsRes = await apiGet<{
      success?: boolean;
      posts?: any[];
      data?: any[];
    }>('/posts?page=1&limit=50').catch(() => ({ success: false, posts: [] }));
    const allPosts =
      (postsRes &&
        ('posts' in postsRes ? postsRes.posts : (postsRes as any).data)) ||
      [];
    const posts = allPosts.filter((p: any) => p?.user_id === userId);

    return {
      ...base,
      profile: profileRes
        ? {
            userId: profileRes.userId || userId,
            fullName: profileRes.fullName ?? null,
            profileImage: profileRes.profileImage ?? null,
            coverImage: profileRes.coverImage ?? null,
            bio: profileRes.bio ?? null,
            education: profileRes.education ?? null,
            city: profileRes.city ?? null,
            primarySport: profileRes.primarySport ?? null,
            sportsPlayed,
            dob: profileRes.dob ?? null,
            userType: profileRes.userType ?? undefined,
            username: undefined,
          }
        : undefined,
      followCounts:
        countsRes && (countsRes.success !== false || 'followers' in countsRes)
          ? {
              followers: countsRes.followers ?? 0,
              following: countsRes.following ?? 0,
            }
          : undefined,
      connectionStatus:
        connectionRes && connectionRes.success
          ? {
              exists: connectionRes.exists ?? false,
              status: connectionRes.status ?? null,
            }
          : undefined,
      socialHandles:
        (socialHandlesRes as any)?.data ??
        (socialHandlesRes as any)?.socialHandles ??
        [],
      academicBackgrounds: (academicRes as any)?.data ?? [],
      achievements: (achievementsRes as any)?.data ?? [],
      athleticPerformance: (athleticRes as any)?.data ?? [],
      competitionClubs: (clubsRes as any)?.data ?? [],
      characterLeadership: (charRes as any)?.data ?? [],
      healthReadiness: (healthRes as any)?.data ?? [],
      videoMedia: (videoRes as any)?.data ?? [],
      posts,
    };
  };

  const fetchProfileComplete = async () => {
    if (!targetUserId) {
      console.log('fetchProfileComplete: No targetUserId, skipping fetch');
      return;
    }

    const currentTargetId = targetUserId;
    console.log(
      'fetchProfileComplete: Starting fetch for userId:',
      currentTargetId
    );

    try {
      setLoading(true);
      const { apiGet } = await import('@/utils/api');

      let data: {
        success?: boolean;
        profile?: {
          userId?: string;
          fullName?: string | null;
          profileImage?: string | null;
          coverImage?: string | null;
          bio?: string | null;
          education?: string | null;
          city?: string | null;
          primarySport?: string | null;
          sportsPlayed?: string | null;
          dob?: string | null;
          userType?: string;
          username?: string;
          email?: string;
        };
        followCounts?: { followers: number; following: number };
        connectionStatus?: { exists: boolean; status: string | null } | null;
        socialHandles?: SocialHandle[];
        academicBackgrounds?: AcademicBackground[];
        achievements?: Achievement[];
        athleticPerformance?: AthleticAndPerformance[];
        competitionClubs?: CompetitionAndClub[];
        characterLeadership?: CharacterAndLeadership[];
        healthReadiness?: HealthAndReadiness[];
        videoMedia?: VideoAndMedia[];
        posts?: any[];
      } | null = null;

      try {
        data = await apiGet<typeof data>(
          `/profile/${currentTargetId}/complete`
        );
      } catch (completeErr: any) {
        if (completeErr?.status === 404) {
          console.warn(
            'Profile /complete not found, using fallback with separate API calls'
          );
          data = await fetchProfileCompleteFallback(
            currentTargetId,
            viewUserId || null,
            currentUserId
          );
        } else {
          throw completeErr;
        }
      }

      if (currentTargetId !== targetUserId) {
        console.log(
          'fetchProfileComplete: targetUserId changed during fetch, ignoring response'
        );
        return;
      }

      if (!data || (typeof data.success === 'boolean' && !data.success)) {
        console.error(
          'Profile complete API returned unsuccessful response:',
          data
        );
        return;
      }

      console.log('Profile complete data fetched:', data);

      if (data.profile) {
        setProfileData({
          userId: data.profile.userId || targetUserId || '',
          fullName: data.profile.fullName ?? null,
          profileImage: data.profile.profileImage ?? null,
          coverImage: data.profile.coverImage ?? null,
          bio: data.profile.bio ?? null,
          education: data.profile.education ?? null,
          city: data.profile.city ?? null,
          primarySport: data.profile.primarySport ?? null,
          sportsPlayed: data.profile.sportsPlayed ?? null,
          dob: data.profile.dob ?? null,
        });
        setUserBio(data.profile.bio || '');

        if (data.profile.sportsPlayed) {
          setSportsPlayed(data.profile.sportsPlayed);
        } else {
          setSportsPlayed('');
        }

        if (viewUserId && viewUserId !== currentUserId) {
          setViewUser({
            id: data.profile.userId || viewUserId,
            full_name: data.profile.fullName || 'User',
            profile_url: data.profile.profileImage || undefined,
            username: data.profile.username,
            user_type: data.profile.userType || 'athlete',
          });
        }
      }

      if (data.followCounts) {
        setFollowersCount(data.followCounts.followers || 0);
        setFollowingCount(data.followCounts.following || 0);
      }

      if (data.connectionStatus) {
        setConnectionRequestStatus(data.connectionStatus);
      } else {
        setConnectionRequestStatus(null);
      }

      if (data.socialHandles) setSocialHandles(data.socialHandles);
      if (data.academicBackgrounds)
        setAcademicBackgrounds(data.academicBackgrounds);
      if (data.achievements) setAchievements(data.achievements);
      if (data.athleticPerformance)
        setAthleticAndPerformance(data.athleticPerformance);
      if (data.competitionClubs) setCompetitionAndClubs(data.competitionClubs);
      if (data.characterLeadership)
        setCharacterAndLeadership(data.characterLeadership);
      if (data.healthReadiness) setHealthAndReadiness(data.healthReadiness);
      if (data.videoMedia) setVideoAndMedia(data.videoMedia);

      if (data.posts) {
        const transformedPosts: PostData[] = data.posts.map((post: any) => ({
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
        setPosts(transformedPosts);
      }
    } catch (error) {
      console.error('Error fetching profile complete:', error);
      if (currentTargetId === targetUserId) {
        setProfileData(null);
        setUserBio('');
        setSportsPlayed('');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileData = async () => {
    if (!targetUserId) {
      console.log('fetchProfileData: No targetUserId, skipping fetch');
      return;
    }

    const currentTargetId = targetUserId;
    console.log(
      'fetchProfileData: Starting fetch for userId:',
      currentTargetId
    );

    try {
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
      }>(`/profile/${currentTargetId}`);

      if (currentTargetId !== targetUserId) {
        console.log(
          'fetchProfileData: targetUserId changed during fetch, ignoring response'
        );
        return;
      }

      console.log('Profile data fetched:', data);

      let processedSportsPlayed: string | null = null;
      if (data.sportsPlayed !== undefined && data.sportsPlayed !== null) {
        console.log('Frontend: Processing sports_played from API:', {
          raw: data.sportsPlayed,
          type: typeof data.sportsPlayed,
          isArray: Array.isArray(data.sportsPlayed),
        });

        if (Array.isArray(data.sportsPlayed)) {
          const sportsArray = data.sportsPlayed.filter(Boolean);
          processedSportsPlayed = sportsArray.join(', ');
          console.log('Frontend: Converted array to string:', {
            array: sportsArray,
            result: processedSportsPlayed,
          });
        } else if (typeof data.sportsPlayed === 'string') {
          let sportsString = data.sportsPlayed.trim();
          if (sportsString.startsWith('{') && sportsString.endsWith('}')) {
            sportsString = sportsString.slice(1, -1);
          }
          const sportsArray = sportsString
            .replace(/["']/g, '')
            .split(',')
            .map(s => s.trim())
            .filter(Boolean);
          processedSportsPlayed = sportsArray.join(', ');
          console.log('Frontend: Processed string array:', {
            original: data.sportsPlayed,
            array: sportsArray,
            result: processedSportsPlayed,
          });
        }
      } else {
        console.log('Frontend: No sports_played in API response');
      }

      console.log(
        'Frontend: Final processed sports_played:',
        processedSportsPlayed
      );
      console.log('Frontend: primarySport from API:', data.primarySport);
      console.log('Frontend: sportsPlayed from API:', data.sportsPlayed);

      const finalSportsPlayed =
        processedSportsPlayed !== null && processedSportsPlayed !== ''
          ? processedSportsPlayed
          : null;

      setProfileData({
        userId: data.userId || targetUserId || '',
        fullName: data.fullName ?? null,
        profileImage: data.profileImage ?? null,
        coverImage: data.coverImage ?? null,
        bio: data.bio ?? null,
        education: data.education ?? null,
        city: data.city ?? null,
        primarySport: data.primarySport ?? null,
        sportsPlayed: finalSportsPlayed,
        dob: data.dob ?? null,
      });

      console.log('Frontend: Set profileData with:', {
        primarySport: data.primarySport ?? null,
        sportsPlayed: finalSportsPlayed,
        areTheyDifferent: data.primarySport !== finalSportsPlayed,
      });
      setUserBio(data.bio || '');

      if (
        processedSportsPlayed !== null &&
        processedSportsPlayed !== undefined
      ) {
        const finalSports = processedSportsPlayed.trim();
        setSportsPlayed(finalSports);
        console.log(
          'fetchProfileData: Updated sportsPlayed state from database:',
          {
            processed: processedSportsPlayed,
            final: finalSports,
            count: finalSports ? finalSports.split(',').length : 0,
            primarySport: data.primarySport,
            areTheyDifferent: finalSports !== (data.primarySport || ''),
          }
        );
      } else {
        setSportsPlayed('');
        console.log(
          'fetchProfileData: No sports_played in database, cleared sportsPlayed state'
        );
        console.log(
          'fetchProfileData: primarySport value (for reference):',
          data.primarySport
        );
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      if (currentTargetId === targetUserId) {
        setProfileData(null);
        setUserBio('');
        setSportsPlayed('');
      }
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
      return getResourceUrl(profileUrl) || profileUrl;
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
  const calculateCompletion = () => {
    let completed = 0;
    const totalSections = isAthlete ? 12 : 11;

    // Basic Profile Information (3 sections)
    if (profileData?.fullName && profileData.fullName.trim() !== '')
      completed++;
    if (profileData?.profileImage) completed++;
    if (
      (profileData?.city && profileData.city.trim() !== '') ||
      profileData?.dob
    )
      completed++;

    // Profile Sections (9 sections, but athletic performance only for athletes)
    if (userBio && userBio.trim() !== '') completed++;
    if (socialHandles && socialHandles.length > 0) completed++;
    if (academicBackgrounds && academicBackgrounds.length > 0) completed++;
    if (achievements && achievements.length > 0) completed++;
    if (isAthlete) {
      if (athleticAndPerformance && athleticAndPerformance.length > 0)
        completed++;
    }
    if (competitionAndClubs && competitionAndClubs.length > 0) completed++;
    if (characterAndLeadership && characterAndLeadership.length > 0)
      completed++;
    if (healthAndReadiness && healthAndReadiness.length > 0) completed++;
    if (videoAndMedia && videoAndMedia.length > 0) completed++;

    const percentage = Math.min(
      Math.round((completed / totalSections) * 100),
      100
    );
    return percentage;
  };

  const currentCompletion = calculateCompletion();
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (currentCompletion / 100) * circumference;

  return (
    <div className=" bg-[#D4D4D4] ">
      <Header
        userName={currentUser?.full_name}
        userProfileUrl={getProfileUrl(currentUser?.profile_url)}
      />

      <main className="flex flex-1 w-full mt-5 overflow-hidden">
        {/* Left Sidebar - Hidden on mobile, shown on tablet and desktop */}
        <div className="hidden md:flex md:flex-3 shrink-0 border-r border-gray-200 overflow-hidden px-4 lg:px-6 flex-col">
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
                  : getResourceUrl(profileData.profileImage) ||
                    profileData.profileImage
                : viewUserId
                  ? viewUser?.profile_url || null
                  : currentUser?.profile_url || null,
              background_image_url: profileData?.coverImage
                ? profileData.coverImage.startsWith('http')
                  ? profileData.coverImage
                  : getResourceUrl(profileData.coverImage) ||
                    profileData.coverImage
                : null,
              user_type: viewUserId
                ? viewUser?.user_type || 'athlete'
                : currentUser?.user_type || 'athlete',
              location: profileData?.city || '',
              age: calculateAge(profileData?.dob) || undefined,
              followers_count: followersCount,
              sports_played: (() => {
                let result = '';
                if (
                  profileData?.sportsPlayed !== undefined &&
                  profileData?.sportsPlayed !== null &&
                  profileData.sportsPlayed !== ''
                ) {
                  const sports = profileData.sportsPlayed as string;
                  let cleaned = sports.trim();
                  if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
                    cleaned = cleaned.slice(1, -1);
                  }
                  cleaned = cleaned.replace(/["']/g, '');
                  const sportsArray = cleaned
                    .split(',')
                    .map((s: string) => s.trim())
                    .filter((s: string) => Boolean(s));
                  result = sportsArray.join(', ');
                  console.log(
                    'Profile page: Processing sports_played for EditProfileModal:',
                    {
                      original: sports,
                      cleaned: cleaned,
                      sportsArray: sportsArray,
                      result: result,
                      count: sportsArray.length,
                    }
                  );
                } else if (sportsPlayed && sportsPlayed.trim() !== '') {
                  result = sportsPlayed.trim();
                  console.log(
                    'Profile page: Using sportsPlayed state as fallback:',
                    result
                  );
                }

                console.log(
                  'Profile page: Final sports_played passed to EditProfileModal:',
                  result
                );
                return result;
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
                  bio?: string;
                  education?: string;
                  city?: string;
                  primarySport?: string;
                  sportsPlayed?: string;
                  profileImageUrl?: string;
                  coverImageUrl?: string;
                } = {};
                console.log('Received data from EditProfilePopup:', {
                  bio: data.bio,
                  education: data.education,
                  city: data.city,
                  bioUndefined: data.bio === undefined,
                  educationUndefined: data.education === undefined,
                });

                if (data.bio !== undefined) {
                  profileData.bio = data.bio;
                }
                if (data.education !== undefined) {
                  profileData.education = data.education;
                }
                if (data.city !== undefined) {
                  profileData.city = data.city;
                }

                if (data.sports_played !== undefined) {
                  profileData.sportsPlayed = data.sports_played;
                }

                console.log('Profile data being sent to API:', profileData);
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

                if (Object.keys(profileData).length === 0) {
                  console.log('No profile data to update');
                  return;
                }

                console.log('=== FRONTEND: Sending profile update to API ===');
                console.log('Profile data object:', profileData);
                console.log('Profile data keys:', Object.keys(profileData));
                console.log(
                  'Profile data values:',
                  Object.entries(profileData).map(([k, v]) => {
                    if (typeof v === 'string') {
                      return [
                        k,
                        v.length > 50 ? v.substring(0, 50) + '...' : v,
                      ];
                    }
                    return [k, v];
                  })
                );
                console.log('API endpoint: /profile');
                console.log('Request method: POST');

                try {
                  const result = await apiPost<{
                    success: boolean;
                    message?: string;
                    profile?: any;
                  }>('/profile', profileData);

                  console.log('=== FRONTEND: API Response Received ===');
                  console.log(
                    'Full API response:',
                    JSON.stringify(result, null, 2)
                  );
                  console.log('API response success:', result.success);
                  console.log('API response message:', result.message);
                  console.log('API response profile:', result.profile);

                  if (!result.success) {
                    console.error('=== FRONTEND: API returned failure ===');
                    console.error('Failed to save profile:', result);
                    alert(
                      'Failed to save profile: ' +
                        (result.message || 'Unknown error')
                    );
                    return;
                  }

                  console.log('=== FRONTEND: Profile saved successfully ===');
                  console.log('Updated profile data:', result.profile);

                  alert('Profile saved successfully!');
                } catch (error: any) {
                  console.error('=== FRONTEND: API Call Error ===');
                  console.error('Error object:', error);
                  console.error('Error message:', error.message);
                  console.error('Error stack:', error.stack);
                  console.error('Error response:', error.response);
                  console.error('Error status:', error.status);

                  const errorMessage =
                    error.response?.data?.message ||
                    error.message ||
                    'Network error. Please check your connection and try again.';
                  alert('Error saving profile: ' + errorMessage);
                  return;
                }

                if (targetUserId) {
                  await fetchProfileComplete();
                }

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
                      primarySport:
                        profileData.primarySport || prev.primarySport,
                      sportsPlayed:
                        profileData.sportsPlayed || prev.sportsPlayed,
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
                if (targetUserId) {
                  await fetchProfileComplete();
                }
              } catch (error) {
                console.error('Error saving profile:', error);
                alert('Error saving profile. Please try again.');
              }
            }}
          />

          {isAthlete && (
            <AthleticData
              athleticAndPerformance={athleticAndPerformance}
              onClick={() => {
                if (isViewingOwnProfile && isAthlete) {
                  setOpenAthleticPopup(true);
                }
              }}
              isEditable={isViewingOwnProfile && isAthlete}
            />
          )}

          {/* Tabs for tablet/desktop */}
          <div className="bg-white mt-2 rounded-lg flex flex-col flex-1 min-h-0">
            <div className="flex items-center border-b border-gray-200 shrink-0">
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-4 lg:px-6 py-3 font-medium text-sm transition-colors relative ${
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

              {!isViewingOwnProfile && isAthlete && (
                <>
                  <div className="h-6 w-px bg-gray-200"></div>
                  <button
                    onClick={() => setActiveTab('stats')}
                    className={`px-4 lg:px-6 py-3 font-medium text-sm transition-colors relative ${
                      activeTab === 'stats'
                        ? 'text-[#CB9729]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Stats
                    {activeTab === 'stats' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]"></div>
                    )}
                  </button>
                </>
              )}

              {isViewingOwnProfile && (
                <>
                  <div className="h-6 w-px bg-gray-200"></div>
                  <button
                    onClick={() => setActiveTab('activity')}
                    className={`px-4 lg:px-6 py-3 font-medium text-sm transition-colors relative ${
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
                    className={`px-4 lg:px-6 py-3 font-medium text-sm  transition-colors relative ${
                      activeTab === 'mysave'
                        ? 'text-[#CB9729]'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Saved
                    {activeTab === 'mysave' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]"></div>
                    )}
                  </button>
                  {currentUser?.user_type === 'coach' && (
                    <>
                      <div className="h-6 w-px bg-gray-200"></div>
                      <button
                        onClick={() => setActiveTab('favourites')}
                        className={`px-4 lg:px-6 py-3 font-medium text-sm transition-colors relative ${
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
                  {isAthlete && (
                    <AthleticAndPerformanceComponent
                      athleticAndPerformance={athleticAndPerformance}
                      onAthleticAndPerformanceChange={setAthleticAndPerformance}
                      sportsPlayed={sportsPlayed}
                      userId={targetUserId}
                      openForEdit={openAthleticPopup}
                      onEditRequested={() => setOpenAthleticPopup(false)}
                    />
                  )}
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
              {activeTab === 'stats' && <StatsTab userId={targetUserId} />}
              {activeTab === 'activity' && (
                <div className="w-full bg-white rounded-lg px-4 lg:px-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Activity
                  </h2>

                  <div className="flex gap-3 mb-6 overflow-x-auto">
                    <button
                      onClick={() => setActiveFilter('posts')}
                      className={`px-4 py-2 rounded-lg font-medium text-xs whitespace-nowrap transition-colors ${
                        activeFilter === 'posts'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border  border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Posts
                    </button>
                    <button
                      onClick={() => setActiveFilter('clips')}
                      className={`px-4 py-2 rounded-lg font-medium text-xs whitespace-nowrap transition-colors ${
                        activeFilter === 'clips'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Clips
                    </button>
                    <button
                      onClick={() => setActiveFilter('article')}
                      className={`px-4 py-2 rounded-lg font-medium text-xs whitespace-nowrap transition-colors ${
                        activeFilter === 'article'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Article
                    </button>
                    <button
                      onClick={() => setActiveFilter('event')}
                      className={`px-4 py-2 rounded-lg font-medium text-xs whitespace-nowrap transition-colors ${
                        activeFilter === 'event'
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
                <div className="w-full bg-white rounded-lg px-4 lg:px-6">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Saved
                  </h2>

                  <div className="flex gap-3 mb-6 overflow-x-auto">
                    <button
                      onClick={() => setActiveSaveFilter('posts')}
                      className={`px-4 py-2 rounded-lg font-medium text-xs whitespace-nowrap transition-colors ${
                        activeSaveFilter === 'posts'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Posts
                    </button>
                    <button
                      onClick={() => setActiveSaveFilter('clips')}
                      className={`px-4 py-2 rounded-lg font-medium text-xs whitespace-nowrap transition-colors ${
                        activeSaveFilter === 'clips'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Clips
                    </button>
                    <button
                      onClick={() => setActiveSaveFilter('article')}
                      className={`px-4 py-2 rounded-lg font-medium text-xs whitespace-nowrap transition-colors ${
                        activeSaveFilter === 'article'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Article
                    </button>
                    {/* <button
                      onClick={() => setActiveSaveFilter('opportunities')}
                      className={`px-4 py-2 rounded-lg font-medium text-xs whitespace-nowrap transition-colors ${
                        activeSaveFilter === 'opportunities'
                          ? 'bg-gray-800 text-white'
                          : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Opportunities
                    </button> */}
                  </div>
                  {activeSaveFilter === 'posts' && (
                    <MySavePost
                      posts={posts}
                      currentUserId={currentUserId || undefined}
                      viewedUserId={viewUserId || null}
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

        {/* Mobile View - Full width with mobile-specific design */}
        <div className="flex md:hidden flex-1 flex-col overflow-hidden">
          {/* Mobile Profile Card */}
          <div className="bg-white rounded-t-3xl flex-1 overflow-y-auto overflow-x-hidden">
            {/* Cover Image */}
            <div className="relative h-32 bg-gray-100 flex-shrink-0">
              {profileData?.coverImage ? (
                <img
                  src={
                    profileData.coverImage.startsWith('http')
                      ? profileData.coverImage
                      : getResourceUrl(profileData.coverImage) ||
                        profileData.coverImage
                  }
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full"></div>
              )}
            </div>

            {/* Profile Picture with completion badge */}
            <div className="relative px-4 pb-4" style={{ marginTop: '-3rem' }}>
              <div className="relative inline-block">
                {/* Circular Progress Ring */}
                <svg
                  className="w-24 h-24 transform -rotate-90"
                  viewBox="0 0 120 120"
                >
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke="#E5E7EB"
                    strokeWidth="8"
                    fill="none"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="54"
                    stroke="#CB9729"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-500 ease-in-out"
                  />
                </svg>

                {/* Profile Image in Center */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-20 h-20 border-2 rounded-full overflow-hidden border-white bg-gray-200">
                    {profileData?.profileImage ? (
                      <img
                        src={
                          profileData.profileImage.startsWith('http')
                            ? profileData.profileImage
                            : getResourceUrl(profileData.profileImage) ||
                              profileData.profileImage
                        }
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-300 text-gray-600 text-xl font-bold">
                        {_getInitials(
                          viewUserId
                            ? viewUser?.full_name
                            : currentUser?.full_name
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Completion Badge */}
                <div className="absolute bottom-0 right-0 bg-[#CB9729] text-white text-xs font-bold rounded-full w-8 h-8 flex items-center justify-center border-2 border-white shadow-lg">
                  {currentCompletion}%
                </div>
              </div>

              {/* User Info */}
              <div className="mt-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  {viewUserId
                    ? viewUser?.full_name || 'User'
                    : profileData?.fullName || currentUser?.full_name || 'User'}
                </h1>
                <p className="text-sm text-black font-bold capitalize">
                  {profileUserType}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs lg:text-sm text-black font-medium">
                  <span>{profileData?.city || 'Rochester, NY'}</span>
                  <span>•</span>
                  <span>{followersCount.toLocaleString()} followers</span>
                  {profileData?.dob && (
                    <>
                      <span>•</span>
                      <span>Age-{calculateAge(profileData.dob)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Sports Played Section */}
              {sportsPlayed && (
                <div className="mt-4 flex rounded-lg">
                  <div className="text-xs text-gray-500">Sports Played :</div>
                  <div className="text-xs font-medium ml-1 text-gray-900">
                    {sportsPlayed}
                  </div>
                </div>
              )}

              {/* Primary Sport Section */}
              {profileData?.primarySport && (
                <div className="mt-3 flex rounded-lg">
                  <p className="text-xs text-gray-500">Primary Sport :</p>
                  <p className="text-xs font-medium ml-1 text-gray-900">
                    {profileData.primarySport}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6">
                {isViewingOwnProfile ? (
                  <button
                    onClick={() => setShowEditProfile(true)}
                    className="w-6/12 bg-[#CB9729] text-white py-3 rounded-lg font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    Edit Profile
                  </button>
                ) : (
                  <button
                    onClick={handleSendConnectionRequest}
                    className="flex-1 bg-white border border-gray-300 text-gray-900 py-3 rounded-lg font-medium text-sm"
                  >
                    Connect
                  </button>
                )}
              </div>

              {/* Stats Row for Athletes */}
              {isAthlete && athleticAndPerformance.length > 0 && (
                <div className="mt-6 px-0 py-3 flex justify-between items-center">
                  {athleticAndPerformance[0]?.height && (
                    <>
                      <div className="text-center">
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          Height
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {athleticAndPerformance[0].height}
                        </div>
                      </div>
                      <div className="h-8 w-px bg-gray-200" />
                    </>
                  )}
                  {athleticAndPerformance[0]?.weight && (
                    <>
                      <div className="text-center">
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          Weight
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {athleticAndPerformance[0].weight}
                        </div>
                      </div>
                      <div className="h-8 w-px bg-gray-200" />
                    </>
                  )}
                  {athleticAndPerformance[0]?.hand && (
                    <>
                      <div className="text-center">
                        <div className="text-xs font-medium text-gray-500 mb-1">
                          Hand
                        </div>
                        <div className="text-sm font-semibold text-gray-900">
                          {athleticAndPerformance[0].hand}
                        </div>
                      </div>
                      <div className="h-8 w-px bg-gray-200" />
                    </>
                  )}
                  {athleticAndPerformance[0]?.arm && (
                    <div className="text-center">
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        Arm
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {athleticAndPerformance[0].arm}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Tabs */}
              <div
                className="flex items-start justify-between border-b border-gray-200 mt-6 overflow-x-auto"
                style={{
                  marginLeft: '-1rem',
                  marginRight: '-1rem',
                  paddingLeft: '1rem',
                  paddingRight: '1rem',
                }}
              >
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`px-3 py-3 font-medium text-sm transition-colors relative flex-shrink-0 ${
                    activeTab === 'profile' ? 'text-[#CB9729]' : 'text-gray-600'
                  }`}
                >
                  Profile
                  {activeTab === 'profile' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]"></div>
                  )}
                </button>

                {isViewingOwnProfile && (
                  <>
                    <div className="h-6 w-px bg-gray-300 flex-shrink-0"></div>
                    <button
                      onClick={() => setActiveTab('activity')}
                      className={`px-3 py-3 font-medium text-sm transition-colors relative flex-shrink-0 ${
                        activeTab === 'activity'
                          ? 'text-[#CB9729]'
                          : 'text-gray-600'
                      }`}
                    >
                      Activity
                      {activeTab === 'activity' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]"></div>
                      )}
                    </button>

                    <div className="h-6 w-px bg-gray-300 flex-shrink-0"></div>
                    <button
                      onClick={() => setActiveTab('mysave')}
                      className={`px-3 py-3 font-medium text-sm transition-colors relative flex-shrink-0 ${
                        activeTab === 'mysave'
                          ? 'text-[#CB9729]'
                          : 'text-gray-600'
                      }`}
                    >
                      Saveds
                      {activeTab === 'mysave' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#CB9729]"></div>
                      )}
                    </button>
                  </>
                )}
              </div>

              {/* Mobile Sub-tabs for Activity/Saveds */}
              {(activeTab === 'activity' || activeTab === 'mysave') && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-hide">
                  {activeTab === 'activity' ? (
                    <>
                      <button
                        onClick={() => setActiveFilter('posts')}
                        className={`px-4 py-2 rounded-sm font-medium text-xs whitespace-nowrap flex-shrink-0 ${
                          activeFilter === 'posts'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Posts
                      </button>
                      <button
                        onClick={() => setActiveFilter('clips')}
                        className={`px-4 py-2 rounded-sm font-medium text-xs whitespace-nowrap flex-shrink-0 ${
                          activeFilter === 'clips'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Clips
                      </button>
                      <button
                        onClick={() => setActiveFilter('article')}
                        className={`px-4 py-2 rounded-sm font-medium text-xs whitespace-nowrap flex-shrink-0 ${
                          activeFilter === 'article'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Articles
                      </button>
                      <button
                        onClick={() => setActiveFilter('event')}
                        className={`px-4 py-2 rounded-sm font-medium text-xs whitespace-nowrap flex-shrink-0 ${
                          activeFilter === 'event'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Events
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setActiveSaveFilter('posts')}
                        className={`px-4 py-2 rounded-sm font-medium text-xs whitespace-nowrap flex-shrink-0 ${
                          activeSaveFilter === 'posts'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Posts
                      </button>
                      <button
                        onClick={() => setActiveSaveFilter('clips')}
                        className={`px-4 py-2 rounded-sm font-medium text-xs whitespace-nowrap flex-shrink-0 ${
                          activeSaveFilter === 'clips'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Clips
                      </button>
                      <button
                        onClick={() => setActiveSaveFilter('article')}
                        className={`px-4 py-2 rounded-sm font-medium text-xs whitespace-nowrap flex-shrink-0 ${
                          activeSaveFilter === 'article'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Articles
                      </button>
                      <button
                        onClick={() => setActiveSaveFilter('opportunities')}
                        className={`px-4 py-2 rounded-sm font-medium text-xs whitespace-nowrap flex-shrink-0 ${
                          activeSaveFilter === 'opportunities'
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        Opportunities
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Mobile Content */}
              <div className="mt-6 pb-20">
                {activeTab === 'profile' && (
                  <div className="space-y-4">
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
                    {isAthlete && (
                      <AthleticAndPerformanceComponent
                        athleticAndPerformance={athleticAndPerformance}
                        onAthleticAndPerformanceChange={
                          setAthleticAndPerformance
                        }
                        sportsPlayed={sportsPlayed}
                        userId={targetUserId}
                        openForEdit={openAthleticPopup}
                        onEditRequested={() => setOpenAthleticPopup(false)}
                      />
                    )}
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
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div>
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
                  <div>
                    {activeSaveFilter === 'posts' && (
                      <MySavePost
                        posts={posts}
                        currentUserId={currentUserId || undefined}
                        viewedUserId={viewUserId || null}
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
                          viewUser?.full_name ||
                          currentUser?.full_name ||
                          'User'
                        }
                        viewedUserId={viewUserId}
                        loading={loading}
                        onCommentCountUpdate={fetchPosts}
                        onPostDeleted={fetchPosts}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Hidden on mobile and tablet */}
        <div className="hidden lg:flex flex-1 shrink-0">
          <RightSideBar />
        </div>
      </main>

      {/* Mobile Edit Profile Modal */}
      {showEditProfile && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
          <div className="bg-white w-full rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">Edit Profile</h2>
              <button
                onClick={() => setShowEditProfile(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <EditProfileModal
                open={true}
                asSidebar={false}
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
                  profile_url: profileData?.profileImage || null,
                  background_image_url: profileData?.coverImage || null,
                  user_type: profileUserType,
                  location: profileData?.city || '',
                  age: calculateAge(profileData?.dob) || undefined,
                  followers_count: followersCount,
                  sports_played: sportsPlayed,
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
                onSave={async data => {
                  // Same onSave logic as desktop
                  setShowEditProfile(false);
                }}
              />
            </div>
          </div>
        </div>
      )}
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
