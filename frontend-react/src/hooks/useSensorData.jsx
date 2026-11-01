import { useState, useEffect, useRef } from 'react';
import { useAssets } from '../contexts/AssetContext';

// Default offline state: all gauges and live values zero / null
export const OFFLINE_KPIS = {
  vibRms: '0.00',
  temp: '0.0',
  rpm: 0,
  health: '--',
  motorLoad: 0,
  battery: '--',
  burstState: 'offline'
};

// Restores recorded data from previous live connections, or falls back to clean 0 buffer
function getInitialDataBuffer(assetId) {
  try {
    const saved = localStorage.getItem(`recorded_telemetry_${assetId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.labels) && parsed.labels.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading saved telemetry from localStorage:', e);
  }

  // Clean zero/standby baseline (no synthetic sine waves)
  const labels = [];
  const vibX = [];
  const vibY = [];
  const vibZ = [];
  const temp = [];
  const rpm = [];
  const now = Date.now();

  for (let i = 19; i >= 0; i--) {
    const t = new Date(now - i * 2000);
    labels.push(t.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    vibX.push('0.00');
    vibY.push('0.00');
    vibZ.push('0.00');
    temp.push('0.0');
    rpm.push(0);
  }

  return { labels, vibX, vibY, vibZ, temp, rpm };
}

export default function useSensorData(activeAsset = 'test-rig-a') {
  const { assets, autoRegisterSensor } = useAssets();
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMode, setConnectionMode] = useState('offline'); // 'live' | 'offline'

  const [data, setData] = useState(() => getInitialDataBuffer(activeAsset));
  const [kpis, setKpis] = useState(OFFLINE_KPIS);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const activeAssetRef = useRef(activeAsset);
  const lastTelemetryTimeRef = useRef(0);

  useEffect(() => {
    activeAssetRef.current = activeAsset;
  }, [activeAsset]);

  // When activeAsset changes, load recorded history for that asset or zero buffer
  const prevAssetRef = useRef(activeAsset);
  useEffect(() => {
    if (prevAssetRef.current !== activeAsset) {
      prevAssetRef.current = activeAsset;
      setData(getInitialDataBuffer(activeAsset));
      setKpis(OFFLINE_KPIS);
      lastTelemetryTimeRef.current = 0;
      setConnectionMode('offline');
      setIsConnected(false);
    }
  }, [activeAsset]);

  // Unified WebSocket Listener for all hardware sensors (with Heartbeat & Auto-Detection)
  useEffect(() => {
    let isUnmounted = false;

    // Heartbeat monitor: checks if actual packets arrived within the last 4.5 seconds
    const heartbeatTimer = setInterval(() => {
      if (isUnmounted) return;
      const timeSinceLastPacket = Date.now() - lastTelemetryTimeRef.current;
      if (lastTelemetryTimeRef.current > 0 && timeSinceLastPacket <= 4500) {
        setConnectionMode('live');
        setIsConnected(true);
      } else {
        // Disconnected or unplugged: drop live gauges to zero/offline
        setConnectionMode('offline');
        setIsConnected(false);
        setKpis(OFFLINE_KPIS);
      }
    }, 1500);

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
          // Remains offline until live TELEMETRY packets actually stream from hardware
        };

        socket.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const payload = JSON.parse(event.data);

            // 1. Process SNAPSHOT
            if (payload.type === 'SNAPSHOT' && payload.data) {
              // Auto-detect any unknown assets present in snapshot
              Object.keys(payload.data).forEach(id => {
                if (autoRegisterSensor) {
                  autoRegisterSensor(id);
                }
              });

              const currentReading = payload.data[activeAssetRef.current];
              if (currentReading && parseFloat(currentReading.vibX || 0) > 0) {
                const vx = parseFloat(currentReading.vibX).toFixed(2);
                const tp = parseFloat(currentReading.temp || 0).toFixed(1);
                const rp = Math.round(parseFloat(currentReading.rpm || 0));

                setKpis({
                  vibRms: vx,
                  temp: tp,
                  rpm: rp,
                  health: Math.max(0, Math.min(100, Math.round(100 - (parseFloat(vx) * 3.5)))),
                  motorLoad: Math.min(100, Math.round((rp / 3000) * 100)),
                  battery: currentReading.battery_pct !== undefined ? currentReading.battery_pct : 100,
                  burstState: currentReading.burst_state || 'active'
                });
              }
            } 
            // 2. Process Live TELEMETRY Packet
            else if (payload.type === 'TELEMETRY' && payload.data) {
              const item = payload.data;
              const incomingId = item.asset_id;

              // Auto-detect new sensor if not yet registered in system design
              if (incomingId && autoRegisterSensor) {
                autoRegisterSensor(incomingId, item.name || item.asset_name);
              }

              // Update data if packet matches currently active asset
              if (incomingId === activeAssetRef.current) {
                lastTelemetryTimeRef.current = Date.now();
                setConnectionMode('live');
                setIsConnected(true);

                const rawVx = parseFloat(item.vibX || 0);
                const rawVy = parseFloat(item.vibY || 0);
                const rawTp = parseFloat(item.temp || 0);
                const rawRp = Math.round(parseFloat(item.rpm || 0));
                const burstSt = item.burst_state || 'active';

                // Retain last known readings during duty-cycle deep sleep
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

                const maxPoints = 30;
                setData(prev => {
                  const slide = (arr, val) => arr.length >= maxPoints ? [...arr.slice(1), val] : [...arr, val];
                  const nextData = {
                    labels: slide(prev.labels, timeStr),
                    vibX: slide(prev.vibX, vx),
                    vibY: slide(prev.vibY, vy),
                    vibZ: slide(prev.vibZ, vz),
                    temp: slide(prev.temp, tp),
                    rpm: slide(prev.rpm, rp)
                  };

                  // Persist recorded data so it is retained after disconnecting
                  try {
                    localStorage.setItem(`recorded_telemetry_${activeAssetRef.current}`, JSON.stringify(nextData));
                  } catch (e) {
                    // ignore quota limits
                  }

                  return nextData;
                });

                setKpis({
                  vibRms: vx,
                  temp: tp,
                  rpm: rp,
                  health: Math.max(0, Math.min(100, Math.round(100 - (parseFloat(vx) * 3.5)))),
                  motorLoad: Math.min(100, Math.round((rp / 3000) * 100)),
                  battery: item.battery_pct !== undefined ? item.battery_pct : 98,
                  burstState: burstSt
                });
              }
            }
          } catch (err) {
            console.error('Error parsing WebSocket message:', err);
          }
        };

        socket.onerror = () => {
          if (isUnmounted) return;
          setIsConnected(false);
          setConnectionMode('offline');
          setKpis(OFFLINE_KPIS);
        };

        socket.onclose = () => {
          if (isUnmounted) return;
          setIsConnected(false);
          setConnectionMode('offline');
          setKpis(OFFLINE_KPIS);
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 4000);
        };
      } catch (err) {
        if (!isUnmounted) {
          setIsConnected(false);
          setConnectionMode('offline');
          setKpis(OFFLINE_KPIS);
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 4000);
        }
      }
    };

    connectWebSocket();

    return () => {
      isUnmounted = true;
      clearInterval(heartbeatTimer);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch (e) {
          // ignore
        }
      }
    };
  }, [autoRegisterSensor]);

  return { data, kpis, isConnected, connectionMode };
}
