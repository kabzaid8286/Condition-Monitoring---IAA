import React from 'react';
import { Typography, Row, Col, Card, Button, Form, Select, DatePicker } from 'antd';
import { FilePdfOutlined, FileExcelOutlined, FileTextOutlined } from '@ant-design/icons';
import './Pages.css';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const ReportsPage = () => {
  return (
    <div className="reports-page">
      <div className="page-header">
        <Title level={2} className="page-title">Reports & Exports</Title>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <div className="panel">
            <h3 className="panel-title">Generate Report</h3>
            <Form layout="vertical">
              <Form.Item label="Report Type">
                <Select defaultValue="health">
                  <Option value="health">Equipment Health Summary</Option>
                  <Option value="alerts">Alert History</Option>
                  <Option value="maintenance">Predictive Maintenance</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Date Range">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item label="Target Equipment">
                <Select defaultValue="all">
                  <Option value="all">All Equipment</Option>
                </Select>
              </Form.Item>
              <Form.Item label="Format">
                <Select defaultValue="pdf">
                  <Option value="pdf">PDF Document</Option>
                  <Option value="csv">CSV Data</Option>
                  <Option value="excel">Excel Spreadsheet</Option>
                </Select>
              </Form.Item>
              <Button type="primary" block>Generate Now</Button>
            </Form>
          </div>
        </Col>
        <Col xs={24} lg={16}>
          <Row gutter={[24, 24]}>
            <Col span={12}>
              <Card className="template-card hoverable" bordered={false}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                  <FilePdfOutlined style={{ fontSize: '32px', color: 'var(--status-critical)' }} />
                  <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Daily Health Summary</h4>
                </div>
                <p className="template-desc">Automated PDF report containing overall system health, active alerts, and top critical equipment.</p>
                <Button>Download Latest</Button>
              </Card>
            </Col>
            <Col span={12}>
              <Card className="template-card hoverable" bordered={false}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                  <FileExcelOutlined style={{ fontSize: '32px', color: 'var(--status-healthy)' }} />
                  <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Sensor Data Export</h4>
                </div>
                <p className="template-desc">Raw CSV export of all sensor readings for deeper analysis in external tools.</p>
                <Button>Configure Export</Button>
              </Card>
            </Col>
            <Col span={12}>
              <Card className="template-card hoverable" bordered={false}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
                  <FileTextOutlined style={{ fontSize: '32px', color: 'var(--accent-primary)' }} />
                  <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Maintenance Log</h4>
                </div>
                <p className="template-desc">Historical record of all resolved alerts, maintenance actions, and downtime.</p>
                <Button>Generate</Button>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>
    </div>
  );
};

export default ReportsPage;
