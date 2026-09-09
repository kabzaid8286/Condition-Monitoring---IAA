import React, { useState } from 'react';
import { ML_MODELS } from '../data/mockData';

export default function MlModelsView({ data }) {
  const [activeModel, setActiveModel] = useState('lstm');
  const modelData = ML_MODELS[activeModel];
  return (
    <>
      <div className="page-title">🧠 ML Predictions</div>
      <div className="page-title-sub">AI-driven anomaly detection and Remaining Useful Life (RUL)</div>

      <div className="card">
        <div className="card-header" style={{ paddingBottom: "16px" }}>
          <div className="card-title">Ensemble Model Selection</div>
        </div>
        <div className="model-tabs" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {Object.entries(ML_MODELS).map(([key, m]) => (
            <button 
              key={key} 
              className={`time-btn ${activeModel === key ? 'active' : ''}`}
              onClick={() => setActiveModel(key)}
              style={activeModel === key ? { background: "var(--primary)", borderColor: "var(--primary)", color: "#fff" } : {}}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: "20px" }}>
        <div className="card">
          <div className="card-header border-b">
            <h2 className="card-title">Current Fault Signatures</h2>
          </div>
          <div className="card-body">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              {modelData.faults.map((f, i) => (
                <div key={i} style={{ background: "var(--bg-glass)", padding: "10px", borderRadius: "6px", display: "flex", justifyContent: "space-between" }}>
                  <span>{f.label}</span>
                  <span style={{
                    color: f.state === 'active' ? 'var(--rose)' : f.state === 'warn' ? 'var(--amber)' : 'var(--emerald)',
                    fontWeight: 600
                  }}>
                    {f.state === 'active' ? 'Detected' : f.state === 'warn' ? 'Warning' : 'Normal'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header border-b">
            <h2 className="card-title">Prognostics</h2>
          </div>
          <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ color: "var(--text-muted)" }}>Current Anomaly Score</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: modelData.anomalyScore > 0.5 ? 'var(--rose)' : 'var(--emerald)' }}>
                {modelData.anomalyScore.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Threshold: 0.75</span>
                <span style={{ fontSize: "12px" }}>{(modelData.anomalyScore * 100).toFixed(0)}%</span>
              </div>
              <div style={{ width: "100%", background: "#334155", height: "8px", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ width: `${modelData.anomalyScore * 100}%`, background: modelData.anomalyScore > 0.5 ? 'var(--rose)' : 'var(--primary)', height: "100%" }}></div>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", padding: "10px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: "6px" }}>
              <div style={{ color: "var(--emerald)" }}>Est. Remaining Useful Life</div>
              <div style={{ fontSize: "18px", fontWeight: "bold", color: "var(--emerald)" }}>{modelData.rul} h</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
