import React, { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import '../components/charts/ChartConfig';
import { commonOptions } from '../components/charts/ChartConfig';

function DialGauge({ value, min, max, unit, label, color, warnThreshold, critThreshold }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = 180 * dpr;
    canvas.height = 110 * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, 180, 110);

    const cx = 90, cy = 95, r = 72;
    const SA = Math.PI * 0.8, EA = Math.PI * 2.2;
    const valNum = typeof value === 'number' ? value : parseFloat(value) || 0;
    const pct = Math.min(1, Math.max(0, (valNum - min) / (max - min || 1)));
    const VA = SA + pct * (EA - SA);

    // Track
    ctx.beginPath();
    ctx.arc(cx, cy, r, SA, EA);
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Fill arc
    ctx.beginPath();
    ctx.arc(cx, cy, r, SA, VA);
    ctx.strokeStyle = color;
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Ticks
    for (let i = 0; i <= 10; i++) {
      const a = SA + (i / 10) * (EA - SA);
      const inner = i % 5 === 0 ? r - 18 : r - 13;
      ctx.beginPath();
      ctx.moveTo(cx + inner * Math.cos(a), cy + inner * Math.sin(a));
      ctx.lineTo(cx + (r + 2) * Math.cos(a), cy + (r + 2) * Math.sin(a));
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = i % 5 === 0 ? 1.5 : 0.8;
      ctx.stroke();
    }

    // Needle
    const nx = cx + (r - 14) * Math.cos(VA);
    const ny = cy + (r - 14) * Math.sin(VA);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(nx, ny);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Pivot
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [value, min, max, color]);

  const valNum = typeof value === 'number' ? value : parseFloat(value) || 0;
  let valColor = color;
  if (critThreshold && valNum >= critThreshold) {
    valColor = 'var(--rose)';
  } else if (warnThreshold && valNum >= warnThreshold) {
    valColor = 'var(--amber)';
  }

  return (
    <div className="card gauge-wrap">
      <canvas ref={canvasRef} style={{ width: '180px', height: '110px', display: 'block' }} />
      <div className="gauge-value-display" style={{ color: valColor }}>
        {typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(1)) : value}
      </div>
      <div className="gauge-unit-display">{unit}</div>
      <div className="gauge-label">{label}</div>
    </div>
  );
}

function FFTCanvas({ tickCount }) {
  const canvasRef = useRef(null);
  const binsRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (!rect.width) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = 140 * dpr;
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = 140;
    const pad = { top: 10, right: 10, bottom: 24, left: 38 };
    const cw = w - pad.left - pad.right;
    const ch = h - pad.top - pad.bottom;

    // Initialize or jitter bins
    if (binsRef.current.length !== 60) {
      const newBins = [];
      for (let i = 0; i < 60; i++) {
        const hz = (i / 60) * 500;
        let v = 0.05;
        if (Math.abs(hz - 25) < 5) v = 0.35 + (Math.random() * 0.1);
        if (Math.abs(hz - 50) < 4) v = 0.22 + (Math.random() * 0.08);
        if (Math.abs(hz - 87) < 6) v = 0.68 + (Math.random() * 0.1);
        if (Math.abs(hz - 150) < 3) v = 0.15 + (Math.random() * 0.05);
        newBins.push(v + (Math.random() * 0.04 - 0.02));
      }
      binsRef.current = newBins;
    } else {
      binsRef.current = binsRef.current.map(v => Math.min(1, Math.max(0.03, v + (Math.random() * 0.02 - 0.01))));
    }

    const bins = binsRef.current;

    ctx.clearRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    [0, 0.25, 0.5, 0.75, 1].forEach(f => {
      const y = pad.top + ch * (1 - f);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(pad.left + cw, y);
      ctx.stroke();
    });

    // Bars
    const bw = (cw / bins.length) * 0.7;
    bins.forEach((v, i) => {
      const x = pad.left + (i / bins.length) * cw;
      const bh = v * ch;
      const y = pad.top + ch - bh;
      const g = ctx.createLinearGradient(0, y, 0, pad.top + ch);
      g.addColorStop(0, 'rgba(59,130,246,0.9)');
      g.addColorStop(1, 'rgba(99,102,241,0.3)');
      ctx.fillStyle = g;
      ctx.fillRect(x, y, bw, bh);
    });

    // X-axis text
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    [0, 100, 200, 300, 400, 500].forEach(hz => {
      ctx.fillText(hz + 'Hz', pad.left + (hz / 500) * cw, pad.top + ch + 16);
    });
  }, [tickCount]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '140px', display: 'block' }} />;
}

export default function LiveTelemetryView({ data }) {
  // Get latest values
  const lastVib = data.vibX[data.vibX.length - 1] || 0;
  const lastTemp = data.temp[data.temp.length - 1] || 0;
  const lastRpm = data.rpm[data.rpm.length - 1] || 0;

  const combinedData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Vibration X',
        data: data.vibX,
        borderColor: '#3b82f6',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0
      },
      {
        label: 'Vibration Y',
        data: data.vibY,
        borderColor: '#06b6d4',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0
      },
      {
        label: 'Temperature',
        data: data.temp,
        borderColor: '#10b981',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0
      },
      {
        label: 'RPM (scaled)',
        data: data.rpm.map(r => (r / 25).toFixed(2)),
        borderColor: '#f59e0b',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0
      }
    ]
  };

  return (
    <>
      <div>
        <div className="page-title">📡 Real-Time Monitoring</div>
        <div className="page-title-sub">Live sensor gauges updating every second</div>
      </div>
      
      <div className="grid-3" style={{ marginTop: "20px" }}>
        <DialGauge
          value={lastVib}
          min={0}
          max={15}
          unit="mm/s RMS"
          label="VIBRATION (Drive-End X)"
          color="#3b82f6"
          warnThreshold={5}
          critThreshold={8}
        />
        
        <DialGauge
          value={lastTemp}
          min={20}
          max={100}
          unit="°C"
          label="BEARING TEMPERATURE"
          color="#10b981"
          warnThreshold={70}
          critThreshold={85}
        />

        <DialGauge
          value={lastRpm}
          min={0}
          max={3000}
          unit="RPM"
          label="SHAFT SPEED"
          color="#f59e0b"
        />
      </div>
      
      <div className="card" style={{ marginTop: "16px" }}>
        <div className="card-header">
          <div className="card-title">Real-Time Multi-Channel Feed</div>
          <div style={{ fontSize: "12px", color: "var(--green)", display: "flex", alignItems: "center", gap: "6px" }}>
            <div className="status-dot live"></div> Streaming at 1 Hz
          </div>
        </div>
        <div className="chart-wrap" style={{ height: "250px" }}>
          <div className="chart-toolbar">
            <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: "#3b82f6" }}></div>Vibration X</div>
            <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: "#06b6d4" }}></div>Vibration Y</div>
            <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: "#10b981" }}></div>Temperature</div>
            <div className="chart-legend-item"><div className="chart-legend-dot" style={{ background: "#f59e0b" }}></div>RPM (scaled)</div>
          </div>
          <Line options={commonOptions} data={combinedData} />
        </div>
      </div>

      <div className="card" style={{ marginTop: "16px" }}>
        <div className="card-header">
          <div className="card-title">Frequency Spectrum (FFT)</div>
          <div className="badge blue">Live</div>
        </div>
        <div className="chart-wrap" style={{ height: "180px" }}>
          <FFTCanvas tickCount={data.labels.length} />
        </div>
      </div>
    </>
  );
}
