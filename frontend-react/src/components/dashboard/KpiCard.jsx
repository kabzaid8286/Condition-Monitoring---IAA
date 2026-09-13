import React from 'react';
import { Line } from 'react-chartjs-2';
import { commonOptions } from '../charts/ChartConfig';

export default function KpiCard({ title, value, unit, colorClass, icon, trend, trendClass, chartData }) {
  const sparklineOptions = {
    ...commonOptions,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
    elements: { point: { radius: 0 }, line: { borderWidth: 2 } },
    layout: { padding: 0 }
  };

  return (
    <div className={`card kpi-card ${colorClass}`}>
      {icon && <div className="kpi-icon">{icon}</div>}
      <div className="kpi-label">{title}</div>
      <div className="kpi-value">{value} <span className="kpi-unit">{unit}</span></div>
      {trend && <div className={`kpi-trend ${trendClass}`}>{trend}</div>}
      {chartData && (
        <div style={{height: "40px", marginTop: "10px"}}>
          <Line data={chartData} options={sparklineOptions} />
        </div>
      )}
    </div>
  );
}
