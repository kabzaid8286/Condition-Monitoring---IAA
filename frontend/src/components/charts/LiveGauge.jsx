import React from 'react';
import ReactECharts from 'echarts-for-react';
import './Charts.css';

const LiveGauge = ({ 
  value = 0, 
  min = 0, 
  max = 100, 
  warningThreshold = 60, 
  criticalThreshold = 80, 
  unit = '%', 
  title = 'Sensor Value' 
}) => {
  const getGradientColor = () => {
    if (value >= criticalThreshold) return '#ef4444'; // Red
    if (value >= warningThreshold) return '#f59e0b'; // Amber
    return '#10b981'; // Green
  };

  const option = {
    backgroundColor: 'transparent',
    series: [
      {
        type: 'gauge',
        startAngle: 180,
        endAngle: 0,
        min: min,
        max: max,
        splitNumber: 5,
        itemStyle: {
          color: getGradientColor(),
          shadowColor: 'rgba(0,138,255,0.45)',
          shadowBlur: 10,
          shadowOffsetX: 2,
          shadowOffsetY: 2
        },
        progress: {
          show: true,
          roundCap: true,
          width: 12
        },
        pointer: {
          show: false
        },
        axisLine: {
          roundCap: true,
          lineStyle: {
            width: 12,
            color: [[1, '#2a3548']] // background track
          }
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        title: {
          show: true,
          offsetCenter: [0, '20%'],
          color: '#8b95a8',
          fontSize: 14,
          fontWeight: 500
        },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '-10%'],
          fontSize: 24,
          fontWeight: '700',
          color: '#e8edf5',
          formatter: `{value}${unit}`
        },
        data: [
          {
            value: Number(value).toFixed(1),
            name: title
          }
        ]
      }
    ]
  };

  return (
    <div className="chart-container gauge-container">
      <ReactECharts 
        option={option} 
        style={{ height: '180px', width: '100%' }} 
        opts={{ renderer: 'svg' }}
      />
    </div>
  );
};

export default LiveGauge;
