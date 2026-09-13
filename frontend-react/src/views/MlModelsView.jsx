import React, { useState, useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { ML_MODELS } from '../data/mockData';
import '../components/charts/ChartConfig';

export default function MlModelsView() {
  const [activeModel, setActiveModel] = useState('lstm');
  const m = ML_MODELS[activeModel] || ML_MODELS.lstm;

  // Generate 24-hour confidence history for all models
  const confidenceChartData = useMemo(() => {
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
    const modelColors = {
      lstm: '#3b82f6',
      rf: '#10b981',
      xgb: '#f59e0b',
      cnn: '#a855f7'
    };

    const datasets = Object.entries(ML_MODELS).map(([key, model], idx) => {
      const baseAcc = model.accuracy / 100;
      const dataPoints = hours.map((_, hIdx) => {
        const wave = Math.sin(hIdx * 0.35 + idx * 1.5) * 0.025;
        const noise = (Math.sin(hIdx * 9.2 + idx * 3.7) * 0.015);
        return parseFloat((baseAcc + wave + noise).toFixed(3));
      });

      return {
        label: model.label,
        data: dataPoints,
        borderColor: modelColors[key] || '#3b82f6',
        backgroundColor: 'transparent',
        borderWidth: activeModel === key ? 2.5 : 1.5,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4
      };
    });

    return {
      labels: hours,
      datasets
    };
  }, [activeModel]);

  const confidenceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(14, 22, 40, 0.9)',
        titleColor: '#8b96aa',
        bodyColor: '#e8edf5',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        padding: 10,
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${(context.parsed.y * 100).toFixed(1)}%`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
        ticks: { color: '#4e5a6e', maxTicksLimit: 12, maxRotation: 0 }
      },
      y: {
        min: 0.8,
        max: 1.0,
        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
        ticks: {
          color: '#8b96aa',
          padding: 8,
          callback: (val) => `${(val * 100).toFixed(0)}%`
        }
      }
    }
  };

  const anomalyFillStyle = {
    width: `${m.anomalyScore * 100}%`,
    background:
      m.anomalyScore > 0.7
        ? 'linear-gradient(90deg, var(--rose), var(--purple))'
        : m.anomalyScore > 0.4
        ? 'linear-gradient(90deg, var(--amber), #f97316)'
        : 'linear-gradient(90deg, var(--green), var(--cyan))'
  };

  const rulFillClass = `rul-bar-fill${m.rul < 30 ? ' low' : m.rul < 60 ? ' medium' : ''}`;

  return (
    <>
      <div>
        <div className="page-title">🤖 ML Predictions</div>
        <div className="page-title-sub">Anomaly detection and remaining useful life estimation</div>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <div className="model-tabs" id="model-tabs">
          {Object.entries(ML_MODELS).map(([key, model]) => (
            <button
              key={key}
              className={`model-tab ${activeModel === key ? 'active' : ''}`}
              onClick={() => setActiveModel(key)}
            >
              {model.label}
            </button>
          ))}
        </div>

        <div className="model-results" id="model-results">
          <div className="model-metric">
            <div className="model-metric-label">Anomaly Score</div>
            <div
              className="model-metric-value"
              style={{
                color:
                  m.anomalyScore > 0.7
                    ? 'var(--rose)'
                    : m.anomalyScore > 0.4
                    ? 'var(--amber)'
                    : 'var(--green)'
              }}
            >
              {m.anomalyScore.toFixed(2)}
            </div>
            <div className="model-metric-sub">Threshold: 0.70</div>
          </div>

          <div className="model-metric">
            <div className="model-metric-label">RUL Estimate</div>
            <div className="model-metric-value" style={{ color: 'var(--cyan)' }}>
              {m.rul}%
            </div>
            <div className="model-metric-sub">~{m.rul * 4} operating hours</div>
          </div>

          <div className="model-metric">
            <div className="model-metric-label">F1 Score</div>
            <div className="model-metric-value" style={{ color: 'var(--accent)' }}>
              {m.f1.toFixed(1)}%
            </div>
            <div className="model-metric-sub">On validation set</div>
          </div>

          <div className="model-metric">
            <div className="model-metric-label">Inference Latency</div>
            <div className="model-metric-value" style={{ color: 'var(--purple)' }}>
              {m.latency}
            </div>
            <div className="model-metric-sub">Per batch (avg)</div>
          </div>
        </div>

        <div className="anomaly-bar-wrap">
          <div className="anomaly-bar-header">
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)' }}>
              Anomaly Score
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 700 }}>
              {m.anomalyScore.toFixed(2)} / 1.00
            </span>
          </div>
          <div className="anomaly-bar-track">
            <div className="anomaly-bar-fill" style={anomalyFillStyle}></div>
            <div className="anomaly-threshold" style={{ left: '70%' }}></div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px', color: 'var(--text-muted)' }}>
            <span>0</span>
            <span>Threshold: 0.70</span>
            <span>1.0</span>
          </div>
        </div>

        <div className="rul-bar-wrap">
          <div className="rul-bar-label">
            <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--text-muted)' }}>
              Remaining Useful Life
            </span>
            <strong>{m.rul}% — ~{m.rul * 4} operating hours</strong>
          </div>
          <div className="rul-bar-track">
            <div className={rulFillClass} style={{ width: `${m.rul}%` }}></div>
          </div>
        </div>

        <div className="fault-tags" id="fault-tags">
          {m.faults.map((f, i) => (
            <div key={i} className={`fault-tag ${f.state}`}>
              {f.state === 'active' ? '🔴' : f.state === 'warn' ? '⚠️' : '✅'} {f.label}
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-header">
          <div className="card-title">Model Confidence — Last 24 Hours</div>
        </div>
        <div className="chart-wrap" style={{ height: '220px' }}>
          <div className="chart-toolbar">
            <div className="chart-legend-item" onClick={() => setActiveModel('lstm')}>
              <div className="chart-legend-dot" style={{ background: '#3b82f6' }}></div>
              LSTM Autoencoder
            </div>
            <div className="chart-legend-item" onClick={() => setActiveModel('rf')}>
              <div className="chart-legend-dot" style={{ background: '#10b981' }}></div>
              Random Forest
            </div>
            <div className="chart-legend-item" onClick={() => setActiveModel('xgb')}>
              <div className="chart-legend-dot" style={{ background: '#f59e0b' }}></div>
              XGBoost
            </div>
            <div className="chart-legend-item" onClick={() => setActiveModel('cnn')}>
              <div className="chart-legend-dot" style={{ background: '#a855f7' }}></div>
              1D-CNN
            </div>
          </div>
          <Line options={confidenceChartOptions} data={confidenceChartData} />
        </div>
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-header" style={{ paddingBottom: '12px' }}>
          <div className="card-title">Model Performance Comparison</div>
        </div>
        <div className="card-body" style={{ paddingTop: 0 }}>
          <table className="sensor-table">
            <thead>
              <tr>
                <th>Model</th>
                <th>Accuracy</th>
                <th>Precision</th>
                <th>Recall</th>
                <th>F1</th>
                <th>Latency</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(ML_MODELS).map(([key, model]) => (
                <tr
                  key={key}
                  onClick={() => setActiveModel(key)}
                  style={{ cursor: 'pointer', background: key === activeModel ? 'rgba(59, 130, 246, 0.05)' : 'transparent' }}
                >
                  <td style={{ fontWeight: 600 }}>{model.label}</td>
                  <td className="mono">{model.accuracy.toFixed(1)}%</td>
                  <td className="mono">{model.precision.toFixed(1)}%</td>
                  <td className="mono">{model.recall.toFixed(1)}%</td>
                  <td className="mono">{model.f1.toFixed(1)}%</td>
                  <td className="mono">{model.latency}</td>
                  <td>
                    <span className={`badge ${key === activeModel ? 'blue' : 'green'}`}>
                      {key === activeModel ? 'Active' : 'Available'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
