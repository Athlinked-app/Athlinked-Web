'use client';

import { useState, useEffect } from 'react';
import { X, ArrowLeft, Search, Send } from 'lucide-react';
import type { PostData } from '../Post';

export interface UserData {
  id: string;
  name: string;
  profile_url: string;
  isGroup?: boolean;
}

interface ShareModalProps {
  open: boolean;
  post: PostData;
  onClose: () => void;
  onShare?: (selectedUsers: string[], message: string) => void;
}

export default function ShareModal({
  open,
  post,
  onClose,
  onShare,
}: ShareModalProps) {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);

  // Load users from localStorage or use dummy data
  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = () => {
    // Try to load from localStorage, otherwise use dummy data
    const storedUsers = localStorage.getItem('athlinked_users');
    if (storedUsers) {
      try {
        const parsedUsers = JSON.parse(storedUsers);
        setUsers(parsedUsers);
      } catch (error) {
        console.error('Error parsing users:', error);
        setUsers(getDummyUsers());
      }
    } else {
      setUsers(getDummyUsers());
    }
  };

  const getDummyUsers = (): UserData[] => {
    return [
      {
        id: '1',
        name: 'Yazhini',
        profile_url: '/assets/Header/profiledummy.jpeg',
        isGroup: true,
      },
      {
        id: '2',
        name: 'Rahul Dravid',
        profile_url: '/assets/Header/profiledummy.jpeg',
      },
      {
        id: '3',
        name: 'Gautham Gambhir',
        profile_url: '/assets/Header/profiledummy.jpeg',
      },
      {
        id: '4',
        name: 'Virat Kohli',
        profile_url: '/assets/Header/profiledummy.jpeg',
      },
      {
        id: '5',
        name: 'MS Dhoni',
        profile_url: '/assets/Header/profiledummy.jpeg',
      },
      {
        id: '6',
        name: 'Rohit Sharma',
        profile_url: '/assets/Header/profiledummy.jpeg',
      },
    ];
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSend = () => {
    if (selectedUsers.size === 0) return;

    const selectedUserIds = Array.from(selectedUsers);
    
    // Save share data to localStorage
    const shareData = {
      post_id: post.id,
      shared_with: selectedUserIds,
      message: message.trim(),
      shared_at: new Date().toISOString(),
    };

    const existingShares = JSON.parse(
      localStorage.getItem('athlinked_shares') || '[]'
    );
    existingShares.push(shareData);
    localStorage.setItem('athlinked_shares', JSON.stringify(existingShares));

    if (onShare) {
      onShare(selectedUserIds, message.trim());
    }

    // Reset and close
    setSelectedUsers(new Set());
    setMessage('');
    setSearchQuery('');
    onClose();
  };

  const handleClose = () => {
    setSelectedUsers(new Set());
    setMessage('');
    setSearchQuery('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-lg font-semibold text-gray-900">Share</h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center w-full border border-gray-200 rounded-lg px-3 py-2 bg-white">
            <Search className="w-5 h-5 text-gray-500 mr-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Type here..."
              className="w-full text-gray-700 placeholder:text-gray-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">All groups</h3>
            <div className="space-y-2">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No users found</p>
                </div>
              ) : (
                filteredUsers.map(user => {
                  const isSelected = selectedUsers.has(user.id);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                      onClick={() => toggleUserSelection(user.id)}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border border-gray-200 flex-shrink-0">
                        <img
                          src={user.profile_url}
                          alt={user.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        {user.isGroup && (
                          <p className="text-xs text-gray-500">Group</p>
                        )}
                      </div>
                      <div
                        className={`w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600'
                            : 'border-gray-300'
                        }`}
                      >
                        {isSelected && (
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Message Input and Send Button */}
        <div className="border-t border-gray-200 p-4 flex-shrink-0 space-y-3">
          <input
            type="text"
            value={message}
            onChange={e => setMessage(e.target.value)}
            placeholder="Add a message..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729]/50 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={selectedUsers.size === 0}
            className="w-full px-6 py-2 bg-[#CB9729] text-white font-semibold rounded-md hover:bg-[#b78322] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Send separately
          </button>
        </div>
      </div>
    </div>
  );
}

