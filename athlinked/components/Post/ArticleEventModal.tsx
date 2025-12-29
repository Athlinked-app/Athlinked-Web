'use client';

import { useState, useRef, useEffect, type ChangeEvent } from 'react';
import { X, Briefcase, Plane, Trophy, Heart, Stethoscope, GraduationCap, Smile, Flag, Image as ImageIcon, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type, Link as LinkIcon, UploadCloud } from 'lucide-react';

type EventType = 'work' | 'travel' | 'sports' | 'relationship' | 'health' | 'academy' | 'feeling' | 'custom';

type ArticleEventModalProps = {
  open: boolean;
  postType: 'article' | 'event';
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
};

const eventTypes: { type: EventType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { type: 'work', label: 'Work', icon: Briefcase },
  { type: 'travel', label: 'Travel', icon: Plane },
  { type: 'sports', label: 'Sports', icon: Trophy },
  { type: 'relationship', label: 'Relationship', icon: Heart },
  { type: 'health', label: 'Health', icon: Stethoscope },
  { type: 'academy', label: 'Academy', icon: GraduationCap },
  { type: 'feeling', label: 'Feeling & Interest', icon: Smile },
  { type: 'custom', label: 'Custom Your Event', icon: Flag },
];

const getEventTypeLabel = (type: EventType): string => {
  const eventType = eventTypes.find(et => et.type === type);
  return eventType ? `${eventType.label} Events` : 'Event';
};

export default function ArticleEventModal({
  open,
  postType,
  onClose,
  onSubmit,
}: ArticleEventModalProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [caption, setCaption] = useState('');
  const [selectedEventType, setSelectedEventType] = useState<EventType | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const articleImageInputRef = useRef<HTMLInputElement>(null);
  const [articleImage, setArticleImage] = useState<File | null>(null);
  const [articleImagePreview, setArticleImagePreview] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && !body && editorRef.current.innerHTML === '') {
      editorRef.current.innerHTML = '';
    }
  }, []);

  if (!open) return null;

  const handleEventTypeSelect = (eventType: EventType) => {
    setSelectedEventType(eventType);
  };

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

  const handleFormat = (command: string, value?: string) => {
    if (!editorRef.current) return;
    
    editorRef.current.focus();
    
    if (command === 'formatBlock' && value) {
      try {
        document.execCommand('formatBlock', false, `<${value}>`);
      } catch (e) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          if (!range.collapsed) {
            const heading = document.createElement(value);
            try {
              range.surroundContents(heading);
            } catch (err) {
              heading.innerHTML = range.toString();
              range.deleteContents();
              range.insertNode(heading);
            }
          } else {
            const heading = document.createElement(value);
            heading.textContent = 'Heading';
            range.insertNode(heading);
            range.setStartAfter(heading);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
      }
    } else {
      document.execCommand(command, false, value);
    }
    
    if (editorRef.current) {
      setBody(editorRef.current.innerHTML);
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
    if (!title.trim()) {
      return;
    }

    if (postType === 'event' && !selectedEventType) {
      return;
    }

    const submitData = {
      title: title.trim(),
      body: postType === 'article' ? (body || undefined) : (body.trim() || undefined),
      date: postType === 'event' ? date : undefined,
      location: postType === 'event' ? location.trim() : undefined,
      caption: caption.trim() || undefined,
      image: postType === 'event' ? selectedImage || undefined : articleImage || undefined,
      eventType: postType === 'event' ? selectedEventType || undefined : undefined,
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
    
    if (editorRef.current) {
      editorRef.current.innerHTML = '';
    }
    
    onClose();
    
    onSubmit(submitData);
  };

  if (postType === 'event' && !selectedEventType) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
  <div className="flex-1" />
  <h2 className="text-2xl font-semibold text-gray-900">
    Create life events
  </h2>
  <div className="flex-1 flex justify-end">
    <button
      type="button"
      aria-label="Close"
      onClick={onClose}
      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
    >
      <X className="w-5 h-5 text-gray-600" />
    </button>
  </div>
</div>

          <div className="mb-4 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Live Events</h3>
            <p className="text-sm text-gray-500">
              Please share any life events you'd like me to remember!
            </p>
          </div>

          <div className="grid grid-cols-4 gap-4 mt-10">
            {eventTypes.map(({ type, label, icon: Icon }) => (
 <button
 key={type}
 type="button"
 onClick={() => handleEventTypeSelect(type)}
 className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-50 transition-colors"
>
 <Icon className="w-12 h-12 text-gray-600" />
 <span className="text-sm font-medium text-gray-900 text-center">{label}</span>
</button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
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
                      onClick={(e) => {
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
                    <span className="text-gray-600 font-medium">Select Image/Video</span>
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
                      onClick={(e) => {
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
                    <span className="text-gray-600 font-medium">Choose a media file or drag & drop it here</span>
                    <span className="text-xs text-gray-500 mt-1">Images: JPG, JPEG, PNG, WebP, GIF | Videos: MP4, MOV</span>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {postType === 'article' ? 'Article Title' : 'Title'} *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Title..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
            />
          </div>

          {postType === 'article' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Article Body *
                </label>
                {/* Rich Text Editor Toolbar */}
                <div className="border border-gray-300 rounded-t-lg bg-gray-50 p-2 flex items-center gap-2 flex-wrap">
                  <select
                    className="px-2 py-1 text-sm border border-gray-300 rounded bg-white text-black"
                    onChange={(e) => handleFormat('fontName', e.target.value)}
                    style={{ color: '#000000' }}
                  >
                    <option value="Sans Serif" style={{ color: '#000000' }}>Sans Serif</option>
                    <option value="Arial" style={{ color: '#000000' }}>Arial</option>
                    <option value="Times New Roman" style={{ color: '#000000' }}>Times New Roman</option>
                    <option value="Courier New" style={{ color: '#000000' }}>Courier New</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => handleFormat('bold')}
                    className="p-1.5 hover:bg-gray-200 rounded"
                    title="Bold"
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormat('italic')}
                    className="p-1.5 hover:bg-gray-200 rounded"
                    title="Italic"
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormat('underline')}
                    className="p-1.5 hover:bg-gray-200 rounded"
                    title="Underline"
                  >
                    <Underline className="w-4 h-4" />
                  </button>
                  <div className="w-px h-6 bg-gray-300" />
                  <button
                    type="button"
                    onClick={() => handleFormat('formatBlock', 'h1')}
                    className="px-2 py-1 text-sm hover:bg-gray-200 rounded font-bold"
                    title="Heading 1"
                  >
                    H1
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormat('formatBlock', 'h2')}
                    className="px-2 py-1 text-sm hover:bg-gray-200 rounded font-bold"
                    title="Heading 2"
                  >
                    H2
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormat('formatBlock', 'h3')}
                    className="px-2 py-1 text-sm hover:bg-gray-200 rounded font-bold"
                    title="Heading 3"
                  >
                    H3
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormat('formatBlock', 'h4')}
                    className="px-2 py-1 text-sm hover:bg-gray-200 rounded font-bold"
                    title="Heading 4"
                  >
                    H4
                  </button>
                  <div className="w-px h-6 bg-gray-300" />
                  <button
                    type="button"
                    onClick={() => handleFormat('justifyLeft')}
                    className="p-1.5 hover:bg-gray-200 rounded"
                    title="Align Left"
                  >
                    <AlignLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormat('justifyCenter')}
                    className="p-1.5 hover:bg-gray-200 rounded"
                    title="Align Center"
                  >
                    <AlignCenter className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFormat('justifyRight')}
                    className="p-1.5 hover:bg-gray-200 rounded"
                    title="Align Right"
                  >
                    <AlignRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const url = prompt('Enter URL:');
                      if (url) handleFormat('createLink', url);
                    }}
                    className="p-1.5 hover:bg-gray-200 rounded"
                    title="Insert Link"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>
                </div>
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  onInput={(e) => {
                    const content = e.currentTarget.innerHTML;
                    setBody(content);
                  }}
                  onBlur={(e) => {
                    const content = e.currentTarget.innerHTML;
                    setBody(content);
                  }}
                  className="w-full min-h-[200px] px-4 py-3 border border-t-0 border-gray-300 rounded-b-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-black"
                  style={{ whiteSpace: 'pre-wrap', color: '#000000' }}
                  data-placeholder="Add your message here"
                />
                <style jsx global>{`
                  [contenteditable][data-placeholder]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    pointer-events: none;
                  }
                  [contenteditable] {
                    color: #000000 !important;
                  }
                  [contenteditable] * {
                    color: #000000 !important;
                  }
                `}</style>
              </div>
            </>
          )}

          {postType === 'event' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Location.."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
                />
              </div>
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
                  Caption
                </label>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900 resize-none"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {postType === 'event' && selectedEventType && (
            <button
              type="button"
              onClick={handleBack}
              className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim() || (postType === 'article' && !body.trim()) || (postType === 'event' && !date)}
            className="px-6 py-2 rounded-md bg-[#CB9729] text-white font-semibold hover:bg-[#b78322] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}

