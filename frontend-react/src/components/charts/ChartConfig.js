import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export const commonOptions = {
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
      boxPadding: 4
    }
  },
  scales: {
    x: {
      grid: { color: 'rgba(255,255,255,0.03)', drawBorder: false },
      ticks: { color: '#4e5a6e', maxTicksLimit: 6, maxRotation: 0 }
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
      ticks: { color: '#8b96aa', padding: 8 }
    }
  }
};
