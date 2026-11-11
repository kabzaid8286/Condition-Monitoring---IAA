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
import ErrorBoundary from '../components/common/ErrorBoundary';
import useSensorData from '../hooks/useSensorData';
import { useAssets } from '../contexts/AssetContext';

export default function DashboardPage({ userRole, onLogout }) {
  const { assets } = useAssets();
  const assetKeys = Object.keys(assets);

  const [activeView, setActiveView] = useState(() => {
    return localStorage.getItem('condition_monitoring_active_view') || 'overview';
  });
  const [selectedAsset, setSelectedAsset] = useState(() => {
    const saved = localStorage.getItem('condition_monitoring_active_asset');
    return saved && saved !== 'test-rig-a' ? saved : '';
  });

  const activeAsset = (selectedAsset && assets[selectedAsset]) 
    ? selectedAsset 
    : (assetKeys[0] || '');

  const handleSelectView = (newView) => {
    setActiveView(newView);
    try {
      localStorage.setItem('condition_monitoring_active_view', newView);
    } catch (e) {
      console.warn('Error saving active view to localStorage:', e);
    }
  };

  const handleSelectAsset = (newAsset) => {
    setSelectedAsset(newAsset);
    try {
      localStorage.setItem('condition_monitoring_active_asset', newAsset);
    } catch (e) {
      console.warn('Error saving active asset to localStorage:', e);
    }
  };

  const { data, kpis, isConnected, connectionMode } = useSensorData(activeAsset, handleSelectAsset);

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
          <ErrorBoundary>
            {activeView === 'test-design' && userRole === 'admin' && <TestDesignView activeAsset={activeAsset} setActiveAsset={handleSelectAsset} />}
            {activeView === 'overview' && <OverviewView kpis={kpis} data={data} isConnected={isConnected} />}
            {activeView === 'realtime' && <LiveTelemetryView data={data} kpis={kpis} isConnected={isConnected} />}
            {activeView === 'historical' && <HistoricalDataView data={data} activeAsset={activeAsset} isConnected={isConnected} />}
            {activeView === 'ml-models' && <MlModelsView data={data} kpis={kpis} isConnected={isConnected} />}
            {activeView === 'alerts' && <AlertsView data={data} kpis={kpis} isConnected={isConnected} />}
            {activeView === 'comparison' && <ComparisonView data={data} isConnected={isConnected} activeAsset={activeAsset} />}
            {activeView === 'analysis' && <AnalysisView data={data} kpis={kpis} activeAsset={activeAsset} isConnected={isConnected} />}
            {activeView === 'ai-assistant' && <AiAssistantView activeAsset={activeAsset} kpis={kpis} isConnected={isConnected} />}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
