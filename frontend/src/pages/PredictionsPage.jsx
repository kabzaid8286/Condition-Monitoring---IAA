import React from 'react';
import { Typography, Row, Col, Card, Progress, Button } from 'antd';
import { RobotOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import './Pages.css';

const { Title, Text } = Typography;

const PredictionsPage = () => {
  const models = [
    { id: 1, name: 'Main Compressor A', rul: '~1200 hours', score: 92, trend: 'stable' },
    { id: 2, name: 'Cooling Pump B', rul: '~350 hours', score: 68, trend: 'down' },
    { id: 3, name: 'Exhaust Fan C', rul: '< 48 hours', score: 45, trend: 'down' },
  ];

  return (
    <div className="predictions-page">
      <div className="page-header">
        <Title level={2} className="page-title">ML Predictions & RUL</Title>
        <Button type="primary" icon={<RobotOutlined />}>Run Batch Prediction</Button>
      </div>

      <Row gutter={[24, 24]}>
        {models.map(m => (
          <Col xs={24} md={12} lg={8} key={m.id}>
            <Card className="hoverable dark-card" bordered={false}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <Title level={4} style={{ color: 'var(--text-primary)', margin: 0 }}>{m.name}</Title>
                {m.trend === 'down' ? <ArrowDownOutlined className="text-critical" /> : <ArrowUpOutlined className="text-healthy" />}
              </div>
              
              <div style={{ textAlign: 'center', margin: '24px 0' }}>
                <Progress 
                  type="dashboard" 
                  percent={m.score} 
                  strokeColor={m.score > 80 ? '#10b981' : m.score > 50 ? '#f59e0b' : '#ef4444'} 
                  format={(p) => <span style={{ color: 'var(--text-primary)' }}>{p}</span>}
                />
                <div style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Health Score</div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '12px', borderRadius: '8px', textAlign: 'center' }}>
                <Text style={{ color: 'var(--text-secondary)' }}>Remaining Useful Life (RUL)</Text>
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-primary)', marginTop: 4 }}>
                  {m.rul}
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default PredictionsPage;
