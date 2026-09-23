import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { useAssets } from '../contexts/AssetContext';
import '../components/charts/ChartConfig';

export default function AnalysisView({ data, activeAsset }) {
  const { assets } = useAssets();
  const asset = assets[activeAsset] || assets['test-rig-a'];

  const stats = useMemo(() => {
    if (!data || !data.vibX) return null;

    const calcStats = (arr) => {
      const nums = arr.map(Number);
      const mean = nums.reduce((a, b) => a + b, 0) / nums.length;
      const min = Math.min(...nums);
      const max = Math.max(...nums);
      const stdDev = Math.sqrt(nums.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b, 0) / nums.length);
      return { mean: mean.toFixed(2), min: min.toFixed(2), max: max.toFixed(2), std: stdDev.toFixed(2) };
    };

    return {
      vibX: calcStats(data.vibX),
      vibY: calcStats(data.vibY),
      vibZ: calcStats(data.vibZ),
      temp: calcStats(data.temp),
      rpm: calcStats(data.rpm)
    };
  }, [data]);

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,
    plugins: {
      legend: { position: 'top', labels: { color: 'rgba(255, 255, 255, 0.7)' } }
    },
    scales: {
      x: { 
        display: false, 
        grid: { color: 'rgba(255, 255, 255, 0.1)' } 
      },
      y: { 
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
        ticks: { color: 'rgba(255, 255, 255, 0.7)' }
      }
    }
  };

  const vibData = {
    labels: data?.labels || [],
    datasets: [
      { label: 'Vibration X', data: data?.vibX || [], borderColor: '#3b82f6', tension: 0.4 },
      { label: 'Vibration Y', data: data?.vibY || [], borderColor: '#10b981', tension: 0.4 },
      { label: 'Vibration Z', data: data?.vibZ || [], borderColor: '#f59e0b', tension: 0.4 }
    ]
  };

  const tempData = {
    labels: data?.labels || [],
    datasets: [
      { label: 'Temperature (°C)', data: data?.temp || [], borderColor: '#f43f5e', tension: 0.4 }
    ]
  };

  const rpmData = {
    labels: data?.labels || [],
    datasets: [
      { label: 'Rotation Speed (RPM)', data: data?.rpm || [], borderColor: '#8b5cf6', tension: 0.4 }
    ]
  };

  return (
    <>
      <div>
        <div className="page-title">📈 Extended Analysis</div>
        <div className="page-title-sub">Deep-dive statistical analysis and multi-axis visualization for {asset.name}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginTop: '20px' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Vibration Over Time (X, Y, Z Axis)</h3>
          </div>
          <div className="card-body" style={{ height: '300px' }}>
            <Line options={commonOptions} data={vibData} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Temperature Over Time</h3>
            </div>
            <div className="card-body" style={{ height: '250px' }}>
              <Line options={commonOptions} data={tempData} />
            </div>
          </div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Load &amp; Speed Over Time</h3>
            </div>
            <div className="card-body" style={{ height: '250px' }}>
              <Line options={commonOptions} data={rpmData} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Live Statistical Analysis (Rolling 10m Window)</h3>
          </div>
          <div className="card-body" style={{ overflowX: 'auto' }}>
            {stats && (
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                    <th style={{ padding: '12px' }}>Metric</th>
                    <th style={{ padding: '12px' }}>Current Mean</th>
                    <th style={{ padding: '12px' }}>Minimum</th>
                    <th style={{ padding: '12px' }}>Peak (Max)</th>
                    <th style={{ padding: '12px' }}>Std Deviation (σ)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>Vibration X</td>
                    <td style={{ padding: '12px' }}>{stats.vibX.mean}</td>
                    <td style={{ padding: '12px' }}>{stats.vibX.min}</td>
                    <td style={{ padding: '12px' }}>{stats.vibX.max}</td>
                    <td style={{ padding: '12px' }}>{stats.vibX.std}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>Vibration Y</td>
                    <td style={{ padding: '12px' }}>{stats.vibY.mean}</td>
                    <td style={{ padding: '12px' }}>{stats.vibY.min}</td>
                    <td style={{ padding: '12px' }}>{stats.vibY.max}</td>
                    <td style={{ padding: '12px' }}>{stats.vibY.std}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>Vibration Z</td>
                    <td style={{ padding: '12px' }}>{stats.vibZ.mean}</td>
                    <td style={{ padding: '12px' }}>{stats.vibZ.min}</td>
                    <td style={{ padding: '12px' }}>{stats.vibZ.max}</td>
                    <td style={{ padding: '12px' }}>{stats.vibZ.std}</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px', fontWeight: 600 }}>Temperature</td>
                    <td style={{ padding: '12px' }}>{stats.temp.mean}</td>
                    <td style={{ padding: '12px' }}>{stats.temp.min}</td>
                    <td style={{ padding: '12px' }}>{stats.temp.max}</td>
                    <td style={{ padding: '12px' }}>{stats.temp.std}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '12px', fontWeight: 600 }}>RPM</td>
                    <td style={{ padding: '12px' }}>{stats.rpm.mean}</td>
                    <td style={{ padding: '12px' }}>{stats.rpm.min}</td>
                    <td style={{ padding: '12px' }}>{stats.rpm.max}</td>
                    <td style={{ padding: '12px' }}>{stats.rpm.std}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
