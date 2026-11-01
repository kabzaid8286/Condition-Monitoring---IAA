/**
 * Condition Monitoring App (IAA / HS Aalen)
 * System Configuration & Default Active Sensors Store
 * 
 * Note: All mock sensor data, synthetic sine waveforms, and fake alerts have been purged.
 * Sensor telemetry is sourced exclusively from the physical Seeed Studio XIAO hardware
 * or live Raspberry Pi 5 MQTT gateway. When hardware is disconnected, all live dials,
 * feeds, and FFT spectra strictly drop to 0.00 / standby.
 */

export const ASSETS = {
  'test-rig-a': { 
    name: 'Test Rig A', 
    label: 'Drive Train / Test Rig', 
    basevib: 0, 
    basetemp: 0, 
    baserpm: 0 
  },
};

export const ML_MODELS = {
  lstm: {
    label: 'LSTM Autoencoder', 
    accuracy: 94.2, 
    precision: 92.8, 
    recall: 95.1, 
    f1: 93.9, 
    latency: '24ms', 
    anomalyScore: 0.00, 
    rul: null,
    faults: [
      { label: 'Imbalance (1X)', state: 'none' },
      { label: 'Shaft Misalignment', state: 'none' },
      { label: 'Bearing Defect (BPFO)', state: 'none' },
      { label: 'Mechanical Looseness', state: 'none' }
    ]
  },
  rf: {
    label: 'Random Forest', 
    accuracy: 91.7, 
    precision: 90.4, 
    recall: 92.3, 
    f1: 91.3, 
    latency: '8ms', 
    anomalyScore: 0.00, 
    rul: null,
    faults: [
      { label: 'Imbalance (1X)', state: 'none' },
      { label: 'Shaft Misalignment', state: 'none' },
      { label: 'Bearing Defect (BPFO)', state: 'none' },
      { label: 'Mechanical Looseness', state: 'none' }
    ]
  },
  xgb: {
    label: 'XGBoost', 
    accuracy: 93.1, 
    precision: 91.9, 
    recall: 94.0, 
    f1: 92.9, 
    latency: '12ms', 
    anomalyScore: 0.00, 
    rul: null,
    faults: [
      { label: 'Imbalance (1X)', state: 'none' },
      { label: 'Shaft Misalignment', state: 'none' },
      { label: 'Bearing Defect (BPFO)', state: 'none' },
      { label: 'Mechanical Looseness', state: 'none' }
    ]
  },
  cnn: {
    label: '1D-CNN', 
    accuracy: 95.6, 
    precision: 94.3, 
    recall: 96.1, 
    f1: 95.2, 
    latency: '42ms', 
    anomalyScore: 0.00, 
    rul: null,
    faults: [
      { label: 'Imbalance (1X)', state: 'none' },
      { label: 'Shaft Misalignment', state: 'none' },
      { label: 'Bearing Defect (BPFO)', state: 'none' },
      { label: 'Mechanical Looseness', state: 'none' }
    ]
  },
};

// Pure empty alerts store: populated only by real hardware threshold exceedance
export const ALERT_DATA = [];

// Pure empty anomaly events timeline: populated only by real ML inference detections
export const ANOMALY_EVENTS = [];

// AI diagnostic assistant guidance
export const AI_ANSWERS = {
  health: 'Health diagnostic report is dynamically generated from active hardware telemetry.',
  anomaly: 'Anomaly diagnosis requires live signal acquisition from the physical sensor node.',
  rul: 'Remaining useful life is computed in real time from live degradation metrics.',
  maintenance: 'Maintenance schedules update automatically based on operational vibration levels.',
  compare: 'Asset comparison is computed across active registered nodes.'
};
