import React from 'react';

export default function Sidebar({ activeView, setActiveView }) {
  return (
    <aside className="sidebar">
      <div className="nav-section-label">Monitoring</div>
      <div 
        className={`nav-item ${activeView === 'overview' ? 'active' : ''}`}
        onClick={() => setActiveView('overview')}
      ><span className="nav-item-icon">🏠</span> Overview</div>
      <div 
        className={`nav-item ${activeView === 'realtime' ? 'active' : ''}`}
        onClick={() => setActiveView('realtime')}
      ><span className="nav-item-icon">📈</span> Live Telemetry</div>
      <div 
        className={`nav-item ${activeView === 'historical' ? 'active' : ''}`}
        onClick={() => setActiveView('historical')}
      ><span className="nav-item-icon">⏳</span> Historical Data</div>
      
      <div className="nav-section-label" style={{marginTop:"10px"}}>Analysis</div>
      <div 
        className={`nav-item ${activeView === 'ml-models' ? 'active' : ''}`}
        onClick={() => setActiveView('ml-models')}
      ><span className="nav-item-icon">🧠</span> ML Predictions</div>
      <div 
        className={`nav-item ${activeView === 'comparison' ? 'active' : ''}`}
        onClick={() => setActiveView('comparison')}
      ><span className="nav-item-icon">⚖️</span> Comparison</div>
      <div 
        className={`nav-item ${activeView === 'ai-assistant' ? 'active' : ''}`}
        onClick={() => setActiveView('ai-assistant')}
      ><span className="nav-item-icon">💬</span> AI Assistant</div>
      
      <div className="nav-section-label" style={{marginTop:"10px"}}>Management</div>
      <div 
        className={`nav-item ${activeView === 'alerts' ? 'active' : ''}`}
        onClick={() => setActiveView('alerts')}
      >
        <span className="nav-item-icon">🚨</span> Alerts
        <span className="nav-item-badge">0</span>
      </div>
      <div 
        className={`nav-item ${activeView === 'config' ? 'active' : ''}`}
        onClick={() => setActiveView('config')}
      ><span className="nav-item-icon">⚙️</span> Configuration</div>
    </aside>
  );
}
