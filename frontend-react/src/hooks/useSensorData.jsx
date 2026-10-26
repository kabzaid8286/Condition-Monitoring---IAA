import { useState, useEffect, useRef } from 'react';
import { useAssets } from '../contexts/AssetContext';

// Helper to pre-seed rolling history buffers so sparklines and charts never render blank
function generateSeededHistory(baseVib = 2.4, baseTemp = 45.0, baseRpm = 1480, count = 20) {
  const labels = [];
  const vibX = [];
  const vibY = [];
  const vibZ = [];
  const temp = [];
  const rpm = [];

  const now = Date.now();
  const vNum = parseFloat(baseVib) || 2.4;
  const tNum = parseFloat(baseTemp) || 45.0;
  const rNum = parseFloat(baseRpm) || 1480;

  for (let i = count - 1; i >= 0; i--) {
    const t = new Date(now - i * 1500);
    labels.push(t.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));

    const cycle = Math.sin(i * 0.45);
    const vx = Math.max(0.1, vNum + cycle * 0.12).toFixed(2);
    const vy = (parseFloat(vx) * 0.55).toFixed(2);
    const vz = (parseFloat(vy) * 0.85).toFixed(2);
    const tp = (tNum + Math.cos(i * 0.25) * 0.35).toFixed(1);
    const rp = Math.round(rNum + Math.sin(i * 0.3) * 6);

    vibX.push(vx);
    vibY.push(vy);
    vibZ.push(vz);
    temp.push(tp);
    rpm.push(rp);
  }

  return { labels, vibX, vibY, vibZ, temp, rpm };
}

export default function useSensorData(activeAsset = 'test-rig-a') {
  const { assets } = useAssets();
  const assetBase = assets[activeAsset] || assets['test-rig-a'] || { basevib: 2.4, basetemp: 45.0, baserpm: 1480, name: 'Test Rig A' };
  const isCustomAsset = Boolean(assetBase.isCustom);

  const [isConnected, setIsConnected] = useState(isCustomAsset);
  const [connectionMode, setConnectionMode] = useState(isCustomAsset ? 'simulated' : 'offline'); // 'live' | 'offline' | 'simulated'

  const [data, setData] = useState(() => 
    generateSeededHistory(assetBase.basevib, assetBase.basetemp, assetBase.baserpm, 20)
  );

  const [kpis, setKpis] = useState(() => {
    const v = parseFloat(assetBase.basevib) || 2.4;
    const t = parseFloat(assetBase.basetemp) || 45.0;
    const r = Math.round(parseFloat(assetBase.baserpm) || 1480);
    return {
      vibRms: v.toFixed(2),
      temp: t.toFixed(1),
      rpm: r,
      health: Math.max(60, Math.min(100, Math.round(100 - (v * 3.5)))),
      motorLoad: Math.min(100, Math.round((r / 3000) * 100)),
      battery: 100,
      burstState: 'active'
    };
  });

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const activeAssetRef = useRef(activeAsset);
  const lastTelemetryTimeRef = useRef(0);

  useEffect(() => {
    activeAssetRef.current = activeAsset;
  }, [activeAsset]);

  // When activeAsset switches, re-seed buffers with corresponding baseline parameters
  const prevAssetRef = useRef(activeAsset);
  useEffect(() => {
    if (prevAssetRef.current !== activeAsset) {
      prevAssetRef.current = activeAsset;
      const currentAssetBase = assets[activeAsset] || assets['test-rig-a'] || { basevib: 2.4, basetemp: 45.0, baserpm: 1480 };
      const currentIsCustom = Boolean(currentAssetBase.isCustom);

      setData(generateSeededHistory(currentAssetBase.basevib, currentAssetBase.basetemp, currentAssetBase.baserpm, 20));

      const v = parseFloat(currentAssetBase.basevib) || 2.4;
      const t = parseFloat(currentAssetBase.basetemp) || 45.0;
      const r = Math.round(parseFloat(currentAssetBase.baserpm) || 1480);
      setKpis({
        vibRms: v.toFixed(2),
        temp: t.toFixed(1),
        rpm: r,
        health: Math.max(60, Math.min(100, Math.round(100 - (v * 3.5)))),
        motorLoad: Math.min(100, Math.round((r / 3000) * 100)),
        battery: 100,
        burstState: 'active'
      });

      if (currentIsCustom) {
        setConnectionMode('simulated');
        setIsConnected(true);
      } else {
        setConnectionMode('offline');
        setIsConnected(false);
      }
    }
  }, [activeAsset, assets]);

  // 1. Simulation Loop for Custom Test Rigs created in Test Design
  useEffect(() => {
    if (!isCustomAsset) return;

    setConnectionMode('simulated');
    setIsConnected(true);

    const interval = setInterval(() => {
      const nowStr = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      const tSec = Date.now() / 1000;
      const baseV = parseFloat(assetBase.basevib) || 2.5;
      const baseT = parseFloat(assetBase.basetemp) || 45.0;
      const baseR = parseFloat(assetBase.baserpm) || 1500;

      const vx = Math.max(0.1, baseV + Math.sin(tSec * 0.7) * 0.18 + (Math.random() * 0.08 - 0.04)).toFixed(2);
      const vy = (parseFloat(vx) * 0.55).toFixed(2);
      const vz = (parseFloat(vy) * 0.85).toFixed(2);
      const tp = (baseT + Math.cos(tSec * 0.25) * 0.4 + (Math.random() * 0.2 - 0.1)).toFixed(1);
      const rp = Math.round(baseR + Math.sin(tSec * 0.4) * 10 + (Math.random() * 6 - 3));

      const maxPoints = 20;
      setData(prev => ({
        labels: prev.labels.length >= maxPoints ? [...prev.labels.slice(1), nowStr] : [...prev.labels, nowStr],
        vibX: prev.vibX.length >= maxPoints ? [...prev.vibX.slice(1), vx] : [...prev.vibX, vx],
        vibY: prev.vibY.length >= maxPoints ? [...prev.vibY.slice(1), vy] : [...prev.vibY, vy],
        vibZ: prev.vibZ.length >= maxPoints ? [...prev.vibZ.slice(1), vz] : [...prev.vibZ, vz],
        temp: prev.temp.length >= maxPoints ? [...prev.temp.slice(1), tp] : [...prev.temp, tp],
        rpm: prev.rpm.length >= maxPoints ? [...prev.rpm.slice(1), rp] : [...prev.rpm, rp]
      }));

      setKpis({
        vibRms: vx,
        temp: tp,
        rpm: rp,
        health: Math.max(60, Math.min(100, Math.round(100 - (parseFloat(vx) * 3.5)))),
        motorLoad: Math.min(100, Math.round((rp / 3000) * 100)),
        battery: 100,
        burstState: 'active'
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isCustomAsset, assetBase]);

  // 2. Hardware WebSocket & Heartbeat Monitor (for physical test rigs like test-rig-a)
  useEffect(() => {
    if (isCustomAsset) return;

    let isUnmounted = false;

    // Heartbeat checker: verifies if live telemetry packets have actually arrived in the last 4.5s
    const heartbeatTimer = setInterval(() => {
      if (isUnmounted) return;
      const timeSinceLastPacket = Date.now() - lastTelemetryTimeRef.current;
      if (lastTelemetryTimeRef.current > 0 && timeSinceLastPacket <= 4500) {
        setConnectionMode('live');
        setIsConnected(true);
      } else {
        // Hardware is disconnected / unplugged
        setConnectionMode('offline');
        setIsConnected(false);
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
          // Keep mode as 'offline' until actual live TELEMETRY packets start arriving from hardware
        };

        socket.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const payload = JSON.parse(event.data);

            if (payload.type === 'SNAPSHOT' && payload.data) {
              const currentReading = payload.data[activeAssetRef.current];
              if (currentReading && parseFloat(currentReading.vibX || 0) > 0) {
                const vx = parseFloat(currentReading.vibX).toFixed(2);
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
              }
            } else if (payload.type === 'TELEMETRY' && payload.data) {
              const item = payload.data;
              if (item.asset_id === activeAssetRef.current) {
                // Microcontroller telemetry packet received! Mark hardware as LIVE
                lastTelemetryTimeRef.current = Date.now();
                setConnectionMode('live');
                setIsConnected(true);

                const rawVx = parseFloat(item.vibX || 0);
                const rawVy = parseFloat(item.vibY || 0);
                const rawTp = parseFloat(item.temp || 0);
                const rawRp = Math.round(parseFloat(item.rpm || 0));
                const burstSt = item.burst_state || 'active';

                // Retain last known readings during duty-cycle sleep
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
          setConnectionMode('offline');
        };

        socket.onclose = () => {
          if (isUnmounted) return;
          setIsConnected(false);
          setConnectionMode('offline');
          reconnectTimeoutRef.current = setTimeout(connectWebSocket, 4000);
        };
      } catch (err) {
        if (!isUnmounted) {
          setIsConnected(false);
          setConnectionMode('offline');
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
  }, [isCustomAsset]);

  return { data, kpis, isConnected, connectionMode };
}
