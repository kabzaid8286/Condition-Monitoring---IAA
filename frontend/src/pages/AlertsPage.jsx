import React, { useState } from 'react';
import { Tabs, Button, Row, Col, Typography, Statistic, Card } from 'antd';
import { CheckCircleOutlined, WarningOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import AlertBanner from '../components/alerts/AlertBanner';
import DataTable from '../components/common/DataTable';
import AlertRuleForm from '../components/alerts/AlertRuleForm';
import useAlertStore from '../store/alertStore';
import dayjs from 'dayjs';
import './Pages.css';

const { Title } = Typography;
const { TabPane } = Tabs;

const AlertsPage = () => {
  const { alerts, activeCount, acknowledgeAlert, resolveAlert } = useAlertStore();
  const [ruleModalVisible, setRuleModalVisible] = useState(false);

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const histAlerts = alerts; // in real app, fetch history

  const columns = [
    { title: 'Time', dataIndex: 'timestamp', render: (t) => dayjs(t).format('YYYY-MM-DD HH:mm:ss') },
    { title: 'Severity', dataIndex: 'severity', render: (s) => <span className={`text-${s}`}>{s.toUpperCase()}</span> },
    { title: 'Equipment', dataIndex: 'equipmentName' },
    { title: 'Message', dataIndex: 'message' },
    { title: 'Status', dataIndex: 'status' }
  ];

  return (
    <div className="alerts-page">
      <div className="page-header">
        <Title level={2} className="page-title">Alert Management</Title>
      </div>

      <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card bordered={false} className="dark-card">
            <Statistic title="Active Alerts" value={activeCount} valueStyle={{ color: 'var(--status-critical)' }} prefix={<ExclamationCircleOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} className="dark-card">
            <Statistic title="Acknowledged" value={activeAlerts.filter(a => a.acknowledged).length} valueStyle={{ color: 'var(--status-warning)' }} prefix={<WarningOutlined />} />
          </Card>
        </Col>
        <Col span={8}>
          <Card bordered={false} className="dark-card">
            <Statistic title="Resolved Today" value={12} valueStyle={{ color: 'var(--status-healthy)' }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
      </Row>

      <div className="panel" style={{ padding: 0 }}>
        <Tabs defaultActiveKey="1" style={{ padding: '0 24px' }}>
          <TabPane tab="Active Alerts" key="1">
            <div style={{ padding: '24px 0' }}>
              {activeAlerts.map(alert => (
                <AlertBanner 
                  key={alert.id} 
                  alert={alert} 
                  onAcknowledge={acknowledgeAlert} 
                  onResolve={resolveAlert} 
                />
              ))}
              {activeAlerts.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No active alerts.</p>}
            </div>
          </TabPane>
          <TabPane tab="Alert History" key="2">
            <div style={{ padding: '24px 0' }}>
              <DataTable columns={columns} data={histAlerts} />
            </div>
          </TabPane>
          <TabPane tab="Alert Rules" key="3">
            <div style={{ padding: '24px 0' }}>
              <Button type="primary" onClick={() => setRuleModalVisible(true)} style={{ marginBottom: 16 }}>
                Create New Rule
              </Button>
              <DataTable 
                columns={[
                  { title: 'Rule Name', dataIndex: 'name' },
                  { title: 'Sensor', dataIndex: 'sensorType' },
                  { title: 'Condition', render: (_, r) => `${r.condition} ${r.threshold}` },
                  { title: 'Severity', dataIndex: 'severity' },
                  { title: 'Status', render: () => <span className="text-healthy">Active</span> }
                ]} 
                data={[
                  { id: 1, name: 'High Temp', sensorType: 'Temperature', condition: '>', threshold: 85, severity: 'warning' }
                ]} 
              />
            </div>
          </TabPane>
        </Tabs>
      </div>

      <AlertRuleForm 
        visible={ruleModalVisible} 
        onCancel={() => setRuleModalVisible(false)} 
        onSubmit={(v) => { console.log(v); setRuleModalVisible(false); }} 
      />
    </div>
  );
};

export default AlertsPage;
