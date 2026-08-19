import React from 'react';
import { Typography, Form, Input, Button, Switch, Divider } from 'antd';
import './Pages.css';

const { Title, Text } = Typography;

const SettingsPage = () => {
  return (
    <div className="settings-page">
      <div className="page-header">
        <Title level={2} className="page-title">Settings</Title>
      </div>

      <div className="panel" style={{ maxWidth: 800 }}>
        <Title level={4} style={{ color: 'var(--text-primary)', marginBottom: 24 }}>Profile Information</Title>
        <Form layout="vertical">
          <Form.Item label="Full Name">
            <Input defaultValue="Admin User" />
          </Form.Item>
          <Form.Item label="Email Address">
            <Input defaultValue="admin@iaa.com" />
          </Form.Item>
          <Button type="primary">Save Changes</Button>
        </Form>

        <Divider style={{ borderColor: 'var(--border-color)', margin: '32px 0' }} />

        <Title level={4} style={{ color: 'var(--text-primary)', marginBottom: 24 }}>Notification Preferences</Title>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Email Alerts for Critical Issues</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Receive immediate emails when critical alerts occur.</div>
            </div>
            <Switch defaultChecked />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Daily Digest</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Receive a daily summary of system health.</div>
            </div>
            <Switch defaultChecked />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: 'var(--text-primary)', fontWeight: 500 }}>Browser Notifications</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Show desktop notifications for new alerts.</div>
            </div>
            <Switch />
          </div>
        </div>

        <Divider style={{ borderColor: 'var(--border-color)', margin: '32px 0' }} />

        <Title level={4} style={{ color: 'var(--text-primary)', marginBottom: 24 }}>System Information</Title>
        <div style={{ color: 'var(--text-secondary)' }}>
          <p><strong>App Version:</strong> 1.0.0</p>
          <p><strong>API Endpoint:</strong> http://localhost:8000/api/v1</p>
          <p><strong>Socket Connection:</strong> Connected</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
