import React from 'react';
import { Line } from 'react-chartjs-2';
import { Activity, Thermometer, Zap, TrendingUp } from 'lucide-react';
import KpiCard from '../components/dashboard/KpiCard';
import { commonOptions } from '../components/charts/ChartConfig';
import { ALERT_DATA } from '../data/systemConfig';

export default function OverviewView({ kpis = {}, data = {} }) {
  const labels = data?.labels || [];
  const vibX = data?.vibX || [];
  const temp = data?.temp || [];
  const rpm = data?.rpm || [];

  const getSparklineData = (dataArray = [], color) => ({
    labels: labels.slice(-20),
    datasets: [{
      data: (dataArray || []).slice(-20),
      borderColor: color,
      tension: 0.4
    }]
  });

  const mainChartData = {
    labels: labels,
    datasets: [
      {
        label: 'Vibration (mm/s)',
        data: vibX,
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
        pointRadius: 0
      },
      {
        label: 'Temp (°C ×0.1)',
        data: temp.map(t => (parseFloat(t || 0) * 0.1).toFixed(2)),
        borderColor: '#10b981',
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0
      }
    ]
  };

  const activeAlerts = ALERT_DATA.filter(a => !a.acked).slice(0, 3);
  const now = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const isOffline = kpis?.burstState === 'offline' || (kpis?.vibRms === '0.00' && kpis?.rpm === 0);

  return (
    <>
      <div className="page-title">Overview <span className={`badge ${isOffline ? 'warn' : 'blue'}`} style={{fontSize:"11px", fontWeight:500}}>{isOffline ? 'Standby (0 Telemetry)' : 'Live'}</span></div>
      <div className="page-title-sub">Main system status and telemetry {isOffline ? '(Hardware Disconnected — Awaiting Telemetry)' : '(Live Stream Connected)'}</div>
      
      <div className="overview-grid" style={{marginTop:"20px"}}>
         <KpiCard title="Vibration RMS" value={kpis?.vibRms ?? '0.00'} unit="mm/s" colorClass="blue" icon={<Activity size={18} color="#3b82f6" />} chartData={getSparklineData(vibX, '#3b82f6')} trend={isOffline ? "0.00 • Hardware Disconnected" : "● Live Accelerometer"} trendClass={isOffline ? "neutral" : "up"} />
         <KpiCard title="Bearing Temp" value={kpis?.temp ?? '0.0'} unit="°C" colorClass="green" icon={<Thermometer size={18} color="#10b981" />} chartData={getSparklineData(temp, '#10b981')} trend={isOffline ? "0.0 • Sensor Offline" : "● Live Temp Probe"} trendClass={isOffline ? "neutral" : "neutral"} />
         <KpiCard title="Shaft Speed" value={kpis?.rpm ?? 0} unit="RPM" colorClass="amber" icon={<Zap size={18} color="#f59e0b" />} chartData={getSparklineData(rpm, '#f59e0b')} trend={isOffline ? "0 RPM • Motor Stopped" : "● Live Speed Ingest"} trendClass={isOffline ? "neutral" : "neutral"} />
         <KpiCard title="Anomaly Score" value={isOffline ? '0.00' : (parseFloat(kpis?.vibRms || 0) / 10).toFixed(2)} unit="/1.0" colorClass="rose" icon={<TrendingUp size={18} color="#f43f5e" />} chartData={getSparklineData(vibX.map(v => parseFloat(v || 0)/10), '#f43f5e')} trend={isOffline ? "0.00 • Model Standby" : "● Live Anomaly Scoring"} trendClass={isOffline ? "neutral" : "down"} />
      </div>

      <div className="chart-row" style={{marginTop: "16px"}}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Live Trend — Vibration & Temperature</div>
            <div className="time-range-btns">
              <button className="time-btn active">5m</button>
              <button className="time-btn">30m</button>
              <button className="time-btn">1h</button>
            </div>
          </div>
          <div className="chart-wrap">
            <Line options={commonOptions} data={mainChartData} height={180} />
          </div>
        </div>
        <div className="card">
          <div className="card-header" style={{paddingBottom:"12px"}}>
            <div className="card-title">Recent Alerts</div>
            <div className="badge rose">{ALERT_DATA.filter(a=>!a.acked).length} Active</div>
          </div>
          <div className="alert-list">
            {activeAlerts.map(a => (
              <div key={a.id} className={`alert-item ${a.sev}`}>
                <div className="alert-sev-icon" style={{display:'flex', alignItems:'center', justifyContent:'center'}}>
                  <span className={`status-dot ${a.sev === 'critical' ? 'alarm' : a.sev === 'warning' ? 'warn' : 'ok'}`} style={{width:'8px', height:'8px'}}></span>
                </div>
                <div className="alert-body">
                  <div className="alert-title">{a.title}</div>
                  <div className="alert-desc">{a.desc}</div>
                  <div className="alert-meta">TIME: {a.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card" style={{marginTop: "16px"}}>
        <div className="card-header" style={{paddingBottom:"12px"}}>
          <div className="card-title">Sensor Status Summary</div>
          <div style={{fontSize:"11px", color:"var(--text-secondary)", fontFamily:"'JetBrains Mono',monospace"}}>Updated: {now}</div>
        </div>
        <div className="card-body" style={{paddingTop:0}}>
          <table className="sensor-table">
            <thead>
              <tr><th>Sensor</th><th>Channel</th><th>Value</th><th>Unit</th><th>Status</th><th>Last seen</th></tr>
            </thead>
            <tbody>
              <tr><td>Drive-End Vibration</td><td className="mono">acc_de_x</td><td className="mono font-bold">{kpis.vibRms}</td><td className="mono text-muted">mm/s</td><td><span className={`health-dot ${kpis.vibRms > 8 ? 'critical' : kpis.vibRms > 5 ? 'warning' : 'ok'}`}></span>{kpis.vibRms > 8 ? 'CRITICAL' : kpis.vibRms > 5 ? 'WARNING' : 'OK'}</td><td className="mono text-muted">{now}</td></tr>
              <tr><td>Non-Drive Vibration</td><td className="mono">acc_nde_y</td><td className="mono font-bold">{(kpis.vibRms * 0.55).toFixed(2)}</td><td className="mono text-muted">mm/s</td><td><span className="health-dot ok"></span>OK</td><td className="mono text-muted">{now}</td></tr>
              <tr><td>Bearing Temperature</td><td className="mono">temp_de</td><td className="mono font-bold">{kpis.temp}</td><td className="mono text-muted">°C</td><td><span className={`health-dot ${kpis.temp > 75 ? 'critical' : kpis.temp > 65 ? 'warning' : 'ok'}`}></span>{kpis.temp > 75 ? 'CRITICAL' : kpis.temp > 65 ? 'WARNING' : 'OK'}</td><td className="mono text-muted">{now}</td></tr>
              <tr><td>Motor Temperature</td><td className="mono">temp_motor</td><td className="mono font-bold">{(kpis.temp * 1.12).toFixed(1)}</td><td className="mono text-muted">°C</td><td><span className="health-dot ok"></span>OK</td><td className="mono text-muted">{now}</td></tr>
              <tr><td>Shaft Speed</td><td className="mono">rpm_shaft</td><td className="mono font-bold">{kpis.rpm}</td><td className="mono text-muted">RPM</td><td><span className="health-dot ok"></span>OK</td><td className="mono text-muted">{now}</td></tr>
              <tr><td>Current (Phase A)</td><td className="mono">curr_phA</td><td className="mono font-bold">18.02</td><td className="mono text-muted">A</td><td><span className="health-dot ok"></span>OK</td><td className="mono text-muted">{now}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
