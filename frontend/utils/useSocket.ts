/**
 * Centralized WebSocket hook for real-time updates
 */

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getCurrentUserId } from './auth';
import { API_BASE_URL } from './config';

let globalSocket: Socket | null = null;
const socketListeners: Map<string, Set<Function>> = new Map();

/**
 * Initialize global socket connection
 */
export function initializeSocket(): Socket | null {
  if (globalSocket?.connected) {
    console.log('Socket already connected');
    return globalSocket;
  }

  const userId = getCurrentUserId();
  if (!userId) {
    console.warn('Cannot initialize socket: No user ID found');
    return null;
  }

  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket.removeAllListeners();
  }

  const socketUrl =
    typeof API_BASE_URL === 'string' && API_BASE_URL.trim()
      ? API_BASE_URL.trim()
      : null;
  if (!socketUrl) {
    console.warn('Socket URL (NEXT_PUBLIC_API_URL) is not set');
    return null;
  }

  console.log('Initializing WebSocket connection to:', socketUrl);

  try {
    globalSocket = io(socketUrl, {
      path: '/socket.io',
      transports: ['polling', 'websocket'], // polling first for proxies that don't support WebSocket upgrade
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 10,
      timeout: 20000,
      forceNew: false,
      withCredentials: true,
      secure: socketUrl.startsWith('https'),
    });

    // Store userId in closure for use in event handlers
    const currentUserId = userId;

    globalSocket.on('connect', () => {
      console.log('✅ Socket connected, sending userId:', currentUserId);
      // Use a small delay to ensure socket is fully ready
      setTimeout(() => {
        try {
          if (globalSocket && globalSocket.connected && currentUserId) {
            console.log('Emitting userId event...');
            globalSocket.emit(
              'userId',
              { userId: currentUserId },
              (response: any) => {
                if (response && response.error) {
                  console.error(
                    '❌ Error response from userId event:',
                    response.error
                  );
                } else {
                  console.log(
                    '✅ userId sent successfully, response:',
                    response
                  );
                }
              }
            );
          } else {
            console.warn('⚠️ Socket not ready when trying to send userId', {
              socketExists: !!globalSocket,
              connected: globalSocket?.connected,
              hasUserId: !!currentUserId,
            });
          }
        } catch (error) {
          console.error('❌ Error sending userId:', error);
          if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
          }
        }
      }, 100);
    });
  } catch (error) {
    console.error('❌ Error creating socket:', error);
    return null;
  }

  globalSocket.on('disconnect', reason => {
    console.log('❌ Socket disconnected:', reason);
  });

  globalSocket.on('connect_error', (error: any) => {
    // Ignore empty error objects - they're often false positives from socket.io
    if (!error) {
      return;
    }

    // Check if it's an empty object
    if (typeof error === 'object' && Object.keys(error).length === 0) {
      // Silently ignore empty error objects
      return;
    }

    // Only log if error has meaningful content
    if (
      error.message ||
      error.description ||
      error.type ||
      error.code ||
      typeof error === 'string'
    ) {
      console.error('❌ Socket connection error:', error);
      if (typeof error === 'string') {
        console.error('Error string:', error);
      } else if (typeof error === 'object') {
        console.error('Error details:', {
          message: error.message || 'No message',
          description: error.description || 'No description',
          context: error.context || 'No context',
          type: error.type || 'No type',
          code: error.code || 'No code',
          stack: error.stack || 'No stack',
          toString: error.toString(),
        });
      }
    }
  });

  globalSocket.on('error', (error: any) => {
    // Ignore empty error objects - they're often false positives from socket.io
    if (!error) {
      return;
    }

    // Check if it's an empty object
    if (typeof error === 'object' && Object.keys(error).length === 0) {
      // Silently ignore empty error objects
      return;
    }

    // Only log if error has meaningful content
    if (
      error.message ||
      error.description ||
      error.type ||
      error.code ||
      typeof error === 'string'
    ) {
      console.error('❌ Socket error event:', error);
      if (typeof error === 'string') {
        console.error('Error string:', error);
      } else if (typeof error === 'object') {
        console.error('Error object details:', {
          message: error.message || 'No message',
          description: error.description || 'No description',
          context: error.context || 'No context',
          type: error.type || 'No type',
          code: error.code || 'No code',
          stack: error.stack || 'No stack',
          toString: error.toString(),
        });
      }
    }
  });

  return globalSocket;
}

/**
 * Get or create global socket instance
 */
export function getSocket(): Socket | null {
  if (!globalSocket) {
    return initializeSocket();
  }

  // If socket exists but not connected, try to reconnect
  if (!globalSocket.connected) {
    console.log('Socket exists but not connected, attempting to reconnect...');
    globalSocket.connect();
  }

  return globalSocket;
}

/**
 * Disconnect global socket
 */
export function disconnectSocket() {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
    socketListeners.clear();
  }
}

/**
 * React hook for using WebSocket
 */
export function useSocket() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const listenersRef = useRef<Map<string, Function[]>>(new Map());

  useEffect(() => {
    const userId = getCurrentUserId();
    if (!userId) {
      return;
    }

    const newSocket = getSocket();
    if (!newSocket) {
      return;
    }

    setSocket(newSocket);
    setIsConnected(newSocket.connected);

    const onConnect = () => {
      setIsConnected(true);
      newSocket.emit('userId', { userId });
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    newSocket.on('connect', onConnect);
    newSocket.on('disconnect', onDisconnect);

    return () => {
      newSocket.off('connect', onConnect);
      newSocket.off('disconnect', onDisconnect);
      // Copy current listeners to local variable to avoid stale ref issues during cleanup
      const currentListeners = listenersRef.current;
      currentListeners.forEach((handlers, event) => {
        handlers.forEach(handler => {
          newSocket.off(event, handler as any);
        });
      });
      currentListeners.clear();
    };
  }, []);

  /**
   * Subscribe to a socket event
   */
  const on = (event: string, handler: Function) => {
    if (!socket) return;

    if (!listenersRef.current.has(event)) {
      listenersRef.current.set(event, []);
    }
    listenersRef.current.get(event)?.push(handler);

    socket.on(event, handler as any);
  };

  /**
   * Unsubscribe from a socket event
   */
  const off = (event: string, handler?: Function) => {
    if (!socket) return;

    if (handler) {
      socket.off(event, handler as any);
      const handlers = listenersRef.current.get(event);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index > -1) {
          handlers.splice(index, 1);
        }
      }
    } else {
      socket.off(event);
      listenersRef.current.delete(event);
    }
  };

  /**
   * Emit a socket event
   */
  const emit = (event: string, data: any) => {
    if (!socket || !socket.connected) {
      console.warn('Socket not connected, cannot emit:', event);
      return;
    }
    socket.emit(event, data);
  };

  return {
    socket,
    isConnected,
    on,
    off,
    emit,
  };
}
