import { useState, useEffect } from 'react';

export default function useSensorData() {
  const [data, setData] = useState(() => {
    const initLabels = [];
    const initVibX = [];
    const initVibY = [];
    const initVibZ = [];
    const initTemp = [];
    const initRpm = [];
    
    let now = new Date();
    for(let i = 60; i >= 0; i--) {
      let t = new Date(now.getTime() - i * 1000);
      initLabels.push(t.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      
      initVibX.push((Math.random() * 2 + 1).toFixed(2));
      initVibY.push((Math.random() * 2 + 0.8).toFixed(2));
      initVibZ.push((Math.random() * 2 + 0.5).toFixed(2));
      
      initTemp.push((Math.random() * 5 + 40).toFixed(1));
      initRpm.push(Math.floor(Math.random() * 50 + 1450));
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
    vibRms: 1.2,
    temp: 45.0,
    rpm: 1450,
    health: 98,
    motorLoad: 76.4
  });

  useEffect(() => {

    // Start simulation interval
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

        // Simulation logic
        let vx = (Math.random() * 2 + 1).toFixed(2);
        let vy = (Math.random() * 2 + 0.8).toFixed(2);
        let vz = (Math.random() * 2 + 0.5).toFixed(2);
        let tp = (Math.random() * 5 + 40).toFixed(1);
        let rp = Math.floor(Math.random() * 50 + 1450);

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
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return { data, kpis };
}
