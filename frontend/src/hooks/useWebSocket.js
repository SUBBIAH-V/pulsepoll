import { useEffect, useRef, useState } from 'react';
import { WS_BASE_URL } from '../services/api';

export const useWebSocket = (pollId, onMessageReceived) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectCountRef = useRef(0);
  const maxReconnects = 10;

  // Keep latest callback in a ref so reconnect always uses freshest handler
  // without triggering re-renders or dependency loops
  const onMessageRef = useRef(onMessageReceived);
  useEffect(() => {
    onMessageRef.current = onMessageReceived;
  }, [onMessageReceived]);

  useEffect(() => {
    if (!pollId) return;

    let destroyed = false;

    const connect = () => {
      if (destroyed) return;

      // Clean up any existing socket
      if (socketRef.current) {
        socketRef.current.onclose = null; // prevent recursive reconnect
        socketRef.current.close();
        socketRef.current = null;
      }

      const wsUrl = `${WS_BASE_URL}/polls/${pollId}`;
      console.log(`[WS] Connecting → ${wsUrl}`);

      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        if (destroyed) { socket.close(); return; }
        console.log(`[WS] Connected to poll [${pollId}]`);
        setIsConnected(true);
        reconnectCountRef.current = 0;
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // Always call the latest message handler via ref
          if (onMessageRef.current) {
            onMessageRef.current(data);
          }
        } catch (err) {
          console.warn('[WS] Failed to parse message:', err);
        }
      };

      socket.onerror = () => {
        console.warn('[WS] Connection error');
      };

      socket.onclose = (event) => {
        if (destroyed) return;
        console.log(`[WS] Closed (code ${event.code})`);
        setIsConnected(false);

        // Exponential backoff reconnect
        if (reconnectCountRef.current < maxReconnects) {
          reconnectCountRef.current += 1;
          const delay = Math.min(1000 * Math.pow(1.5, reconnectCountRef.current), 15000);
          console.log(`[WS] Reconnecting in ${Math.round(delay)}ms (attempt ${reconnectCountRef.current})`);
          reconnectTimerRef.current = setTimeout(connect, delay);
        } else {
          console.warn('[WS] Max reconnects reached. Giving up.');
        }
      };
    };

    connect();

    return () => {
      destroyed = true;
      clearTimeout(reconnectTimerRef.current);
      if (socketRef.current) {
        socketRef.current.onclose = null;
        socketRef.current.close();
        socketRef.current = null;
      }
      setIsConnected(false);
    };
  }, [pollId]);

  return { isConnected };
};
