import React, { useState } from 'react';
import { Typography, Select, DatePicker, Button, Space, Card } from 'antd';
import { DownloadOutlined, ReloadOutlined } from '@ant-design/icons';
import TimeSeriesChart from '../components/charts/TimeSeriesChart';
import './Pages.css';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const HistoryPage = () => {
  const [data, setData] = useState([]);

  const handleFetch = () => {
    // mock fetch
    const arr = Array.from({length: 100}).map((_, i) => ({
      time: new Date().getTime() - (100-i)*3600000,
      value: 50 + Math.random()*20
    }));
    setData(arr);
  };

  return (
    <div className="history-page">
      <div className="page-header">
        <Title level={2} className="page-title">Historical Data Explorer</Title>
        <Button icon={<DownloadOutlined />}>Export CSV</Button>
      </div>

      <Card bordered={false} className="dark-card" style={{ marginBottom: 24 }}>
        <Space wrap size="large">
          <div>
            <div style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>Equipment</div>
            <Select style={{ width: 200 }} placeholder="Select Equipment" defaultValue="all">
              <Select.Option value="all">All Equipment</Select.Option>
              <Select.Option value="1">Main Compressor A</Select.Option>
            </Select>
          </div>
          <div>
            <div style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>Sensor Type</div>
            <Select style={{ width: 200 }} placeholder="Select Sensor" defaultValue="temp">
              <Select.Option value="temp">Temperature</Select.Option>
              <Select.Option value="vib">Vibration</Select.Option>
            </Select>
          </div>
          <div>
            <div style={{ marginBottom: 8, color: 'var(--text-secondary)' }}>Time Range</div>
            <RangePicker showTime />
          </div>
          <div style={{ alignSelf: 'flex-end' }}>
            <Button type="primary" icon={<ReloadOutlined />} onClick={handleFetch}>Load Data</Button>
          </div>
        </Space>
      </Card>

      <div className="panel">
        <h3 className="panel-title" style={{ marginBottom: 20 }}>Historical Trend</h3>
        <TimeSeriesChart data={data} height="500px" title="Historical Sensor Value" unit="Units" />
      </div>
    </div>
  );
};

export default HistoryPage;
