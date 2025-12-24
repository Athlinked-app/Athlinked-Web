'use client';

import { useState, useEffect, useRef } from 'react';
import Header from '@/components/Header';
import NavigationBar from '@/components/NavigationBar';
import { Search, Smile, Paperclip, Image as ImageIcon, CheckCheck, Check } from 'lucide-react';
import io, { Socket } from 'socket.io-client';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch current user
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

  // Initialize Socket.IO connection
  useEffect(() => {
    if (!currentUser?.id) return;

    const newSocket = io('http://localhost:3001', {
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected');
      newSocket.emit('userId', { userId: currentUser.id });
    });

    newSocket.on('receive_message', (data: Message & { conversation_id: string; is_delivered?: boolean }) => {
      if (selectedConversation?.conversation_id === data.conversation_id) {
        // Check if this is our own message (sent by us)
        const isOurMessage = data.sender_id === currentUser.id;
        
        setMessages(prev => {
          // Remove optimistic message if exists
          const filtered = prev.filter(msg => !msg.message_id.startsWith('temp-'));
          
          // Add the real message
          return [...filtered, {
            message_id: data.message_id,
            sender_id: data.sender_id,
            message: data.message,
            created_at: data.created_at,
            is_read: false,
            is_read_by_recipient: false,
            is_delivered: isOurMessage ? (data.is_delivered || false) : true, // If we sent it, use delivered status; if received, it's delivered to us
          }];
        });
      }
      // Update conversations list
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
        // readerId is the person who read the messages
        // For messages we sent, if the reader is the recipient, mark as read
        setMessages(prev =>
          prev.map(msg => {
            if (msg.sender_id === currentUser?.id && data.readerId === selectedConversation.other_user_id) {
              // We sent this message and the recipient read it
              return { ...msg, is_read_by_recipient: true };
            } else if (msg.sender_id === data.readerId && msg.sender_id !== currentUser?.id) {
              // Someone else sent this message and we read it
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

  // Fetch conversations
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

  // Fetch messages for selected conversation
  const fetchMessages = async (conversationId: string) => {
    if (!currentUser?.id) return;
    
    try {
      const response = await fetch(
        `http://localhost:3001/api/messages/${conversationId}?user_id=${currentUser.id}`
      );

      if (!response.ok) {
        console.error('Failed to fetch messages');
        return;
      }

      const data = await response.json();
      if (data.success && data.messages) {
        // Map messages to include delivery status
        const messagesWithStatus = data.messages.map((msg: Message) => ({
          ...msg,
          is_delivered: msg.is_read_by_recipient !== undefined ? true : false, // If we have read status, it's delivered
          is_read_by_recipient: msg.is_read_by_recipient || false,
        }));
        setMessages(messagesWithStatus);
        // Mark messages as read
        markAsRead(conversationId);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  // Mark messages as read
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

  // Search users from network
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

  // Handle search input change with debounce
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

  // Handle selecting a user from search results
  const handleSelectUser = async (user: SearchUser) => {
    if (!currentUser?.id) return;

    try {
      // Find existing conversation with this user
      const existingConv = conversations.find(
        (conv) => conv.other_user_id === user.id
      );

      if (existingConv) {
        // Open existing conversation
        setSelectedConversation(existingConv);
        setSearchQuery('');
        setShowSearchResults(false);
        return;
      }

      // Create or get conversation
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
        // Refresh conversations list
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

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation || !socket || !currentUser) return;

    const tempMessageId = `temp-${Date.now()}`;
    const messageText = messageInput.trim();

    // Optimistically add message to UI
    const optimisticMessage: Message = {
      message_id: tempMessageId,
      sender_id: currentUser.id,
      message: messageText,
      created_at: new Date().toISOString(),
      is_read: false,
      is_read_by_recipient: false,
      is_delivered: false,
    };

    setMessages(prev => [...prev, optimisticMessage]);

    socket.emit('send_message', {
      conversationId: selectedConversation.conversation_id,
      receiverId: selectedConversation.other_user_id,
      message: messageText,
    });

    setMessageInput('');
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
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 24) {
      return `${hours}h`;
    }
    return date.toLocaleDateString();
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
          {/* Messages List Panel */}
          <div className="w-80 bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200 relative">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
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
                    // Delay to allow click on search results
                    setTimeout(() => setShowSearchResults(false), 200);
                  }}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#CB9729] text-black"
                />
                
                {/* Search Results Dropdown */}
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
                              <span className="text-gray-600 font-semibold text-xs">
                                {getInitials(user.full_name || 'User')}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-900 truncate">
                                {user.full_name || 'User'}
                              </span>
                              <span className="text-xs text-gray-500">
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
                <div className="p-4 text-center text-gray-500">
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
                          <span className="text-gray-600 font-semibold text-sm">
                            {getInitials(conv.other_user_username)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-semibold text-gray-900 truncate">
                            {conv.other_user_username}
                          </span>
                          {conv.unread_count > 0 && (
                            <span className="bg-[#CB9729] text-white text-xs font-semibold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 truncate">
                            {conv.last_message || 'No messages yet'}
                          </span>
                          {conv.last_message_time && (
                            <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
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

          {/* Chat Panel */}
          <div className="flex-1 bg-white rounded-lg border border-gray-200 flex flex-col overflow-hidden">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden border border-gray-200 flex items-center justify-center">
                    {selectedConversation.other_user_profile_image ? (
                      <img
                        src={getProfileUrl(selectedConversation.other_user_profile_image) || ''}
                        alt={selectedConversation.other_user_username}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-600 font-semibold text-xs">
                        {getInitials(selectedConversation.other_user_username)}
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {selectedConversation.other_user_username}
                  </span>
                </div>

                {/* Messages */}
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
                          <div className="text-center text-xs text-gray-500 my-4">
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
                                <span className="text-gray-600 font-semibold text-xs">
                                  {getInitials(selectedConversation.other_user_username)}
                                </span>
                              )}
                            </div>
                          )}
                          <div
                            className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                              isOwnMessage
                                ? 'bg-white border border-gray-200'
                                : 'bg-gray-100'
                            }`}
                          >
                            <p className="text-sm text-gray-900">{msg.message}</p>
                            {isOwnMessage && (
                              <div className="flex justify-end items-center mt-0.5">
                                {msg.is_read_by_recipient ? (
                                  // Blue double tick - message seen/read
                                  <CheckCheck size={16} className="text-[#53BDEB]" strokeWidth={2.5} />
                                ) : msg.is_delivered ? (
                                  // Gray double tick - message reached/delivered
                                  <CheckCheck size={16} className="text-[#8696A0]" strokeWidth={2.5} />
                                ) : (
                                  // Single tick - message sent
                                  <Check size={12} className="text-[#8696A0]" strokeWidth={2.5} />
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

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-500 hover:text-gray-700">
                      <Smile size={20} />
                    </button>
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
                    <button className="p-2 text-gray-500 hover:text-gray-700">
                      <Paperclip size={20} />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700">
                      <ImageIcon size={20} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

