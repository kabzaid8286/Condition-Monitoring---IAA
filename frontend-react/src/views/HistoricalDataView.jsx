import React from 'react';
import { Line } from 'react-chartjs-2';
import { commonOptions } from '../components/charts/ChartConfig';
import { ANOMALY_EVENTS } from '../data/mockData';

export default function HistoricalDataView({ data }) {
  
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
      borderColor: '#f43f5e',
      backgroundColor: 'rgba(244, 63, 94, 0.1)',
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
      <div className="page-title">📈 Historical Trends</div>
      <div className="page-title-sub">Long-range time series analysis and anomaly timeline</div>

      <div className="card" style={{ marginTop: "20px" }}>
        <div className="card-header">
          <div className="card-title">Vibration RMS — 7-Day History</div>
          <div className="time-range-btns">
            <button className="time-btn">1D</button>
            <button className="time-btn active">7D</button>
            <button className="time-btn">30D</button>
          </div>
        </div>
        <div className="chart-wrap">
          <Line options={commonOptions} data={histVibData} height={200} />
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: "16px" }}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Bearing Temperature History</div>
          </div>
          <div className="chart-wrap">
            <Line options={commonOptions} data={histTempData} height={160} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">RPM & Load Trend</div>
          </div>
          <div className="chart-wrap">
            <Line options={commonOptions} data={histRpmData} height={160} />
          </div>
        </div>
      </div>

      <div className="card w-full mt-4">
        <div className="card-header border-b">
          <h2 className="card-title">Anomaly Event Timeline</h2>
        </div>
        <div className="p-4">
          <div className="anomaly-timeline" style={{borderLeft: "2px solid #334155", paddingLeft: "20px", marginLeft: "10px", display: "flex", flexDirection: "column", gap: "20px"}}>
            {ANOMALY_EVENTS.map((event, i) => (
              <div key={i} className="timeline-item" style={{position: "relative"}}>
                <div className={`timeline-dot ${event.sev}`} style={{
                  position: "absolute", left: "-26px", top: "4px", width: "12px", height: "12px", 
                  borderRadius: "50%", background: event.sev === 'critical' ? '#ef4444' : event.sev === 'warning' ? '#f59e0b' : '#3b82f6',
                  border: "2px solid #0f172a"
                }}></div>
                <div className="timeline-time" style={{fontSize: "0.8rem", color: "#94a3b8", marginBottom: "4px"}}>{event.ts}</div>
                <div className="timeline-content" style={{background: "#1e293b", padding: "12px", borderRadius: "6px"}}>
                  <div style={{fontWeight: "600", marginBottom: "4px"}}>{event.msg}</div>
                  <div style={{fontSize: "0.85rem", color: "#64748b"}}>Detected by: {event.model}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
