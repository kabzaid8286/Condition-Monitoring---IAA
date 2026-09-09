import React, { useState, useMemo } from 'react';
import { exportCSV, exportJSON, exportPDF } from '../../utils/exportReport';

export default function Header({ userRole }) {
  const lbl = { user: 'User', admin: 'Admin' };
  const clr = { user: '#3b82f6', admin: '#f43f5e' };
  const ini = { user: 'U', admin: 'A' };
  
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const sampleData = useMemo(() => {
    const now = Date.now();
    return [
      { timestamp: new Date(now).toLocaleString(), vibration: 2.4, temp: 55.1, rpm: 1490, anomaly: 0.12 },
      { timestamp: new Date(now - 1000).toLocaleString(), vibration: 2.5, temp: 55.1, rpm: 1491, anomaly: 0.13 },
      { timestamp: new Date(now - 2000).toLocaleString(), vibration: 2.4, temp: 55.2, rpm: 1490, anomaly: 0.12 },
      { timestamp: new Date(now - 3000).toLocaleString(), vibration: 11.2, temp: 57.1, rpm: 1485, anomaly: 0.88, note: "FAULT" }
    ];
  }, []);

  const handleExport = (type) => {
    setDropdownOpen(false);
    if (type === 'pdf') exportPDF(sampleData);
    if (type === 'csv') exportCSV(sampleData);
    if (type === 'json') exportJSON(sampleData);
  };

  return (
    <header className="header">
      <div className="header-brand">
        <img src="https://www.hs-aalen.de/_assets/23c048c4e278024490c6ac1b855e5de4/img/hs-aalen-logo.svg" alt="HS Aalen" style={{height: "28px"}} />
        <div>
          <div className="header-brand-name">IAA Condition Monitor</div>
          <div className="header-brand-sub">Test Rig Pilot</div>
        </div>
      </div>
      <div className="header-divider"></div>
      <div className="asset-select-wrapper">
        <select className="asset-select">
          <option>Test Rig A — Drive Train</option>
          <option>Test Rig B — Generator</option>
        </select>
      </div>
      <div className="status-pill ok">
        <div className="status-dot live"></div>
        System Healthy
      </div>
      
      <div className="header-actions">
        <div style={{position: "relative"}}>
          <button className="icon-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>📄</button>
          {dropdownOpen && (
            <div className="dropdown" style={{display: "block", right: 0, top: "40px"}}>
              <div className="dropdown-item" onClick={() => handleExport('pdf')}>↓ Executive Report (.pdf)</div>
              <div className="dropdown-item" onClick={() => handleExport('csv')}>↓ Sensor Data (.csv)</div>
              <div className="dropdown-item" onClick={() => handleExport('json')}>↓ Raw Payload (.json)</div>
            </div>
          )}
        </div>
        <button className="icon-btn" style={{position:"relative"}}>
          🔔<span className="notif-badge">0</span>
        </button>
        <div className="user-chip">
          <div className="user-avatar" style={{background: `linear-gradient(135deg, ${clr[userRole]}, #6366f1)`}}>
            {ini[userRole]}
          </div>
          <div>
            <div className="user-name">A. {lbl[userRole]}</div>
            <div className="user-role-tag">{lbl[userRole]} Access</div>
          </div>
        </div>
      </div>
    </header>
  );
}
