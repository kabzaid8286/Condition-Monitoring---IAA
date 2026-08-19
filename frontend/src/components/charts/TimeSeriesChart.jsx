import React from 'react';
import ReactECharts from 'echarts-for-react';
import dayjs from 'dayjs';

const TimeSeriesChart = ({ 
  data = [], 
  title = '', 
  unit = '', 
  warningThreshold, 
  criticalThreshold,
  color = '#3b82f6',
  height = '300px'
}) => {
  const option = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1a2235',
      borderColor: '#2a3548',
      textStyle: { color: '#e8edf5' },
      formatter: function (params) {
        let result = `<div style="font-weight:600;margin-bottom:4px;">${dayjs(params[0].axisValue).format('YYYY-MM-DD HH:mm:ss')}</div>`;
        params.forEach(param => {
          result += `${param.marker} ${param.seriesName}: <span style="font-weight:bold">${Number(param.value).toFixed(2)}</span> ${unit}<br/>`;
        });
        return result;
      }
    },
    grid: {
      top: '15%',
      left: '3%',
      right: '4%',
      bottom: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.map(item => item.time),
      axisLabel: {
        color: '#8b95a8',
        formatter: (val) => dayjs(val).format('HH:mm')
      },
      axisLine: { lineStyle: { color: '#2a3548' } },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: unit,
      nameTextStyle: { color: '#8b95a8' },
      axisLabel: { color: '#8b95a8' },
      splitLine: { 
        lineStyle: { color: '#1a2235', type: 'dashed' } 
      }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100,
        height: 15,
        bottom: 5,
        borderColor: '#2a3548',
        textStyle: { color: '#8b95a8' },
        fillerColor: 'rgba(59,130,246,0.2)',
      }
    ],
    series: [
      {
        name: title || 'Value',
        type: 'line',
        smooth: true,
        symbol: 'none',
        lineStyle: {
          width: 2,
          color: color
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: `${color}66` },
              { offset: 1, color: `${color}00` }
            ]
          }
        },
        data: data.map(item => item.value),
        markLine: {
          symbol: ['none', 'none'],
          label: { position: 'end', color: '#8b95a8' },
          data: [
            ...(warningThreshold ? [{ yAxis: warningThreshold, lineStyle: { color: '#f59e0b', type: 'dashed' }, label: { formatter: 'Warning' } }] : []),
            ...(criticalThreshold ? [{ yAxis: criticalThreshold, lineStyle: { color: '#ef4444', type: 'dashed' }, label: { formatter: 'Critical' } }] : [])
          ]
        }
      }
    ]
  };

  return (
    <div className="chart-container">
      <ReactECharts 
        option={option} 
        style={{ height, width: '100%' }} 
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
};

export default TimeSeriesChart;
