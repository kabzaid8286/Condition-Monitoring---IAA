import { useState, useEffect, useRef } from 'react';
import { useAssets } from '../contexts/AssetContext';

export default function useSensorData(activeAsset = 'test-rig-a') {
  const { assets } = useAssets();
  const assetBase = assets[activeAsset] || assets['test-rig-a'];

  const [isConnected, setIsConnected] = useState(false);
  const [connectionMode, setConnectionMode] = useState('simulated'); // 'live' | 'simulated'

  const [data, setData] = useState(() => {
    const initLabels = [];
    const initVibX = [];
    const initVibY = [];
    const initVibZ = [];
    const initTemp = [];
    const initRpm = [];
    
    let now = new Date();
    for(let i = 60; i >= 0; i--) {
      let t = new Date(now.getTime() - i * 10000);
      initLabels.push(t.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      initVibX.push((Math.random() * 2 + assetBase.basevib - 1).toFixed(2));
      initVibY.push((Math.random() * 2 + assetBase.basevib - 1.2).toFixed(2));
      initVibZ.push((Math.random() * 2 + assetBase.basevib - 1.5).toFixed(2));
      
      initTemp.push((Math.random() * 5 + assetBase.basetemp - 2).toFixed(1));
      initRpm.push(Math.floor(Math.random() * 50 + assetBase.baserpm - 25));
    }
    return {
      labels: initLabels,
      vibX: initVibX,
      vibY: initVibY,
      vibZ: initVibZ,
      temp: initTemp,
      rpm: initRpm
    };
  });

  const [kpis, setKpis] = useState({
    vibRms: assetBase.basevib,
    temp: assetBase.basetemp,
    rpm: assetBase.baserpm,
    health: 98,
    motorLoad: 76.4,
    battery: 98,
    burstState: 'active'
  });

  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const activeAssetRef = useRef(activeAsset);

  useEffect(() => {
    activeAssetRef.current = activeAsset;
  }, [activeAsset]);

  // Reset or re-populate initial points when activeAsset changes
  useEffect(() => {
    const initLabels = [];
    const initVibX = [];
    const initVibY = [];
    const initVibZ = [];
    const initTemp = [];
    const initRpm = [];
    
    let now = new Date();
    for(let i = 60; i >= 0; i--) {
      let t = new Date(now.getTime() - i * 10000);
      initLabels.push(t.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      initVibX.push((Math.random() * 2 + assetBase.basevib - 1).toFixed(2));
      initVibY.push((Math.random() * 2 + assetBase.basevib - 1.2).toFixed(2));
      initVibZ.push((Math.random() * 2 + assetBase.basevib - 1.5).toFixed(2));
      
      initTemp.push((Math.random() * 5 + assetBase.basetemp - 2).toFixed(1));
      initRpm.push(Math.floor(Math.random() * 50 + assetBase.baserpm - 25));
    }

    setData({
      labels: initLabels,
      vibX: initVibX,
      vibY: initVibY,
      vibZ: initVibZ,
      temp: initTemp,
      rpm: initRpm
    });

    setKpis({
      vibRms: assetBase.basevib,
      temp: assetBase.basetemp,
      rpm: assetBase.baserpm,
      health: 98,
      motorLoad: Math.min(100, Math.round((assetBase.baserpm / 3000) * 100))
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

  // Fallback Simulation Interval: Only runs when connectionMode === 'simulated'
  useEffect(() => {
    if (connectionMode === 'live') return;

    const interval = setInterval(() => {
      setData(prev => {
        const newLabels = [...prev.labels.slice(1)];
        const newVibX = [...prev.vibX.slice(1)];
        const newVibY = [...prev.vibY.slice(1)];
        const newVibZ = [...prev.vibZ.slice(1)];
        const newTemp = [...prev.temp.slice(1)];
        const newRpm = [...prev.rpm.slice(1)];

        const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        newLabels.push(nowTime);

        let vx = (Math.random() * 2 + assetBase.basevib - 1).toFixed(2);
        let vy = (Math.random() * 2 + assetBase.basevib - 1.2).toFixed(2);
        let vz = (Math.random() * 2 + assetBase.basevib - 1.5).toFixed(2);
        let tp = (Math.random() * 5 + assetBase.basetemp - 2).toFixed(1);
        let rp = Math.floor(Math.random() * 50 + assetBase.baserpm - 25);

        newVibX.push(vx);
        newVibY.push(vy);
        newVibZ.push(vz);
        newTemp.push(tp);
        newRpm.push(rp);

        setKpis(k => ({
          ...k,
          vibRms: vx,
          temp: tp,
          rpm: rp
        }));

        return {
          labels: newLabels,
          vibX: newVibX,
          vibY: newVibY,
          vibZ: newVibZ,
          temp: newTemp,
          rpm: newRpm
        };
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [connectionMode, assetBase]);

  return { data, kpis, isConnected, connectionMode };
}
