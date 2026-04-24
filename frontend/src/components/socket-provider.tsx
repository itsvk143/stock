'use client';

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useMarketStore } from '@/store/market-store';

const SocketContext = createContext<Socket | null>(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const socketRef = useRef<Socket | null>(null);
  const updatePrice = useMarketStore((state) => state.updatePrice);
  const subscribedTokens = useMarketStore((state) => state.subscribedTokens);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const baseUrl = apiUrl.replace(/\/api$/, '');
    const socket = io(baseUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to Market Socket');
      if (subscribedTokens.length > 0) {
        socket.emit('subscribe_stock', subscribedTokens);
      }
    });

    // We'll dynamic listen to ticks
    // In a real app, you might want to listen to a generic 'tick' and check token
    // but here we follow the backend implementation of server.emit(`tick:${data.token}`, data)
    
    return () => {
      socket.disconnect();
    };
  }, []);

  // Listen to subscribed tokens
  useEffect(() => {
    if (!socketRef.current) return;
    
    const socket = socketRef.current;
    
    subscribedTokens.forEach((token) => {
      socket.off(`tick:${token}`);
      socket.on(`tick:${token}`, (data) => {
        updatePrice(token, data);
      });
    });

    if (socket.connected) {
      socket.emit('subscribe_stock', subscribedTokens);
    }
  }, [subscribedTokens, updatePrice]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
};
