import { useState, useEffect, useRef } from 'react';
import { useAssets } from '../contexts/AssetContext';

export default function useSensorData(activeAsset = 'test-rig-a') {
  const { assets } = useAssets();
  const assetBase = assets[activeAsset] || assets['test-rig-a'];

  const [isConnected, setIsConnected] = useState(false);
  const [connectionMode, setConnectionMode] = useState('simulated'); // 'live' | 'simulated'

  const [data, setData] = useState({
    labels: [],
    vibX: [],
    vibY: [],
    vibZ: [],
    temp: [],
    rpm: []
  });

  const [kpis, setKpis] = useState({
    vibRms: '0.00',
    temp: '0.0',
    rpm: 0,
    health: 100,
    motorLoad: 0,
    battery: 100,
    burstState: 'idle'
  });

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const activeAssetRef = useRef(activeAsset);

  useEffect(() => {
    activeAssetRef.current = activeAsset;
  }, [activeAsset]);

  // Reset data buffers when activeAsset changes
  useEffect(() => {
    setData({
      labels: [],
      vibX: [],
      vibY: [],
      vibZ: [],
      temp: [],
      rpm: []
    });

    setKpis({
      vibRms: '0.00',
      temp: '0.0',
      rpm: 0,
      health: 100,
      motorLoad: 0,
      battery: 100,
      burstState: 'idle'
    });
  }, [activeAsset]);

  // WebSocket Connection Management
  useEffect(() => {
    let isUnmounted = false;

    const connectWebSocket = () => {
      if (isUnmounted) return;

      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsHost = window.location.hostname || 'localhost';
      const wsUrl = `${wsProtocol}//${wsHost}:8000/api/v1/telemetry/ws`;

      try {
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          if (isUnmounted) return;
          setIsConnected(true);
          setConnectionMode('live');
        };

        socket.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const payload = JSON.parse(event.data);

            if (payload.type === 'SNAPSHOT' && payload.data) {
              const currentReading = payload.data[activeAssetRef.current];
              if (currentReading) {
                setKpis(k => ({
                  ...k,
                  vibRms: parseFloat(currentReading.vibX || 0).toFixed(2),
                  temp: parseFloat(currentReading.temp || 0).toFixed(1),
                  rpm: Math.round(parseFloat(currentReading.rpm || 0))
                }));
              }
            } else if (payload.type === 'TELEMETRY' && payload.data) {
              const item = payload.data;
              if (item.asset_id === activeAssetRef.current) {
                const timeStr = item.time 
                  ? new Date(item.time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

                const vx = parseFloat(item.vibX).toFixed(2);
                const vy = parseFloat(item.vibY).toFixed(2);
                const vz = item.vibZ !== undefined ? parseFloat(item.vibZ).toFixed(2) : (parseFloat(item.vibY) * 0.85).toFixed(2);
                const tp = parseFloat(item.temp).toFixed(1);
                const rp = Math.round(parseFloat(item.rpm));

                setData(prev => ({
                  labels: [...prev.labels.slice(1), timeStr],
                  vibX: [...prev.vibX.slice(1), vx],
                  vibY: [...prev.vibY.slice(1), vy],
                  vibZ: [...prev.vibZ.slice(1), vz],
                  temp: [...prev.temp.slice(1), tp],
                  rpm: [...prev.rpm.slice(1), rp]
                }));

                setKpis(k => ({
                  ...k,
                  vibRms: vx,
                  temp: tp,
                  rpm: rp,
                  health: Math.max(60, Math.min(100, Math.round(100 - (parseFloat(vx) * 3.5)))),
                  motorLoad: Math.min(100, Math.round((rp / 3000) * 100)),
                  battery: item.battery_pct !== undefined ? item.battery_pct : (k.battery || 98),
                  burstState: item.burst_state || 'active'
                }));
              }
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        socket.onerror = () => {
          if (isUnmounted) return;
          setIsConnected(false);
          setConnectionMode('simulated');
        };

        socket.onclose = () => {
          if (isUnmounted) return;
          setIsConnected(false);
          setConnectionMode('simulated');
          // Auto-reconnect after 4 seconds
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 4000);
        };
      } catch (err) {
        if (!isUnmounted) {
          setIsConnected(false);
          setConnectionMode('simulated');
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 4000);
        }
      }
    };

    connectWebSocket();

    return () => {
      isUnmounted = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  // Pure live mode: No mock/simulation data generated
  // Telemetry updates exclusively via incoming WebSocket packets from hardware pipeline

  return { data, kpis, isConnected, connectionMode };
}
