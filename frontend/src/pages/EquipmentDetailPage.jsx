import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Tabs, Row, Col, Card, Typography } from 'antd';
import StatusBadge from '../components/common/StatusBadge';
import HealthScoreRadar from '../components/charts/HealthScoreRadar';
import LiveGauge from '../components/charts/LiveGauge';
import TimeSeriesChart from '../components/charts/TimeSeriesChart';
import VibrationSpectrum from '../components/charts/VibrationSpectrum';
import useEquipmentStore from '../store/equipmentStore';
import './Pages.css';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const EquipmentDetailPage = () => {
  const { id } = useParams();
  const { equipment } = useEquipmentStore();
  const eq = equipment.find(e => e.id.toString() === id) || { name: 'Unknown', status: 'offline', healthScore: 0 };
  
  const [liveSensors, setLiveSensors] = useState({
    vibration: 12.4,
    temperature: 68.2,
    pressure: 110.5
  });

  useEffect(() => {
    const int = setInterval(() => {
      setLiveSensors(prev => ({
        vibration: prev.vibration + (Math.random() - 0.5) * 2,
        temperature: prev.temperature + (Math.random() - 0.5),
        pressure: prev.pressure + (Math.random() - 0.5) * 5
      }));
    }, 2000);
    return () => clearInterval(int);
  }, []);

  const histData = Array.from({length: 30}).map((_, i) => ({
    time: new Date().getTime() - (30-i)*60000,
    value: 65 + Math.random()*10
  }));

  const freqData = Array.from({length: 50}).map((_, i) => ({
    frequency: i * 10,
    amplitude: Math.random() * (i === 15 ? 100 : 20)
  }));

  return (
    <div className="equipment-detail-page">
      <div className="detail-header">
        <div className="detail-info">
          <h2>{eq.name} <StatusBadge status={eq.status} /></h2>
          <div className="detail-meta">
            <span><strong>Type:</strong> {eq.type || 'Unknown'}</span>
            <span><strong>Location:</strong> {eq.location || 'Unknown'}</span>
            <span><strong>ID:</strong> {id}</span>
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <Tabs defaultActiveKey="1" style={{ padding: '0 24px' }}>
          <TabPane tab="Overview" key="1">
            <div style={{ padding: '24px 0' }}>
              <Row gutter={[24, 24]}>
                <Col xs={24} lg={8}>
                  <Card title="Health Breakdown" bordered={false} className="dark-card">
                    <HealthScoreRadar 
                      scores={{ Vibration: 85, Temperature: 90, Pressure: 75, Acoustic: 95 }} 
                    />
                  </Card>
                </Col>
                <Col xs={24} lg={16}>
                  <Card title="Live Sensors" bordered={false} className="dark-card">
                    <div className="sensor-grid">
                      <LiveGauge title="Vibration" value={liveSensors.vibration} unit=" mm/s" max={30} warningThreshold={15} criticalThreshold={22} />
                      <LiveGauge title="Temperature" value={liveSensors.temperature} unit=" °C" max={150} warningThreshold={85} criticalThreshold={110} />
                      <LiveGauge title="Pressure" value={liveSensors.pressure} unit=" psi" max={200} warningThreshold={140} criticalThreshold={170} />
                    </div>
                  </Card>
                </Col>
              </Row>
            </div>
          </TabPane>
          <TabPane tab="History & Analytics" key="2">
            <div style={{ padding: '24px 0' }}>
              <Row gutter={[24, 24]}>
                <Col span={24}>
                  <Card title="Historical Trend (Last 24h)" bordered={false} className="dark-card">
                    <TimeSeriesChart data={histData} unit="°C" warningThreshold={85} criticalThreshold={100} />
                  </Card>
                </Col>
                <Col span={24}>
                  <Card title="Frequency Spectrum Analysis" bordered={false} className="dark-card">
                    <VibrationSpectrum data={freqData} />
                  </Card>
                </Col>
              </Row>
            </div>
          </TabPane>
          <TabPane tab="Alerts & Rules" key="3">
            <div style={{ padding: '24px 0' }}>
              <Text style={{ color: 'var(--text-secondary)' }}>Configure thresholds and view alert history specific to this equipment here.</Text>
            </div>
          </TabPane>
        </Tabs>
      </div>
    </div>
  );
};

export default EquipmentDetailPage;
