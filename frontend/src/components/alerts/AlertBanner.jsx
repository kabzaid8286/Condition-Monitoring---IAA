import React from 'react';
import { Button } from 'antd';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { InfoCircleOutlined, WarningOutlined, CloseCircleOutlined } from '@ant-design/icons';
import './Alerts.css';

dayjs.extend(relativeTime);

const AlertBanner = ({ alert, onAcknowledge, onResolve, compact = false }) => {
  const { id, title, message, severity, equipmentId, equipmentName, timestamp, status, acknowledged } = alert;

  const getSeverityConfig = () => {
    switch (severity?.toLowerCase()) {
      case 'critical': return { class: 'alert-critical', icon: <CloseCircleOutlined /> };
      case 'warning': return { class: 'alert-warning', icon: <WarningOutlined /> };
      default: return { class: 'alert-info', icon: <InfoCircleOutlined /> };
    }
  };

  const { class: sevClass, icon } = getSeverityConfig();
  const timeStr = dayjs(timestamp).fromNow();

  return (
    <div className={`alert-banner ${sevClass} ${compact ? 'compact' : ''} ${acknowledged ? 'acknowledged' : ''}`}>
      <div className="alert-icon">{icon}</div>
      <div className="alert-content">
        <div className="alert-header">
          <h4 className="alert-title">{title}</h4>
          <span className="alert-time">{timeStr}</span>
        </div>
        {!compact && <p className="alert-message">{message}</p>}
        <div className="alert-meta">
          <span>Equipment: <Link to={`/equipment/${equipmentId}`}>{equipmentName}</Link></span>
        </div>
      </div>
      <div className="alert-actions">
        {status === 'active' && !acknowledged && (
          <Button size="small" onClick={() => onAcknowledge(id)}>Ack</Button>
        )}
        {status === 'active' && (
          <Button size="small" type="primary" danger={severity === 'critical'} onClick={() => onResolve(id)}>
            Resolve
          </Button>
        )}
      </div>
    </div>
  );
};

export default AlertBanner;
