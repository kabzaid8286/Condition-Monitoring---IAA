import React from 'react';
import './Common.css';

const StatusBadge = ({ status, text, size = 'default' }) => {
  const getStatusClass = (s) => {
    switch(s?.toLowerCase()) {
      case 'operational':
      case 'healthy':
      case 'resolved':
      case 'active': // For rules
        return 'status-healthy';
      case 'warning':
        return 'status-warning';
      case 'critical':
      case 'danger':
        return 'status-critical';
      case 'maintenance':
      case 'info':
        return 'status-info';
      case 'offline':
      case 'inactive':
      default:
        return 'status-offline';
    }
  };

  const displayText = text || status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown';

  return (
    <div className={`status-badge ${getStatusClass(status)} size-${size}`}>
      <span className="status-dot"></span>
      <span className="status-text">{displayText}</span>
    </div>
  );
};

export default StatusBadge;
