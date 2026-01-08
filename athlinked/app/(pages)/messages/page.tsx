'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import NavigationBar from '@/components/NavigationBar';
import {
  Search,
  CheckCheck,
  Check,
  X,
  MoreVertical,
  Trash2,
} from 'lucide-react';
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

function MessagesPageContent() {
  const searchParams = useSearchParams();
  const userIdFromUrl = searchParams.get('userId');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
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
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showConversationMenu, setShowConversationMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const conversationMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const { getCurrentUserId, getCurrentUser } =
          await import('@/utils/auth');
        const userId = getCurrentUserId();
        const user = getCurrentUser();

        if (userId) {
          // Fetch full user profile for display
          const { apiGet } = await import('@/utils/api');
          try {
            const data = await apiGet<{ success: boolean; user?: any }>(
              `/profile`
            );
            if (data.success && data.user) {
              setCurrentUser({
                id: userId,
                full_name: data.user.full_name || 'User',
                profile_url: data.user.profile_url,
                username: data.user.username,
              });
            } else {
              // Fallback to token data
              setCurrentUser({
                id: userId,
                full_name: user?.username || 'User',
                profile_url: undefined,
                username: user?.username ?? undefined,
              });
            }
          } catch (error) {
            // Fallback to token data
            setCurrentUser({
              id: userId,
              full_name: user?.username || 'User',
              profile_url: undefined,
              username: user?.username ?? undefined,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;

    // Use centralized WebSocket utility
    const { getSocket } = require('@/utils/useSocket');
    const newSocket = getSocket();

    if (!newSocket) return;

    if (newSocket.connected) {
      newSocket.emit('userId', { userId: currentUser.id });
    } else {
      newSocket.on('connect', () => {
        newSocket.emit('userId', { userId: currentUser.id });
      });
    }

    newSocket.on(
      'receive_message',
      (
        data: Message & {
          conversation_id: string;
          is_delivered?: boolean;
          media_url?: string;
          message_type?: string;
        }
      ) => {
        // Update conversation list when receiving a message
        setConversations(prev => {
          const updated = prev.map(conv => {
            if (conv.conversation_id === data.conversation_id) {
              return {
                ...conv,
                last_message: data.message || (data.media_url ? 'Media' : ''),
                last_message_time: data.created_at,
                unread_count:
                  data.sender_id === currentUser.id
                    ? conv.unread_count
                    : conv.unread_count + 1,
              };
            }
            return conv;
          });

          // If conversation doesn't exist in list, fetch conversations
          const exists = updated.some(
            conv => conv.conversation_id === data.conversation_id
          );
          if (!exists && data.sender_id !== currentUser.id) {
            fetchConversations();
          }

          return updated;
        });

        if (selectedConversation?.conversation_id === data.conversation_id) {
          const isOurMessage = data.sender_id === currentUser.id;

          setMessages(prev => {
            const filtered = prev.filter(msg => {
              if (!msg.message_id.startsWith('temp-')) return true;
              if (msg.sender_id === data.sender_id) {
                if (msg.media_url && data.media_url) {
                  return false;
                }
                if (
                  msg.message === data.message &&
                  Math.abs(
                    new Date(msg.created_at).getTime() -
                      new Date(data.created_at).getTime()
                  ) < 5000
                ) {
                  return false;
                }
              }
              return true;
            });

            let messageType = data.message_type as
              | 'text'
              | 'image'
              | 'video'
              | 'file'
              | 'gif'
              | 'post';
            if (!messageType && data.post_data) {
              messageType = 'post';
            } else if (!messageType && data.media_url) {
              const url = data.media_url.toLowerCase();
              if (
                url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
                url.includes('giphy.com')
              ) {
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
                postData =
                  typeof data.post_data === 'string'
                    ? JSON.parse(data.post_data)
                    : data.post_data;
              } catch (e) {
                console.error('Error parsing post_data:', e);
              }
            }

            return [
              ...filtered,
              {
                message_id: data.message_id,
                sender_id: data.sender_id,
                message: data.message || '',
                created_at: data.created_at,
                is_read: false,
                is_read_by_recipient: false,
                is_delivered: isOurMessage ? data.is_delivered || false : true,
                media_url: data.media_url || null,
                message_type: messageType || 'text',
                post_data: postData,
              },
            ];
          });
        }
        fetchConversations();
      }
    );

    newSocket.on(
      'message_delivered',
      (data: { message_id: string; conversation_id: string }) => {
        if (selectedConversation?.conversation_id === data.conversation_id) {
          setMessages(prev =>
            prev.map(msg =>
              msg.message_id === data.message_id
                ? { ...msg, is_delivered: true }
                : msg
            )
          );
        }
      }
    );

    newSocket.on(
      'messages_read',
      (data: { conversationId: string; readerId: string }) => {
        if (selectedConversation?.conversation_id === data.conversationId) {
          setMessages(prev =>
            prev.map(msg => {
              if (
                msg.sender_id === currentUser?.id &&
                data.readerId === selectedConversation.other_user_id
              ) {
                return { ...msg, is_read_by_recipient: true };
              } else if (
                msg.sender_id === data.readerId &&
                msg.sender_id !== currentUser?.id
              ) {
                return { ...msg, is_read: true };
              }
              return msg;
            })
          );
        }
      }
    );

    // Listen for conversation updates
    newSocket.on(
      'conversation_updated',
      (data: { conversation: Conversation }) => {
        setConversations(prev => {
          const index = prev.findIndex(
            conv => conv.conversation_id === data.conversation.conversation_id
          );
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = data.conversation;
            // Move updated conversation to top
            const [updatedConv] = updated.splice(index, 1);
            return [updatedConv, ...updated];
          } else {
            // New conversation, add to top
            return [data.conversation, ...prev];
          }
        });
      }
    );

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      // Don't disconnect the global socket, just remove listeners
      if (newSocket) {
        newSocket.off('receive_message');
        newSocket.off('message_delivered');
        newSocket.off('messages_read');
        newSocket.off('conversation_updated');
      }
    };
  }, [currentUser?.id, selectedConversation?.conversation_id]);

  const fetchConversations = async () => {
    if (!currentUser?.id) return;

    try {
      const { apiGet } = await import('@/utils/api');
      const data = await apiGet<{
        success: boolean;
        conversations?: Conversation[];
      }>(`/messages/conversations`);
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
      const { apiGet } = await import('@/utils/api');
      const data = await apiGet<{ success: boolean; messages?: Message[] }>(
        `/messages/${conversationId}`
      );
      if (data.success && data.messages) {
        const messagesWithStatus = data.messages.map((msg: any) => {
          let messageType = msg.message_type;
          if (!messageType && msg.media_url) {
            const url = msg.media_url.toLowerCase();
            if (
              url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
              url.includes('giphy.com')
            ) {
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
              postData =
                typeof msg.post_data === 'string'
                  ? JSON.parse(msg.post_data)
                  : msg.post_data;
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
      const { apiPost } = await import('@/utils/api');
      await apiPost(`/messages/${conversationId}/read`, {});
      fetchConversations();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!currentUser?.id || !selectedConversation) return;

    if (!confirm('Are you sure you want to delete this message?')) {
      return;
    }

    try {
      const { apiDelete } = await import('@/utils/api');
      const response = await apiDelete<{ success: boolean; message?: string }>(
        `/messages/message/${messageId}`
      );

      if (response.success) {
        // Remove message from local state
        setMessages(prev => prev.filter(msg => msg.message_id !== messageId));
        setOpenMenuId(null);
        // Refresh conversations to update last message
        fetchConversations();
      } else {
        alert(response.message || 'Failed to delete message');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    }
  };

  const handleDeleteConversation = async () => {
    if (!currentUser?.id || !selectedConversation) return;

    if (
      !confirm(
        'Are you sure you want to delete this conversation? This will delete all messages and cannot be undone.'
      )
    ) {
      return;
    }

    try {
      const { apiDelete } = await import('@/utils/api');
      const response = await apiDelete<{ success: boolean; message?: string }>(
        `/messages/conversation/${selectedConversation.conversation_id}`
      );

      if (response.success) {
        // Clear selected conversation and messages
        setSelectedConversation(null);
        setMessages([]);
        setShowConversationMenu(false);
        // Refresh conversations list
        fetchConversations();
      } else {
        alert(response.message || 'Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
      if (
        conversationMenuRef.current &&
        !conversationMenuRef.current.contains(event.target as Node)
      ) {
        setShowConversationMenu(false);
      }
    };

    if (openMenuId || showConversationMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId, showConversationMenu]);

  const searchUsers = async (query: string) => {
    if (!query.trim() || !currentUser?.id) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const { apiGet } = await import('@/utils/api');
      const data = await apiGet<{ success: boolean; users?: SearchUser[] }>(
        `/messages/search/users?q=${encodeURIComponent(query)}`
      );
      if (data.success && data.users) {
        setSearchResults(data.users);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
      setShowSearchResults(false);
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
        conv => conv.other_user_id === user.id
      );

      if (existingConv) {
        setSelectedConversation(existingConv);
        setSearchQuery('');
        setShowSearchResults(false);
        return;
      }
      const { apiPost } = await import('@/utils/api');
      const data = await apiPost<{
        success: boolean;
        conversation?: Conversation;
        message?: string;
      }>('/messages/conversations/create', {
        otherUserId: user.id,
      });

      if (data.success && data.conversation) {
        setSelectedConversation(data.conversation);
        await fetchConversations();
        setSearchQuery('');
        setShowSearchResults(false);
      } else {
        alert(
          `Failed to create conversation: ${data.message || 'Unknown error'}`
        );
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

  // Handle userId from URL parameter - auto-select or create conversation
  useEffect(() => {
    const handleUserIdFromUrl = async () => {
      if (!userIdFromUrl || !currentUser?.id) {
        return;
      }

      // Wait for conversations to be loaded
      if (conversations.length === 0) {
        return;
      }

      // Check if conversation already exists
      const existingConv = conversations.find(
        conv => conv.other_user_id === userIdFromUrl
      );

      if (existingConv) {
        setSelectedConversation(existingConv);
        return;
      }

      // If no conversation exists, try to create one or find the user
      try {
        // First, try to search for the user to get their info
        const { apiGet } = await import('@/utils/api');
        const searchData = await apiGet<{
          success: boolean;
          users?: SearchUser[];
        }>(`/messages/search/users?q=`);
        if (searchData.success && searchData.users) {
          const targetUser = searchData.users.find(
            (u: SearchUser) => u.id === userIdFromUrl
          );

          if (targetUser) {
            // Create conversation with this user
            await handleSelectUser(targetUser);
          }
        }
      } catch (error) {
        console.error('Error handling userId from URL:', error);
      }
    };

    if (userIdFromUrl && currentUser?.id && conversations.length > 0) {
      handleUserIdFromUrl();
    }
     
  }, [userIdFromUrl, currentUser?.id, conversations.length]);

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

  const handleFileSelect = async (
    file: File,
    type: 'image' | 'video' | 'file'
  ) => {
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
    if (
      (!messageInput.trim() && !selectedFile && !selectedGIF) ||
      !selectedConversation ||
      !socket ||
      !currentUser
    )
      return;

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
        formData.append(
          'conversation_id',
          selectedConversation.conversation_id
        );
        formData.append('sender_id', currentUser.id);
        formData.append('receiver_id', selectedConversation.other_user_id);
        if (messageText) {
          formData.append('message', messageText);
        }

        // File upload with FormData
        const { apiUpload } = await import('@/utils/api');
        const uploadData = await apiUpload<{
          success: boolean;
          media_url?: string;
          fileUrl?: string;
          message?: string;
        }>('/messages/upload', formData);
        if (uploadData.success) {
          mediaUrl = uploadData.media_url || uploadData.fileUrl || null;
          messageType = selectedFile.type.startsWith('image/')
            ? 'image'
            : selectedFile.type.startsWith('video/')
              ? 'video'
              : 'file';
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
              <h2 className="text-xl font-semibold text-black mb-4">
                Messages
              </h2>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={e => {
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
                    {searchResults.map(user => (
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
                                {user.relationship === 'following'
                                  ? 'Following'
                                  : 'Follower'}
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
                filteredConversations.map(conv => (
                  <div
                    key={conv.conversation_id}
                    onClick={() => setSelectedConversation(conv)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                      selectedConversation?.conversation_id ===
                      conv.conversation_id
                        ? 'bg-yellow-50'
                        : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden border border-gray-200 flex items-center justify-center flex-shrink-0">
                        {conv.other_user_profile_image ? (
                          <img
                            src={
                              getProfileUrl(conv.other_user_profile_image) || ''
                            }
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
                <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden border border-gray-200 flex items-center justify-center">
                      {selectedConversation.other_user_profile_image ? (
                        <img
                          src={
                            getProfileUrl(
                              selectedConversation.other_user_profile_image
                            ) || ''
                          }
                          alt={selectedConversation.other_user_username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-black font-semibold text-xs">
                          {getInitials(
                            selectedConversation.other_user_username
                          )}
                        </span>
                      )}
                    </div>
                    <span className="text-lg font-semibold text-black">
                      {selectedConversation.other_user_username}
                    </span>
                  </div>
                  <div className="relative" ref={conversationMenuRef}>
                    <button
                      onClick={() =>
                        setShowConversationMenu(!showConversationMenu)
                      }
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                      aria-label="Conversation options"
                    >
                      <MoreVertical size={20} className="text-gray-600" />
                    </button>
                    {showConversationMenu && (
                      <div className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                        <button
                          onClick={handleDeleteConversation}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                          Delete Chat
                        </button>
                      </div>
                    )}
                  </div>
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
                          } group`}
                          onMouseEnter={() =>
                            isOwnMessage && setHoveredMessageId(msg.message_id)
                          }
                          onMouseLeave={() => setHoveredMessageId(null)}
                        >
                          {!isOwnMessage && (
                            <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden border border-gray-200 flex items-center justify-center flex-shrink-0">
                              {selectedConversation.other_user_profile_image ? (
                                <img
                                  src={
                                    getProfileUrl(
                                      selectedConversation.other_user_profile_image
                                    ) || ''
                                  }
                                  alt={selectedConversation.other_user_username}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-black font-semibold text-xs">
                                  {getInitials(
                                    selectedConversation.other_user_username
                                  )}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="relative flex items-start gap-2">
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
                                          src={
                                            msg.post_data.user_profile_url.startsWith(
                                              'http'
                                            )
                                              ? msg.post_data.user_profile_url
                                              : `http://localhost:3001${msg.post_data.user_profile_url}`
                                          }
                                          alt={msg.post_data.username || 'User'}
                                          className="w-full h-full object-cover"
                                          onError={e => {
                                            e.currentTarget.style.display =
                                              'none';
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
                                  {msg.post_data.media_url &&
                                    (() => {
                                      const mediaUrl =
                                        msg.post_data.media_url.startsWith(
                                          'http'
                                        )
                                          ? msg.post_data.media_url
                                          : `http://localhost:3001${msg.post_data.media_url}`;
                                      const isVideo =
                                        msg.post_data.post_type === 'video' ||
                                        msg.post_data.media_url.match(
                                          /\.(mp4|mov|webm|ogg)$/i
                                        );

                                      if (isVideo) {
                                        return (
                                          <div className="w-full">
                                            <video
                                              src={mediaUrl}
                                              controls
                                              className="w-full h-auto object-cover"
                                              onError={e => {
                                                e.currentTarget.style.display =
                                                  'none';
                                              }}
                                            />
                                          </div>
                                        );
                                      } else {
                                        return (
                                          <div className="w-full">
                                            <img
                                              src={mediaUrl}
                                              alt={
                                                msg.post_data.caption ||
                                                msg.post_data.article_title ||
                                                msg.post_data.event_title ||
                                                'Post'
                                              }
                                              className="w-full h-auto object-cover"
                                              onError={e => {
                                                e.currentTarget.style.display =
                                                  'none';
                                              }}
                                            />
                                          </div>
                                        );
                                      }
                                    })()}
                                  <div className="p-3">
                                    {msg.post_data.article_title && (
                                      <h4 className="font-semibold text-black mb-2 text-base">
                                        {msg.post_data.article_title}
                                      </h4>
                                    )}
                                    {msg.post_data.event_title && (
                                      <div className="mb-2">
                                        <h4 className="font-semibold text-black mb-1 text-base">
                                          {msg.post_data.event_title}
                                        </h4>
                                        {msg.post_data.event_date && (
                                          <p className="text-xs text-black">
                                            📅{' '}
                                            {new Date(
                                              msg.post_data.event_date
                                            ).toLocaleDateString()}
                                          </p>
                                        )}
                                        {msg.post_data.event_location && (
                                          <p className="text-xs text-black">
                                            📍 {msg.post_data.event_location}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                    {msg.post_data.caption && (
                                      <p className="text-sm text-black mb-2">
                                        {msg.post_data.caption}
                                      </p>
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
                              ) : msg.media_url ? (
                                (() => {
                                  const mediaUrl = msg.media_url.startsWith(
                                    'http'
                                  )
                                    ? msg.media_url
                                    : `http://localhost:3001${msg.media_url}`;
                                  const urlLower = msg.media_url.toLowerCase();
                                  const isImage =
                                    msg.message_type === 'image' ||
                                    msg.message_type === 'gif' ||
                                    (!msg.message_type &&
                                      (urlLower.match(
                                        /\.(jpg|jpeg|png|gif|webp)$/i
                                      ) ||
                                        urlLower.includes('giphy.com')));
                                  const isVideo =
                                    msg.message_type === 'video' ||
                                    (!msg.message_type &&
                                      urlLower.match(/\.(mp4|mov|webm|ogg)$/i));
                                  const isGif =
                                    msg.message_type === 'gif' ||
                                    urlLower.includes('giphy.com');

                                  if (isImage || isGif) {
                                    return (
                                      <div className="w-full">
                                        <img
                                          src={mediaUrl}
                                          alt={msg.message || 'Media'}
                                          className="w-full h-auto object-cover max-w-md rounded-lg"
                                          onError={e => {
                                            e.currentTarget.style.display =
                                              'none';
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
                                          onError={e => {
                                            e.currentTarget.style.display =
                                              'none';
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
                                          <span className="text-sm font-medium">
                                            {msg.message || 'Download file'}
                                          </span>
                                        </a>
                                      </div>
                                    );
                                  }
                                })()
                              ) : null}

                              {msg.message && (
                                <p
                                  className={`text-sm text-black ${msg.media_url ? 'px-4 py-2' : 'px-4 py-2'}`}
                                >
                                  {msg.message}
                                </p>
                              )}

                              <div
                                className={`flex items-center justify-end gap-1.5 px-4 pb-2 ${isOwnMessage ? '' : 'justify-start'}`}
                              >
                                <span className="text-xs text-black">
                                  {formatMessageTimestamp(msg.created_at)}
                                </span>
                                {isOwnMessage && (
                                  <div className="flex items-center">
                                    {msg.is_read_by_recipient ? (
                                      <CheckCheck
                                        size={16}
                                        className="text-[#53BDEB]"
                                        strokeWidth={2.5}
                                      />
                                    ) : msg.is_delivered ? (
                                      <CheckCheck
                                        size={16}
                                        className="text-[#8696A0]"
                                        strokeWidth={2.5}
                                      />
                                    ) : (
                                      <Check
                                        size={12}
                                        className="text-[#8696A0]"
                                        strokeWidth={2.5}
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                            {isOwnMessage &&
                              hoveredMessageId === msg.message_id && (
                                <div className="relative" ref={menuRef}>
                                  <button
                                    onClick={() =>
                                      setOpenMenuId(
                                        openMenuId === msg.message_id
                                          ? null
                                          : msg.message_id
                                      )
                                    }
                                    className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                                    aria-label="Message options"
                                  >
                                    <MoreVertical
                                      size={18}
                                      className="text-gray-600"
                                    />
                                  </button>
                                  {openMenuId === msg.message_id && (
                                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[120px]">
                                      <button
                                        onClick={() =>
                                          handleDeleteMessage(msg.message_id)
                                        }
                                        className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 rounded-lg transition-colors"
                                      >
                                        <Trash2 size={16} />
                                        Delete
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
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
                            <span className="text-sm text-black">
                              {selectedFile.name}
                            </span>
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
                      onChange={e => setMessageInput(e.target.value)}
                      onKeyPress={e => {
                        if (e.key === 'Enter') {
                          handleSendMessage();
                        }
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-black"
                    />
                    <FileUpload onFileSelect={handleFileSelect} />
                    <button
                      onClick={handleSendMessage}
                      disabled={
                        !messageInput.trim() && !selectedFile && !selectedGIF
                      }
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

export default function MessagesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#D4D4D4]">
          <p className="text-gray-600">Loading messages...</p>
        </div>
      }
    >
      <MessagesPageContent />
    </Suspense>
  );
}
