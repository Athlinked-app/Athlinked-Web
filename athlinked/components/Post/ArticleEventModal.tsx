'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

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
  }) => void;
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

  if (!open) return null;

  const handleSubmit = () => {
    if (!title.trim()) {
      return;
    }

    onSubmit({
      title: title.trim(),
      body: body.trim() || undefined,
      date: postType === 'event' ? date : undefined,
      location: postType === 'event' ? location.trim() : undefined,
      caption: caption.trim() || undefined,
    });

    setTitle('');
    setBody('');
    setDate('');
    setLocation('');
    setCaption('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Create {postType === 'article' ? 'Article' : 'Event'}
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

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {postType === 'article' ? 'Article Title' : 'Event Title'} *
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={`Enter ${postType === 'article' ? 'article' : 'event'} title`}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
            />
          </div>

          {postType === 'article' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Article Body *
                </label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Write your article..."
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] resize-none text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Add a short description..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] resize-none text-gray-900"
                />
              </div>
            </>
          )}

          {postType === 'event' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Date *
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Location
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Enter event location"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Description
                </label>
                <textarea
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  placeholder="Add details about the event..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] resize-none text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Add a short description..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] resize-none text-gray-900"
                />
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
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

