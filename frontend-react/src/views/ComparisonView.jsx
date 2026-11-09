import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { useAssets } from '../contexts/AssetContext';
import '../components/charts/ChartConfig';

export default function ComparisonView({ data: activeData = {}, isConnected = false, activeAsset = '' }) {
  const { assets } = useAssets();

  const palette = ['#3b82f6', '#10b981', '#f59e0b', '#f43f5e', '#a855f7', '#06b6d4'];
  const assetColors = {};
  Object.keys(assets).forEach((key, idx) => {
    assetColors[key] = palette[idx % palette.length];
  });

  // Helper to retrieve recorded historical points for an asset or zeros
  const getAssetReadings = (key, count = 20) => {
    if (key === activeAsset && isConnected && activeData?.vibX?.length > 0) {
      return activeData;
    }

    try {
      const saved = localStorage.getItem(`recorded_telemetry_${key}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.vibX) && parsed.vibX.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      // ignore
    }

    // Zero / standby fallback
    return {
      labels: Array.from({ length: count }, (_, i) => `${(count - i) * 2}m ago`),
      vibX: Array.from({ length: count }, () => '0.00'),
      temp: Array.from({ length: count }, () => '0.0'),
      rpm: Array.from({ length: count }, () => 0)
    };
  };

  // Generate comparative historical series for all assets using real recorded data or zero
  const chartData = useMemo(() => {
    const timeLabels = Array.from({ length: 20 }, (_, i) => `${(20 - i) * 2}m ago`);

    const datasets = Object.entries(assets).map(([key, a]) => {
      const readings = getAssetReadings(key, 20);
      const points = (readings?.vibX || []).slice(-20).map(v => parseFloat(v || 0));
      while (points.length < 20) {
        points.unshift(0.00);
      }

      return {
        label: a.name,
        data: points,
        borderColor: assetColors[key] || '#8b5cf6',
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
  }, [assets, activeData, isConnected, activeAsset]);

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
        <div className="page-title">Asset Comparison</div>
        <div className="page-title-sub">Side-by-side metrics across active, recorded, and standby sensor nodes</div>
      </div>

      <div className="comparison-grid" id="comparison-grid" style={{ marginTop: '20px' }}>
        {Object.entries(assets).map(([key, a]) => {
          const readings = getAssetReadings(key);
          const hasData = readings && readings.vibX && readings.vibX.length > 0;
          const isThisActive = key === activeAsset && isConnected;

          const rawVib = isThisActive 
            ? parseFloat(readings.vibX[readings.vibX.length - 1] || 0)
            : hasData ? parseFloat(readings.vibX[readings.vibX.length - 1] || 0) : 0;
          
          const rawTemp = isThisActive 
            ? parseFloat(readings.temp[readings.temp.length - 1] || 0)
            : hasData ? parseFloat(readings.temp[readings.temp.length - 1] || 0) : 0;

          const rawRpm = isThisActive 
            ? Math.round(parseFloat(readings.rpm[readings.rpm.length - 1] || 0))
            : hasData ? Math.round(parseFloat(readings.rpm[readings.rpm.length - 1] || 0)) : 0;

          const vib = rawVib.toFixed(2);
          const temp = rawTemp.toFixed(1);
          const rpm = rawRpm;
          const sc = (rawVib / 10).toFixed(2);
          const vp = Math.min(100, Math.max(0, (rawVib / 15) * 100));
          const tp = Math.min(100, Math.max(0, ((rawTemp - 20) / 80) * 100));
          const rp = Math.min(100, Math.max(0, (rpm / 3000) * 100));

          const sColor = isThisActive 
            ? (rawVib > 4 ? 'var(--amber)' : 'var(--green)') 
            : 'var(--text-muted)';
          const sText = isThisActive 
            ? (rawVib > 4 ? 'Caution' : 'Live Nominal') 
            : (rawVib > 0 ? 'Recorded Session' : 'Standby (0 Telemetry)');

          return (
            <div key={key} className="card comparison-card">
              <div className="comparison-asset-name">
                {a.name}
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
            {Object.entries(assets).map(([key, a]) => {
              const color = assetColors[key] || '#8b5cf6';
              return (
                <div key={key} className="chart-legend-item">
                  <div className="chart-legend-dot" style={{ background: color }}></div>
                  {a.name}
                </div>
              );
            })}
          </div>
          <Line options={chartOptions} data={chartData} />
        </div>
      </div>
    </>
  );
}
