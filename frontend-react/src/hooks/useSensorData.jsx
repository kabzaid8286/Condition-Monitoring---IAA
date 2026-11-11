import { useState, useEffect, useRef } from 'react';
import { useAssets } from '../contexts/AssetContext';

// Default offline state: all gauges and live values zero / null
export const OFFLINE_KPIS = {
  vibRms: '0.0000',
  accelRms: '0.0000',
  temp: '0.0',
  rpm: 0,
  health: '--',
  motorLoad: 0,
  battery: '--',
  sampleRateHz: 12800,
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
  const accelX = [];
  const accelY = [];
  const temp = [];
  const rpm = [];
  const now = Date.now();

  for (let i = 19; i >= 0; i--) {
    const t = new Date(now - i * 2000);
    labels.push(t.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    vibX.push('0.0000');
    vibY.push('0.0000');
    vibZ.push('0.0000');
    accelX.push('0.00');
    accelY.push('0.00');
    temp.push('0.0');
    rpm.push(0);
  }

  return { labels, vibX, vibY, vibZ, accelX, accelY, temp, rpm };
}

export default function useSensorData(activeAsset = '', onAutoSelectLiveAsset = null) {
  const { assets, autoRegisterSensor } = useAssets();

  // Per-asset tracking maps
  const assetLastPacketTimeRef = useRef({}); // { [assetId]: timestamp }
  const assetDataMapRef = useRef({});        // { [assetId]: dataBuffer }
  const assetKpisMapRef = useRef({});        // { [assetId]: kpiObject }
  const onAutoSelectRef = useRef(onAutoSelectLiveAsset);

  useEffect(() => {
    onAutoSelectRef.current = onAutoSelectLiveAsset;
  }, [onAutoSelectLiveAsset]);

  // Check if current asset is live right now
  const isCurrentLiveInitial = () => {
    const t = assetLastPacketTimeRef.current[activeAsset] || 0;
    return t > 0 && (Date.now() - t) <= 3500;
  };

  const [currentSelectedAsset, setCurrentSelectedAsset] = useState(activeAsset);
  const [isConnected, setIsConnected] = useState(isCurrentLiveInitial);
  const [connectionMode, setConnectionMode] = useState(isCurrentLiveInitial() ? 'live' : 'offline');
  const [data, setData] = useState(() => assetDataMapRef.current[activeAsset] || getInitialDataBuffer(activeAsset));
  const [kpis, setKpis] = useState(() => isCurrentLiveInitial() ? (assetKpisMapRef.current[activeAsset] || OFFLINE_KPIS) : OFFLINE_KPIS);

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const activeAssetRef = useRef(activeAsset);

  useEffect(() => {
    activeAssetRef.current = activeAsset;
  }, [activeAsset]);

  // Synchronous state adjustment during render when activeAsset changes
  // Eliminates 1-second transient glitches when switching machines
  if (currentSelectedAsset !== activeAsset) {
    setCurrentSelectedAsset(activeAsset);
    const lastSeen = assetLastPacketTimeRef.current[activeAsset] || 0;
    const isLiveNow = lastSeen > 0 && (Date.now() - lastSeen) <= 3500;

    if (isLiveNow) {
      setData(assetDataMapRef.current[activeAsset] || getInitialDataBuffer(activeAsset));
      setKpis(assetKpisMapRef.current[activeAsset] || OFFLINE_KPIS);
      setIsConnected(true);
      setConnectionMode('live');
    } else {
      // Unconnected machine: immediately zero / offline
      setData(getInitialDataBuffer(activeAsset));
      setKpis(OFFLINE_KPIS);
      setIsConnected(false);
      setConnectionMode('offline');
    }
  }

  // Unified WebSocket Listener for all hardware sensors (with Heartbeat & Auto-Detection)
  useEffect(() => {
    let isUnmounted = false;

    // Heartbeat monitor: evaluates strictly against the active asset's last packet time
    const heartbeatTimer = setInterval(() => {
      if (isUnmounted) return;
      const currentAsset = activeAssetRef.current;
      const lastSeen = assetLastPacketTimeRef.current[currentAsset] || 0;
      const isLiveNow = lastSeen > 0 && (Date.now() - lastSeen) <= 3500;

      if (isLiveNow) {
        setConnectionMode('live');
        setIsConnected(true);
      } else {
        // Disconnected or unplugged: drop live gauges strictly to zero/offline
        setConnectionMode('offline');
        setIsConnected(false);
        setKpis(OFFLINE_KPIS);
      }
    }, 1000);

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
        };

        socket.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const payload = JSON.parse(event.data);

            // 1. Process SNAPSHOT
            if (payload.type === 'SNAPSHOT' && payload.data) {
              const now = Date.now();
              Object.entries(payload.data).forEach(([id, item]) => {
                // Only auto-register from snapshot if the reading is actively live (<3.5s old)
                const packetTime = item.time ? new Date(item.time).getTime() : 0;
                const isActivelyStreaming = (now - packetTime) <= 3500;
                if (isActivelyStreaming && autoRegisterSensor) {
                  autoRegisterSensor(id, item.name || item.asset_name, false);
                }
              });
            } 
            // 2. Process Live TELEMETRY Packet
            else if (payload.type === 'TELEMETRY' && payload.data) {
              const item = payload.data;
              const incomingId = item.asset_id;

              if (!incomingId) return;

              // Auto-detect new sensor if not yet registered in system design (live hardware wake-up)
              if (autoRegisterSensor) {
                autoRegisterSensor(incomingId, item.name || item.asset_name, true);
              }

              // Update last packet timestamp for THIS specific sensor
              assetLastPacketTimeRef.current[incomingId] = Date.now();

              const rawVx = parseFloat(item.vibX || 0);
              const rawVy = parseFloat(item.vibY || 0);
              const rawAx = parseFloat(item.accelX || 0);
              const rawAy = parseFloat(item.accelY || 0);
              const rawTp = parseFloat(item.temp || 0);
              const rawRp = Math.round(parseFloat(item.rpm || 0));
              const burstSt = item.burst_state || 'active';

              const timeStr = item.time 
                ? new Date(item.time).toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })
                : new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

              const vx = rawVx.toFixed(4);
              const vy = rawVy.toFixed(4);
              const vz = item.vibZ !== undefined ? parseFloat(item.vibZ).toFixed(4) : (rawVy * 0.85).toFixed(4);
              const ax = rawAx.toFixed(4);
              const ay = rawAy.toFixed(4);
              const tp = rawTp.toFixed(1);
              const rp = rawRp;

              const maxPoints = 30;
              const existingData = assetDataMapRef.current[incomingId] || getInitialDataBuffer(incomingId);
              const slide = (arr, val) => arr.length >= maxPoints ? [...arr.slice(1), val] : [...arr, val];
              const nextData = {
                labels: slide(existingData.labels, timeStr),
                vibX: slide(existingData.vibX, vx),
                vibY: slide(existingData.vibY, vy),
                vibZ: slide(existingData.vibZ, vz),
                accelX: slide(existingData.accelX || [], ax),
                accelY: slide(existingData.accelY || [], ay),
                temp: slide(existingData.temp, tp),
                rpm: slide(existingData.rpm, rp)
              };

              assetDataMapRef.current[incomingId] = nextData;

              // Persist recorded telemetry for this sensor
              try {
                localStorage.setItem(`recorded_telemetry_${incomingId}`, JSON.stringify(nextData));
              } catch (e) {
                // ignore
              }

              const nextKpis = {
                vibRms: vx,
                accelRms: ax,
                temp: tp,
                rpm: rp,
                health: Math.max(0, Math.min(100, Math.round(100 - (parseFloat(vx) * 3500)))),
                motorLoad: Math.min(100, Math.round((rp / 3000) * 100)),
                battery: item.battery_pct !== undefined ? item.battery_pct : 98,
                sampleRateHz: item.sample_rate_hz || 12800,
                burstState: burstSt
              };

              assetKpisMapRef.current[incomingId] = nextKpis;

              // Auto-focus switcher: ONLY lock onto live sensor if NO asset is currently selected at all
              const currentActive = activeAssetRef.current;
              if (!currentActive && onAutoSelectRef.current) {
                onAutoSelectRef.current(incomingId);
              }

              // Update live active UI state ONLY if this packet matches the currently selected machine
              if (incomingId === activeAssetRef.current) {
                setConnectionMode('live');
                setIsConnected(true);
                setData(nextData);
                setKpis(nextKpis);
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
