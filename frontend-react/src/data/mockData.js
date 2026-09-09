export const ASSETS = {
  'test-rig-a': { name: 'Test Rig A', label: 'Drive Train', basevib: 3.4, basetemp: 62, baserpm: 1482 },
  'test-rig-b': { name: 'Test Rig B', label: 'Bearing Unit', basevib: 2.1, basetemp: 55, baserpm: 1200 },
  'motor-01': { name: 'Motor 01', label: 'Induction 15 kW', basevib: 1.8, basetemp: 70, baserpm: 2950 },
  'gearbox-02': { name: 'Gearbox 02', label: 'Helical Stage', basevib: 4.9, basetemp: 75, baserpm: 960 },
};

export const ML_MODELS = {
  lstm: {
    label: 'LSTM Autoencoder', accuracy: 94.2, precision: 92.8, recall: 95.1, f1: 93.9, latency: '28ms', anomalyScore: 0.23, rul: 78,
    faults: [{ label: 'Imbalance', state: 'none' }, { label: 'Misalignment', state: 'none' }, { label: 'Bearing Defect', state: 'warn' }, { label: 'Looseness', state: 'none' }]
  },
  rf: {
    label: 'Random Forest', accuracy: 91.7, precision: 90.4, recall: 92.3, f1: 91.3, latency: '8ms', anomalyScore: 0.31, rul: 74,
    faults: [{ label: 'Imbalance', state: 'none' }, { label: 'Misalignment', state: 'warn' }, { label: 'Bearing Defect', state: 'warn' }, { label: 'Looseness', state: 'none' }]
  },
  xgb: {
    label: 'XGBoost', accuracy: 93.1, precision: 91.9, recall: 94.0, f1: 92.9, latency: '12ms', anomalyScore: 0.28, rul: 76,
    faults: [{ label: 'Imbalance', state: 'none' }, { label: 'Misalignment', state: 'none' }, { label: 'Bearing Defect', state: 'active' }, { label: 'Looseness', state: 'none' }]
  },
  cnn: {
    label: '1D-CNN', accuracy: 95.6, precision: 94.3, recall: 96.1, f1: 95.2, latency: '45ms', anomalyScore: 0.19, rul: 81,
    faults: [{ label: 'Imbalance', state: 'none' }, { label: 'Misalignment', state: 'none' }, { label: 'Bearing Defect', state: 'none' }, { label: 'Looseness', state: 'none' }]
  },
};

export const ALERT_DATA = [
  { id: 1, sev: 'critical', title: 'High Vibration — Drive End', desc: 'Vibration RMS exceeded 8.0 mm/s. Bearing defect suspected.', asset: 'test-rig-a', time: '2026-08-17 23:21:04', acked: false },
  { id: 2, sev: 'warning', title: 'Bearing Temperature Rising', desc: 'DE Bearing temp trending +2.3 °C over 30 min.', asset: 'test-rig-a', time: '2026-08-17 22:58:11', acked: false },
  { id: 3, sev: 'warning', title: 'RPM Fluctuation Detected', desc: 'Shaft speed variance ±18 RPM above ±5 RPM tolerance.', asset: 'motor-01', time: '2026-08-17 22:40:33', acked: false },
  { id: 4, sev: 'info', title: 'Scheduled Maintenance Due', desc: 'Lubricant change interval (500 h) reached — Gearbox 02.', asset: 'gearbox-02', time: '2026-08-17 21:00:00', acked: false },
  { id: 5, sev: 'info', title: 'ML Model Retrained', desc: 'LSTM retrained on latest 7-day data. F1: 0.93 → 0.94.', asset: 'all', time: '2026-08-17 20:00:00', acked: true },
];

export const ANOMALY_EVENTS = [
  { ts: '2026-08-17 23:21', sev: 'critical', msg: 'Vibration spike (12.4 mm/s) — possible outer race defect', model: 'XGBoost + LSTM' },
  { ts: '2026-08-17 22:58', sev: 'warning', msg: 'Bearing temp 64.2 °C (+2.3 °C drift over 30 min)', model: 'Threshold rule' },
  { ts: '2026-08-17 18:35', sev: 'warning', msg: 'Anomaly score 0.68 — approaching alert threshold', model: 'LSTM Autoencoder' },
  { ts: '2026-08-16 09:12', sev: 'info', msg: 'Mild imbalance signature in FFT at 24.7 Hz', model: '1D-CNN' },
  { ts: '2026-08-14 14:52', sev: 'info', msg: 'Motor temperature 71.8 °C — within limits, noted', model: 'Threshold rule' },
];

export const AI_ANSWERS = {
  health: `📊 **Current Health — Test Rig A**\n\nOverall status: **Caution ⚠️**\n\n• **Vibration RMS**: 3.42 mm/s — within normal range but trending upward.\n• **Bearing Temp**: 62.1 °C — elevated; monitor for rise above 70 °C.\n• **Shaft Speed**: 1,482 RPM — stable within ±5 RPM.\n• **Anomaly Score**: 0.23 — low risk; early bearing-defect signature detected.\n\n**Recommendation**: Schedule inspection of the drive-end bearing within the next 50 operating hours.`,
  anomaly: `〰️ **Latest Vibration Anomaly Explained**\n\nAt **23:21 UTC** the drive-end accelerometer recorded a peak of **12.4 mm/s RMS**, exceeding the 8.0 mm/s threshold.\n\n**Root cause (XGBoost + LSTM consensus)**:\n• Outer race bearing defect — BPFO frequency elevated +6.2 dB at 87.4 Hz.\n• Pattern consistent with early-stage spalling on outer raceway.\n• Score returned to baseline within 4 minutes — intermittent contact.`,
  rul: `⏳ **Remaining Useful Life — Drive-End Bearing**\n\n| Model | RUL | Confidence |\n|---|---|---|\n| LSTM Autoencoder | 312 h (78%) | High |\n| Random Forest | 296 h (74%) | Medium |\n| XGBoost | 304 h (76%) | High |\n| 1D-CNN | 324 h (81%) | High |\n\n**Ensemble estimate**: ~310 operating hours.\nAt current utilisation (8 h/day) → approx. **39 working days** before bearing replacement.`,
  maintenance: `🔧 **Maintenance Recommendations**\n\n**Priority 1 — Urgent (within 50 h)**\n• Inspect drive-end bearing for spalling on outer race.\n• Check and replenish lubricant if degraded.\n\n**Priority 2 — Planned (within 200 h)**\n• Re-align shaft coupling — mild misalignment signature detected.\n• Replace sensor ACC_DE_X — slight gain drift noted.\n\n**Priority 3 — Routine**\n• Gearbox 02 lubricant change (500-hour interval reached).\n• Verify motor phase-current balance weekly.`,
  compare: `⚖️ **Asset Comparison — Test Rig A vs Motor 01**\n\n| Metric | Test Rig A | Motor 01 |\n|---|---|---|\n| Vibration RMS | 3.42 mm/s ⚠️ | 1.82 mm/s ✅ |\n| Temperature | 62.1 °C ⚠️ | 70.3 °C ⚠️ |\n| RPM stability | ±3 RPM ✅ | ±18 RPM ⚠️ |\n| Anomaly score | 0.23 Low | 0.41 Medium |\n| Active alerts | 2 | 1 |\n\n**Motor 01** shows higher-than-expected RPM variance — investigate drive inverter or mechanical coupling.`,
};
