import React, { useState } from 'react';
import Header from '../components/layout/Header';
import Sidebar from '../components/layout/Sidebar';
import KpiCard from '../components/dashboard/KpiCard';
import LiveTelemetryView from '../views/LiveTelemetryView';
import MlModelsView from '../views/MlModelsView';
import AlertsView from '../views/AlertsView';
import HistoricalDataView from '../views/HistoricalDataView';
import AiAssistantView from '../views/AiAssistantView';
import ComparisonView from '../views/ComparisonView';
import useSensorData from '../hooks/useSensorData';

export default function DashboardPage({ userRole }) {
  const [activeView, setActiveView] = useState('overview');
  const { data, kpis } = useSensorData();

  return (
    <div id="app" className="visible">
      <Header userRole={userRole} />
      <div className="app-body">
        <Sidebar activeView={activeView} setActiveView={setActiveView} />
        
        <main className="main-content">
          {activeView === 'overview' && (
            <>
              <div className="page-title">🏠 Overview <span className="badge blue" style={{fontSize:"11px", fontWeight:500}}>Live</span></div>
              <div className="page-title-sub">React Architecture Migration in Progress...</div>
              
              <div className="overview-grid" style={{marginTop:"20px"}}>
                 <KpiCard title="Vibration RMS" value={kpis.vibRms} unit="mm/s" colorClass="blue" />
                 <KpiCard title="Temperature" value={kpis.temp} unit="°C" colorClass="green" />
                 <KpiCard title="Motor RPM" value={kpis.rpm} unit="RPM" colorClass="amber" />
                 <KpiCard title="Health Score" value={kpis.health} unit="%" colorClass="rose" />
              </div>

              <div className="grid-2" style={{marginTop:"16px"}}>
                <div className="card">
                  <div className="card-header"><div className="card-title">Live Sensor Array</div></div>
                  <div className="card-body" style={{paddingTop:0}}>
                    <table className="sensor-table">
                      <thead>
                        <tr><th>Sensor ID</th><th>Type</th><th>Value</th><th>Status</th></tr>
                      </thead>
                      <tbody>
                        <tr><td>ACC-DE-01</td><td>Vibration X</td><td className="mono">{kpis.vibRms} mm/s</td><td><span className="badge blue">Normal</span></td></tr>
                        <tr><td>TMP-DE-01</td><td>Bearing Temp</td><td className="mono">{kpis.temp} °C</td><td><span className="badge green">Normal</span></td></tr>
                        <tr><td>ENC-M-01</td><td>Motor Speed</td><td className="mono">{kpis.rpm} RPM</td><td><span className="badge green">Normal</span></td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeView === 'realtime' && <LiveTelemetryView data={data} />}
          {activeView === 'ml-models' && <MlModelsView data={data} />}
          {activeView === 'alerts' && <AlertsView />}
          {activeView === 'historical' && <HistoricalDataView data={data} />}
          {activeView === 'comparison' && <ComparisonView data={data} />}
          {activeView === 'ai-assistant' && <AiAssistantView />}

          {['config'].includes(activeView) && (
            <div className="card" style={{marginTop: "20px"}}>
              <div className="card-body">
                <h3>{activeView} View</h3>
                <p style={{color: "var(--text-secondary)", marginTop: "10px"}}>This module is actively being migrated from Vanilla JS to React...</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
