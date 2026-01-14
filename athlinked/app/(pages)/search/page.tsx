'use client';

import { useState, useEffect } from 'react';
import NavigationBar from '@/components/NavigationBar';
import RightSideBar from '@/components/RightSideBar';
import Header from '@/components/Header';
import Post, { type PostData } from '@/components/Post';
import { Search as SearchIcon, X, Play } from 'lucide-react';

interface SearchResult {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  isFollowing: boolean;
}

interface ClipResult {
  id: string;
  user_id?: string;
  username: string;
  user_profile_url: string | null;
  video_url: string;
  description: string | null;
  like_count: number;
  comment_count: number;
  created_at: string;
}

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchPosts, setSearchPosts] = useState<PostData[]>([]);
  const [searchClips, setSearchClips] = useState<ClipResult[]>([]);
  const [searchArticles, setSearchArticles] = useState<PostData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Dummy posts data - Photos, Videos and Text posts
  const photoTextPosts: PostData[] = [
    {
      id: 'photo1',
      username: 'Lisa Martinez',
      user_profile_url:
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
      user_id: 'user_photo1',
      post_type: 'photo',
      caption:
        'Crushing my fitness goals! 💪 30-day transformation complete. Hard work pays off! #FitnessJourney #Transformation',
      media_url:
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=600&fit=crop',
      like_count: 523,
      comment_count: 67,
      save_count: 145,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'video1',
      username: 'Sarah Champion',
      user_profile_url:
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      user_id: 'user_video1',
      post_type: 'video',
      caption: 'Check out my new training technique! What do you think? 🏋️‍♀️',
      media_url:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      like_count: 412,
      comment_count: 56,
      save_count: 89,
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'photo2',
      username: 'David Chen',
      user_profile_url:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop',
      user_id: 'user_photo2',
      post_type: 'photo',
      caption:
        'Beautiful morning at the track! Perfect weather for speed training 🏃‍♂️⚡️ #TrackAndField #SprintTraining',
      media_url:
        'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=600&fit=crop',
      like_count: 389,
      comment_count: 42,
      save_count: 98,
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: 'video2',
      username: 'Marcus Johnson',
      user_profile_url:
        'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop',
      user_id: 'user_video2',
      post_type: 'video',
      caption:
        'Game day highlights! 🏀 Dropped 35 points tonight. Team victory! #Basketball #Highlights',
      media_url:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      like_count: 678,
      comment_count: 89,
      save_count: 167,
      created_at: new Date(Date.now() - 172800000).toISOString(),
    },
    {
      id: 'text1',
      username: 'Rachel Thompson',
      user_profile_url:
        'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop',
      user_id: 'user_text1',
      post_type: 'text',
      caption:
        'Just want to share some motivation today: Every champion was once a contender who refused to give up. Your struggle today is developing the strength you need for tomorrow. Keep pushing!  💯 #Motivation #NeverGiveUp #ChampionMindset',
      like_count: 892,
      comment_count: 156,
      save_count: 234,
      created_at: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      id: 'video3',
      username: 'Jessica Lee',
      user_profile_url:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
      user_id: 'user_video3',
      post_type: 'video',
      caption:
        'Morning yoga flow to start the day right 🧘‍♀️✨ Try this routine! #Yoga #MorningRoutine',
      media_url:
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      like_count: 934,
      comment_count: 123,
      save_count: 456,
      created_at: new Date(Date.now() - 345600000).toISOString(),
    },
  ];

  // Dummy articles
  const articlePosts: PostData[] = [
    {
      id: 'article1',
      username: 'Dr. Emma Fitness',
      user_profile_url:
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
      user_id: 'user_article1',
      post_type: 'article',
      article_title: 'The Ultimate Guide to Sports Nutrition',
      caption:
        'Everything you need to know about fueling your athletic performance',
      article_body:
        "<p>Proper nutrition is the cornerstone of athletic performance. Whether you're a professional athlete or a weekend warrior, what you eat can make or break your training.</p><h2>Key Principles</h2><p>1. Hydration is crucial - Aim for at least 8-10 glasses of water daily<br>2. Balance your macros - 40% carbs, 30% protein, 30% fats<br>3. Time your meals properly - Eat 2-3 hours before exercise<br>4. Don't skip recovery nutrition - Post-workout meals are essential</p><h2>Pre-Workout Nutrition</h2><p>Your pre-workout meal should be rich in carbohydrates and moderate in protein. This provides energy and prevents muscle breakdown during exercise.</p><h2>Post-Workout Recovery</h2><p>Within 30-60 minutes after exercise, consume a combination of protein and carbohydrates to optimize recovery and muscle growth.</p>",
      media_url:
        'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=600&fit=crop',
      like_count: 567,
      comment_count: 89,
      save_count: 234,
      created_at: new Date(Date.now() - 259200000).toISOString(),
    },
    {
      id: 'article2',
      username: 'Coach Mike Stevens',
      user_profile_url:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop',
      user_id: 'user_article2',
      post_type: 'article',
      article_title: '5 Training Mistakes That Are Holding You Back',
      caption:
        'Avoid these common pitfalls to maximize your athletic potential',
      article_body:
        "<p>Many athletes unknowingly make training mistakes that limit their progress. Here are the top 5 mistakes and how to fix them.</p><h2>1. Overtraining</h2><p>More is not always better. Your body needs adequate rest to recover and grow stronger. Aim for at least 1-2 rest days per week.</p><h2>2. Neglecting Mobility Work</h2><p>Flexibility and mobility are crucial for performance and injury prevention. Dedicate 10-15 minutes daily to stretching and mobility exercises.</p><h2>3. Poor Sleep Habits</h2><p>Sleep is when your body repairs and grows. Aim for 7-9 hours of quality sleep each night for optimal recovery.</p><h2>4. Inconsistent Training</h2><p>Consistency is key. It's better to train moderately 4-5 times per week than intensely once or twice.</p><h2>5. Ignoring Nutrition</h2><p>You can't out-train a bad diet. Proper nutrition is essential for fueling your workouts and recovery.</p>",
      media_url:
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
      like_count: 723,
      comment_count: 134,
      save_count: 389,
      created_at: new Date(Date.now() - 432000000).toISOString(),
    },
    {
      id: 'article3',
      username: 'Nina Rodriguez',
      user_profile_url:
        'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=100&h=100&fit=crop',
      user_id: 'user_article3',
      post_type: 'article',
      article_title: 'Mental Toughness: The Key to Athletic Success',
      caption: 'Developing the mindset of a champion',
      article_body:
        '<p>Physical training is only half the battle. Mental toughness is what separates good athletes from great ones.</p><h2>What is Mental Toughness?</h2><p>Mental toughness is the ability to consistently perform at your peak, regardless of circumstances. It involves resilience, focus, confidence, and emotional control.</p><h2>Building Mental Resilience</h2><p>1. Set clear, achievable goals<br>2. Practice visualization techniques<br>3. Develop a pre-performance routine<br>4. Learn from failures instead of fearing them<br>5. Stay present in the moment</p><h2>Overcoming Performance Anxiety</h2><p>Competition anxiety is normal, but it doesn\'t have to control you. Breathing exercises, positive self-talk, and progressive muscle relaxation can help manage pre-competition nerves.</p><h2>The Power of Positive Self-Talk</h2><p>Your internal dialogue directly impacts performance. Replace negative thoughts with empowering affirmations. Instead of "I can\'t do this," try "I am prepared and capable."</p>',
      media_url:
        'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&h=600&fit=crop',
      like_count: 891,
      comment_count: 167,
      save_count: 445,
      created_at: new Date(Date.now() - 518400000).toISOString(),
    },
  ];

  // Dummy events
  const eventPosts: PostData[] = [
    {
      id: 'event1',
      username: 'Alex Trainer',
      user_profile_url:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
      user_id: 'user_event1',
      post_type: 'event',
      event_title: 'Community Marathon 2025',
      event_date: '2025-03-15T08:00:00Z',
      event_location: 'Central Park, New York',
      event_type: 'sports',
      caption:
        'Join us for the biggest running event of the year! All levels welcome.',
      media_url:
        'https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&h=600&fit=crop',
      like_count: 892,
      comment_count: 156,
      save_count: 445,
      created_at: new Date(Date.now() - 345600000).toISOString(),
    },
    {
      id: 'event2',
      username: 'Olympic Training Center',
      user_profile_url:
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop',
      user_id: 'user_event2',
      post_type: 'event',
      event_title: 'Youth Basketball Championship Finals',
      event_date: '2025-04-20T18:00:00Z',
      event_location: 'Madison Square Garden, NYC',
      event_type: 'sports',
      caption:
        'Watch the best young talents compete for the championship! 🏀🏆 Free entry for students!',
      media_url:
        'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&h=600&fit=crop',
      like_count: 1245,
      comment_count: 234,
      save_count: 678,
      created_at: new Date(Date.now() - 432000000).toISOString(),
    },
    {
      id: 'event3',
      username: 'City Sports Council',
      user_profile_url:
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop',
      user_id: 'user_event3',
      post_type: 'event',
      event_title: 'Summer Triathlon Challenge',
      event_date: '2025-06-10T07:00:00Z',
      event_location: 'Santa Monica Beach, California',
      event_type: 'sports',
      caption:
        'Swim, bike, run! Test your endurance in this exciting triathlon event. Register now! 🏊‍♂️🚴‍♀️🏃‍♂️',
      media_url:
        'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&h=600&fit=crop',
      like_count: 1567,
      comment_count: 289,
      save_count: 823,
      created_at: new Date(Date.now() - 518400000).toISOString(),
    },
  ];

  // Combine all posts
  const allPosts: PostData[] = [
    ...photoTextPosts,
    ...articlePosts,
    ...eventPosts,
  ];

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const userIdentifier = localStorage.getItem('userEmail');
      if (!userIdentifier) return;

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

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setCurrentUserId(data.user.id);
          setCurrentUser(data.user);
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

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
      return `http://localhost:3001${profileUrl}`;
    }
    return profileUrl;
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim() === '') {
      setSearchResults([]);
      setSearchPosts([]);
      setSearchClips([]);
      setSearchArticles([]);
      return;
    }

    setIsSearching(true);
    const searchLower = query.toLowerCase();
    const baseUrl = 'http://localhost:3001';

    try {
      // Fetch all content types in parallel
      const [usersResponse, postsResponse, clipsResponse, articlesResponse] =
        await Promise.all([
          fetch(`${baseUrl}/api/signup/users?limit=100`).catch(() => null),
          fetch(`${baseUrl}/api/posts?page=1&limit=100`).catch(() => null),
          fetch(`${baseUrl}/api/clips?page=1&limit=100`).catch(() => null),
          fetch(`${baseUrl}/api/articles`).catch(() => null),
        ]);

      // Process users
      if (usersResponse && usersResponse.ok) {
        const data = await usersResponse.json();
        if (data.success && data.users) {
          const filteredUsers = data.users.filter((user: any) => {
            const fullName = (user.full_name || '').toLowerCase();
            const username = (user.username || '').toLowerCase();

            return (
              user.id !== currentUserId &&
              (fullName.includes(searchLower) || username.includes(searchLower))
            );
          });

          const transformedResults: SearchResult[] = await Promise.all(
            filteredUsers.map(async (user: any) => {
              let isFollowing = false;
              if (currentUserId) {
                try {
                  const isFollowingResponse = await fetch(
                    `${baseUrl}/api/network/is-following/${user.id}?follower_id=${currentUserId}`
                  );
                  if (isFollowingResponse.ok) {
                    const isFollowingData = await isFollowingResponse.json();
                    if (isFollowingData.success) {
                      isFollowing = isFollowingData.isFollowing;
                    }
                  }
                } catch (error) {
                  console.error(
                    `Error checking follow status for ${user.id}:`,
                    error
                  );
                }
              }

              return {
                id: user.id,
                name: user.full_name || 'User',
                role: user.user_type
                  ? user.user_type.charAt(0).toUpperCase() +
                    user.user_type.slice(1).toLowerCase()
                  : 'User',
                avatar: getProfileUrl(user.profile_url) || null,
                isFollowing,
              };
            })
          );
          setSearchResults(transformedResults);
        } else {
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
      }

      // Process posts
      if (postsResponse && postsResponse.ok) {
        const data = await postsResponse.json();
        if (data.success && data.posts) {
          const filteredPosts: PostData[] = data.posts
            .filter((post: any) => {
              const username = (post.username || '').toLowerCase();
              const caption = (post.caption || '').toLowerCase();
              return (
                username.includes(searchLower) || caption.includes(searchLower)
              );
            })
            .map((post: any) => ({
              id: post.id,
              username: post.username || 'User',
              user_profile_url: post.user_profile_url || null,
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
          setSearchPosts(filteredPosts);
        } else {
          setSearchPosts([]);
        }
      } else {
        setSearchPosts([]);
      }

      // Process clips
      if (clipsResponse && clipsResponse.ok) {
        const data = await clipsResponse.json();
        if (data.success && data.clips) {
          const filteredClips: ClipResult[] = data.clips
            .filter((clip: any) => {
              const username = (clip.username || '').toLowerCase();
              const description = (clip.description || '').toLowerCase();
              return (
                username.includes(searchLower) ||
                description.includes(searchLower)
              );
            })
            .map((clip: any) => ({
              id: clip.id,
              user_id: clip.user_id,
              username: clip.username || 'User',
              user_profile_url: clip.user_profile_url || null,
              video_url: clip.video_url,
              description: clip.description,
              like_count: clip.like_count || 0,
              comment_count: clip.comment_count || 0,
              created_at: clip.created_at,
            }));
          setSearchClips(filteredClips);
        } else {
          setSearchClips([]);
        }
      } else {
        setSearchClips([]);
      }

      // Process articles
      if (articlesResponse && articlesResponse.ok) {
        const data = await articlesResponse.json();
        if (data.success && data.articles) {
          const filteredArticles: PostData[] = data.articles
            .filter((article: any) => {
              const username = (article.username || '').toLowerCase();
              const title = (article.title || '').toLowerCase();
              const body = (article.body || '').toLowerCase();
              return (
                username.includes(searchLower) ||
                title.includes(searchLower) ||
                body.includes(searchLower)
              );
            })
            .map((article: any) => ({
              id: article.id,
              username: article.username || 'User',
              user_profile_url: article.user_profile_url || null,
              user_id: article.user_id,
              post_type: 'article',
              caption: article.body ? article.body.substring(0, 200) : null,
              media_url: article.image_url || null,
              article_title: article.title,
              article_body: article.body,
              like_count: article.like_count || 0,
              comment_count: article.comment_count || 0,
              save_count: article.save_count || 0,
              created_at: article.created_at,
            }));
          setSearchArticles(filteredArticles);
        } else {
          setSearchArticles([]);
        }
      } else {
        setSearchArticles([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setSearchPosts([]);
      setSearchClips([]);
      setSearchArticles([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFollow = async (
    userId: string,
    isCurrentlyFollowing: boolean
  ) => {
    if (!currentUserId) {
      alert('You must be logged in to follow users');
      return;
    }

    try {
      const endpoint = isCurrentlyFollowing
        ? `http://localhost:3001/api/network/unfollow/${userId}`
        : `http://localhost:3001/api/network/follow/${userId}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUserId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSearchResults(prevResults =>
          prevResults.map(person =>
            person.id === userId
              ? { ...person, isFollowing: !isCurrentlyFollowing }
              : person
          )
        );
      } else {
        alert(
          result.message ||
            `Failed to ${isCurrentlyFollowing ? 'unfollow' : 'follow'} user`
        );
      }
    } catch (error) {
      console.error(
        `Error ${isCurrentlyFollowing ? 'unfollowing' : 'following'} user:`,
        error
      );
      alert(
        `Failed to ${isCurrentlyFollowing ? 'unfollow' : 'follow'} user. Please try again.`
      );
    }
  };

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'posts', label: 'Posts' },
    { id: 'clips', label: 'Clips' },
    { id: 'articles', label: 'Articles' },
    { id: 'events', label: 'Events' },
    { id: 'opportunities', label: 'Opportunities' },
    { id: 'network', label: 'Network' },
  ];

  // Filter posts based on active filter and search query
  const getFilteredPosts = () => {
    // Use search results if we have a search query, otherwise use dummy data
    let posts = searchQuery.trim() !== '' ? searchPosts : allPosts;

    // If using dummy data and there's a search query, filter it
    if (searchQuery.trim() !== '' && posts === allPosts) {
      const searchLower = searchQuery.toLowerCase();
      posts = posts.filter(
        post =>
          post.username.toLowerCase().includes(searchLower) ||
          (post.caption && post.caption.toLowerCase().includes(searchLower)) ||
          (post.article_title &&
            post.article_title.toLowerCase().includes(searchLower)) ||
          (post.event_title &&
            post.event_title.toLowerCase().includes(searchLower))
      );
    }

    // Filter by post type based on active filter
    if (activeFilter === 'all') return posts;
    if (activeFilter === 'posts')
      return posts.filter(
        p =>
          p.post_type === 'photo' ||
          p.post_type === 'text' ||
          p.post_type === 'video'
      );
    if (activeFilter === 'clips') return []; // Clips are handled separately
    if (activeFilter === 'articles') {
      // If we have search results, use searchArticles, otherwise filter from posts
      if (searchQuery.trim() !== '' && searchArticles.length > 0) {
        return searchArticles;
      }
      return posts.filter(p => p.post_type === 'article');
    }
    if (activeFilter === 'events')
      return posts.filter(p => p.post_type === 'event');
    if (activeFilter === 'opportunities') return []; // Opportunities will be defined later

    return [];
  };

  const renderContent = () => {
    // Show people search results for Network tab
    if (activeFilter === 'network') {
      if (isSearching) {
        return (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CB9729] mx-auto"></div>
            <p className="text-gray-500 mt-4">Searching...</p>
          </div>
        );
      }

      if (searchQuery === '') {
        return (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <SearchIcon className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start searching
            </h3>
            <p className="text-gray-500">Search for people in your network</p>
          </div>
        );
      }

      if (searchResults.length === 0) {
        return (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <SearchIcon className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No results found
            </h3>
            <p className="text-gray-500">
              No people found matching "{searchQuery}"
            </p>
          </div>
        );
      }

      return (
        <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
          {searchResults.map(person => (
            <div
              key={person.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                  {person.avatar ? (
                    <img
                      src={person.avatar}
                      alt={person.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 font-semibold text-sm">
                      {getInitials(person.name)}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {person.name}
                  </p>
                  <p className="text-xs text-gray-500">{person.role}</p>
                </div>
                <button
                  onClick={() => handleFollow(person.id, person.isFollowing)}
                  className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors flex-shrink-0 ${
                    person.isFollowing
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {person.isFollowing ? 'Following' : 'Follow'}
                </button>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // For "All" tab - show people, posts, clips, and articles
    if (activeFilter === 'all') {
      const filteredPosts = getFilteredPosts();
      // Combine posts with articles, avoiding duplicates
      const articleIdsInPosts = new Set(
        filteredPosts.filter(p => p.post_type === 'article').map(p => p.id)
      );
      const uniqueArticles = searchArticles.filter(
        article => !articleIdsInPosts.has(article.id)
      );
      const allPostsForDisplay = [...filteredPosts, ...uniqueArticles];

      const hasPeople = searchQuery.trim() !== '' && searchResults.length > 0;
      const hasPosts = allPostsForDisplay.length > 0;
      const hasClips = searchClips.length > 0;

      if (isSearching) {
        return (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#CB9729] mx-auto"></div>
            <p className="text-gray-500 mt-4">Searching...</p>
          </div>
        );
      }

      if (searchQuery === '') {
        return (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <SearchIcon className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start searching
            </h3>
            <p className="text-gray-500">
              Search for posts, clips, articles, events, opportunities, and
              people
            </p>
          </div>
        );
      }

      if (!hasPeople && !hasPosts && !hasClips) {
        return (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <SearchIcon className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No results found
            </h3>
            <p className="text-gray-500">
              No results found matching "{searchQuery}"
            </p>
          </div>
        );
      }

      return (
        <div className="flex flex-col gap-4">
          {/* People Section */}
          {hasPeople && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3 px-2">
                People
              </h3>
              <div className="bg-white rounded-lg shadow-sm divide-y divide-gray-200">
                {searchResults.map(person => (
                  <div
                    key={person.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                        {person.avatar ? (
                          <img
                            src={person.avatar}
                            alt={person.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-semibold text-sm">
                            {getInitials(person.name)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {person.name}
                        </p>
                        <p className="text-xs text-gray-500">{person.role}</p>
                      </div>
                      <button
                        onClick={() =>
                          handleFollow(person.id, person.isFollowing)
                        }
                        className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors flex-shrink-0 ${
                          person.isFollowing
                            ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {person.isFollowing ? 'Following' : 'Follow'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clips Section */}
          {hasClips && (
            <div>
              {(hasPeople || hasPosts) && (
                <h3 className="text-lg font-semibold text-gray-900 mb-3 px-2">
                  Clips
                </h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {searchClips.map(clip => {
                  const videoUrl = clip.video_url?.startsWith('http')
                    ? clip.video_url
                    : `http://localhost:3001${clip.video_url}`;

                  return (
                    <div
                      key={clip.id}
                      className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <div className="relative aspect-square bg-gray-100">
                        <video
                          src={videoUrl}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <Play
                            className="w-12 h-12 text-white opacity-80"
                            fill="white"
                          />
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          {clip.user_profile_url ? (
                            <img
                              src={getProfileUrl(clip.user_profile_url) || ''}
                              alt={clip.username}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-gray-600 font-semibold text-xs">
                                {getInitials(clip.username)}
                              </span>
                            </div>
                          )}
                          <span className="text-sm font-semibold text-gray-900">
                            {clip.username}
                          </span>
                        </div>
                        {clip.description && (
                          <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                            {clip.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>{clip.like_count} likes</span>
                          <span>{clip.comment_count} comments</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Posts Section (includes posts and articles) */}
          {hasPosts && (
            <div>
              {(hasPeople || hasClips) && (
                <h3 className="text-lg font-semibold text-gray-900 mb-3 px-2">
                  Posts & Articles
                </h3>
              )}
              <div className="flex flex-col gap-4">
                {allPostsForDisplay.map(post => (
                  <Post
                    key={post.id}
                    post={post}
                    currentUserProfileUrl={getProfileUrl(
                      currentUser?.profile_url
                    )}
                    currentUsername={currentUser?.full_name || 'User'}
                    currentUserId={currentUserId || undefined}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    // Show clips for Clips filter
    if (activeFilter === 'clips') {
      if (searchQuery.trim() === '') {
        return (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <SearchIcon className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Start searching
            </h3>
            <p className="text-gray-500">Search for clips</p>
          </div>
        );
      }

      if (searchClips.length === 0) {
        return (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <SearchIcon className="mx-auto text-gray-300 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No clips found
            </h3>
            <p className="text-gray-500">
              No clips found matching "{searchQuery}"
            </p>
          </div>
        );
      }

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {searchClips.map(clip => {
            const videoUrl = clip.video_url?.startsWith('http')
              ? clip.video_url
              : `http://localhost:3001${clip.video_url}`;

            return (
              <div
                key={clip.id}
                className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="relative aspect-square bg-gray-100">
                  <video
                    src={videoUrl}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play
                      className="w-12 h-12 text-white opacity-80"
                      fill="white"
                    />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {clip.user_profile_url ? (
                      <img
                        src={getProfileUrl(clip.user_profile_url) || ''}
                        alt={clip.username}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-600 font-semibold text-xs">
                          {getInitials(clip.username)}
                        </span>
                      </div>
                    )}
                    <span className="text-sm font-semibold text-gray-900">
                      {clip.username}
                    </span>
                  </div>
                  {clip.description && (
                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                      {clip.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>{clip.like_count} likes</span>
                    <span>{clip.comment_count} comments</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Show posts for other filters (Posts, Articles, Events, Opportunities)
    const filteredPosts = getFilteredPosts();

    if (searchQuery.trim() === '') {
      return (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <SearchIcon className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Start searching
          </h3>
          <p className="text-gray-500">Search for {activeFilter}</p>
        </div>
      );
    }

    if (filteredPosts.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <SearchIcon className="mx-auto text-gray-300 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No {activeFilter} found
          </h3>
          <p className="text-gray-500">
            No {activeFilter} found matching "{searchQuery}"
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4">
        {filteredPosts.map(post => (
          <Post
            key={post.id}
            post={post}
            currentUserProfileUrl={getProfileUrl(currentUser?.profile_url)}
            currentUsername={currentUser?.full_name || 'User'}
            currentUserId={currentUserId || undefined}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="h-screen bg-[#D4D4D4] flex flex-col overflow-hidden">
      <Header
        userName={currentUser?.full_name}
        userProfileUrl={getProfileUrl(currentUser?.profile_url)}
      />

      <main className="flex flex-1 w-full mt-5 overflow-hidden">
        <div className="hidden md:flex px-6">
          <NavigationBar activeItem="search" />
        </div>

        <div className="flex-1 flex flex-col px-4 overflow-hidden min-w-0">
          <div className="flex-1 overflow-y-auto pr-2 min-h-0">
            <div className="flex flex-col gap-4 pb-4">
              {/* Search Header */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">
                  Search
                </h1>

                {/* Search Input */}
                <div className="relative">
                  <SearchIcon
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search for posts, clips, articles, events, opportunities, and people..."
                    value={searchQuery}
                    onChange={e => handleSearch(e.target.value)}
                    className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] focus:border-transparent"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSearchResults([]);
                        setSearchPosts([]);
                        setSearchClips([]);
                        setSearchArticles([]);
                      }}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              </div>

              {/* Search Filters */}
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex gap-2 overflow-x-auto">
                  {filters.map(filter => (
                    <button
                      key={filter.id}
                      onClick={() => setActiveFilter(filter.id)}
                      className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                        activeFilter === filter.id
                          ? 'bg-[#CB9729] text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Content Area */}
              {renderContent()}
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
