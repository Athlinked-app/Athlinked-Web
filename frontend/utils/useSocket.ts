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
    return globalSocket;
  }

  const userId = getCurrentUserId();
  if (!userId) {
    return null;
  }

  if (globalSocket) {
    globalSocket.disconnect();
  }

  globalSocket = io(API_BASE_URL, {
    transports: ['websocket'],
    autoConnect: true,
  });

  globalSocket.on('connect', () => {
    console.log('Socket connected');
    globalSocket?.emit('userId', { userId });
  });

  globalSocket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  globalSocket.on('error', (error: any) => {
    console.error('Socket error:', error);
  });

  return globalSocket;
}

/**
 * Get or create global socket instance
 */
export function getSocket(): Socket | null {
  if (!globalSocket || !globalSocket.connected) {
    return initializeSocket();
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
