'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import NavigationBar from '@/components/NavigationBar';
import RightSideBar from '@/components/RightSideBar';
import Post, { type PostData } from '@/components/Post';
import { isAuthenticated } from '@/utils/auth';
import { getResourceUrl, apiGet } from '@/utils/api';

interface CurrentUser {
  id: string;
  full_name: string;
  profile_url?: string;
}

export default function SinglePostPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params?.postId as string | undefined;

  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      if (!isAuthenticated()) {
        // Redirect to login with return URL
        const returnUrl = encodeURIComponent(window.location.pathname);
        router.push(`/login?returnUrl=${returnUrl}`);
        return false;
      }
      setAuthChecked(true);
      return true;
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    // Don't fetch post until auth is checked
    if (!authChecked || !postId) {
      if (!postId) {
        setLoading(false);
        setError('Invalid post');
      }
      return;
    }

    const fetchPost = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiGet<{
          success: boolean;
          post?: any;
          message?: string;
          requiresAuth?: boolean;
        }>(`/posts/${postId}`);

        // Handle auth requirement from backend
        if (
          data.requiresAuth ||
          (!data.success && data.message === 'Authentication required')
        ) {
          const returnUrl = encodeURIComponent(window.location.pathname);
          router.push(`/login?returnUrl=${returnUrl}`);
          return;
        }

        if (data.success && data.post) {
          const p = data.post;
          const transformed: PostData = {
            id: p.id,
            username: p.username || 'User',
            user_profile_url:
              p.user_profile_url && p.user_profile_url.trim() !== ''
                ? p.user_profile_url
                : null,
            user_id: p.user_id,
            user_type: p.user_type || 'athlete',
            post_type: p.post_type,
            caption: p.caption,
            media_url: p.media_url,
            article_title: p.article_title,
            article_body: p.article_body,
            event_title: p.event_title,
            event_date: p.event_date,
            event_location: p.event_location,
            event_type: p.event_type,
            like_count: p.like_count ?? 0,
            comment_count: p.comment_count ?? 0,
            save_count: p.save_count ?? 0,
            created_at: p.created_at,
          };
          setPost(transformed);
        } else {
          setError('Post not found');
          setPost(null);
        }
      } catch (err: any) {
        console.error('Error fetching post:', err);

        // Handle 401 errors by redirecting to login
        if (err?.status === 401 || err?.response?.status === 401) {
          const returnUrl = encodeURIComponent(window.location.pathname);
          router.push(`/login?returnUrl=${returnUrl}`);
          return;
        }

        setError('Post not found');
        setPost(null);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId, authChecked, router]);

  useEffect(() => {
    if (!isAuthenticated() || !authChecked) return;

    const fetchCurrentUser = async () => {
      try {
        const userIdentifier = localStorage.getItem('userEmail');
        if (!userIdentifier) return;
        let data: any;
        if (userIdentifier.startsWith('username:')) {
          const username = userIdentifier.replace('username:', '');
          data = await apiGet<{ success: boolean; data?: any }>(
            `/users/username/${encodeURIComponent(username)}`
          );
        } else {
          data = await apiGet<{ success: boolean; data?: any }>(
            `/users/email/${encodeURIComponent(userIdentifier)}`
          );
        }
        if (data?.success && data?.data) {
          setCurrentUserId(data.data.id);
          setCurrentUser({
            id: data.data.id,
            full_name: data.data.full_name || 'User',
            profile_url: data.data.profile_url,
          });
        }
      } catch {
        // ignore
      }
    };
    fetchCurrentUser();
  }, [authChecked]);

  const getProfileUrl = (profileUrl?: string | null): string | undefined => {
    if (!profileUrl || profileUrl.trim() === '') return undefined;
    if (profileUrl.startsWith('http')) return profileUrl;
    if (profileUrl.startsWith('/') && !profileUrl.startsWith('/assets')) {
      return getResourceUrl(profileUrl) || profileUrl;
    }
    return profileUrl;
  };

  if (!postId) {
    return (
      <div className="h-screen bg-[#D4D4D4] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-black bg-white rounded-xl border border-gray-200 p-6">
            <p>Invalid post link.</p>
            <Link
              href="/home"
              className="text-blue-600 underline mt-2 inline-block"
            >
              Go to home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (!authChecked || loading) {
    return (
      <div className="h-screen bg-[#D4D4D4] flex flex-col">
        <Header
          userName={currentUser?.full_name}
          userProfileUrl={getProfileUrl(currentUser?.profile_url)}
        />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500 mb-4" />
            <p className="text-black">Loading post...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="h-screen bg-[#D4D4D4] flex flex-col">
        <Header
          userName={currentUser?.full_name}
          userProfileUrl={getProfileUrl(currentUser?.profile_url)}
        />
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="text-center text-black bg-white rounded-xl border border-gray-200 p-6 max-w-md">
            <p className="text-lg font-medium">Post not found</p>
            <p className="text-gray-600 mt-2">
              This post may have been removed or the link is incorrect.
            </p>
            <Link
              href={isAuthenticated() ? '/home' : '/login'}
              className="mt-4 inline-block px-4 py-2 bg-yellow-500 text-black rounded-lg hover:bg-yellow-600"
            >
              {isAuthenticated() ? 'Go to home' : 'Log in'}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#D4D4D4] flex flex-col overflow-hidden">
      <Header
        userName={currentUser?.full_name}
        userProfileUrl={getProfileUrl(currentUser?.profile_url)}
      />

      <main className="flex flex-1 w-full mt-2 md:mt-5 overflow-hidden">
        <div className="hidden md:flex px-3">
          <NavigationBar activeItem="home" />
        </div>

        <div className="flex-1 flex flex-col gap-2 lg:gap-4 overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto pr-2 min-h-0">
            <div className="flex flex-col gap-4 pb-4 max-w-2xl mx-auto">
              <Post
                post={post}
                currentUserProfileUrl={getProfileUrl(currentUser?.profile_url)}
                currentUsername={currentUser?.full_name || 'You'}
                currentUserId={currentUserId || undefined}
              />
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
