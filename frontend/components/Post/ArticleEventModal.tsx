'use client';

import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { X, Image as ImageIcon, UploadCloud } from 'lucide-react';
import MentionInputField from '../Mention/MentionInputField';

type EventType =
  | 'work'
  | 'travel'
  | 'sports'
  | 'relationship'
  | 'health'
  | 'academy'
  | 'feeling'
  | 'custom';

type ArticleEventModalProps = {
  open: boolean;
  postType: 'article' | 'event';
  currentUserId?: string;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    body?: string;
    date?: string;
    location?: string;
    caption?: string;
    image?: File;
    eventType?: EventType;
  }) => void;
  isUploading?: boolean;
};

const DEFAULT_EVENT_TYPE: EventType = 'custom';

const eventTypeLabels: Record<EventType, string> = {
  work: 'Work',
  travel: 'Travel',
  sports: 'Sports',
  relationship: 'Relationship',
  health: 'Health',
  academy: 'Academy',
  feeling: 'Feeling & Interest',
  custom: 'Live',
};

const getEventTypeLabel = (type: EventType): string => {
  if (type === 'custom') return ' Events';
  return `${eventTypeLabels[type]} Events`;
};

export default function ArticleEventModal({
  open,
  postType,
  currentUserId,
  onClose,
  onSubmit,
  isUploading = false,
}: ArticleEventModalProps) {
  const isEvent = postType === 'event';
  const isArticle = postType === 'article';

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(
    null
  );
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const articleImageInputRef = useRef<HTMLInputElement>(null);
  const [articleImage, setArticleImage] = useState<File | null>(null);
  const [articleImagePreview, setArticleImagePreview] = useState<string | null>(
    null
  );

  // Skip the event-category picker and go straight to the event form.
  useEffect(() => {
    if (open && postType === 'event' && !selectedEventType) {
      setSelectedEventType(DEFAULT_EVENT_TYPE);
    }
  }, [open, postType, selectedEventType]);

  if (!open) return null;

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleArticleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setArticleImage(file);
      setArticleImagePreview(URL.createObjectURL(file));
    }
  };

  const isVideoFile = (file: File | null): boolean => {
    if (!file) return false;
    return file.type.startsWith('video/');
  };

  const handleArticleImageClick = () => {
    articleImageInputRef.current?.click();
  };

  const handleRemoveArticleImage = () => {
    setArticleImage(null);
    setArticleImagePreview(null);
    if (articleImageInputRef.current) {
      articleImageInputRef.current.value = '';
    }
  };

  const handleBack = () => {
    setSelectedEventType(null);
    setSelectedImage(null);
    setImagePreview(null);
    setArticleImage(null);
    setArticleImagePreview(null);
    setTitle('');
    setLocation('');
    setDate('');
    setBody('');
    setCaption('');
  };

  const handleSubmit = async () => {
    // Requirements:
    // - Article: body required (media optional, title optional)
    // - Event: date required, other fields optional (media optional)
    if (isArticle) {
      if (!body.trim()) return;
    } else if (isEvent) {
      if (!date) return;
    }

    const ensuredEventType =
      postType === 'event'
        ? (selectedEventType ?? DEFAULT_EVENT_TYPE)
        : undefined;

    const normalizedTitle = isEvent
      ? title.trim() ||
        getEventTypeLabel(ensuredEventType ?? DEFAULT_EVENT_TYPE).trim() ||
        'Life Event'
      : title.trim() || 'Untitled Article';

    const submitData = {
      title: normalizedTitle,
      body: postType === 'article' ? body.trim() : body.trim() || undefined,
      date: postType === 'event' ? date : undefined,
      location: postType === 'event' ? location.trim() : undefined,
      caption: caption.trim() || undefined,
      image:
        postType === 'event'
          ? selectedImage || undefined
          : articleImage || undefined,
      eventType: postType === 'event' ? ensuredEventType : undefined,
    };

    setTitle('');
    setBody('');
    setDate('');
    setLocation('');
    setCaption('');
    setSelectedEventType(null);
    setSelectedImage(null);
    setImagePreview(null);
    setArticleImage(null);
    setArticleImagePreview(null);

    onClose();

    onSubmit(submitData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-0">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Create {postType === 'article' ? 'Article' : 'life events'}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {postType === 'event' && selectedEventType && (
          <div className="mb-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {getEventTypeLabel(selectedEventType)}
            </h3>
          </div>
        )}

        <div className="space-y-4">
          {postType === 'event' && (
            <div>
              <div
                onClick={handleImageClick}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#CB9729] transition-colors bg-gray-50"
              >
                {imagePreview ? (
                  <div className="relative">
                    {isVideoFile(selectedImage) ? (
                      <video
                        src={imagePreview}
                        controls
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    ) : (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    )}
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <ImageIcon className="w-12 h-12 text-gray-400" />
                    <span className="text-gray-600 font-medium">
                      Select Image/Video
                    </span>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {postType === 'article' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Media Upload (Photo/Video)
              </label>
              <div
                onClick={handleArticleImageClick}
                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-[#CB9729] transition-colors bg-gray-50"
              >
                {articleImagePreview ? (
                  <div className="relative">
                    {isVideoFile(articleImage) ? (
                      <video
                        src={articleImagePreview}
                        controls
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    ) : (
                      <img
                        src={articleImagePreview}
                        alt="Preview"
                        className="w-full h-64 object-cover rounded-lg"
                      />
                    )}
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleRemoveArticleImage();
                      }}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <UploadCloud className="w-12 h-12 text-gray-400" />
                    <span className="text-gray-600 font-medium">
                      Choose a media file or drag & drop it here
                    </span>
                    <span className="text-xs text-gray-500 mt-1">
                      Images: JPG, JPEG, PNG, WebP, GIF | Videos: MP4, MOV
                    </span>
                  </div>
                )}
                <input
                  ref={articleImageInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,video/mp4,video/quicktime"
                  onChange={handleArticleImageSelect}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {postType === 'article' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Write your article..."
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900 resize-none"
              />
            </div>
          )}

          {postType === 'event' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  placeholder="Select the date"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                {currentUserId ? (
                  <MentionInputField
                    value={caption}
                    onChange={setCaption}
                    currentUserId={currentUserId}
                    placeholder="Add a Description..."
                    className="px-4 py-2 text-gray-900 resize-none"
                    type="textarea"
                    rows={3}
                  />
                ) : (
                  <textarea
                    value={caption}
                    onChange={e => setCaption(e.target.value)}
                    placeholder="Add a Description..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900 resize-none"
                  />
                )}
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isUploading}
            className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={
              isUploading || (isArticle && !body.trim()) || (isEvent && !date)
            }
            className={`px-6 py-2 rounded-md font-semibold transition-colors disabled:cursor-not-allowed flex items-center gap-2 ${
              isUploading
                ? 'bg-white border-2 border-[#CB9729] text-[#CB9729]'
                : 'bg-[#CB9729] text-white hover:bg-[#b78322] disabled:opacity-50'
            }`}
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-[#CB9729] border-t-transparent rounded-full animate-spin"></div>
                <span>Posting...</span>
              </>
            ) : (
              'Post'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
