'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import NavigationBar from '@/components/NavigationBar';
import RightSideBar from '@/components/RightSideBar';
import HomeHerosection from '@/components/Home/Herosection';
import Post, { type PostData } from '@/components/Post';
import HomePopup from '@/components/Home/Homepopup';
import { isAuthenticated } from '@/utils/auth';
import { BASE_URL, getResourceUrl, apiGet } from '@/utils/api';

interface CurrentUser {
  id: string;
  full_name: string;
  profile_url?: string;
  username?: string;
}

export default function Landing() {
  const router = useRouter();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [profileCompletion, setProfileCompletion] = useState(20);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const data = await apiGet<{
        success: boolean;
        posts?: any[];
        message?: string;
      }>('/posts?page=1&limit=50');

      if (data.success && data.posts) {
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
    // Check authentication first - use hard redirect for security
    if (!isAuthenticated()) {
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
      return;
    }
    setCheckingAuth(false);
    fetchPosts();
    fetchCurrentUser();
  }, [router]);

  const fetchCurrentUser = async () => {
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
          id: data.user.id,
          full_name: data.user.full_name || 'User',
          profile_url: data.user.profile_url,
          username: data.user.username,
        });

        // Fetch profile data to calculate completion
        await calculateProfileCompletion(data.user.id);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const calculateProfileCompletion = async (userId: string) => {
    try {
      const { apiGet } = await import('@/utils/api');
      let completed = 0;
      const totalSections = 12;

      // Fetch profile data - API returns data directly, not wrapped in success/profile
      const profileData = await apiGet<{
        userId?: string;
        fullName?: string | null;
        profileImage?: string | null;
        city?: string | null;
        dob?: string | null;
        bio?: string | null;
      }>(`/profile/${userId}`);

      // Basic Profile Information (3 sections) - matching EditProfileModel logic
      // EditProfileModel uses: fullName, profileImagePreview, location/age
      if (profileData.fullName && profileData.fullName.trim() !== '')
        completed++;
      if (profileData.profileImage) completed++;
      if (
        (profileData.city && profileData.city.trim() !== '') ||
        profileData.dob
      )
        completed++;

      // Fetch all profile sections individually
      const [
        socialHandlesRes,
        academicBackgroundsRes,
        achievementsRes,
        athleticAndPerformanceRes,
        competitionAndClubsRes,
        characterAndLeadershipRes,
        healthAndReadinessRes,
        videoAndMediaRes,
      ] = await Promise.allSettled([
        apiGet<{ success: boolean; data?: any[] }>(
          `/profile/${userId}/social-handles`
        ),
        apiGet<{ success: boolean; data?: any[] }>(
          `/profile/${userId}/academic-backgrounds`
        ),
        apiGet<{ success: boolean; data?: any[] }>(
          `/profile/${userId}/achievements`
        ),
        apiGet<{ success: boolean; data?: any[] }>(
          `/profile/${userId}/athletic-performance`
        ),
        apiGet<{ success: boolean; data?: any[] }>(
          `/profile/${userId}/competition-clubs`
        ),
        apiGet<{ success: boolean; data?: any[] }>(
          `/profile/${userId}/character-leadership`
        ),
        apiGet<{ success: boolean; data?: any[] }>(
          `/profile/${userId}/health-readiness`
        ),
        apiGet<{ success: boolean; data?: any[] }>(
          `/profile/${userId}/video-media`
        ),
      ]);

      // Check bio from profile data
      if (profileData.bio && profileData.bio.trim() !== '') completed++;

      // Check each section (9 sections) - all use `data` property
      if (
        socialHandlesRes.status === 'fulfilled' &&
        socialHandlesRes.value.success &&
        socialHandlesRes.value.data &&
        socialHandlesRes.value.data.length > 0
      )
        completed++;

      if (
        academicBackgroundsRes.status === 'fulfilled' &&
        academicBackgroundsRes.value.success &&
        academicBackgroundsRes.value.data &&
        academicBackgroundsRes.value.data.length > 0
      )
        completed++;

      if (
        achievementsRes.status === 'fulfilled' &&
        achievementsRes.value.success &&
        achievementsRes.value.data &&
        achievementsRes.value.data.length > 0
      )
        completed++;

      if (
        athleticAndPerformanceRes.status === 'fulfilled' &&
        athleticAndPerformanceRes.value.success &&
        athleticAndPerformanceRes.value.data &&
        athleticAndPerformanceRes.value.data.length > 0
      )
        completed++;

      if (
        competitionAndClubsRes.status === 'fulfilled' &&
        competitionAndClubsRes.value.success &&
        competitionAndClubsRes.value.data &&
        competitionAndClubsRes.value.data.length > 0
      )
        completed++;

      if (
        characterAndLeadershipRes.status === 'fulfilled' &&
        characterAndLeadershipRes.value.success &&
        characterAndLeadershipRes.value.data &&
        characterAndLeadershipRes.value.data.length > 0
      )
        completed++;

      if (
        healthAndReadinessRes.status === 'fulfilled' &&
        healthAndReadinessRes.value.success &&
        healthAndReadinessRes.value.data &&
        healthAndReadinessRes.value.data.length > 0
      )
        completed++;

      if (
        videoAndMediaRes.status === 'fulfilled' &&
        videoAndMediaRes.value.success &&
        videoAndMediaRes.value.data &&
        videoAndMediaRes.value.data.length > 0
      )
        completed++;

      const percentage = Math.min(
        Math.round((completed / totalSections) * 100),
        100
      );
      setProfileCompletion(percentage);
    } catch (error) {
      console.error('Error calculating profile completion:', error);
      // Default to 20% if calculation fails
      setProfileCompletion(20);
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
      return getResourceUrl(profileUrl) || profileUrl;
    }
    return profileUrl;
  };

  // Get initials for placeholder
  const _getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Show loading state while checking authentication
  if (checkingAuth) {
    return (
      <div className="h-screen bg-[#D4D4D4] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mb-4"></div>
          <p className="text-black">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#D4D4D4] flex flex-col overflow-hidden">
      <HomePopup
        profileCompletion={profileCompletion}
        onCompleteProfile={() => router.push('/profile')}
        userId={currentUserId}
      />
      <Header
        userName={currentUser?.full_name}
        userProfileUrl={getProfileUrl(currentUser?.profile_url)}
      />

      <main className="flex flex-1 w-full mt-5 overflow-hidden ">
        <div className="hidden md:flex px-3 ">
          <NavigationBar activeItem="home" />
        </div>

        <div className="flex-1 flex flex-col  gap-4 overflow-hidden min-w-0">
          <div className="shrink-0">
            <HomeHerosection
              userProfileUrl={getProfileUrl(currentUser?.profile_url)}
              username={currentUser?.full_name || 'User'}
              onPostCreated={handlePostCreated}
            />
          </div>

          <div className="flex-1 overflow-y-auto pr-2 min-h-0">
            <div className="flex flex-col gap-4 pb-4">
              {loading ? (
                <div className="text-center py-8 text-black bg-white rounded-xl border border-gray-200">
                  Loading posts...
                </div>
              ) : posts.length === 0 ? (
                <div className="text-center py-8 text-black bg-white rounded-xl border border-gray-200">
                  No posts yet. Be the first to post!
                </div>
              ) : (
                posts.map(post => (
                  <Post
                    key={post.id}
                    post={post}
                    currentUserProfileUrl={getProfileUrl(
                      currentUser?.profile_url
                    )}
                    currentUsername={currentUser?.full_name || 'User'}
                    currentUserId={currentUserId || undefined}
                    onCommentCountUpdate={fetchPosts}
                    onPostDeleted={fetchPosts}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:flex px-3">
          <RightSideBar />
        </div>
      </main>
    </div>
  );
}
