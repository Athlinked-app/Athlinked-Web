'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import NavigationBar from '@/components/NavigationBar';
import RightSideBar from '@/components/RightSideBar';
import HomeHerosection from '@/components/Home/Herosection';
import Post, { type PostData } from '@/components/Post';

interface CurrentUser {
  id: string;
  full_name: string;
  profile_url?: string;
  username?: string;
}

export default function Landing() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

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
          full_name: data.user.full_name || 'User',
          profile_url: data.user.profile_url,
          username: data.user.username,
        });
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
        <div className="hidden md:flex px-6 ">
          <NavigationBar activeItem="home" />
        </div>

        <div className="flex-1 flex flex-col px-4 gap-4 overflow-hidden min-w-0">
          <div className="flex-shrink-0">
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
                    currentUserProfileUrl={getProfileUrl(currentUser?.profile_url)}
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

        <div className="hidden lg:flex">
          <RightSideBar />
        </div>
      </main>
    </div>
  );
}
