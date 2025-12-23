/* eslint-disable jsx-a11y/label-has-associated-control */
'use client';

import { useState, type ChangeEvent } from 'react';
import {
  Search,
  Image as ImageIcon,
  Video,
  CalendarDays,
  Newspaper,
} from 'lucide-react';
import PostUploadModal from '@/components/Post/PostUploadModal';
import PostDetailsModal from '@/components/Post/PostDetailsModal';
import ArticleEventModal from '@/components/Post/ArticleEventModal';

type HomeHerosectionProps = {
  userProfileUrl?: string;
  username?: string;
  onPostCreated?: () => void;
};

type PostType = 'photo' | 'video' | 'article' | 'event';

export default function HomeHerosection({
  userProfileUrl = '/assets/Header/profiledummy.jpeg',
  username = 'Rohit Sharma',
  onPostCreated,
}: HomeHerosectionProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showArticleEvent, setShowArticleEvent] = useState(false);
  const [selectedPostType, setSelectedPostType] = useState<PostType | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [postText, setPostText] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setFilePreview(URL.createObjectURL(file));
    setShowUpload(false);
    setShowDetails(true);
  };

  const resetFileState = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setCaption('');
    setShowDetails(false);
  };

  const getUserData = async () => {
    const userIdentifier = localStorage.getItem('userEmail');
    if (!userIdentifier) {
      throw new Error('User not logged in');
    }

    let userResponse;
    if (userIdentifier.startsWith('username:')) {
      const username = userIdentifier.replace('username:', '');
      userResponse = await fetch(
        `http://localhost:3001/api/signup/user-by-username/${encodeURIComponent(username)}`
      );
    } else {
      userResponse = await fetch(
        `http://localhost:3001/api/signup/user/${encodeURIComponent(userIdentifier)}`
      );
    }

    if (!userResponse.ok) {
      throw new Error('Failed to fetch user data');
    }

    const userData = await userResponse.json();
    if (!userData.success || !userData.user) {
      throw new Error('User not found');
    }

    return userData.user;
  };

  const handleTextPost = async () => {
    if (!postText.trim()) return;

    setIsUploading(true);
    try {
      const userData = await getUserData();

      const response = await fetch('http://localhost:3001/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userData.id,
          post_type: 'photo',
          caption: postText.trim(),
        }),
      });

      const data = await response.json();
      if (data.success) {
        setPostText('');
        if (onPostCreated) {
          onPostCreated();
        }
      } else {
        alert(data.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating text post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleMediaPost = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    try {
      const userData = await getUserData();

      const formData = new FormData();
      formData.append('media', selectedFile);
      formData.append('user_id', userData.id);
      formData.append('post_type', selectedPostType!);
      formData.append('caption', caption);

      const response = await fetch('http://localhost:3001/api/posts', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        resetFileState();
        if (onPostCreated) {
          onPostCreated();
        }
      } else {
        alert(data.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating media post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleArticleEventSubmit = async (data: {
    title: string;
    body?: string;
    date?: string;
    location?: string;
    caption?: string;
  }) => {
    setIsUploading(true);
    try {
      const userData = await getUserData();

      const postData: any = {
        user_id: userData.id,
        post_type: selectedPostType,
        caption: data.caption || null,
      };

      if (selectedPostType === 'article') {
        postData.article_title = data.title;
        postData.article_body = data.body;
      } else if (selectedPostType === 'event') {
        postData.event_title = data.title;
        postData.event_date = data.date;
        postData.event_location = data.location;
      }

      const response = await fetch('http://localhost:3001/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(postData),
      });

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text.substring(0, 200));
        alert('Failed to create post. Server returned invalid response.');
        return;
      }

      const result = await response.json();
      console.log('Create article/event post response:', result);
      
      if (result.success) {
        setShowArticleEvent(false);
        if (onPostCreated) {
          onPostCreated();
        }
      } else {
        alert(result.message || 'Failed to create post');
      }
    } catch (error) {
      console.error('Error creating article/event post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatSize = (size: number) => {
    if (size >= 1024 * 1024) {
      return `${(size / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(size / 1024).toFixed(1)} KB`;
  };

  return (
    <div className="w-full">
      <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm p-4 md:p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden bg-gray-200 border border-gray-200">
            <img
              src={userProfileUrl}
              alt="User profile"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1">
            <div className="flex items-center w-full border border-gray-200 rounded-lg px-3 py-2 bg-white">
              <Search className="w-5 h-5 text-gray-500 mr-3" />
              <input
                type="text"
                placeholder="What's on your mind?"
                value={postText}
                onChange={e => setPostText(e.target.value)}
                onKeyPress={e => {
                  if (e.key === 'Enter') {
                    handleTextPost();
                  }
                }}
                className="w-full text-gray-700 placeholder:text-gray-400 focus:outline-none"
                disabled={isUploading}
              />
            </div>
          </div>

          <button
            onClick={handleTextPost}
            disabled={!postText.trim() || isUploading}
            className="px-8 py-2 bg-[#CB9729] text-white font-semibold rounded-md hover:bg-[#b78322] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Posting...' : 'Post'}
          </button>
        </div>

        <div className="mt-4 border-t border-gray-200 pt-3">
          <div className="grid grid-cols-4 divide-x divide-gray-200">
            <button
              type="button"
              onClick={() => {
                setSelectedPostType('photo');
                setShowUpload(true);
              }}
              className="flex items-center justify-center gap-2 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ImageIcon className="w-5 h-5 text-gray-500" />
              <span className="text-md font-medium">Photos</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedPostType('video');
                setShowUpload(true);
              }}
              className="flex items-center justify-center gap-2 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Video className="w-5 h-5 text-gray-500" />
              <span className="text-md font-medium">Videos</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedPostType('event');
                setShowArticleEvent(true);
              }}
              className="flex items-center justify-center gap-2 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <CalendarDays className="w-5 h-5 text-gray-500" />
              <span className="text-md font-medium">Events</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedPostType('article');
                setShowArticleEvent(true);
              }}
              className="flex items-center justify-center gap-2 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Newspaper className="w-5 h-5 text-gray-500" />
              <span className="text-md font-medium">Article</span>
            </button>
          </div>
        </div>
      </div>

      {selectedPostType && (
        <PostUploadModal
          open={showUpload}
          postType={selectedPostType as 'photo' | 'video'}
          onClose={() => setShowUpload(false)}
          onFileSelect={handleFileSelect}
        />
      )}

      {selectedPostType && (selectedPostType === 'photo' || selectedPostType === 'video') && (
        <PostDetailsModal
          open={showDetails}
          postType={selectedPostType}
          filePreview={filePreview}
          fileName={selectedFile?.name || 'No file selected'}
          fileSizeLabel={selectedFile ? formatSize(selectedFile.size) : ''}
          caption={caption}
          onCaptionChange={setCaption}
          onClose={resetFileState}
          onPost={handleMediaPost}
          onRemoveFile={resetFileState}
        />
      )}

      {selectedPostType && (selectedPostType === 'article' || selectedPostType === 'event') && (
        <ArticleEventModal
          open={showArticleEvent}
          postType={selectedPostType}
          onClose={() => setShowArticleEvent(false)}
          onSubmit={handleArticleEventSubmit}
        />
      )}
    </div>
  );
}
