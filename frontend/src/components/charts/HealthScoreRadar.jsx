import React from 'react';
import ReactECharts from 'echarts-for-react';

const HealthScoreRadar = ({ scores = {}, title = 'System Health Breakdown', height = '300px' }) => {
  // Default metrics if empty
  const defaultScores = {
    Vibration: 100,
    Temperature: 100,
    Pressure: 100,
    Acoustic: 100,
    Current: 100
  };

  const actualScores = Object.keys(scores).length > 0 ? scores : defaultScores;
  const indicators = Object.keys(actualScores).map(key => ({ name: key, max: 100 }));
  const values = Object.values(actualScores);

  const averageScore = values.reduce((a, b) => a + b, 0) / values.length;
  
  const getColor = (score) => {
    if (score >= 80) return '#10b981'; // Green
    if (score >= 50) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const mainColor = getColor(averageScore);

  const option = {
    backgroundColor: 'transparent',
    title: {
      text: title,
      textStyle: { color: '#8b95a8', fontSize: 14, fontWeight: 500 },
      left: 'center',
      top: 0
    },
    tooltip: {
      trigger: 'item',
      backgroundColor: '#1a2235',
      borderColor: '#2a3548',
      textStyle: { color: '#e8edf5' }
    },
    radar: {
      indicator: indicators,
      shape: 'polygon',
      splitNumber: 4,
      axisName: {
        color: '#e8edf5'
      },
      splitLine: {
        lineStyle: {
          color: [
            'rgba(42, 53, 72, 0.2)', 'rgba(42, 53, 72, 0.4)',
            'rgba(42, 53, 72, 0.6)', 'rgba(42, 53, 72, 0.8)',
            'rgba(42, 53, 72, 1)'
          ].reverse()
        }
      },
      splitArea: {
        show: false
      },
      axisLine: {
        lineStyle: {
          color: 'rgba(42, 53, 72, 0.5)'
        }
      }
    },
    series: [
      {
        name: 'Health Score',
        type: 'radar',
        data: [
          {
            value: values,
            name: 'Current State',
            symbol: 'circle',
            symbolSize: 6,
            itemStyle: { color: mainColor },
            areaStyle: {
              color: `${mainColor}44` // 44 is hex alpha for ~25%
            },
            lineStyle: { width: 2, color: mainColor }
          }
        ]
      }
    ]
  };

  return (
    <div className="chart-container">
      <ReactECharts option={option} style={{ height, width: '100%' }} />
    </div>
  );
};

export default HealthScoreRadar;
