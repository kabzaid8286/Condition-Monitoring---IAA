import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_REALTIME_URL || 'http://localhost:3001';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const token = useAuthStore(state => state.accessToken);

  useEffect(() => {
    if (!token) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      reconnection: true,
    });

    socketRef.current.on('connect', () => setIsConnected(true));
    socketRef.current.on('disconnect', () => setIsConnected(false));

    return () => {
      socketRef.current?.disconnect();
    };
  }, [token]);

  const subscribe = useCallback((room) => {
    socketRef.current?.emit('subscribe', room);
  }, []);

  const unsubscribe = useCallback((room) => {
    socketRef.current?.emit('unsubscribe', room);
  }, []);

  const onSensorData = useCallback((callback) => {
    if (!socketRef.current) return;
    socketRef.current.on('sensorData', callback);
    return () => socketRef.current?.off('sensorData', callback);
  }, []);

  const onAlert = useCallback((callback) => {
    if (!socketRef.current) return;
    socketRef.current.on('alert', callback);
    return () => socketRef.current?.off('alert', callback);
  }, []);

  return { isConnected, subscribe, unsubscribe, onSensorData, onAlert };
};

export default useSocket;
