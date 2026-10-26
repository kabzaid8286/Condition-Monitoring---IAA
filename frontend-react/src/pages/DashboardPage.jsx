import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import LiveTelemetryView from '../views/LiveTelemetryView';
import MlModelsView from '../views/MlModelsView';
import AlertsView from '../views/AlertsView';
import HistoricalDataView from '../views/HistoricalDataView';
import AiAssistantView from '../views/AiAssistantView';
import ComparisonView from '../views/ComparisonView';
import OverviewView from '../views/OverviewView';
import TestDesignView from '../views/TestDesignView';
import AnalysisView from '../views/AnalysisView';
import useSensorData from '../hooks/useSensorData';

export default function DashboardPage({ userRole, onLogout }) {
  const [activeView, setActiveView] = useState(() => {
    return localStorage.getItem('condition_monitoring_active_view') || 'overview';
  });
  const [activeAsset, setActiveAsset] = useState(() => {
    return localStorage.getItem('condition_monitoring_active_asset') || 'test-rig-a';
  });

  const handleSelectView = (newView) => {
    setActiveView(newView);
    try {
      localStorage.setItem('condition_monitoring_active_view', newView);
    } catch (e) {
      console.warn('Error saving active view to localStorage:', e);
    }
  };

  const handleSelectAsset = (newAsset) => {
    setActiveAsset(newAsset);
    try {
      localStorage.setItem('condition_monitoring_active_asset', newAsset);
    } catch (e) {
      console.warn('Error saving active asset to localStorage:', e);
    }
  };

  const { data, kpis, isConnected, connectionMode } = useSensorData(activeAsset);

  return (
    <div id="app" className="visible">
      <Header 
        userRole={userRole} 
        activeAsset={activeAsset} 
        setActiveAsset={handleSelectAsset} 
        data={data} 
        kpis={kpis}
        isConnected={isConnected}
        connectionMode={connectionMode}
      />
      <div className="app-body">
        <Sidebar userRole={userRole} activeView={activeView} setActiveView={handleSelectView} onLogout={onLogout} />
        
        <main className="main-content">
          {activeView === 'test-design' && userRole === 'admin' && <TestDesignView activeAsset={activeAsset} setActiveAsset={handleSelectAsset} />}
          {activeView === 'overview' && <OverviewView kpis={kpis} data={data} />}
          {activeView === 'realtime' && <LiveTelemetryView data={data} />}
          {activeView === 'historical' && <HistoricalDataView data={data} activeAsset={activeAsset} />}
          {activeView === 'ml-models' && <MlModelsView data={data} />}
          {activeView === 'alerts' && <AlertsView />}
          {activeView === 'comparison' && <ComparisonView data={data} />}
          {activeView === 'analysis' && <AnalysisView data={data} activeAsset={activeAsset} />}
          {activeView === 'ai-assistant' && <AiAssistantView activeAsset={activeAsset} />}
        </main>
      </div>
    </div>
  );
}
