import React, { useState, useMemo } from 'react';
import { exportCSV, exportJSON, exportPDF } from '../../utils/exportReport';
import { useAssets } from '../../contexts/AssetContext';

export default function Header({ userRole, activeAsset, setActiveAsset }) {
  const lbl = { user: 'User', admin: 'Admin' };
  const clr = { user: '#3b82f6', admin: '#f43f5e' };
  const ini = { user: 'U', admin: 'A' };
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [manualAlarm, setManualAlarm] = useState(false);
  const { assets } = useAssets();
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
    <>
      <div className={`alarm-banner ${manualAlarm ? 'active' : ''}`} id="global-alarm-banner">
        <div style={{display:'flex', alignItems:'center', gap:'15px', maxWidth:'1400px', margin:'0 auto', padding:'0 20px'}}>
          <span style={{fontSize:'24px', animation:'pulse-dot 1s infinite'}}>⚠️</span>
          <div style={{flex:1}}>
            <div style={{fontWeight:700, fontSize:'16px'}}>CRITICAL SYSTEM ALARM</div>
            <div style={{fontSize:'13px', opacity:0.9}}>Multiple anomalous vibration signatures detected. Immediate inspection required.</div>
          </div>
          <button className="btn" onClick={() => setManualAlarm(false)} style={{background:'rgba(255,255,255,0.2)', color:'white', border:'none'}}>Acknowledge</button>
        </div>
      </div>
      <header className="header">
      <div className="header-brand">
        <img src="https://www.hs-aalen.de/_assets/23c048c4e278024490c6ac1b855e5de4/img/hs-aalen-logo.svg" alt="HS Aalen" style={{height: "28px"}} />
        <div>
          <div className="header-brand-name">IAA Monitor</div>
          <div className="header-brand-sub">Real-time Condition Monitoring</div>
        </div>
      </div>
      <div className="header-divider"></div>
      <div style={{display: "flex", alignItems: "center", gap: "10px", flex: 1}}>
        <div className="asset-select-wrapper">
          <select className="asset-select" value={activeAsset} onChange={(e) => setActiveAsset(e.target.value)}>
            {Object.entries(assets).map(([id, asset]) => (
              <option key={id} value={id}>{asset.name} — {asset.label}</option>
            ))}
          </select>
        </div>
        <div className="status-pill ok">
          <div className="status-dot live"></div>
          <span>Nominal</span>
        </div>
        <div className="status-pill" style={{background: "rgba(6,182,212,0.1)", color: "var(--cyan)", fontSize: "11px", padding: "4px 10px"}}>
          <div className="status-dot" style={{background: "var(--cyan)", animation: "pulse-dot 1s infinite"}}></div>Live
        </div>
      </div>
      
      <div className="header-actions">
        <div className="icon-btn" title="Toggle alarm" onClick={() => setManualAlarm(!manualAlarm)}>
          🔔<div className="notif-badge">{manualAlarm ? "4" : "3"}</div>
        </div>
        <div className="dropdown-wrapper" style={{position: "relative"}}>
          <div className="icon-btn" title="Export Report" onClick={() => setDropdownOpen(!dropdownOpen)}>📥</div>
          {dropdownOpen && (
            <div className="dropdown-menu" style={{display: "block", position: "absolute", top: "40px", right: 0, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "8px", width: "220px", zIndex: 1000, boxShadow: "0 10px 25px rgba(0,0,0,0.5)"}}>
              <div className="dropdown-item" onClick={() => handleExport('pdf')} style={{padding: "10px", cursor: "pointer", borderRadius: "6px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px"}}>📄 Executive PDF</div>
              <div className="dropdown-item" onClick={() => handleExport('csv')} style={{padding: "10px", cursor: "pointer", borderRadius: "6px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px"}}>📊 Raw Telemetry (CSV)</div>
              <div className="dropdown-item" onClick={() => handleExport('json')} style={{padding: "10px", cursor: "pointer", borderRadius: "6px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px"}}>⚙️ ML Payload (JSON)</div>
            </div>
          )}
        </div>
        <div className="icon-btn" title="Fullscreen" onClick={() => { if(!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); }}>⛶</div>
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
    </>
  );
}
