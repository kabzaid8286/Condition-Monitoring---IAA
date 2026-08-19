import React from 'react';
import { Layout, Menu, Badge } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashboardOutlined,
  ToolOutlined,
  BellOutlined,
  LineChartOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  SettingOutlined
} from '@ant-design/icons';
import useAlertStore from '../../store/alertStore';

const { Sider } = Layout;

const Sidebar = ({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const activeAlerts = useAlertStore(state => state.activeCount);

  const menuItems = [
    { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/equipment', icon: <ToolOutlined />, label: 'Equipment' },
    { 
      key: '/alerts', 
      icon: <Badge count={activeAlerts} size="small" offset={[10, 0]}><BellOutlined style={{ color: 'inherit' }} /></Badge>, 
      label: 'Alerts' 
    },
    { key: '/history', icon: <LineChartOutlined />, label: 'History' },
    { key: '/predictions', icon: <ExperimentOutlined />, label: 'Predictions' },
    { key: '/reports', icon: <FileTextOutlined />, label: 'Reports' },
    { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
  ];

  return (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={(value) => setCollapsed(value)}
      className="sidebar"
      width={240}
      theme="dark"
      breakpoint="lg"
    >
      <div className="logo-container">
        <h1 className="logo-text">{collapsed ? 'IAA' : 'IAA Monitor'}</h1>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        onClick={({ key }) => navigate(key)}
        items={menuItems}
      />
    </Sider>
  );
};

export default Sidebar;
