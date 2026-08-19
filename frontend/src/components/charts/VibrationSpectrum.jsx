import React from 'react';
import ReactECharts from 'echarts-for-react';

const VibrationSpectrum = ({ data = [], title = 'Frequency Spectrum', height = '300px' }) => {
  const option = {
    backgroundColor: 'transparent',
    title: {
      text: title,
      textStyle: { color: '#8b95a8', fontSize: 14, fontWeight: 500 },
      left: 'center',
      top: 0
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#1a2235',
      borderColor: '#2a3548',
      textStyle: { color: '#e8edf5' },
    },
    grid: {
      top: '15%',
      left: '3%',
      right: '4%',
      bottom: '5%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      name: 'Frequency (Hz)',
      nameLocation: 'middle',
      nameGap: 25,
      nameTextStyle: { color: '#8b95a8' },
      data: data.map(d => d.frequency),
      axisLabel: { color: '#8b95a8' },
      axisLine: { lineStyle: { color: '#2a3548' } }
    },
    yAxis: {
      type: 'value',
      name: 'Amplitude (mm/s)',
      nameTextStyle: { color: '#8b95a8' },
      axisLabel: { color: '#8b95a8' },
      splitLine: { lineStyle: { color: '#1a2235' } }
    },
    dataZoom: [{ type: 'inside' }],
    series: [
      {
        type: 'bar',
        data: data.map(d => d.amplitude),
        itemStyle: {
          color: '#6366f1'
        },
        barWidth: '40%'
      }
    ]
  };

  return (
    <div className="chart-container">
      <ReactECharts option={option} style={{ height, width: '100%' }} />
    </div>
  );
};

export default VibrationSpectrum;
