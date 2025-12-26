'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import NavigationBar from '@/components/NavigationBar';
import { Search, CheckCheck, Check, X } from 'lucide-react';
import io, { Socket } from 'socket.io-client';
import EmojiPicker from '@/components/Message/EmojiPicker';
import GIFPicker from '@/components/Message/GIFPicker';
import FileUpload from '@/components/Message/FileUpload';

interface Conversation {
  conversation_id: string;
  other_user_id: string;
  other_user_username: string;
  other_user_profile_image: string | null;
  last_message: string | null;
  last_message_time: string | null;
  unread_count: number;
}

interface Message {
  message_id: string;
  sender_id: string;
  message: string;
  created_at: string;
  is_read: boolean;
  is_read_by_recipient?: boolean;
  is_delivered?: boolean;
  media_url?: string | null;
  message_type?: 'text' | 'image' | 'video' | 'file' | 'gif' | 'post' | null;
  post_data?: any | null;
}

interface CurrentUser {
  id: string;
  full_name: string;
  profile_url?: string;
  username?: string;
}

interface SearchUser {
  id: string;
  username: string;
  full_name: string | null;
  profile_url: string | null;
  relationship: 'following' | 'follower';
}

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedGIF, setSelectedGIF] = useState<string | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
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

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;

    const newSocket = io('http://localhost:3001', {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      newSocket.emit('userId', { userId: currentUser.id });
    });

    newSocket.on('receive_message', (data: Message & { conversation_id: string; is_delivered?: boolean; media_url?: string; message_type?: string }) => {
      if (selectedConversation?.conversation_id === data.conversation_id) {
        const isOurMessage = data.sender_id === currentUser.id;
        
        setMessages(prev => {
          const filtered = prev.filter(msg => {
            if (!msg.message_id.startsWith('temp-')) return true;
            if (msg.sender_id === data.sender_id) {
              if (msg.media_url && data.media_url) {
                return false;
              }
              if (msg.message === data.message && Math.abs(new Date(msg.created_at).getTime() - new Date(data.created_at).getTime()) < 5000) {
                return false;
              }
            }
            return true;
          });
          
          let messageType = data.message_type as 'text' | 'image' | 'video' | 'file' | 'gif' | 'post';
          if (!messageType && data.post_data) {
            messageType = 'post';
          } else if (!messageType && data.media_url) {
            const url = data.media_url.toLowerCase();
            if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || url.includes('giphy.com')) {
              messageType = url.includes('giphy.com') ? 'gif' : 'image';
            } else if (url.match(/\.(mp4|mov|webm|ogg)$/i)) {
              messageType = 'video';
            } else {
              messageType = 'file';
            }
          }
          
          let postData = null;
          if (data.post_data) {
            try {
              postData = typeof data.post_data === 'string' ? JSON.parse(data.post_data) : data.post_data;
            } catch (e) {
              console.error('Error parsing post_data:', e);
            }
          }
          
          return [...filtered, {
            message_id: data.message_id,
            sender_id: data.sender_id,
            message: data.message || '',
            created_at: data.created_at,
            is_read: false,
            is_read_by_recipient: false,
            is_delivered: isOurMessage ? (data.is_delivered || false) : true,
            media_url: data.media_url || null,
            message_type: messageType || 'text',
            post_data: postData,
          }];
        });
      }
      fetchConversations();
    });

    newSocket.on('message_delivered', (data: { message_id: string; conversation_id: string }) => {
      if (selectedConversation?.conversation_id === data.conversation_id) {
        setMessages(prev =>
          prev.map(msg =>
            msg.message_id === data.message_id ? { ...msg, is_delivered: true } : msg
          )
        );
      }
    });

    newSocket.on('messages_read', (data: { conversationId: string; readerId: string }) => {
      if (selectedConversation?.conversation_id === data.conversationId) {
        setMessages(prev =>
          prev.map(msg => {
            if (msg.sender_id === currentUser?.id && data.readerId === selectedConversation.other_user_id) {
              return { ...msg, is_read_by_recipient: true };
            } else if (msg.sender_id === data.readerId && msg.sender_id !== currentUser?.id) {
              return { ...msg, is_read: true };
            }
            return msg;
          })
        );
      }
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser?.id, selectedConversation?.conversation_id]);

  const fetchConversations = async () => {
    if (!currentUser?.id) return;
    
    try {
      const response = await fetch(
        `http://localhost:3001/api/messages/conversations?user_id=${currentUser.id}`
      );

      if (!response.ok) {
        console.error('Failed to fetch conversations');
        return;
      }

      const data = await response.json();
      if (data.success && data.conversations) {
        setConversations(data.conversations);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    if (!currentUser?.id) return;
    
    try {
      const response = await fetch(
        `http://localhost:3001/api/messages/${conversationId}?user_id=${currentUser.id}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText || 'Failed to fetch messages' };
        }
        console.error('Failed to fetch messages:', response.status, errorData);
        setMessages([]);
        return;
      }

      const data = await response.json();
      if (data.success && data.messages) {
        const messagesWithStatus = data.messages.map((msg: any) => {
          let messageType = msg.message_type;
          if (!messageType && msg.media_url) {
            const url = msg.media_url.toLowerCase();
            if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i) || url.includes('giphy.com')) {
              messageType = url.includes('giphy.com') ? 'gif' : 'image';
            } else if (url.match(/\.(mp4|mov|webm|ogg)$/i)) {
              messageType = 'video';
            } else {
              messageType = 'file';
            }
          }
          
          let postData = null;
          if (msg.post_data) {
            try {
              postData = typeof msg.post_data === 'string' ? JSON.parse(msg.post_data) : msg.post_data;
            } catch (e) {
              console.error('Error parsing post_data:', e);
            }
          }
          
          return {
            ...msg,
            is_delivered: msg.is_read_by_recipient !== undefined ? true : false,
            is_read_by_recipient: msg.is_read_by_recipient || false,
            media_url: msg.media_url || null,
            message_type: messageType || 'text',
            post_data: postData,
          };
        });
        setMessages(messagesWithStatus);
        markAsRead(conversationId);
      } else {
        console.error('Messages API returned unsuccessful response:', data);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  };

  const markAsRead = async (conversationId: string) => {
    if (!currentUser?.id) return;
    
    try {
      await fetch(`http://localhost:3001/api/messages/${conversationId}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: currentUser.id,
        }),
      });
      fetchConversations();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim() || !currentUser?.id) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3001/api/messages/search/users?q=${encodeURIComponent(query)}&user_id=${currentUser.id}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to search users:', response.status, errorData);
        return;
      }

      const data = await response.json();
      if (data.success && data.users) {
        setSearchResults(data.users);
        setShowSearchResults(true);
      } else {
        console.error('Search users response error:', data);
      }
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery.trim()) {
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers(searchQuery);
      }, 300);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, currentUser?.id]);

  const handleSelectUser = async (user: SearchUser) => {
    if (!currentUser?.id) return;

    try {
      const existingConv = conversations.find(
        (conv) => conv.other_user_id === user.id
      );

      if (existingConv) {
        setSelectedConversation(existingConv);
        setSearchQuery('');
        setShowSearchResults(false);
        return;
      }
      const response = await fetch(
        'http://localhost:3001/api/messages/conversations/create',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: currentUser.id,
            otherUserId: user.id,
          }),
        }
      );

      if (!response.ok) {
        let errorData: { message?: string } = {};
        try {
          const text = await response.text();
          errorData = text ? JSON.parse(text) : {};
        } catch (e) {
          console.error('Failed to parse error response:', e);
        }
        console.error('Failed to create conversation:', response.status, errorData);
        alert(`Failed to create conversation: ${errorData?.message || 'Unknown error'}`);
        return;
      }

      const data = await response.json();
      if (data.success && data.conversation) {
        setSelectedConversation(data.conversation);
        await fetchConversations();
        setSearchQuery('');
        setShowSearchResults(false);
      } else {
        console.error('Create conversation response error:', data);
      }
    } catch (error) {
      console.error('Error selecting user:', error);
    }
  };

  useEffect(() => {
    if (currentUser?.id) {
      fetchConversations();
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.conversation_id);
    }
  }, [selectedConversation?.conversation_id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleEmojiSelect = (emoji: string) => {
    setMessageInput(prev => prev + emoji);
  };

  const handleGIFSelect = (gifUrl: string) => {
    setSelectedGIF(gifUrl);
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleFileSelect = async (file: File, type: 'image' | 'video' | 'file') => {
    setSelectedFile(file);
    setSelectedGIF(null);
    
    if (type === 'image' || type === 'video') {
      const preview = URL.createObjectURL(file);
      setFilePreview(preview);
    } else {
      setFilePreview(null);
    }
  };

  const clearMedia = () => {
    setSelectedFile(null);
    setSelectedGIF(null);
    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }
  };

  const handleSendMessage = async () => {
    if ((!messageInput.trim() && !selectedFile && !selectedGIF) || !selectedConversation || !socket || !currentUser) return;

    const tempMessageId = `temp-${Date.now()}`;
    const messageText = messageInput.trim();

    let messageType: 'text' | 'image' | 'video' | 'file' | 'gif' = 'text';
    let mediaUrl: string | null = null;

    if (selectedGIF) {
      messageType = 'gif';
      mediaUrl = selectedGIF;
    } else if (selectedFile) {
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('conversation_id', selectedConversation.conversation_id);
        formData.append('sender_id', currentUser.id);
        formData.append('receiver_id', selectedConversation.other_user_id);
        if (messageText) {
          formData.append('message', messageText);
        }

        const uploadResponse = await fetch('http://localhost:3001/api/messages/upload', {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }

        const uploadData = await uploadResponse.json();
        if (uploadData.success) {
          mediaUrl = uploadData.media_url;
          messageType = selectedFile.type.startsWith('image/') ? 'image' : 
                       selectedFile.type.startsWith('video/') ? 'video' : 'file';
        } else {
          throw new Error(uploadData.message || 'Failed to upload file');
        }
      } catch (error) {
        console.error('Error uploading file:', error);
        alert('Failed to upload file. Please try again.');
        return;
      }
    }

    const optimisticMessage: Message = {
      message_id: tempMessageId,
      sender_id: currentUser.id,
      message: messageText || (selectedGIF ? 'GIF' : selectedFile?.name || ''),
      created_at: new Date().toISOString(),
      is_read: false,
      is_read_by_recipient: false,
      is_delivered: false,
      media_url: mediaUrl || selectedGIF || null,
      message_type: messageType,
    };

    setMessages(prev => [...prev, optimisticMessage]);

    socket.emit('send_message', {
      conversationId: selectedConversation.conversation_id,
      receiverId: selectedConversation.other_user_id,
      message: messageText || (selectedGIF ? 'GIF' : selectedFile?.name || ''),
      media_url: mediaUrl || selectedGIF || null,
      message_type: messageType,
    });

    setMessageInput('');
    clearMedia();
    fetchConversations();
  };

  const getProfileUrl = (profileUrl?: string | null): string | undefined => {
    if (!profileUrl || profileUrl.trim() === '') return undefined;
    if (profileUrl.startsWith('http')) return profileUrl;
    if (profileUrl.startsWith('/') && !profileUrl.startsWith('/assets')) {
      return `http://localhost:3001${profileUrl}`;
    }
    return profileUrl;
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    const timeString = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (minutes < 1) {
      return 'Just now';
    }
    if (date.toDateString() === now.toDateString()) {
      return timeString;
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatMessageTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    const timeString = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    if (minutes < 1) {
      return 'Just now';
    }
    if (date.toDateString() === now.toDateString()) {
      return timeString;
    }
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday ${timeString}`;
    }
    if (days < 7) {
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      return `${dayName} ${timeString}`;
    }
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.other_user_username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen bg-[#D4D4D4] flex flex-col overflow-hidden">
      <Header
        userName={currentUser?.full_name}
        userProfileUrl={getProfileUrl(currentUser?.profile_url)}
      />

      <main className="flex flex-1 w-full mt-5 overflow-hidden">
        <div className="hidden md:flex px-6">
          <NavigationBar activeItem="message" />
        </div>

        <div className="flex-1 flex gap-4 px-4 overflow-hidden">
          <div className="w-80 bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 relative">
              <h2 className="text-xl font-semibold text-black mb-4">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black" size={18} />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (e.target.value.trim()) {
                      setShowSearchResults(true);
                    } else {
                      setShowSearchResults(false);
                    }
                  }}
                  onFocus={() => {
                    if (searchQuery.trim() && searchResults.length > 0) {
                      setShowSearchResults(true);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setShowSearchResults(false), 200);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-black"
                />
                
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                    {searchResults.map((user) => (
                      <div
                        key={user.id}
                        onClick={() => handleSelectUser(user)}
                        className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden border border-gray-200 flex items-center justify-center flex-shrink-0">
                            {user.profile_url ? (
                              <img
                                src={getProfileUrl(user.profile_url) || ''}
                                alt={user.full_name || 'User'}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-black font-semibold text-xs">
                                {getInitials(user.full_name || 'User')}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-black truncate">
                                {user.full_name || 'User'}
                              </span>
                              <span className="text-xs text-black">
                                {user.relationship === 'following' ? 'Following' : 'Follower'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-4 text-center text-black">
                  No conversations found
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.conversation_id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedConversation?.conversation_id === conv.conversation_id
                        ? 'bg-yellow-50'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden border border-gray-200 flex items-center justify-center flex-shrink-0">
                        {conv.other_user_profile_image ? (
                          <img
                            src={getProfileUrl(conv.other_user_profile_image) || ''}
                            alt={conv.other_user_username}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-black font-semibold text-sm">
                            {getInitials(conv.other_user_username)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-black truncate">
                            {conv.other_user_username}
                          </span>
                          {conv.unread_count > 0 && (
                            <span className="bg-[#CB9729] text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-black truncate">
                            {conv.last_message || 'No messages yet'}
                          </span>
                          {conv.last_message_time && (
                            <span className="text-xs text-black ml-2 flex-shrink-0">
                              {formatTime(conv.last_message_time)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden border border-gray-200 flex items-center justify-center">
                    {selectedConversation.other_user_profile_image ? (
                      <img
                        src={getProfileUrl(selectedConversation.other_user_profile_image) || ''}
                        alt={selectedConversation.other_user_username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-black font-semibold text-xs">
                        {getInitials(selectedConversation.other_user_username)}
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-semibold text-black">
                    {selectedConversation.other_user_username}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((msg, index) => {
                    const isOwnMessage = msg.sender_id === currentUser?.id;
                    const showDate =
                      index === 0 ||
                      new Date(msg.created_at).toDateString() !==
                        new Date(messages[index - 1].created_at).toDateString();

                    return (
                      <div key={msg.message_id}>
                        {showDate && (
                          <div className="text-center text-xs text-black my-4">
                            {formatMessageTime(msg.created_at)}
                          </div>
                        )}
                        <div
                          className={`flex gap-3 ${
                            isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          {!isOwnMessage && (
                            <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden border border-gray-200 flex items-center justify-center flex-shrink-0">
                              {selectedConversation.other_user_profile_image ? (
                                <img
                                  src={
                                    getProfileUrl(selectedConversation.other_user_profile_image) ||
                                    ''
                                  }
                                  alt={selectedConversation.other_user_username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-black font-semibold text-xs">
                                  {getInitials(selectedConversation.other_user_username)}
                                </span>
                              )}
                            </div>
                          )}
                          <div
                            className={`max-w-xs lg:max-w-md rounded-lg overflow-hidden ${
                              isOwnMessage
                                ? 'bg-white border border-gray-200'
                                : 'bg-gray-100'
                            }`}
                          >
                            {msg.post_data && msg.message_type === 'post' ? (
                              <div className="w-full border border-gray-200 rounded-lg overflow-hidden bg-white max-w-md">
                                <div className="p-3 border-b border-gray-200 flex items-center gap-2">
                                  {msg.post_data.user_profile_url && (
                                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border border-gray-200 flex-shrink-0">
                                      <img
                                        src={msg.post_data.user_profile_url.startsWith('http') ? msg.post_data.user_profile_url : `http://localhost:3001${msg.post_data.user_profile_url}`}
                                        alt={msg.post_data.username || 'User'}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.style.display = 'none';
                                        }}
                                      />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-black truncate">
                                      {msg.post_data.username || 'User'}
                                    </p>
                                  </div>
                                </div>
                                {msg.post_data.media_url && (() => {
                                  const mediaUrl = msg.post_data.media_url.startsWith('http') ? msg.post_data.media_url : `http://localhost:3001${msg.post_data.media_url}`;
                                  const isVideo = msg.post_data.post_type === 'video' || 
                                                msg.post_data.media_url.match(/\.(mp4|mov|webm|ogg)$/i);
                                  
                                  if (isVideo) {
                                    return (
                                      <div className="w-full">
                                        <video
                                          src={mediaUrl}
                                          controls
                                          className="w-full h-auto object-cover"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                          }}
                                        />
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div className="w-full">
                                        <img
                                          src={mediaUrl}
                                          alt={msg.post_data.caption || msg.post_data.article_title || msg.post_data.event_title || 'Post'}
                                          className="w-full h-auto object-cover"
                                          onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                          }}
                                        />
                                      </div>
                                    );
                                  }
                                })()}
                                <div className="p-3">
                                  {msg.post_data.article_title && (
                                    <h4 className="font-semibold text-black mb-2 text-base">{msg.post_data.article_title}</h4>
                                  )}
                                  {msg.post_data.event_title && (
                                    <div className="mb-2">
                                      <h4 className="font-semibold text-black mb-1 text-base">{msg.post_data.event_title}</h4>
                                      {msg.post_data.event_date && (
                                        <p className="text-xs text-black">📅 {new Date(msg.post_data.event_date).toLocaleDateString()}</p>
                                      )}
                                      {msg.post_data.event_location && (
                                        <p className="text-xs text-black">📍 {msg.post_data.event_location}</p>
                                      )}
                                    </div>
                                  )}
                                  {msg.post_data.caption && (
                                    <p className="text-sm text-black mb-2">{msg.post_data.caption}</p>
                                  )}
                                  {msg.post_data.post_url && (
                                    <a
                                      href={msg.post_data.post_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                    >
                                      View Post →
                                    </a>
                                  )}
                                </div>
                              </div>
                            ) : msg.media_url && (() => {
                              const mediaUrl = msg.media_url.startsWith('http') ? msg.media_url : `http://localhost:3001${msg.media_url}`;
                              const urlLower = msg.media_url.toLowerCase();
                              const isImage = msg.message_type === 'image' || msg.message_type === 'gif' || 
                                            (!msg.message_type && (urlLower.match(/\.(jpg|jpeg|png|gif|webp)$/i) || urlLower.includes('giphy.com')));
                              const isVideo = msg.message_type === 'video' || 
                                            (!msg.message_type && urlLower.match(/\.(mp4|mov|webm|ogg)$/i));
                              const isGif = msg.message_type === 'gif' || urlLower.includes('giphy.com');
                              
                              if (isImage || isGif) {
                                return (
                                  <div className="w-full">
                                    <img
                                      src={mediaUrl}
                                      alt={msg.message || 'Media'}
                                      className="w-full h-auto object-cover max-w-md rounded-lg"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                );
                              } else if (isVideo) {
                                return (
                                  <div className="w-full">
                                    <video
                                      src={mediaUrl}
                                      controls
                                      className="w-full h-auto max-w-md rounded-lg"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                );
                              } else {
                                return (
                                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                    <a
                                      href={mediaUrl}
                                      download
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
                                    >
                                      <span className="text-sm font-medium">{msg.message || 'Download file'}</span>
                                    </a>
                                  </div>
                                );
                              }
                            })()}
                            
                            {msg.message && (
                              <p className={`text-sm text-black ${msg.media_url ? 'px-4 py-2' : 'px-4 py-2'}`}>
                                {msg.message}
                              </p>
                            )}
                            
                            <div className={`flex items-center justify-end gap-1.5 px-4 pb-2 ${isOwnMessage ? '' : 'justify-start'}`}>
                              <span className="text-xs text-black">
                                {formatMessageTimestamp(msg.created_at)}
                              </span>
                              {isOwnMessage && (
                                <div className="flex items-center">
                                  {msg.is_read_by_recipient ? (
                                    <CheckCheck size={16} className="text-[#53BDEB]" strokeWidth={2.5} />
                                  ) : msg.is_delivered ? (
                                    <CheckCheck size={16} className="text-[#8696A0]" strokeWidth={2.5} />
                                  ) : (
                                    <Check size={12} className="text-[#8696A0]" strokeWidth={2.5} />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-gray-200">
                  {(selectedFile || selectedGIF || filePreview) && (
                    <div className="mb-2 relative">
                      <div className="relative inline-block max-w-xs">
                        {selectedGIF ? (
                          <img
                            src={selectedGIF}
                            alt="Selected GIF"
                            className="max-h-32 rounded-lg"
                          />
                        ) : filePreview ? (
                          selectedFile?.type.startsWith('video/') ? (
                            <video
                              src={filePreview}
                              className="max-h-32 rounded-lg"
                              controls
                            />
                          ) : (
                            <img
                              src={filePreview}
                              alt="Preview"
                              className="max-h-32 rounded-lg"
                            />
                          )
                        ) : selectedFile ? (
                          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                            <span className="text-sm text-black">{selectedFile.name}</span>
                            <span className="text-xs text-black">
                              ({(selectedFile.size / 1024).toFixed(1)} KB)
                            </span>
                          </div>
                        ) : null}
                        <button
                          type="button"
                          onClick={clearMedia}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <EmojiPicker onEmojiSelect={handleEmojiSelect} />
                    <GIFPicker onGIFSelect={handleGIFSelect} />
                    <input
                      type="text"
                      placeholder="Message"
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-black"
                    />
                    <FileUpload onFileSelect={handleFileSelect} />
                    <button
                      onClick={handleSendMessage}
                      disabled={(!messageInput.trim() && !selectedFile && !selectedGIF)}
                      className="px-4 py-2 bg-[#CB9729] text-white font-semibold rounded-lg hover:bg-[#b78322] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-black">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

