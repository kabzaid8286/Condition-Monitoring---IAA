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

  const prevAssetRef = useRef(activeAsset);

  // Only reset data buffers when activeAsset actually changes to a different asset
  useEffect(() => {
    if (prevAssetRef.current !== activeAsset) {
      prevAssetRef.current = activeAsset;
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
    }
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
              if (currentReading && parseFloat(currentReading.vibX || 0) > 0) {
                const timeStr = currentReading.time 
                  ? new Date(currentReading.time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

                const vx = parseFloat(currentReading.vibX).toFixed(2);
                const vy = parseFloat(currentReading.vibY || 0).toFixed(2);
                const vz = (parseFloat(vy) * 0.85).toFixed(2);
                const tp = parseFloat(currentReading.temp || 0).toFixed(1);
                const rp = Math.round(parseFloat(currentReading.rpm || 0));

                setKpis(k => ({
                  ...k,
                  vibRms: vx,
                  temp: tp,
                  rpm: rp,
                  battery: currentReading.battery_pct !== undefined ? currentReading.battery_pct : k.battery,
                  burstState: currentReading.burst_state || 'active'
                }));

                setData(prev => {
                  if (prev.labels.length === 0) {
                    return {
                      labels: [timeStr],
                      vibX: [vx],
                      vibY: [vy],
                      vibZ: [vz],
                      temp: [tp],
                      rpm: [rp]
                    };
                  }
                  return prev;
                });
              }
            } else if (payload.type === 'TELEMETRY' && payload.data) {
              const item = payload.data;
              if (item.asset_id === activeAssetRef.current) {
                const rawVx = parseFloat(item.vibX || 0);
                const rawVy = parseFloat(item.vibY || 0);
                const rawTp = parseFloat(item.temp || 0);
                const rawRp = Math.round(parseFloat(item.rpm || 0));
                const burstSt = item.burst_state || 'active';

                // If node is sleeping and sending zero placeholders, retain last known readings
                if (rawVx === 0 && rawTp === 0 && burstSt === 'sleep') {
                  setKpis(k => ({
                    ...k,
                    burstState: 'sleep',
                    battery: item.battery_pct !== undefined ? item.battery_pct : k.battery
                  }));
                  return;
                }

                const timeStr = item.time 
                  ? new Date(item.time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
                  : new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

                const vx = rawVx.toFixed(2);
                const vy = rawVy.toFixed(2);
                const vz = item.vibZ !== undefined ? parseFloat(item.vibZ).toFixed(2) : (rawVy * 0.85).toFixed(2);
                const tp = rawTp.toFixed(1);
                const rp = rawRp;

                const maxPoints = 20;
                setData(prev => {
                  const slide = (arr, val) => arr.length >= maxPoints ? [...arr.slice(1), val] : [...arr, val];
                  return {
                    labels: slide(prev.labels, timeStr),
                    vibX: slide(prev.vibX, vx),
                    vibY: slide(prev.vibY, vy),
                    vibZ: slide(prev.vibZ, vz),
                    temp: slide(prev.temp, tp),
                    rpm: slide(prev.rpm, rp)
                  };
                });

                setKpis(k => ({
                  ...k,
                  vibRms: vx,
                  temp: tp,
                  rpm: rp,
                  health: Math.max(60, Math.min(100, Math.round(100 - (parseFloat(vx) * 3.5)))),
                  motorLoad: Math.min(100, Math.round((rp / 3000) * 100)),
                  battery: item.battery_pct !== undefined ? item.battery_pct : (k.battery || 98),
                  burstState: burstSt
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
