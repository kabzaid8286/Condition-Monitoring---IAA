import React from 'react';
import { Card, Badge, Progress, Space } from 'antd';
import { EnvironmentOutlined, CalendarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import StatusBadge from '../common/StatusBadge';
import './Equipment.css';

const EquipmentCard = ({ equipment }) => {
  const navigate = useNavigate();
  const { id, name, type, location, status, healthScore, activeAlerts, lastMaintenance } = equipment;

  const getHealthColor = (score) => {
    if (score >= 80) return '#10b981';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <Card 
      className="equipment-card hoverable" 
      onClick={() => navigate(`/equipment/${id}`)}
      bordered={false}
    >
      <div className="ec-header">
        <div className="ec-title-area">
          <h3 className="ec-name">{name}</h3>
          <span className="ec-type">{type}</span>
        </div>
        <div className="ec-status">
          <StatusBadge status={status} size="small" />
        </div>
      </div>

      <div className="ec-body">
        <div className="ec-info">
          <Space direction="vertical" size={4}>
            <div className="info-row">
              <EnvironmentOutlined /> <span>{location}</span>
            </div>
            <div className="info-row">
              <CalendarOutlined /> <span>Maintained: {lastMaintenance}</span>
            </div>
          </Space>
        </div>

        <div className="ec-health">
          <Progress 
            type="circle" 
            percent={healthScore} 
            size={50} 
            strokeColor={getHealthColor(healthScore)}
            trailColor="var(--bg-surface-elevated)"
            format={(percent) => <span className="health-score-text">{percent}</span>}
          />
          <div className="health-label">Health</div>
        </div>
      </div>

      {activeAlerts > 0 && (
        <div className="ec-alerts">
          <Badge count={`${activeAlerts} Active Alerts`} style={{ backgroundColor: 'var(--status-critical)' }} />
        </div>
      )}
    </Card>
  );
};

export default EquipmentCard;
