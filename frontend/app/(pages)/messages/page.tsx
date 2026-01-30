'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import NavigationBar from '@/components/NavigationBar';
import {
  Search,
  CheckCheck,
  Check,
  X,
  MoreVertical,
  Trash2,
  Play,
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  ArrowLeft,
} from 'lucide-react';
import io, { Socket } from 'socket.io-client';
import EmojiPicker from '@/components/Message/EmojiPicker';
import GIFPicker from '@/components/Message/GIFPicker';
import FileUpload from '@/components/Message/FileUpload';
import Post, { type PostData } from '@/components/Post';
import ShareModal from '@/components/Share/ShareModal';
import { getResourceUrl } from '@/utils/config';
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

interface ClipComment {
  id: string;
  author: string;
  authorAvatar: string | null;
  text: string;
  created_at?: string;
  replies?: ClipComment[];
}

interface ClipModalData {
  id: string;
  videoUrl: string;
  author: string;
  authorAvatar: string | null;
  caption: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  is_liked: boolean;
  is_saved: boolean;
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
  // Add this new state near the other useState declarations (after line 97)
  const [isMobileView, setIsMobileView] = useState(false);
  const router = useRouter();
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
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const [isClipModalOpen, setIsClipModalOpen] = useState(false);
  const [clipModalData, setClipModalData] = useState<ClipModalData | null>(
    null
  );
  const [clipComments, setClipComments] = useState<ClipComment[]>([]);
  const [clipCommentInput, setClipCommentInput] = useState('');
  const [isClipCommentsOpen, setIsClipCommentsOpen] = useState(false);
  const [isClipShareOpen, setIsClipShareOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastConversationIdRef = useRef<string | null>(null);
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

  // Add this useEffect after the state declarations
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 640); // 640px is sm breakpoint (mobile only)
    };

    checkMobileView();
    window.addEventListener('resize', checkMobileView);

    return () => window.removeEventListener('resize', checkMobileView);
  }, []);

  useEffect(() => {
    if (!currentUser?.id) return;

    // Use centralized WebSocket utility
    import('@/utils/useSocket')
      .then(({ getSocket, initializeSocket }) => {
        // Initialize socket if not already connected
        let newSocket = getSocket();
        if (!newSocket || !newSocket.connected) {
          newSocket = initializeSocket();
        }

        if (!newSocket) {
          console.error('Failed to initialize WebSocket');
          return;
        }

        // Remove existing listeners first to prevent duplicates
        newSocket.off('receive_message');
        newSocket.off('message_delivered');
        newSocket.off('messages_read');
        newSocket.off('conversation_updated');
        newSocket.off('connect');

        // Ensure userId is sent when connected
        const sendUserId = () => {
          if (newSocket && newSocket.connected && currentUser.id) {
            try {
              // Small delay to ensure socket is fully ready
              setTimeout(() => {
                if (newSocket && newSocket.connected) {
                  newSocket.emit('userId', { userId: currentUser.id });
                  console.log('✅ Sent userId to socket:', currentUser.id);
                }
              }, 100);
            } catch (error) {
              console.error('❌ Error sending userId:', error);
            }
          }
        };

        if (newSocket.connected) {
          sendUserId();
        } else {
          const connectHandler = () => {
            console.log('✅ Socket connected, sending userId');
            sendUserId();
            // Remove handler after first connection to avoid duplicates
            newSocket.off('connect', connectHandler);
          };
          newSocket.on('connect', connectHandler);
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
            console.log('Received message via WebSocket:', data);
            const isOurMessage = data.sender_id === currentUser.id;

            // Update conversation list when receiving a message
            setConversations(prev => {
              const updated = prev.map(conv => {
                if (conv.conversation_id === data.conversation_id) {
                  return {
                    ...conv,
                    last_message:
                      data.message || (data.media_url ? 'Media' : ''),
                    last_message_time: data.created_at,
                    unread_count: isOurMessage
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
              if (!exists && !isOurMessage) {
                // Fetch conversations asynchronously
                import('@/utils/api').then(({ apiGet }) => {
                  apiGet<{
                    success: boolean;
                    conversations?: Conversation[];
                  }>(`/messages/conversations`)
                    .then(data => {
                      if (data.success && data.conversations) {
                        setConversations(data.conversations);
                      }
                    })
                    .catch(error => {
                      console.error('Error fetching conversations:', error);
                    });
                });
              }

              return updated;
            });

            if (
              selectedConversation?.conversation_id === data.conversation_id
            ) {
              setMessages(prev => {
                // Check if message with this exact ID already exists
                const existingMessage = prev.find(
                  msg => msg.message_id === data.message_id
                );
                if (existingMessage) {
                  // Message already exists, just update delivery status
                  return prev.map(msg =>
                    msg.message_id === data.message_id
                      ? {
                          ...msg,
                          is_delivered: data.is_delivered || msg.is_delivered,
                        }
                      : msg
                  );
                }

                // For our own messages, we already have an optimistic temp message
                // Replace the temp message with the real one instead of adding new
                if (isOurMessage) {
                  // Find and replace the matching temp message
                  const tempIndex = prev.findIndex(
                    msg =>
                      msg.message_id.startsWith('temp-') &&
                      msg.sender_id === data.sender_id
                  );

                  if (tempIndex !== -1) {
                    // Replace temp message with real message
                    const newMessages = [...prev];
                    newMessages[tempIndex] = {
                      message_id: data.message_id,
                      sender_id: data.sender_id,
                      message: data.message || '',
                      created_at: data.created_at,
                      is_read: false,
                      is_read_by_recipient: false,
                      is_delivered: data.is_delivered || false,
                      media_url: data.media_url || null,
                      message_type: (data.message_type as any) || 'text',
                      post_data: data.post_data
                        ? typeof data.post_data === 'string'
                          ? JSON.parse(data.post_data)
                          : data.post_data
                        : null,
                    };
                    return newMessages;
                  }
                  // No temp message found, don't add duplicate - this shouldn't happen normally
                  return prev;
                }

                // For messages from others, add the new message
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
                  ...prev,
                  {
                    message_id: data.message_id,
                    sender_id: data.sender_id,
                    message: data.message || '',
                    created_at: data.created_at,
                    is_read: false,
                    is_read_by_recipient: false,
                    is_delivered: true,
                    media_url: data.media_url || null,
                    message_type: messageType || 'text',
                    post_data: postData,
                  },
                ];
              });
            }
          }
        );

        newSocket.on(
          'message_delivered',
          (data: { message_id: string; conversation_id: string }) => {
            if (
              selectedConversation?.conversation_id === data.conversation_id
            ) {
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
                conv =>
                  conv.conversation_id === data.conversation.conversation_id
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

        // Cleanup function
        return () => {
          // Don't disconnect the global socket, just remove listeners
          if (newSocket) {
            newSocket.off('receive_message');
            newSocket.off('message_delivered');
            newSocket.off('messages_read');
            newSocket.off('conversation_updated');
            newSocket.off('connect');
          }
        };
      })
      .catch(error => {
        console.error('❌ Error initializing WebSocket:', error);
      });
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
      if (!userIdFromUrl || !currentUser?.id) return;
      // Ignore if URL points to self
      if (userIdFromUrl === currentUser.id) return;

      // Already selected
      if (selectedConversation?.other_user_id === userIdFromUrl) return;

      // If conversation exists, select it
      const existingConv = conversations.find(
        conv => conv.other_user_id === userIdFromUrl
      );
      if (existingConv) {
        setSelectedConversation(existingConv);
        return;
      }

      // Otherwise, create it directly (works even if no prior messages)
      try {
        const { apiPost } = await import('@/utils/api');
        const data = await apiPost<{
          success: boolean;
          conversation?: Conversation;
          message?: string;
        }>('/messages/conversations/create', {
          otherUserId: userIdFromUrl,
        });

        if (data.success && data.conversation) {
          setSelectedConversation(data.conversation);
          await fetchConversations();
        } else {
          console.error('Create conversation failed:', data);
          alert(data.message || 'Failed to start conversation');
        }
      } catch (error) {
        console.error('Error handling userId from URL:', error);
        alert('Failed to start conversation. Please try again.');
      }
    };

    if (userIdFromUrl && currentUser?.id) {
      handleUserIdFromUrl();
    }
  }, [
    userIdFromUrl,
    currentUser?.id,
    conversations,
    selectedConversation?.other_user_id,
  ]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.conversation_id);
    }
  }, [selectedConversation?.conversation_id]);

  // When opening/switching a conversation, jump to the latest message.
  useEffect(() => {
    const convId = selectedConversation?.conversation_id || null;
    if (!convId) return;

    if (lastConversationIdRef.current !== convId) {
      lastConversationIdRef.current = convId;
      // Wait for the message list container to render, then scroll.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        });
      });
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

    // Use socketRef to ensure we have the latest socket instance
    const currentSocket = socketRef.current || socket;
    if (!currentSocket) {
      console.error('❌ Socket not available, cannot send message');
      alert('WebSocket connection not available. Please refresh the page.');
      return;
    }

    if (!currentSocket.connected) {
      console.error('❌ Socket not connected, attempting to reconnect...');
      // Try to reconnect
      import('@/utils/useSocket').then(({ initializeSocket }) => {
        const newSocket = initializeSocket();
        if (newSocket && newSocket.connected) {
          newSocket.emit('send_message', {
            conversationId: selectedConversation.conversation_id,
            receiverId: selectedConversation.other_user_id,
            message:
              messageText || (selectedGIF ? 'GIF' : selectedFile?.name || ''),
            media_url: mediaUrl || selectedGIF || null,
            message_type: messageType,
          });
          console.log('✅ Message sent via WebSocket after reconnect');
        } else {
          console.error('❌ Failed to reconnect socket');
          alert('Failed to send message. Please refresh the page.');
        }
      });
      return;
    }

    try {
      currentSocket.emit('send_message', {
        conversationId: selectedConversation.conversation_id,
        receiverId: selectedConversation.other_user_id,
        message:
          messageText || (selectedGIF ? 'GIF' : selectedFile?.name || ''),
        media_url: mediaUrl || selectedGIF || null,
        message_type: messageType,
      });
      console.log('✅ Message sent via WebSocket');
    } catch (error) {
      console.error('❌ Error sending message via WebSocket:', error);
      alert('Failed to send message. Please try again.');
    }

    setMessageInput('');
    clearMedia();
    fetchConversations();
  };

  const getProfileUrl = (profileUrl?: string | null): string | undefined => {
    return getResourceUrl(profileUrl);
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

  // Get user's timezone dynamically
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Parse UTC timestamp from database and convert to user's local timezone
  const parseUTCTimestamp = (timestamp: string): Date => {
    if (!timestamp) return new Date();

    let ts = timestamp;

    // Normalize: replace space with T for ISO format
    if (ts.includes(' ') && !ts.includes('T')) {
      ts = ts.replace(' ', 'T');
    }

    // Add Z suffix if no timezone indicator (database returns UTC without Z)
    if (
      !ts.endsWith('Z') &&
      !ts.includes('+') &&
      !/[+-]\d{2}:\d{2}$/.test(ts)
    ) {
      ts = ts + 'Z';
    }

    return new Date(ts);
  };

  const formatTime = (timestamp: string) => {
    const date = parseUTCTimestamp(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    // Format time in user's local timezone
    const timeString = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: userTimezone,
    });

    if (minutes < 1) {
      return 'Just now';
    }

    // Compare dates in user's local timezone
    const nowDateStr = now.toLocaleDateString('en-US', {
      timeZone: userTimezone,
    });
    const msgDateStr = date.toLocaleDateString('en-US', {
      timeZone: userTimezone,
    });

    if (nowDateStr === msgDateStr) {
      return timeString;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-US', {
      timeZone: userTimezone,
    });

    if (msgDateStr === yesterdayStr) {
      return 'Yesterday';
    }
    if (days < 7) {
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        timeZone: userTimezone,
      });
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: userTimezone,
    });
  };

  const formatMessageTime = (timestamp: string) => {
    const date = parseUTCTimestamp(timestamp);
    return date.toLocaleString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: userTimezone,
    });
  };

  const formatMessageTimestamp = (timestamp: string) => {
    const date = parseUTCTimestamp(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    // Format time in user's local timezone
    const timeString = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: userTimezone,
    });

    if (minutes < 1) {
      return 'Just now';
    }

    // Compare dates in user's local timezone
    const nowDateStr = now.toLocaleDateString('en-US', {
      timeZone: userTimezone,
    });
    const msgDateStr = date.toLocaleDateString('en-US', {
      timeZone: userTimezone,
    });

    if (nowDateStr === msgDateStr) {
      return timeString;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-US', {
      timeZone: userTimezone,
    });

    if (msgDateStr === yesterdayStr) {
      return `Yesterday ${timeString}`;
    }
    if (days < 7) {
      const dayName = date.toLocaleDateString('en-US', {
        weekday: 'short',
        timeZone: userTimezone,
      });
      return `${dayName} ${timeString}`;
    }
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: userTimezone,
    });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.other_user_username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const resolvePostIdFromPostData = (pd: any): string | null => {
    const direct = pd?.id ?? pd?.post_id ?? pd?.postId;
    if (direct) return String(direct);

    const url = pd?.post_url;
    if (typeof url !== 'string' || !url.trim()) return null;

    try {
      const u = new URL(url, window.location.origin);
      const qp = u.searchParams.get('postId') || u.searchParams.get('id');
      if (qp) return qp;
      const parts = u.pathname.split('/').filter(Boolean);
      return parts[parts.length - 1] || null;
    } catch {
      // Try best-effort parse for non-standard URLs
      const parts = url.split('/').filter(Boolean);
      return parts[parts.length - 1] || null;
    }
  };

  const mapPostDataToPost = (pd: any): PostData => {
    const id = resolvePostIdFromPostData(pd) || 'unknown';

    return {
      id,
      username: pd?.username || 'User',
      user_profile_url: pd?.user_profile_url ?? null,
      user_id: pd?.user_id ?? undefined,
      user_type: pd?.user_type ?? undefined,
      post_type: pd?.post_type ?? undefined,
      caption: pd?.caption ?? null,
      media_url: pd?.media_url ?? null,
      article_title: pd?.article_title ?? null,
      article_body: pd?.article_body ?? null,
      event_title: pd?.event_title ?? null,
      event_date: pd?.event_date ?? null,
      event_location: pd?.event_location ?? null,
      event_type: pd?.event_type ?? null,
      image_url: pd?.image_url ?? null,
      description: pd?.description ?? null,
      like_count: Number(pd?.like_count ?? 0),
      comment_count: Number(pd?.comment_count ?? 0),
      save_count: Number(pd?.save_count ?? 0),
      created_at: pd?.created_at ?? new Date().toISOString(),
    };
  };

  const isClipPostData = (pd: any): boolean => {
    // Heuristics: clips are commonly linked to /clips or have clip ids/types
    const url = typeof pd?.post_url === 'string' ? pd.post_url : '';

    if (pd?.clip_id || pd?.clipId) return true;
    if (pd?.clip_url || pd?.clipUrl) return true;
    if (pd?.type === 'clip' || pd?.resource_type === 'clip') return true;
    if (pd?.post_type === 'clip') return true;

    if (url) {
      const lower = url.toLowerCase();
      if (lower.includes('/clips') || lower.includes('/clip')) return true;
      // If post_url is actually a media file URL (mp4/etc), treat it as a clip share
      if (/\.(mp4|mov|webm|ogg)(\?|#|$)/i.test(lower)) return true;

      try {
        const u = new URL(url, window.location.origin);
        const path = u.pathname.toLowerCase();
        if (path.includes('/clips') || path.includes('/clip')) return true;

        // Common query param patterns
        const qp =
          u.searchParams.get('type') ||
          u.searchParams.get('resource') ||
          u.searchParams.get('resource_type');
        if (qp && qp.toLowerCase() === 'clip') return true;

        const clipId =
          u.searchParams.get('clipId') ||
          u.searchParams.get('clip_id') ||
          u.searchParams.get('clip');
        if (clipId) return true;
      } catch {
        // ignore
      }
    }

    return false;
  };

  const openClipFromPostData = (pd: any) => {
    const clipId =
      pd?.clip_id || pd?.clipId || pd?.id || pd?.post_id || pd?.postId || null;

    if (clipId) {
      router.push(`/clips?clipId=${encodeURIComponent(String(clipId))}`);
    } else {
      router.push('/clips');
    }
  };

  const getVideoUrlFromPostData = (pd: any): string | null => {
    const raw =
      pd?.media_url ||
      pd?.video_url ||
      pd?.videoUrl ||
      pd?.clip_url ||
      pd?.clipUrl ||
      pd?.url;
    if (!raw || typeof raw !== 'string') return null;
    return getResourceUrl(raw) || raw;
  };

  const openClipModalFromPostData = async (pd: any) => {
    const clipId =
      pd?.clip_id || pd?.clipId || pd?.id || pd?.post_id || pd?.postId || null;

    const videoUrl = getVideoUrlFromPostData(pd);
    if (!clipId || !videoUrl) {
      // fallback: open clips page
      openClipFromPostData(pd);
      return;
    }

    const base: ClipModalData = {
      id: String(clipId),
      videoUrl,
      author: pd?.username || 'User',
      authorAvatar: pd?.user_profile_url || null,
      caption: pd?.caption || '',
      like_count: Number(pd?.like_count ?? 0),
      comment_count: Number(pd?.comment_count ?? 0),
      share_count: Number(pd?.share_count ?? 0),
      is_liked: false,
      is_saved: false,
    };

    setClipModalData(base);
    setClipComments([]);
    setClipCommentInput('');
    setIsClipCommentsOpen(false);
    setIsClipModalOpen(true);

    try {
      const { apiGet } = await import('@/utils/api');

      // Fetch saved status (requires auth)
      if (currentUser?.id) {
        try {
          const saved = await apiGet<{ success: boolean; isSaved?: boolean }>(
            `/clips/${base.id}/save-status?user_id=${currentUser.id}`
          );
          if (saved?.success) {
            setClipModalData(prev =>
              prev ? { ...prev, is_saved: !!saved.isSaved } : prev
            );
          }
        } catch {
          // ignore
        }
      }

      // Fetch comments
      const commentsRes = await apiGet<{ success: boolean; comments?: any[] }>(
        `/clips/${base.id}/comments`
      );

      if (commentsRes?.success && Array.isArray(commentsRes.comments)) {
        const mapOne = (c: any): ClipComment => ({
          id: String(c.id),
          author: c.username || 'User',
          authorAvatar: c.user_profile_url || null,
          text: c.comment || '',
          created_at: c.created_at,
          replies: Array.isArray(c.replies) ? c.replies.map(mapOne) : [],
        });
        const mapped = commentsRes.comments.map(mapOne);
        setClipComments(mapped);
        setClipModalData(prev =>
          prev ? { ...prev, comment_count: mapped.length } : prev
        );
      }
    } catch (e) {
      console.error('Error loading clip modal data:', e);
    }
  };

  const toggleClipLike = async () => {
    if (!clipModalData) return;
    const wasLiked = clipModalData.is_liked;
    const clipId = clipModalData.id;

    setClipModalData(prev =>
      prev
        ? {
            ...prev,
            is_liked: !wasLiked,
            like_count: Math.max(0, prev.like_count + (wasLiked ? -1 : 1)),
          }
        : prev
    );

    try {
      const { apiPost } = await import('@/utils/api');
      const endpoint = wasLiked
        ? `/clips/${clipId}/unlike`
        : `/clips/${clipId}/like`;
      const result = await apiPost<{
        success: boolean;
        like_count?: number;
        message?: string;
      }>(endpoint, {});

      if (!result?.success) {
        // revert
        setClipModalData(prev =>
          prev
            ? {
                ...prev,
                is_liked: wasLiked,
                like_count: Math.max(0, prev.like_count + (wasLiked ? 1 : -1)),
              }
            : prev
        );
        alert(
          result?.message || 'Failed to update like status. Please try again.'
        );
      } else if (typeof result.like_count === 'number') {
        setClipModalData(prev =>
          prev ? { ...prev, like_count: result.like_count! } : prev
        );
      }
    } catch (e) {
      // revert
      setClipModalData(prev =>
        prev
          ? {
              ...prev,
              is_liked: wasLiked,
              like_count: Math.max(0, prev.like_count + (wasLiked ? 1 : -1)),
            }
          : prev
      );
      console.error('Error liking clip:', e);
      alert('Failed to update like status. Please try again.');
    }
  };

  const toggleClipSave = async () => {
    if (!clipModalData || !currentUser?.id) return;
    const wasSaved = clipModalData.is_saved;
    const clipId = clipModalData.id;

    setClipModalData(prev => (prev ? { ...prev, is_saved: !wasSaved } : prev));

    try {
      const { apiPost } = await import('@/utils/api');
      const endpoint = wasSaved
        ? `/clips/${clipId}/unsave`
        : `/clips/${clipId}/save`;
      const result = await apiPost<{
        success: boolean;
        message?: string;
        save_count?: number;
      }>(endpoint, {});
      if (!result?.success) {
        // Treat "already saved" as success (idempotent)
        if (
          typeof result?.message === 'string' &&
          result.message.includes('already saved')
        ) {
          setClipModalData(prev => (prev ? { ...prev, is_saved: true } : prev));
          return;
        }

        setClipModalData(prev =>
          prev ? { ...prev, is_saved: wasSaved } : prev
        );
        alert(result?.message || 'Failed to update save status');
      }
    } catch (e) {
      setClipModalData(prev => (prev ? { ...prev, is_saved: wasSaved } : prev));
      console.error('Error saving clip:', e);
      alert('Failed to update save status');
    }
  };

  const addClipComment = async () => {
    if (!clipModalData || !currentUser?.id) return;
    const clipId = clipModalData.id;
    const comment = clipCommentInput.trim();
    if (!comment) return;

    setClipCommentInput('');

    try {
      const { apiPost, apiGet } = await import('@/utils/api');
      const res = await apiPost<{ success: boolean; message?: string }>(
        `/clips/${clipId}/comments`,
        { comment }
      );
      if (!res?.success) {
        alert(res?.message || 'Failed to add comment');
        return;
      }

      const commentsRes = await apiGet<{ success: boolean; comments?: any[] }>(
        `/clips/${clipId}/comments`
      );
      if (commentsRes?.success && Array.isArray(commentsRes.comments)) {
        const mapOne = (c: any): ClipComment => ({
          id: String(c.id),
          author: c.username || 'User',
          authorAvatar: c.user_profile_url || null,
          text: c.comment || '',
          created_at: c.created_at,
          replies: Array.isArray(c.replies) ? c.replies.map(mapOne) : [],
        });
        const mapped = commentsRes.comments.map(mapOne);
        setClipComments(mapped);
        setClipModalData(prev =>
          prev ? { ...prev, comment_count: mapped.length } : prev
        );
      }
    } catch (e) {
      console.error('Error adding clip comment:', e);
      alert('Failed to add comment');
    }
  };

  const onClipShared = async () => {
    if (!clipModalData) return;
    const clipId = clipModalData.id;
    try {
      const { apiPost } = await import('@/utils/api');
      const res = await apiPost<{ success: boolean; share_count?: number }>(
        `/clips/${clipId}/share`,
        {}
      );
      if (res?.success && typeof res.share_count === 'number') {
        setClipModalData(prev =>
          prev ? { ...prev, share_count: res.share_count! } : prev
        );
      } else {
        setClipModalData(prev =>
          prev ? { ...prev, share_count: prev.share_count + 1 } : prev
        );
      }
    } catch {
      setClipModalData(prev =>
        prev ? { ...prev, share_count: prev.share_count + 1 } : prev
      );
    }
  };

  return (
    <div className="h-screen bg-[#D4D4D4] flex flex-col overflow-hidden">
      <Header
        userName={currentUser?.full_name}
        userProfileUrl={getProfileUrl(currentUser?.profile_url)}
      />

      <main className="flex flex-1 w-full mt-5 overflow-hidden">
        <div className="hidden md:flex px-3">
          <NavigationBar activeItem="message" />
        </div>

        <div className="flex-1 flex gap-3 pr-0 md:pr-4 overflow-hidden">
          {/* Conversation List - hide on mobile when chat is open */}
          <div
            className={`${
              isMobileView && selectedConversation
                ? 'hidden'
                : 'w-full md:w-60 sm:w-80'
            } bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden`}
          >
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
                          <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden border border-gray-200 flex items-center justify-center shrink-0">
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
                      <div className="w-12 h-12 rounded-full bg-gray-300 overflow-hidden border border-gray-200 flex items-center justify-center shrink-0">
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
                            <span className="bg-[#CB9729] text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-black truncate">
                            {conv.last_message || 'No messages yet'}
                          </span>
                          {conv.last_message_time && (
                            <span className="text-xs text-black ml-2 shrink-0">
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
          {/* Chat Box - full screen on mobile, side-by-side on desktop */}
          <div
            className={`${
              isMobileView
                ? selectedConversation
                  ? 'fixed inset-0 z-50'
                  : 'hidden'
                : 'flex-1'
            } bg-white rounded-lg sm:border border-gray-200 flex flex-col overflow-hidden`}
          >
            {selectedConversation ? (
              <>
                <div className="p-4 border-b border-gray-200 flex items-center justify-between gap-3">
                  {/* Back button for mobile */}
                  {isMobileView && (
                    <button
                      onClick={() => setSelectedConversation(null)}
                      className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors md:hidden"
                      aria-label="Back to conversations"
                    >
                      <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                  )}
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
                            <div className="w-8 h-8 rounded-full bg-gray-300 overflow-hidden border border-gray-200 flex items-center justify-center shrink-0">
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
                                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 border border-gray-200 shrink-0">
                                        <img
                                          src={
                                            getResourceUrl(
                                              msg.post_data.user_profile_url
                                            ) || ''
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
                                        getResourceUrl(
                                          msg.post_data.media_url
                                        ) || '';
                                      const isClip = isClipPostData(
                                        msg.post_data
                                      );
                                      const isVideo =
                                        isClip ||
                                        msg.post_data.post_type === 'video' ||
                                        msg.post_data.media_url.match(
                                          /\.(mp4|mov|webm|ogg)$/i
                                        );

                                      if (isVideo) {
                                        // For shared clips: autoplay preview (muted) and open clip modal on click
                                        if (isClip) {
                                          return (
                                            <button
                                              type="button"
                                              onClick={() =>
                                                openClipModalFromPostData(
                                                  msg.post_data
                                                )
                                              }
                                              className="relative w-full"
                                              aria-label="Open clip"
                                            >
                                              <video
                                                src={mediaUrl}
                                                className="w-full h-auto object-cover"
                                                muted
                                                playsInline
                                                autoPlay
                                                loop
                                                preload="metadata"
                                                onError={e => {
                                                  e.currentTarget.style.display =
                                                    'none';
                                                }}
                                              />
                                              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                                <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
                                                  <Play
                                                    className="w-5 h-5 text-white ml-0.5"
                                                    fill="currentColor"
                                                  />
                                                </div>
                                              </div>
                                            </button>
                                          );
                                        }

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
                                    {msg.post_data.post_url &&
                                      (isClipPostData(msg.post_data) ? (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            openClipModalFromPostData(
                                              msg.post_data
                                            )
                                          }
                                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                          View Clip →
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const mapped = mapPostDataToPost(
                                              msg.post_data
                                            );
                                            setSelectedPost(mapped);
                                            setIsPostModalOpen(true);
                                          }}
                                          className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
                                        >
                                          View Post →
                                        </button>
                                      ))}
                                  </div>
                                </div>
                              ) : msg.media_url ? (
                                (() => {
                                  const mediaUrl =
                                    getResourceUrl(msg.media_url) || '';
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
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setVideoModalUrl(mediaUrl);
                                            setIsVideoModalOpen(true);
                                          }}
                                          className="relative w-full max-w-md rounded-lg overflow-hidden"
                                          aria-label="Open video"
                                        >
                                          <video
                                            src={mediaUrl}
                                            className="w-full h-auto rounded-lg"
                                            muted
                                            playsInline
                                            preload="metadata"
                                            onError={e => {
                                              e.currentTarget.style.display =
                                                'none';
                                            }}
                                          />
                                          <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                            <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                                              <Play
                                                className="w-6 h-6 text-white ml-0.5"
                                                fill="currentColor"
                                              />
                                            </div>
                                          </div>
                                        </button>
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

                <div className="p-2 md:p-4 border-t  border-gray-200">
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

                  <div className="flex  mb-20 md:mb-0 items-center gap-2">
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
                      className="flex-1 md:px-4 md:py-2 px-2 py-2 text-xs md:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-black"
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

      {/* Post details modal (opened from "View Post") */}
      {isPostModalOpen && selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setIsPostModalOpen(false);
              setSelectedPost(null);
            }}
          />

          <div className="relative z-10 w-full max-w-3xl bg-white rounded-lg sm:rounded-xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Post Details</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => {
                  setIsPostModalOpen(false);
                  setSelectedPost(null);
                }}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-2 sm:p-3">
              <Post
                post={selectedPost}
                currentUserId={currentUser?.id || undefined}
                currentUserProfileUrl={getProfileUrl(currentUser?.profile_url)}
                currentUsername={currentUser?.full_name || 'You'}
              />
            </div>
          </div>
        </div>
      )}

      {/* Video-only modal (for clips/videos) */}
      {isVideoModalOpen && videoModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setIsVideoModalOpen(false);
              setVideoModalUrl(null);
            }}
          />

          <div className="relative z-10 w-full max-w-3xl bg-black rounded-lg shadow-2xl overflow-hidden">
            <button
              type="button"
              aria-label="Close"
              onClick={() => {
                setIsVideoModalOpen(false);
                setVideoModalUrl(null);
              }}
              className="absolute top-3 right-3 z-20 p-2 rounded-full bg-black/50 hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <video
              src={videoModalUrl}
              controls
              autoPlay
              playsInline
              className="w-full max-h-[80vh] object-contain bg-black"
            />
          </div>
        </div>
      )}

      {/* Clip modal (for shared clips) */}
      {isClipModalOpen && clipModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setIsClipModalOpen(false);
              setClipModalData(null);
              setClipComments([]);
              setClipCommentInput('');
              setIsClipCommentsOpen(false);
              setIsClipShareOpen(false);
            }}
          />

          <div className="relative z-10 w-full max-w-3xl bg-white rounded-lg sm:rounded-xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Clip Details</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => {
                  setIsClipModalOpen(false);
                  setClipModalData(null);
                  setClipComments([]);
                  setClipCommentInput('');
                  setIsClipCommentsOpen(false);
                  setIsClipShareOpen(false);
                }}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="p-2 sm:p-3">
              <div className="space-y-3">
                {/* Video */}
                <div className="w-full bg-black rounded-lg overflow-hidden">
                  <video
                    src={clipModalData.videoUrl}
                    controls
                    autoPlay
                    playsInline
                    className="w-full max-h-[60vh] object-contain bg-black"
                  />
                </div>

                {/* Author + caption */}
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                      {clipModalData.authorAvatar ? (
                        <img
                          src={
                            getResourceUrl(clipModalData.authorAvatar) ||
                            clipModalData.authorAvatar
                          }
                          alt={clipModalData.author}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-700 font-semibold text-sm">
                          {(clipModalData.author || 'U')
                            .split(' ')
                            .map(w => w[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">
                        {clipModalData.author}
                      </p>
                      {clipModalData.caption ? (
                        <p className="text-sm text-gray-700 mt-1">
                          {clipModalData.caption}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-white border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={toggleClipLike}
                      className="flex items-center gap-2 text-gray-800 hover:text-gray-900"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          clipModalData.is_liked
                            ? 'text-red-500'
                            : 'text-gray-700'
                        }`}
                        fill={clipModalData.is_liked ? 'currentColor' : 'none'}
                      />
                      <span className="text-sm font-medium">
                        {clipModalData.like_count}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsClipCommentsOpen(v => !v)}
                      className="flex items-center gap-2 text-gray-800 hover:text-gray-900"
                    >
                      <MessageSquare className="w-5 h-5 text-gray-700" />
                      <span className="text-sm font-medium">
                        {clipModalData.comment_count}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsClipShareOpen(true)}
                      className="flex items-center gap-2 text-gray-800 hover:text-gray-900"
                    >
                      <Share2 className="w-5 h-5 text-gray-700" />
                      <span className="text-sm font-medium">
                        {clipModalData.share_count}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={toggleClipSave}
                      className="flex items-center gap-2 text-gray-800 hover:text-gray-900"
                    >
                      <Bookmark
                        className="w-5 h-5 text-gray-700"
                        fill={clipModalData.is_saved ? 'currentColor' : 'none'}
                      />
                      <span className="text-sm font-medium">
                        {clipModalData.is_saved ? 'Saved' : 'Save'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Comments */}
                {isClipCommentsOpen && (
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="space-y-3">
                      {clipComments.length === 0 ? (
                        <p className="text-sm text-gray-500">
                          No comments yet.
                        </p>
                      ) : (
                        clipComments.map(c => (
                          <div key={c.id} className="text-sm">
                            <div className="flex items-start gap-2">
                              <div className="w-7 h-7 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                                {c.authorAvatar ? (
                                  <img
                                    src={
                                      getResourceUrl(c.authorAvatar) ||
                                      c.authorAvatar
                                    }
                                    alt={c.author}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span className="text-gray-700 font-semibold text-xs">
                                    {(c.author || 'U')
                                      .split(' ')
                                      .map(w => w[0])
                                      .join('')
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-gray-900">
                                  {c.author}
                                </p>
                                <p className="text-gray-700">{c.text}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <input
                        value={clipCommentInput}
                        onChange={e => setClipCommentInput(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 border border-gray-300 rounded-full px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            addClipComment();
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={addClipComment}
                        disabled={!clipCommentInput.trim()}
                        className="px-4 py-2 bg-[#CB9729] text-white rounded-full disabled:opacity-50"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Share modal for clip */}
            {isClipShareOpen && (
              <ShareModal
                open={isClipShareOpen}
                onClose={() => setIsClipShareOpen(false)}
                onShare={async () => {
                  await onClipShared();
                  setIsClipShareOpen(false);
                }}
                currentUserId={currentUser?.id}
                post={{
                  id: clipModalData.id,
                  username: clipModalData.author,
                  user_profile_url: clipModalData.authorAvatar,
                  user_id: undefined,
                  post_type: 'clip' as any,
                  caption: clipModalData.caption,
                  media_url: clipModalData.videoUrl,
                  like_count: clipModalData.like_count,
                  comment_count: clipModalData.comment_count,
                  save_count: 0,
                  created_at: new Date().toISOString(),
                }}
              />
            )}
          </div>
        </div>
      )}
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
