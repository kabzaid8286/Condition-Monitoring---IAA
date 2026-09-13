import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import { commonOptions } from '../components/charts/ChartConfig';
import { ANOMALY_EVENTS } from '../data/mockData';

export default function HistoricalDataView({ data }) {
  const [timeRange, setTimeRange] = useState('7D');

  const histVibData = {
    labels: data.labels,
    datasets: [{
      label: 'Vibration RMS',
      data: data.vibX.map(v => (v * 1.5).toFixed(2)),
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointRadius: 0
    }]
  };

  const histTempData = {
    labels: data.labels,
    datasets: [{
      label: 'Temperature',
      data: data.temp.map(v => (v * 1.1).toFixed(2)),
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointRadius: 0
    }]
  };

  const histRpmData = {
    labels: data.labels,
    datasets: [{
      label: 'RPM',
      data: data.rpm.map(v => (v * 0.95).toFixed(0)),
      borderColor: '#f59e0b',
      backgroundColor: 'rgba(245, 158, 11, 0.1)',
      borderWidth: 2,
      tension: 0.4,
      fill: true,
      pointRadius: 0
    }]
  };

  const sevColors = {
    critical: 'var(--rose)',
    warning: 'var(--amber)',
    info: 'var(--accent)'
  };

  return (
    <>
      <div>
        <div className="page-title">📈 Historical Trends</div>
        <div className="page-title-sub">Long-range time series analysis and anomaly timeline</div>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <div className="card-header">
          <div className="card-title">Vibration RMS — 7-Day History</div>
          <div className="time-range-btns">
            {['1D', '7D', '30D'].map(range => (
              <button
                key={range}
                className={`time-btn ${timeRange === range ? 'active' : ''}`}
                onClick={() => setTimeRange(range)}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
        <div className="chart-wrap" style={{ height: "200px" }}>
          <Line options={commonOptions} data={histVibData} />
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: "16px" }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Bearing Temperature History</div>
          </div>
          <div className="chart-wrap" style={{ height: "160px" }}>
            <Line options={commonOptions} data={histTempData} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">RPM &amp; Load Trend</div>
          </div>
          <div className="chart-wrap" style={{ height: "160px" }}>
            <Line options={commonOptions} data={histRpmData} />
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: "16px" }}>
        <div className="card-header">
          <div className="card-title">Recent Anomaly Events Timeline</div>
        </div>
        <div className="card-body" style={{ padding: "0 20px 16px" }}>
          {ANOMALY_EVENTS.map((event, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: '12px',
                alignItems: 'flex-start',
                padding: '10px 0',
                borderBottom: i === ANOMALY_EVENTS.length - 1 ? 'none' : '1px solid var(--border)'
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontFamily: "'JetBrains Mono', monospace",
                  color: 'var(--text-muted)',
                  minWidth: '110px',
                  marginTop: '2px'
                }}
              >
                {event.ts}
              </div>
              <div
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: sevColors[event.sev] || 'var(--accent)',
                  marginTop: '5px',
                  flexShrink: 0
                }}
              ></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {event.msg}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Detected by: <span style={{ color: 'var(--accent)' }}>{event.model}</span>
                </div>
              </div>
              <span className={`badge ${event.sev === 'critical' ? 'rose' : event.sev === 'warning' ? 'amber' : 'blue'}`}>
                {event.sev}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
