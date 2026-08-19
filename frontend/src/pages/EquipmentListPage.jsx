import React, { useState } from 'react';
import { Button, Input, Select, Space, Typography, Tag } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import EquipmentForm from '../components/equipment/EquipmentForm';
import useEquipmentStore from '../store/equipmentStore';
import './Pages.css';

const { Title } = Typography;
const { Option } = Select;

const EquipmentListPage = () => {
  const navigate = useNavigate();
  const { equipment, isLoading } = useEquipmentStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const handleAddSubmit = (values) => {
    console.log('Adding equipment:', values);
    setModalVisible(false);
  };

  const filteredData = equipment.filter(eq => {
    const matchesSearch = eq.name.toLowerCase().includes(searchText.toLowerCase()) || 
                          eq.location.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || eq.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => <a onClick={() => navigate(`/equipment/${record.id}`)} style={{ fontWeight: 500, color: 'var(--accent-primary)' }}>{text}</a>,
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge status={status} size="small" />
    },
    {
      title: 'Health',
      dataIndex: 'healthScore',
      key: 'healthScore',
      render: (score) => {
        let color = 'success';
        if (score < 50) color = 'error';
        else if (score < 80) color = 'warning';
        return <Tag color={color}>{score}%</Tag>;
      }
    },
    {
      title: 'Alerts',
      dataIndex: 'activeAlerts',
      key: 'activeAlerts',
      render: (count) => count > 0 ? <Tag color="error">{count} Active</Tag> : <span style={{color: 'var(--text-secondary)'}}>None</span>
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Button type="link" size="small" onClick={() => navigate(`/equipment/${record.id}`)}>
          View Details
        </Button>
      ),
    },
  ];

  return (
    <div className="equipment-page">
      <div className="page-header">
        <Title level={2} className="page-title">Equipment Directory</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          Add Equipment
        </Button>
      </div>

      <div className="panel">
        <div style={{ marginBottom: 20, display: 'flex', gap: '16px' }}>
          <Input 
            placeholder="Search equipment..." 
            prefix={<SearchOutlined />} 
            style={{ width: 300 }}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select 
            defaultValue="all" 
            style={{ width: 150 }} 
            onChange={setStatusFilter}
          >
            <Option value="all">All Statuses</Option>
            <Option value="operational">Operational</Option>
            <Option value="warning">Warning</Option>
            <Option value="critical">Critical</Option>
            <Option value="offline">Offline</Option>
          </Select>
        </div>

        <DataTable 
          columns={columns} 
          data={filteredData} 
          loading={isLoading}
          pagination={{ pageSize: 10 }}
        />
      </div>

      <EquipmentForm 
        visible={modalVisible}
        onCancel={() => setModalVisible(false)}
        onSubmit={handleAddSubmit}
      />
    </div>
  );
};

export default EquipmentListPage;
