import React from 'react';

export default function KpiCard({ title, value, unit, colorClass, icon }) {
  return (
    <div className={`card kpi-card ${colorClass}`}>
      {icon && <div className="kpi-icon">{icon}</div>}
      <div className="kpi-label">{title}</div>
      <div className="kpi-value">{value} <span className="kpi-unit">{unit}</span></div>
    </div>
  );
}
