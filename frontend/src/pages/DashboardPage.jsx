import React, { useEffect, useState } from 'react';
import { Typography, Row, Col } from 'antd';
import { 
  AppstoreOutlined, 
  CheckCircleOutlined, 
  WarningOutlined, 
  HeartOutlined 
} from '@ant-design/icons';
import EquipmentCard from '../components/equipment/EquipmentCard';
import TimeSeriesChart from '../components/charts/TimeSeriesChart';
import AlertBanner from '../components/alerts/AlertBanner';
import useEquipmentStore from '../store/equipmentStore';
import useAlertStore from '../store/alertStore';
import useSensorStore from '../store/sensorStore';
import './Pages.css';

const { Title } = Typography;

// Mock data generator for the demo
const generateMockLiveChart = () => {
  const now = new Date().getTime();
  return Array.from({ length: 50 }).map((_, i) => ({
    time: now - (50 - i) * 2000,
    value: 65 + Math.random() * 10
  }));
};

const DashboardPage = () => {
  const [chartData, setChartData] = useState(generateMockLiveChart());
  const { equipment, setEquipment } = useEquipmentStore();
  const { alerts, setAlerts, activeCount, acknowledgeAlert, resolveAlert } = useAlertStore();
  
  useEffect(() => {
    // Mock fetching equipment
    const mockEquipment = [
      { id: 1, name: 'Main Compressor A', type: 'Compressor', location: 'Plant 1', status: 'operational', healthScore: 92, activeAlerts: 0, lastMaintenance: '2023-10-01' },
      { id: 2, name: 'Cooling Pump B', type: 'Pump', location: 'Plant 1', status: 'warning', healthScore: 68, activeAlerts: 2, lastMaintenance: '2023-08-15' },
      { id: 3, name: 'Exhaust Fan C', type: 'Fan', location: 'Roof', status: 'critical', healthScore: 45, activeAlerts: 1, lastMaintenance: '2023-05-20' },
      { id: 4, name: 'Conveyor Belt 1', type: 'Conveyor', location: 'Assembly', status: 'operational', healthScore: 88, activeAlerts: 0, lastMaintenance: '2023-09-10' },
    ];
    setEquipment(mockEquipment);

    // Mock alerts
    const mockAlerts = [
      { id: 101, title: 'High Vibration Detected', message: 'Vibration exceeded 15mm/s', severity: 'warning', equipmentId: 2, equipmentName: 'Cooling Pump B', timestamp: new Date().getTime() - 1000 * 60 * 5, status: 'active', acknowledged: false },
      { id: 102, title: 'Temperature Critical', message: 'Bearing temp > 85°C', severity: 'critical', equipmentId: 3, equipmentName: 'Exhaust Fan C', timestamp: new Date().getTime() - 1000 * 60 * 15, status: 'active', acknowledged: false }
    ];
    setAlerts(mockAlerts);

    // Simulate live data
    const interval = setInterval(() => {
      setChartData(prev => {
        const newData = [...prev.slice(1), { time: new Date().getTime(), value: 65 + Math.random() * 10 + (Math.random() > 0.9 ? 15 : 0) }];
        return newData;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [setEquipment, setAlerts]);

  const totalEq = equipment.length;
  const activeEq = equipment.filter(e => e.status !== 'offline').length;
  const avgHealth = totalEq ? Math.round(equipment.reduce((acc, curr) => acc + curr.healthScore, 0) / totalEq) : 0;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <Title level={2} className="page-title">Real-time Overview</Title>
      </div>

      <div className="dashboard-top-row">
        <div className="stat-card">
          <div className="stat-icon"><AppstoreOutlined /></div>
          <div className="stat-content">
            <div className="stat-title">Total Equipment</div>
            <div className="stat-value">{totalEq}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success"><CheckCircleOutlined /></div>
          <div className="stat-content">
            <div className="stat-title">Online / Active</div>
            <div className="stat-value">{activeEq}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className={`stat-icon ${activeCount > 0 ? 'danger' : 'success'}`}>
            <WarningOutlined />
          </div>
          <div className="stat-content">
            <div className="stat-title">Active Alerts</div>
            <div className="stat-value">{activeCount}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className={`stat-icon ${avgHealth > 80 ? 'success' : avgHealth > 50 ? 'warning' : 'danger'}`}>
            <HeartOutlined />
          </div>
          <div className="stat-content">
            <div className="stat-title">Avg Health Score</div>
            <div className="stat-value">{avgHealth}%</div>
          </div>
        </div>
      </div>

      <Title level={4} style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Equipment Status</Title>
      <div className="equipment-grid">
        {equipment.map(eq => (
          <EquipmentCard key={eq.id} equipment={eq} />
        ))}
      </div>

      <div className="dashboard-split-row">
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Live Sensor Stream (Vibration)</h3>
          </div>
          <TimeSeriesChart 
            data={chartData} 
            title="Aggregated Vibration" 
            unit="mm/s" 
            warningThreshold={75}
            criticalThreshold={85}
          />
        </div>
        
        <div className="panel">
          <div className="panel-header">
            <h3 className="panel-title">Recent Alerts</h3>
          </div>
          <div className="alert-feed" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {alerts.filter(a => a.status === 'active').length > 0 ? (
              alerts.filter(a => a.status === 'active').map(alert => (
                <AlertBanner 
                  key={alert.id} 
                  alert={alert} 
                  onAcknowledge={acknowledgeAlert}
                  onResolve={resolveAlert}
                  compact
                />
              ))
            ) : (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                No active alerts. System healthy.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
