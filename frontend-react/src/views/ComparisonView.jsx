import React from 'react';
import { Line } from 'react-chartjs-2';
import { commonOptions } from '../components/charts/ChartConfig';
import { ASSETS } from '../data/mockData';

export default function ComparisonView({ data }) {
  const comparisonData = {
    labels: data?.labels || ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    datasets: [
      {
        label: 'Test Rig A',
        data: data?.history?.vib || [3.2, 3.4, 3.3, 3.5, 3.4, 3.6, 3.8, 3.7, 3.9, 4.0],
        borderColor: '#f59e0b',
        borderWidth: 2,
        fill: false,
        pointRadius: 0
      },
      {
        label: 'Test Rig B',
        data: [2.1, 2.2, 2.1, 2.3, 2.2, 2.1, 2.0, 2.1, 2.2, 2.1],
        borderColor: '#3b82f6',
        borderWidth: 2,
        fill: false,
        pointRadius: 0
      },
      {
        label: 'Motor 01',
        data: [1.8, 1.8, 1.9, 1.8, 1.7, 1.8, 1.9, 1.8, 1.8, 1.9],
        borderColor: '#10b981',
        borderWidth: 2,
        fill: false,
        pointRadius: 0
      },
      {
        label: 'Gearbox 02',
        data: [4.8, 4.9, 4.8, 4.7, 4.9, 5.0, 4.8, 4.9, 4.8, 4.9],
        borderColor: '#8b5cf6',
        borderWidth: 2,
        fill: false,
        pointRadius: 0
      }
    ]
  };
  return (
    <>
      <div className="page-title">⚖️ Asset Comparison</div>
      <div className="page-title-sub">Side-by-side live metrics for multiple machines</div>

      <div className="comparison-grid" style={{marginTop:"20px"}}>
        {Object.entries(ASSETS).map(([key, asset]) => (
          <div key={key} className="card comparison-card">
            <div className="comparison-asset-name">
              <div className="status-dot live" style={{color: key === 'test-rig-a' ? "var(--amber)" : "var(--emerald)"}}></div>
              {asset.name} <span style={{fontSize: "0.85rem", color: "var(--text-muted)", marginLeft: "8px"}}>{asset.label}</span>
            </div>
            
            <div className="comparison-metric-row">
              <span className="comparison-metric-name">Vibration RMS</span>
              <span className="comparison-metric-value" style={{color: key === 'test-rig-a' ? "var(--amber)" : "var(--emerald)"}}>{asset.basevib} mm/s</span>
            </div>
            <div className="comparison-metric-bar-wrap">
              <div className="comparison-metric-bar" style={{width: `${Math.min(asset.basevib * 10, 100)}%`, background: key === 'test-rig-a' ? "var(--amber)" : "var(--emerald)"}}></div>
            </div>

            <div className="comparison-metric-row">
              <span className="comparison-metric-name">Temperature</span>
              <span className="comparison-metric-value" style={{color: key === 'test-rig-a' ? "var(--amber)" : "var(--emerald)"}}>{asset.basetemp} °C</span>
            </div>
            <div className="comparison-metric-bar-wrap">
              <div className="comparison-metric-bar" style={{width: `${asset.basetemp}%`, background: key === 'test-rig-a' ? "var(--amber)" : "var(--emerald)"}}></div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <div className="card-header border-b" style={{ paddingBottom: "16px" }}>
          <h2 className="card-title">Comparative Vibration Trend — All Assets</h2>
        </div>
        <div className="card-body" style={{ padding: "16px" }}>
          <Line options={commonOptions} data={comparisonData} height={100} />
        </div>
      </div>
    </>
  );
}
