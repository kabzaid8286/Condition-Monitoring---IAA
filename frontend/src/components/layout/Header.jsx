import React from 'react';
import { Layout, Badge, Avatar, Dropdown, Menu } from 'antd';
import { BellOutlined, UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import useSocket from '../../hooks/useSocket';
import useAlertStore from '../../store/alertStore';

const { Header } = Layout;

const AppHeader = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isConnected } = useSocket();
  const unreadAlerts = useAlertStore(state => state.unacknowledgedCount);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        Profile ({user?.name || 'User'})
      </Menu.Item>
      <Menu.Item key="settings" icon={<SettingOutlined />} onClick={() => navigate('/settings')}>
        Settings
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout} danger>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <Header className="app-header">
      <div className="header-left">
        {/* Breadcrumbs or search could go here */}
      </div>
      
      <div className="header-right">
        <div className="connection-status">
          <div className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          {isConnected ? 'Live' : 'Offline'}
        </div>

        <Badge count={unreadAlerts} overflowCount={99} onClick={() => navigate('/alerts')} style={{ cursor: 'pointer' }}>
          <BellOutlined style={{ fontSize: '20px', color: 'var(--text-primary)', cursor: 'pointer' }} />
        </Badge>

        <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
          <Avatar 
            style={{ backgroundColor: 'var(--accent-primary)', cursor: 'pointer' }} 
            icon={<UserOutlined />} 
          />
        </Dropdown>
      </div>
    </Header>
  );
};

export default AppHeader;
