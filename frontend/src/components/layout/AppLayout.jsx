import React, { useState } from 'react';
import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AppHeader from './Header';
import './Layout.css';

const { Content } = Layout;

const AppLayout = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout className="app-layout">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <Layout>
        <AppHeader collapsed={collapsed} setCollapsed={setCollapsed} />
        <Content className="content-wrapper">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;
