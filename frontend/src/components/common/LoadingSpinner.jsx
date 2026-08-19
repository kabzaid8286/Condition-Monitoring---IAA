import React from 'react';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import './Common.css';

const LoadingSpinner = ({ text = 'Loading...', variant = 'inline', size = 24 }) => {
  const antIcon = <LoadingOutlined style={{ fontSize: size }} spin />;

  if (variant === 'fullpage') {
    return (
      <div className="loading-fullpage">
        <Spin indicator={antIcon} tip={text} />
      </div>
    );
  }

  if (variant === 'overlay') {
    return (
      <div className="loading-overlay">
        <Spin indicator={antIcon} tip={text} />
      </div>
    );
  }

  return (
    <div className="loading-inline">
      <Spin indicator={antIcon} />
      {text && <span className="loading-text">{text}</span>}
    </div>
  );
};

export default LoadingSpinner;
