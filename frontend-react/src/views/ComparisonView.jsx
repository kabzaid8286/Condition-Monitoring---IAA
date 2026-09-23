import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { useAssets } from '../contexts/AssetContext';
import '../components/charts/ChartConfig';

export default function ComparisonView() {
  const { assets } = useAssets();
  // Generate comparative historical series for all assets
  const chartData = useMemo(() => {
    const timeLabels = Array.from({ length: 40 }, (_, i) => `${i * 2}m ago`).reverse();
    const assetColors = {
      'test-rig-a': '#3b82f6',
      'test-rig-b': '#10b981',
      'motor-01': '#f59e0b',
      'gearbox-02': '#f43f5e'
    };

    const datasets = Object.entries(assets).map(([key, a], ci) => {
      const data = Array.from({ length: 40 }, (_, i) => {
        const wave = Math.sin(i * 0.2 + ci * 1.5) * 0.35;
        const noise = (Math.sin(i * 4.3 + ci * 2.1) * 0.15);
        return parseFloat((a.basevib + wave + noise).toFixed(2));
      });

      return {
        label: a.name,
        data,
        borderColor: assetColors[key] || '#3b82f6',
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 0,
        pointHoverRadius: 4
      };
    });

    return {
      labels: timeLabels,
      datasets
    };
  }, []);

  const chartOptions = {
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
          label: (context) => ` ${context.dataset.label}: ${context.parsed.y.toFixed(2)} mm/s`
        }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
        ticks: { color: '#4e5a6e', maxTicksLimit: 8, maxRotation: 0 }
      },
      y: {
        min: 0,
        max: 10,
        grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
        ticks: {
          color: '#8b96aa',
          padding: 8,
          callback: (val) => `${val} mm/s`
        }
      }
    }
  };

  return (
    <>
      <div>
        <div className="page-title">⚖️ Asset Comparison</div>
        <div className="page-title-sub">Side-by-side live metrics for multiple machines</div>
      </div>

      <div className="comparison-grid" id="comparison-grid" style={{ marginTop: '20px' }}>
        {Object.entries(assets).map(([key, a]) => {
          const vib = a.basevib.toFixed(2);
          const temp = a.basetemp.toFixed(1);
          const rpm = Math.round(a.baserpm);
          const sc = key === 'test-rig-a' ? '0.23' : key === 'gearbox-02' ? '0.38' : '0.14';
          const vp = Math.min(100, (parseFloat(vib) / 15) * 100);
          const tp = Math.min(100, ((parseFloat(temp) - 20) / 80) * 100);
          const rp = Math.min(100, (rpm / 3000) * 100);
          const isCaution = parseFloat(vib) > 4;
          const sColor = isCaution ? 'var(--amber)' : 'var(--green)';
          const sText = isCaution ? 'Caution' : 'Nominal';

          return (
            <div key={key} className="card comparison-card">
              <div className="comparison-asset-name">
                🏭 {a.name}
                <span
                  className="badge"
                  style={{
                    color: sColor,
                    borderColor: sColor,
                    background: 'transparent',
                    marginLeft: '8px'
                  }}
                >
                  {sText}
                </span>
              </div>

              <div className="comparison-metric-row">
                <div>
                  <div className="comparison-metric-name">Vibration RMS</div>
                  <div className="comparison-metric-bar-wrap">
                    <div className="comparison-metric-bar" style={{ width: `${vp}%`, background: 'var(--accent)' }}></div>
                  </div>
                </div>
                <div className="comparison-metric-value" style={{ color: 'var(--accent)' }}>
                  {vib} mm/s
                </div>
              </div>

              <div className="comparison-metric-row">
                <div>
                  <div className="comparison-metric-name">Temperature</div>
                  <div className="comparison-metric-bar-wrap">
                    <div className="comparison-metric-bar" style={{ width: `${tp}%`, background: 'var(--green)' }}></div>
                  </div>
                </div>
                <div className="comparison-metric-value" style={{ color: 'var(--green)' }}>
                  {temp} °C
                </div>
              </div>

              <div className="comparison-metric-row">
                <div>
                  <div className="comparison-metric-name">Shaft Speed</div>
                  <div className="comparison-metric-bar-wrap">
                    <div className="comparison-metric-bar" style={{ width: `${rp}%`, background: 'var(--amber)' }}></div>
                  </div>
                </div>
                <div className="comparison-metric-value" style={{ color: 'var(--amber)' }}>
                  {rpm} RPM
                </div>
              </div>

              <div className="comparison-metric-row">
                <div className="comparison-metric-name">Anomaly Score</div>
                <div className="comparison-metric-value">{sc}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: '16px' }}>
        <div className="card-header">
          <div className="card-title">Comparative Vibration Trend — All Assets</div>
        </div>
        <div className="chart-wrap" style={{ height: '240px' }}>
          <div className="chart-toolbar">
            <div className="chart-legend-item">
              <div className="chart-legend-dot" style={{ background: '#3b82f6' }}></div>
              Test Rig A
            </div>
            <div className="chart-legend-item">
              <div className="chart-legend-dot" style={{ background: '#10b981' }}></div>
              Test Rig B
            </div>
            <div className="chart-legend-item">
              <div className="chart-legend-dot" style={{ background: '#f59e0b' }}></div>
              Motor 01
            </div>
            <div className="chart-legend-item">
              <div className="chart-legend-dot" style={{ background: '#f43f5e' }}></div>
              Gearbox 02
            </div>
          </div>
          <Line options={chartOptions} data={chartData} />
        </div>
      </div>
    </>
  );
}
