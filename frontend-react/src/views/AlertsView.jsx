import React, { useState } from 'react';
import { ALERT_DATA } from '../data/mockData';

export default function AlertsView() {
  const [filter, setFilter] = useState('all');

  const filteredAlerts = ALERT_DATA.filter(a => filter === 'all' || a.sev === filter);

  return (
    <div className="view-content fade-in">
      <div className="card w-full">
        <div className="card-header border-b">
          <h2 className="card-title">System Alerts Log</h2>
          <div className="flex gap-1" style={{marginTop: "1rem"}}>
            <button className={`btn ${filter==='all'?'btn-primary':'btn-secondary'}`} onClick={()=>setFilter('all')}>All Alerts</button>
            <button className={`btn ${filter==='critical'?'btn-primary':'btn-secondary'}`} onClick={()=>setFilter('critical')}>Critical</button>
            <button className={`btn ${filter==='warning'?'btn-primary':'btn-secondary'}`} onClick={()=>setFilter('warning')}>Warnings</button>
            <button className={`btn ${filter==='info'?'btn-primary':'btn-secondary'}`} onClick={()=>setFilter('info')}>Info</button>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {filteredAlerts.length > 0 ? filteredAlerts.map(alert => (
            <div key={alert.id} className={`alert-item ${alert.sev}`}>
              <div className="alert-item-header">
                <span className={`alert-badge ${alert.sev}`}>{alert.sev.toUpperCase()}</span>
                <strong>{alert.title}</strong>
                <span className="alert-time">{alert.time}</span>
              </div>
              <p className="alert-item-desc">{alert.desc}</p>
              <div className="alert-item-meta">
                <span>Asset: {alert.asset}</span>
                <span className={alert.acked ? "alert-acked" : "alert-unacked"}>
                  {alert.acked ? "Acked" : "Unacknowledged"}
                </span>
              </div>
            </div>
          )) : (
            <div className="p-4" style={{textAlign:"center", color:"#94a3b8"}}>No alerts match the selected filter.</div>
          )}
        </div>
      </div>
    </div>
  );
}
