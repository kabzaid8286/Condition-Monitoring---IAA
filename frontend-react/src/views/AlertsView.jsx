import React, { useState } from 'react';
import { ALERT_DATA } from '../data/mockData';

export default function AlertsView() {
  const [alerts, setAlerts] = useState(ALERT_DATA);
  const [filter, setFilter] = useState('all');

  const icons = {
    critical: '🚨',
    warning: '⚠️',
    info: 'ℹ️'
  };

  const handleAck = (id) => {
    setAlerts(prev =>
      prev.map(a => (a.id === id ? { ...a, acked: true } : a))
    );
  };

  const handleAckAll = () => {
    setAlerts(prev => prev.map(a => ({ ...a, acked: true })));
  };

  const activeCount = alerts.filter(a => !a.acked).length;

  let displayedAlerts = [...alerts];
  if (filter === 'acked') {
    displayedAlerts = displayedAlerts.filter(a => a.acked);
  } else if (filter !== 'all') {
    displayedAlerts = displayedAlerts.filter(a => a.sev === filter && !a.acked);
  }

  const filterTabs = [
    { key: 'all', label: 'All' },
    { key: 'critical', label: 'Critical' },
    { key: 'warning', label: 'Warning' },
    { key: 'info', label: 'Info' },
    { key: 'acked', label: 'Acknowledged' }
  ];

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div className="page-title">🚨 Alerts &amp; Alarms</div>
          <div className="page-title-sub">Active anomaly detections requiring attention</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <div className="badge rose" id="active-alert-count">
            {activeCount} Active
          </div>
          <button
            id="ack-all-btn"
            onClick={handleAckAll}
            style={{
              padding: '7px 14px',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            ✓ Acknowledge All
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: '20px' }}>
        <div style={{ padding: '16px 16px 0', display: 'flex', gap: '6px', flexWrap: 'wrap' }} id="alert-filter-tabs">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              className={`time-btn ${filter === tab.key ? 'active' : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="alert-list" id="full-alert-list" style={{ padding: '16px' }}>
          {displayedAlerts.length > 0 ? (
            displayedAlerts.map(a => (
              <div
                key={a.id}
                className={`alert-item ${a.acked ? 'acked' : a.sev}`}
                id={`alert-${a.id}`}
              >
                <div className="alert-sev-icon">{icons[a.sev] || 'ℹ️'}</div>
                <div className="alert-body">
                  <div className="alert-title">{a.acked ? '✓ ' : ''}{a.title}</div>
                  <div className="alert-desc">{a.desc}</div>
                  <div className="alert-meta">Asset: {a.asset} · {a.time}</div>
                </div>
                {!a.acked ? (
                  <button
                    className="alert-ack-btn"
                    onClick={() => handleAck(a.id)}
                  >
                    Acknowledge
                  </button>
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--green)', whiteSpace: 'nowrap' }}>
                    ✓ Acked
                  </span>
                )}
              </div>
            ))
          ) : (
            <div style={{ padding: '12px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No alerts here.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
