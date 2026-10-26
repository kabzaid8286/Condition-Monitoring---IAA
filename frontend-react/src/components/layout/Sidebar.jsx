import React from 'react';
import {
  LayoutDashboard,
  Activity,
  TrendingUp,
  Cpu,
  AlertTriangle,
  GitCompare,
  BarChart3,
  Bot,
  Sliders,
  LogOut
} from 'lucide-react';

export default function Sidebar({ userRole, activeView, setActiveView, onLogout }) {
  return (
    <nav className="sidebar">
      {userRole === 'admin' && (
        <>
          <div className="nav-section-label">Test Design</div>
          <div 
            className={`nav-item ${activeView === 'test-design' ? 'active' : ''}`}
            onClick={() => setActiveView('test-design')}
          >
            <span className="nav-item-icon" style={{display:'inline-flex', alignItems:'center', justifyContent:'center'}}><Sliders size={15} /></span>Test Design Config
          </div>
        </>
      )}

      <div className="nav-section-label">Monitoring</div>
      <div 
        className={`nav-item ${activeView === 'overview' ? 'active' : ''}`}
        onClick={() => setActiveView('overview')}
      >
        <span className="nav-item-icon" style={{display:'inline-flex', alignItems:'center', justifyContent:'center'}}><LayoutDashboard size={15} /></span>Overview
      </div>
      <div 
        className={`nav-item ${activeView === 'realtime' ? 'active' : ''}`}
        onClick={() => setActiveView('realtime')}
      >
        <span className="nav-item-icon" style={{display:'inline-flex', alignItems:'center', justifyContent:'center'}}><Activity size={15} /></span>Real-Time
      </div>
      <div 
        className={`nav-item ${activeView === 'historical' ? 'active' : ''}`}
        onClick={() => setActiveView('historical')}
      >
        <span className="nav-item-icon" style={{display:'inline-flex', alignItems:'center', justifyContent:'center'}}><TrendingUp size={15} /></span>Historical Trends
      </div>
      
      <div className="nav-section-label">Analytics</div>
      <div 
        className={`nav-item ${activeView === 'ml-models' ? 'active' : ''}`}
        onClick={() => setActiveView('ml-models')}
      >
        <span className="nav-item-icon" style={{display:'inline-flex', alignItems:'center', justifyContent:'center'}}><Cpu size={15} /></span>ML Predictions
      </div>
      <div 
        className={`nav-item ${activeView === 'alerts' ? 'active' : ''}`}
        onClick={() => setActiveView('alerts')}
      >
        <span className="nav-item-icon" style={{display:'inline-flex', alignItems:'center', justifyContent:'center'}}><AlertTriangle size={15} /></span>Alerts
        <span className="nav-item-badge" id="nav-alert-badge">3</span>
      </div>
      <div 
        className={`nav-item ${activeView === 'comparison' ? 'active' : ''}`}
        onClick={() => setActiveView('comparison')}
      >
        <span className="nav-item-icon" style={{display:'inline-flex', alignItems:'center', justifyContent:'center'}}><GitCompare size={15} /></span>Asset Comparison
      </div>
      <div 
        className={`nav-item ${activeView === 'analysis' ? 'active' : ''}`}
        onClick={() => setActiveView('analysis')}
      >
        <span className="nav-item-icon" style={{display:'inline-flex', alignItems:'center', justifyContent:'center'}}><BarChart3 size={15} /></span>Extended Analysis
      </div>
      
      <div className="nav-section-label">Assistant</div>
      <div 
        className={`nav-item ${activeView === 'ai-assistant' ? 'active' : ''}`}
        onClick={() => setActiveView('ai-assistant')}
      >
        <span className="nav-item-icon" style={{display:'inline-flex', alignItems:'center', justifyContent:'center'}}><Bot size={15} /></span>AI Assistant
      </div>

      <div className="sidebar-footer">
        <div className="sidebar-footer-btn" id="logout-btn" onClick={onLogout} style={{display:'flex', alignItems:'center', gap:'8px', justifyContent:'center'}}>
          <LogOut size={15} /> Sign Out
        </div>
      </div>
    </nav>
  );
}
