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
import useSensorData from '../hooks/useSensorData';

export default function DashboardPage({ userRole, onLogout }) {
  const [activeView, setActiveView] = useState('overview');
  const [activeAsset, setActiveAsset] = useState('test-rig-a');
  const { data, kpis } = useSensorData(activeAsset);

  return (
    <div id="app" className="visible">
      <Header userRole={userRole} activeAsset={activeAsset} setActiveAsset={setActiveAsset} />
      <div className="app-body">
        <Sidebar userRole={userRole} activeView={activeView} setActiveView={setActiveView} onLogout={onLogout} />
        
        <main className="main-content">
          {activeView === 'test-design' && userRole === 'admin' && <TestDesignView activeAsset={activeAsset} setActiveAsset={setActiveAsset} />}
          {activeView === 'overview' && <OverviewView kpis={kpis} data={data} />}
          {activeView === 'realtime' && <LiveTelemetryView data={data} />}
          {activeView === 'historical' && <HistoricalDataView data={data} />}
          {activeView === 'ml-models' && <MlModelsView data={data} />}
          {activeView === 'alerts' && <AlertsView />}
          {activeView === 'comparison' && <ComparisonView data={data} />}
          {activeView === 'ai-assistant' && <AiAssistantView activeAsset={activeAsset} />}
        </main>
      </div>
    </div>
  );
}
