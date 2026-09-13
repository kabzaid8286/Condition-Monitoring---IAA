import React from 'react';

export default function Sidebar({ activeView, setActiveView, onLogout }) {
  return (
    <nav className="sidebar">
      <div className="nav-section-label">Monitoring</div>
      <div 
        className={`nav-item ${activeView === 'overview' ? 'active' : ''}`}
        onClick={() => setActiveView('overview')}
      >
        <span className="nav-item-icon">🏠</span>Overview
      </div>
      <div 
        className={`nav-item ${activeView === 'realtime' ? 'active' : ''}`}
        onClick={() => setActiveView('realtime')}
      >
        <span className="nav-item-icon">📡</span>Real-Time
      </div>
      <div 
        className={`nav-item ${activeView === 'historical' ? 'active' : ''}`}
        onClick={() => setActiveView('historical')}
      >
        <span className="nav-item-icon">📈</span>Historical Trends
      </div>
      
      <div className="nav-section-label">Analytics</div>
      <div 
        className={`nav-item ${activeView === 'ml-models' ? 'active' : ''}`}
        onClick={() => setActiveView('ml-models')}
      >
        <span className="nav-item-icon">🤖</span>ML Predictions
      </div>
      <div 
        className={`nav-item ${activeView === 'alerts' ? 'active' : ''}`}
        onClick={() => setActiveView('alerts')}
      >
        <span className="nav-item-icon">🚨</span>Alerts
        <span className="nav-item-badge" id="nav-alert-badge">3</span>
      </div>
      <div 
        className={`nav-item ${activeView === 'comparison' ? 'active' : ''}`}
        onClick={() => setActiveView('comparison')}
      >
        <span className="nav-item-icon">⚖️</span>Asset Comparison
      </div>
      
      <div className="nav-section-label">Assistant</div>
      <div 
        className={`nav-item ${activeView === 'ai-assistant' ? 'active' : ''}`}
        onClick={() => setActiveView('ai-assistant')}
      >
        <span className="nav-item-icon">💬</span>AI Assistant
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-btn" id="logout-btn" onClick={onLogout}>
          🚪 Sign Out
        </div>
      </div>
    </nav>
  );
}
