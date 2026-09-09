import React from 'react';
import { Line } from 'react-chartjs-2';
import '../components/charts/ChartConfig';
import { commonOptions } from '../components/charts/ChartConfig';

export default function LiveTelemetryView({ data }) {
  const vibData = {
    labels: data.labels,
    datasets: [
      {
        label: 'X-Axis',
        data: data.vibX,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 0
      },
      {
        label: 'Y-Axis',
        data: data.vibY,
        borderColor: '#10b981',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0
      },
      {
        label: 'Z-Axis',
        data: data.vibZ,
        borderColor: '#f59e0b',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0
      }
    ]
  };

  const tempChartData = {
    labels: data.labels,
    datasets: [{
      label: 'Casing Temp (°C)',
      data: data.temp,
      borderColor: '#f43f5e',
      backgroundColor: 'rgba(244, 63, 94, 0.1)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointRadius: 0
    }]
  };

  const rpmChartData = {
    labels: data.labels,
    datasets: [{
      label: 'Motor RPM',
      data: data.rpm,
      borderColor: '#a855f7',
      backgroundColor: 'rgba(168, 85, 247, 0.1)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointRadius: 0
    }]
  };

  return (
    <>
      <div className="page-title">📈 Live Telemetry</div>
      <div className="page-title-sub">High-frequency sensor streams (1Hz)</div>
      
      <div className="chart-row" style={{marginTop:"20px"}}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Vibration Spectrum (X, Y, Z)</div>
            <div className="time-range-btns">
              <button className="time-btn active">Live</button>
              <button className="time-btn">1m</button>
            </div>
          </div>
          <div className="chart-wrap">
            <Line options={commonOptions} data={vibData} height={180} />
          </div>
        </div>
        
        <div className="card">
          <div className="card-header">
            <div className="card-title">Motor Load (%)</div>
          </div>
          <div className="gauge-wrap">
            <div style={{width: "200px", height: "120px", display: "flex", alignItems:"center", justifyContent:"center", color:"var(--text-muted)"}}>
              [Gauge Rendering]
            </div>
            <div style={{marginTop:"-10px", textAlign:"center"}}>
              <div className="gauge-value-display">76.4</div>
              <div className="gauge-unit-display">% LOAD</div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid-2" style={{marginTop:"16px"}}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Temperature Profile</div>
          </div>
          <div className="chart-wrap">
            <Line options={commonOptions} data={tempChartData} height={180} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Motor Speed (RPM)</div>
          </div>
          <div className="chart-wrap">
            <Line options={{...commonOptions, scales: { ...commonOptions.scales, y: { ...commonOptions.scales.y, min: 1400, max: 1550 }}}} data={rpmChartData} height={180} />
          </div>
        </div>
      </div>
    </>
  );
}
