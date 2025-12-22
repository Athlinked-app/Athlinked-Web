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
import PhotosUploadModal, { PostDetailsModal } from '@/components/Photos';

type HomeHerosectionProps = {
  userProfileUrl?: string;
  username?: string;
  onPostCreated?: () => void;
};

export default function HomeHerosection({
  userProfileUrl = '/assets/Header/profiledummy.jpeg',
  username = 'Rohit Sharma',
  onPostCreated,
}: HomeHerosectionProps) {
  const [showUpload, setShowUpload] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('Public');
  const [postText, setPostText] = useState('');

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setDescription('');
      setPrivacy('Public');
      setShowUpload(false);
      setShowDetails(true);
    }
  };

  const resetFileState = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setDescription('');
    setPrivacy('Public');
    setShowDetails(false);
  };

  const handlePost = () => {
    // Create post if there's text or an image
    const hasText = postText.trim().length > 0;
    const hasImage = selectedFile && filePreview;

    if (hasText || hasImage) {
      // Create a new post object
      const newPost = {
        id: `post-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        username: username,
        user_profile_url: userProfileUrl,
        image_url: filePreview || null, // Use the preview URL (blob URL) or null
        description: hasText ? postText.trim() : (description || null),
        like_count: 0,
        comment_count: 0,
        created_at: new Date().toISOString(),
      };

      // Get existing posts from localStorage
      const existingPosts = JSON.parse(localStorage.getItem('athlinked_posts') || '[]');
      
      // Add new post to the beginning of the array
      const updatedPosts = [newPost, ...existingPosts];
      
      // Save back to localStorage
      localStorage.setItem('athlinked_posts', JSON.stringify(updatedPosts));

      // Notify parent component to refresh
      if (onPostCreated) {
        onPostCreated();
      }
    }
    
    // Reset all states
    resetFileState();
    setPostText('');
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
        {/* Top: avatar, search, post button */}
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
                onChange={(e) => setPostText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handlePost();
                  }
                }}
                className="w-full text-gray-700 placeholder:text-gray-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handlePost}
            disabled={!postText.trim() && !selectedFile}
            className="px-8 py-2 bg-[#CB9729] text-white font-semibold rounded-md hover:bg-[#b78322] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Post
          </button>
        </div>

        {/* Bottom: quick actions */}
        <div className="mt-4 border-t border-gray-200 pt-3">
          <div className="grid grid-cols-4 divide-x divide-gray-200">
            <button
              type="button"
              onClick={() => setShowUpload(true)}
              className="flex items-center justify-center gap-2 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <ImageIcon className="w-5 h-5 text-gray-500" />
              <span className="text-md font-medium">Photos</span>
            </button>
            <div className="flex items-center justify-center gap-2 py-2 text-gray-700">
              <Video className="w-5 h-5 text-gray-500" />
              <span className="text-md font-medium">Videos</span>
            </div>
            <div className="flex items-center justify-center gap-2 py-2 text-gray-700">
              <CalendarDays className="w-5 h-5 text-gray-500" />
              <span className="text-md font-medium">Events</span>
            </div>
            <div className="flex items-center justify-center gap-2 py-2 text-gray-700">
              <Newspaper className="w-5 h-5 text-gray-500" />
              <span className="text-md font-medium">Article</span>
            </div>
          </div>
        </div>
      </div>

      <PhotosUploadModal
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onFileChange={handleFileChange}
      />

      <PostDetailsModal
        open={showDetails}
        filePreview={filePreview}
        fileName={selectedFile?.name || 'No file selected'}
        fileSizeLabel={selectedFile ? formatSize(selectedFile.size) : ''}
        description={description}
        privacy={privacy}
        onDescriptionChange={setDescription}
        onPrivacyChange={setPrivacy}
        onClose={resetFileState}
        onPost={handlePost}
        onRemoveFile={resetFileState}
      />
    </div>
  );
}

