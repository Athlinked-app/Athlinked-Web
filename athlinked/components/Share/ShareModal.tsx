'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ArrowLeft, Search, Send, MessageCircle, Link, Copy, Check } from 'lucide-react';
import io, { Socket } from 'socket.io-client';
import type { PostData } from '../Post';

export interface UserData {
  id: string;
  name: string;
  profile_url: string | null;
  username?: string;
  full_name?: string;
  isGroup?: boolean;
}

interface ShareModalProps {
  open: boolean;
  post: PostData;
  onClose: () => void;
  onShare?: (selectedUsers: string[], message: string) => void;
  currentUserId?: string;
}

export default function ShareModal({
  open,
  post,
  onClose,
  onShare,
  currentUserId,
}: ShareModalProps) {
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (open && currentUserId) {
      loadFollowingUsers();
      // Initialize socket with error handling - don't block modal if it fails
      initializeSocket().catch((error) => {
        console.warn('Socket connection failed (this is okay for WhatsApp/Copy Link):', error);
        // Socket is only needed for sharing to users, not for WhatsApp or copy link
        // So we continue without it
      });
    }
    
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [open, currentUserId]);

  const initializeSocket = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!currentUserId) {
        reject(new Error('No user ID'));
        return;
      }
      
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('userId', { userId: currentUserId });
        setTimeout(() => resolve(), 100);
        return;
      }
      
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      const socket = io('http://localhost:3001', {
        transports: ['websocket'],
      });
      
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 5000);
      
      socket.on('connect', () => {
        socket.emit('userId', { userId: currentUserId });
        socketRef.current = socket;
        clearTimeout(timeout);
        setTimeout(() => resolve(), 200);
      });
      
      socket.on('connect_error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
      
      socketRef.current = socket;
    });
  };

  const loadFollowingUsers = async () => {
    if (!currentUserId) return;
    
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3001/api/network/following/${currentUserId}`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.following) {
          const followingUsers: UserData[] = data.following.map((user: any) => ({
            id: user.id,
            name: user.full_name || user.username || 'User',
            profile_url: user.profile_url || null,
            username: user.username,
            full_name: user.full_name,
          }));
          setUsers(followingUsers);
        } else {
          setUsers([]);
        }
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('Error loading following users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };
  
  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getProfileUrl = (url: string | null | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    return `http://localhost:3001${url}`;
  };

  const handleShareToWhatsApp = () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    const text = message.trim() 
      ? `${message.trim()}\n\n${postUrl}`
      : `Check out this post: ${postUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleCopyLink = async () => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(postUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const handleShareToUsers = async () => {
    if (selectedUsers.size === 0 || !currentUserId) return;

    const selectedUserIds = Array.from(selectedUsers);
    
    try {
      // Try to initialize socket, but handle errors gracefully
      try {
        await initializeSocket();
      } catch (socketError) {
        console.warn('Socket initialization failed, retrying...', socketError);
        // Retry once after a short delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        try {
          await initializeSocket();
        } catch (retryError) {
          throw new Error('Unable to connect to server. Please check your connection and try again.');
        }
      }
      
      if (!socketRef.current || !socketRef.current.connected) {
        throw new Error('Socket connection failed. Please try again.');
      }
      
      const shareMessage = message.trim() || `Check out this post!`;
      const postUrl = `${window.location.origin}/post/${post.id}`;
      
      const postData = {
        id: post.id,
        username: post.username,
        user_profile_url: post.user_profile_url,
        post_type: post.post_type,
        caption: post.caption,
        media_url: post.media_url || post.image_url,
        article_title: post.article_title,
        article_body: post.article_body,
        event_title: post.event_title,
        event_date: post.event_date,
        event_location: post.event_location,
        event_type: post.event_type,
        created_at: post.created_at,
        post_url: postUrl,
      };
      
      const fullMessage = shareMessage;
      
      let successCount = 0;
      const errors: string[] = [];
      
      for (const userId of selectedUserIds) {
        try {
          const response = await fetch('http://localhost:3001/api/messages/conversations/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: currentUserId,
              otherUserId: userId,
            }),
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.conversation) {
              const conversationId = data.conversation.conversation_id || data.conversation.id;
              
              if (!conversationId) {
                errors.push(`No conversation ID for user ${userId}`);
                continue;
              }
              
              if (socketRef.current && socketRef.current.connected) {
                socketRef.current.emit('send_message', {
                  conversationId: conversationId,
                  receiverId: userId,
                  message: fullMessage,
                  post_data: JSON.stringify(postData),
                  message_type: 'post',
                });
                
                await new Promise(resolve => setTimeout(resolve, 500));
                successCount++;
              } else {
                errors.push(`Socket not connected for user ${userId}`);
              }
            } else {
              errors.push(`Failed to get conversation for user ${userId}`);
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            errors.push(`API error for user ${userId}: ${errorData.message || 'Unknown error'}`);
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Error sharing with user ${userId}: ${errorMsg}`);
          console.error(`Error sharing with user ${userId}:`, error);
        }
      }
      
      if (errors.length > 0) {
        console.error('Share errors:', errors);
      }

      if (successCount > 0) {
        if (onShare) {
          onShare(selectedUserIds, message.trim());
        }

        setSelectedUsers(new Set());
        setMessage('');
        setSearchQuery('');
        onClose();
      } else {
        alert('Failed to share post. Please try again.');
      }
    } catch (error) {
      console.error('Error sharing post:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect. Please try again.';
      alert(errorMessage);
    }
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

        {/* Share Options */}
        <div className="border-b border-gray-200 p-4 flex-shrink-0">
          <div className="flex gap-3">
            <button
              onClick={handleShareToWhatsApp}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-sm font-medium">WhatsApp</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              {linkCopied ? (
                <>
                  <Check className="w-5 h-5" />
                  <span className="text-sm font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span className="text-sm font-medium">Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Share with following</h3>
            {loading ? (
              <div className="text-center py-8 text-gray-500">
                <p>Loading...</p>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No users found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredUsers.map(user => {
                  const isSelected = selectedUsers.has(user.id);
                  return (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                      onClick={() => toggleUserSelection(user.id)}
                    >
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border border-gray-200 flex-shrink-0 flex items-center justify-center">
                        {getProfileUrl(user.profile_url) ? (
                          <img
                            src={getProfileUrl(user.profile_url) || ''}
                            alt={user.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-gray-600 font-semibold text-xs">
                            {getInitials(user.name)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        {user.username && (
                          <p className="text-xs text-gray-500">@{user.username}</p>
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
                })}
              </div>
            )}
          </div>
        </div>

        {/* Message Input and Send Button */}
        {selectedUsers.size > 0 && (
          <div className="border-t border-gray-200 p-4 flex-shrink-0 space-y-3">
            <input
              type="text"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Add a message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729]/50 text-sm"
            />
            <button
              onClick={handleShareToUsers}
              disabled={selectedUsers.size === 0}
              className="w-full px-6 py-2 bg-[#CB9729] text-white font-semibold rounded-md hover:bg-[#b78322] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Send to {selectedUsers.size} {selectedUsers.size === 1 ? 'user' : 'users'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

