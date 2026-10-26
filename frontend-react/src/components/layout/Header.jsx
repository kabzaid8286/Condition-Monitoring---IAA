import React, { useState, useMemo } from 'react';
import { AlertTriangle, Battery } from 'lucide-react';
import { exportCSV, exportJSON, exportPDF } from '../../utils/exportReport';
import { useAssets } from '../../contexts/AssetContext';

export default function Header({ userRole, activeAsset, setActiveAsset, data, kpis = {}, isConnected = false, connectionMode = 'simulated' }) {
  const lbl = { user: 'User', admin: 'Admin' };
  const clr = { user: '#3b82f6', admin: '#f43f5e' };
  const ini = { user: 'U', admin: 'A' };
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [manualAlarm, setManualAlarm] = useState(false);
  const { assets } = useAssets();
  const exportData = useMemo(() => {
    if (!data || !data.labels) return [];
    
    return data.labels.map((label, index) => ({
      timestamp: label,
      vibration: parseFloat(data.vibX[index]) || 0,
      temp: parseFloat(data.temp[index]) || 0,
      rpm: parseFloat(data.rpm[index]) || 0,
      anomaly: (parseFloat(data.vibX[index]) / 10) || 0 // Simulated anomaly score
    })).reverse();
  }, [data]);

  const handleExport = (type) => {
    setDropdownOpen(false);
    const active = assets[activeAsset] || { name: 'Unknown', label: 'Unknown' };
    if (type === 'pdf') exportPDF(exportData, active);
    if (type === 'csv') exportCSV(exportData, active);
    if (type === 'json') exportJSON(exportData, active);
  };

  return (
    <>
      <div className={`alarm-banner ${manualAlarm ? 'active' : ''}`} id="global-alarm-banner">
        <div style={{display:'flex', alignItems:'center', gap:'15px', maxWidth:'1400px', margin:'0 auto', padding:'0 20px'}}>
          <AlertTriangle size={24} color="#f43f5e" style={{animation:'pulse-dot 1s infinite'}} />
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
        <div className={`status-pill ${connectionMode === 'offline' ? 'warn' : 'ok'}`}>
          <div className={`status-dot ${connectionMode === 'offline' ? 'warn' : 'live'}`} style={connectionMode === 'simulated' ? {background: '#8b5cf6'} : undefined}></div>
          <span>{connectionMode === 'offline' ? 'Standby' : connectionMode === 'simulated' ? 'Simulating' : 'Nominal'}</span>
        </div>
        {connectionMode === 'live' && (
          <div className="status-pill" title="Connected to hardware telemetry stream via FastAPI WebSocket" style={{background: "rgba(16,185,129,0.15)", color: "#10b981", fontSize: "11px", padding: "4px 10px", border: "1px solid rgba(16,185,129,0.3)"}}>
            <div className="status-dot" style={{background: "#10b981", animation: "pulse-dot 1s infinite"}}></div>Live WS (RPi 5)
          </div>
        )}
        {connectionMode === 'offline' && (
          <div className="status-pill" title="Microcontroller unplugged or serial gateway waiting for connection" style={{background: "rgba(245,158,11,0.15)", color: "#f59e0b", fontSize: "11px", padding: "4px 10px", border: "1px solid rgba(245,158,11,0.3)"}}>
            <div className="status-dot" style={{background: "#f59e0b"}}></div>Hardware Offline
          </div>
        )}
        {connectionMode === 'simulated' && (
          <div className="status-pill" title="Simulating custom asset telemetry based on defined physics parameters" style={{background: "rgba(139,92,246,0.15)", color: "#a78bfa", fontSize: "11px", padding: "4px 10px", border: "1px solid rgba(139,92,246,0.3)"}}>
            <div className="status-dot" style={{background: "#8b5cf6", animation: "pulse-dot 1.5s infinite"}}></div>Virtual Simulation
          </div>
        )}
        {kpis && kpis.battery !== undefined && (
          <div className="status-pill" title={`Sensor Node Battery: ${kpis.battery}%`} style={{background: "rgba(255,255,255,0.06)", color: "var(--text-secondary)", fontSize: "11px", padding: "4px 10px", border: "1px solid var(--border)", display: "inline-flex", alignItems: "center", gap: "5px"}}>
            <Battery size={13} style={{verticalAlign: "-1px"}} /> {kpis.battery}%
          </div>
        )}
        {kpis && kpis.burstState === 'sleep' && (
          <div className="status-pill" title="Microcontroller in Deep Sleep (Power Saving)" style={{background: "rgba(99,102,241,0.15)", color: "#818cf8", fontSize: "11px", padding: "4px 10px", border: "1px solid rgba(99,102,241,0.3)"}}>
            Deep Sleep
          </div>
        )}
      </div>
      
      <div className="header-actions">
        <div className="icon-btn" title="Toggle alarm" onClick={() => setManualAlarm(!manualAlarm)}>
          🔔<div className="notif-badge">{manualAlarm ? "4" : "3"}</div>
        </div>
        <div className="dropdown-wrapper" style={{position: "relative"}}>
          <div className="icon-btn" title="Export Report" onClick={() => setDropdownOpen(!dropdownOpen)}>📥</div>
          {dropdownOpen && (
            <div className="dropdown-menu" style={{display: "block", position: "absolute", top: "40px", right: 0, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "8px", width: "220px", zIndex: 1000, boxShadow: "0 10px 25px rgba(0,0,0,0.5)"}}>
              <div className="dropdown-item" onClick={() => handleExport('pdf')} style={{padding: "10px", cursor: "pointer", borderRadius: "6px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px"}}>Executive PDF</div>
              <div className="dropdown-item" onClick={() => handleExport('csv')} style={{padding: "10px", cursor: "pointer", borderRadius: "6px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px"}}>Raw Telemetry (CSV)</div>
              <div className="dropdown-item" onClick={() => handleExport('json')} style={{padding: "10px", cursor: "pointer", borderRadius: "6px", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px"}}>ML Payload (JSON)</div>
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
