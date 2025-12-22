'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import NavigationBar from '@/components/NavigationBar';
import HomeHerosection from '@/components/Home/Herosection';
import Post, { type PostData } from '@/components/Post';

export default function Landing() {
  const [posts, setPosts] = useState<PostData[]>([]);

  const fetchPosts = () => {
    // Get posts from localStorage
    const storedPosts = localStorage.getItem('athlinked_posts');
    if (storedPosts) {
      try {
        const parsedPosts = JSON.parse(storedPosts);
        setPosts(parsedPosts);
      } catch (error) {
        console.error('Error parsing posts from localStorage:', error);
        setPosts([]);
      }
    } else {
      setPosts([]);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostCreated = () => {
    // Refresh posts after a new post is created
    fetchPosts();
  };

  return (
    <div className="h-screen bg-[#D4D4D4] flex flex-col overflow-hidden">
      {/* Full-width header */}
      <Header
        userName="Ashwin"
        userProfileUrl="/assets/Header/profiledummy.jpeg"
      />

      <main className="flex flex-1 w-full mt-5 overflow-hidden">
        {/* Left column: navigation */}
        <div className="hidden md:flex px-6 ">
          <NavigationBar
            activeItem="home"
            userName="Ashwin"
            userProfileUrl="/assets/Header/profiledummy.jpeg"
          />
        </div>

        {/* Center column: main content */}
        <div className="flex-1 flex flex-col px-4 gap-4 overflow-hidden min-w-0">
          <div className="flex-shrink-0">
            <HomeHerosection
              userProfileUrl="/assets/Header/profiledummy.jpeg"
              username="Rohit Sharma"
              onPostCreated={handlePostCreated}
            />
          </div>

          {/* Posts Feed - Fixed height with scroll */}
          <div className="flex-1 overflow-y-auto pr-2 min-h-0">
            <div className="flex flex-col gap-4 pb-4">
              {posts.length === 0 ? (
                <div className="text-center py-8 text-gray-600 bg-white rounded-xl border border-gray-200">
                  No posts yet. Be the first to post!
                </div>
              ) : (
                posts.map(post => (
                  <Post
                    key={post.id}
                    post={post}
                    currentUserProfileUrl="/assets/Header/profiledummy.jpeg"
                    currentUsername="Rohit Sharma"
                    onCommentCountUpdate={fetchPosts}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column: reserved for future widgets */}
        <div className="hidden lg:flex px-6">
          <div className="w-72">
            <NavigationBar
              activeItem="home"
              userName="Ashwin"
              userProfileUrl="/assets/Header/profiledummy.jpeg"
            />
          </div>
        </div>
      </main>
    </div>
  );
}