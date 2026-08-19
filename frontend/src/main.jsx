import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider, theme } from 'antd';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import App from './App.jsx';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfigProvider
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            fontFamily: "'Inter', sans-serif",
            colorPrimary: '#3b82f6',
            colorBgBase: '#0a0e17',
            colorBgContainer: '#111827',
            colorBgElevated: '#1a2235',
            colorBorder: '#2a3548',
            colorText: '#e8edf5',
            colorTextSecondary: '#8b95a8',
            colorSuccess: '#10b981',
            colorWarning: '#f59e0b',
            colorError: '#ef4444',
            colorInfo: '#6366f1',
          },
        }}
      >
        <BrowserRouter>
          <App />
          <ToastContainer theme="dark" position="bottom-right" />
        </BrowserRouter>
      </ConfigProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
