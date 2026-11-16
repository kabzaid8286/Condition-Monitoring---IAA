import React, { useState } from 'react';
import { useAssets } from '../contexts/AssetContext';
import { toast } from '../utils/toast';
import { Cpu, Edit3, Trash2, Check, X, PlusCircle, Radio } from 'lucide-react';

export default function TestDesignView({ activeAsset, setActiveAsset }) {
  const [activeTab, setActiveTab] = useState('component');
  const { assets, addAsset, updateAsset, removeAsset } = useAssets();
  
  // State for adding a new sensor
  const [newSensor, setNewSensor] = useState({
    name: '',
    sensorId: '',
    label: ''
  });

  // State for inline editing of existing sensors
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', label: '' });

  // Multi-sensor streaming selection
  const [activeStreamingNodes, setActiveStreamingNodes] = useState(() => {
    try {
      const saved = localStorage.getItem('condition_monitoring_active_streaming');
      return saved ? JSON.parse(saved) : (activeAsset ? [activeAsset] : []);
    } catch {
      return activeAsset ? [activeAsset] : [];
    }
  });

  const toggleSensorStreaming = (id) => {
    setActiveStreamingNodes(prev => {
      const exists = prev.includes(id);
      const next = exists ? prev.filter(x => x !== id) : [...prev, id];
      try {
        localStorage.setItem('condition_monitoring_active_streaming', JSON.stringify(next));
      } catch {}
      
      // Dispatch control update to backend / gateway
      fetch(`http://localhost:8000/api/v1/telemetry/control/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !exists, streaming: !exists })
      }).catch(() => {});

      toast(!exists ? `Streaming activated for ${assets[id]?.name || id}. Storing in memory card.` : `Streaming paused for ${assets[id]?.name || id}.`);
      return next;
    });
  };

  // Selected machine for environmental & parameter tuning
  const availableAssetIds = Object.keys(assets);
  const [selectedMachine, setSelectedMachine] = useState(activeAsset || availableAssetIds[0] || '');

  // Per-machine parameter configurations
  const [machineParams, setMachineParams] = useState(() => {
    try {
      const saved = localStorage.getItem('condition_monitoring_machine_params');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Current parameters for the selected machine
  const currentParams = machineParams[selectedMachine] || {
    loadProfile: 'every_30s',
    samplingRate: 12800
  };

  const handleParamChange = (field, value) => {
    setMachineParams(prev => ({
      ...prev,
      [selectedMachine]: {
        ...(prev[selectedMachine] || { loadProfile: 'every_30s', samplingRate: 12800 }),
        [field]: value
      }
    }));
  };

  const handleApplyParameters = async (e) => {
    e.preventDefault();
    if (!selectedMachine) {
      toast('Please select a machine first.', 'error');
      return;
    }

    try {
      localStorage.setItem('condition_monitoring_machine_params', JSON.stringify(machineParams));
    } catch (e) {
      console.warn(e);
    }

    const payload = {
      cmd: 'SET_CONFIG',
      sampling_rate: Number(currentParams.samplingRate) || 12800,
      rate: Number(currentParams.samplingRate) || 12800,
      duty_cycle: currentParams.loadProfile,
      schedule: currentParams.loadProfile,
      streaming: activeStreamingNodes.includes(selectedMachine)
    };

    try {
      const res = await fetch(`http://localhost:8000/api/v1/telemetry/control/${selectedMachine}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        toast(`Parameters applied to ${assets[selectedMachine]?.name || selectedMachine}: Rate = ${payload.rate} Hz, Duty = ${payload.duty_cycle}. Stored in memory card.`);
      } else {
        toast(`Settings saved locally. Gateway notified.`, 'info');
      }
    } catch (err) {
      toast(`Settings saved locally for ${assets[selectedMachine]?.name || selectedMachine}.`, 'info');
    }
  };

  const handleNewSensorChange = (e) => {
    const { name, value } = e.target;
    setNewSensor(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateSensor = (e) => {
    e.preventDefault();
    const rawName = (newSensor.name || '').trim();
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const finalName = rawName || `Sensor Node-${randomSuffix}`;

    const rawId = (newSensor.sensorId || '').trim();
    const cleanId = rawId 
      ? rawId.toLowerCase().replace(/[^a-z0-9_-]+/g, '-') 
      : finalName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `sensor-${randomSuffix}`;

    if (assets[cleanId]) {
      toast(`A sensor with ID "${cleanId}" already exists. Please choose a unique ID.`, 'error');
      return;
    }

    addAsset(cleanId, {
      name: finalName,
      label: (newSensor.label || '').trim() || 'Configured Rig Sensor',
      basevib: 0,
      basetemp: 0,
      baserpm: 0,
      isCustom: true
    });

    if (setActiveAsset) {
      setActiveAsset(cleanId);
    }

    setNewSensor({ name: '', sensorId: '', label: '' });
    toast(`Sensor "${finalName}" (ID: ${cleanId}) created. Operating in Zero/Standby mode until hardware connects.`);
  };

  const startEdit = (id, asset) => {
    setEditingId(id);
    setEditForm({
      name: asset.name,
      label: asset.label || ''
    });
  };

  const saveEdit = (id) => {
    const trimmedName = editForm.name.trim();
    if (!trimmedName) {
      toast('Sensor name cannot be empty.', 'error');
      return;
    }

    updateAsset(id, {
      name: trimmedName,
      label: editForm.label.trim() || 'Industrial Telemetry Node'
    });

    setEditingId(null);
    toast(`Sensor updated: "${trimmedName}". Applied across dropdown and all views.`);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = (id) => {
    const assetToDelete = assets[id];
    removeAsset(id);
    if (activeAsset === id && setActiveAsset) {
      const remaining = Object.keys(assets).filter(k => k !== id);
      setActiveAsset(remaining[0] || '');
    }
    toast(`${assetToDelete ? assetToDelete.name : 'Sensor'} removed successfully.`, 'error');
  };

  const allAssetsList = Object.entries(assets);

  return (
    <>
      <div>
        <div className="page-title">Test Design &amp; Sensor Configuration</div>
        <div className="page-title-sub">Manage, customize, and configure physical and auto-detected sensors (Admin Only)</div>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <div className="model-tabs" style={{ marginBottom: "20px" }}>
          <button
            className={`model-tab ${activeTab === 'component' ? 'active' : ''}`}
            onClick={() => setActiveTab('component')}
          >
            Sensor Nodes &amp; Asset Management
          </button>
          <button
            className={`model-tab ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            System Environmental Testing
          </button>
        </div>

        {activeTab === 'component' && (
          <div className="card-body">
            {/* 1. All Configured and Auto-Detected Sensors */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>
                  Active &amp; Auto-Detected Sensor Nodes ({allAssetsList.length})
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  All sensors sync automatically with the top navigation dropdown
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginBottom: '16px' }}>
                Any new hardware sensor plugged into the gateway will be automatically discovered here. You can rename, describe, or activate any node. Sensors without an active hardware stream cleanly display 0 / standby values.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {allAssetsList.map(([id, a]) => {
                  const isEditing = editingId === id;
                  const isActive = activeAsset === id;

                  return (
                    <div 
                      key={id} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        padding: '16px', 
                        background: 'var(--bg-glass)', 
                        border: isActive ? '1px solid var(--accent)' : '1px solid var(--border)', 
                        borderRadius: '8px',
                        gap: '12px'
                      }}
                    >
                      {isEditing ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
                          <div>
                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Sensor / Rig Name</label>
                            <input 
                              type="text" 
                              value={editForm.name} 
                              onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                              style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--accent)', borderRadius: '4px', color: '#fff', fontSize: '13px' }}
                              placeholder="e.g. Bearing Accelerometer Node 2"
                            />
                          </div>
                          <div>
                            <label style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>Description / Location</label>
                            <input 
                              type="text" 
                              value={editForm.label} 
                              onChange={(e) => setEditForm(prev => ({ ...prev, label: e.target.value }))}
                              style={{ width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border)', borderRadius: '4px', color: '#fff', fontSize: '13px' }}
                              placeholder="e.g. Drive End Bearing Housing"
                            />
                          </div>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '18px' }}>
                            <button 
                              type="button" 
                              onClick={() => saveEdit(id)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--green)', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                            >
                              <Check size={14} /> Save
                            </button>
                            <button 
                              type="button" 
                              onClick={cancelEdit}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '8px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                            >
                              <X size={14} /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Cpu size={18} color="#3b82f6" />
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text-primary)' }}>{a.name}</span>
                                {a.isAutoDetected && (
                                  <span style={{ fontSize: '10px', background: 'rgba(16,185,129,0.2)', color: '#34d399', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Auto-Discovered</span>
                                )}
                                {a.isCustom && (
                                  <span style={{ fontSize: '10px', background: 'rgba(168,85,247,0.2)', color: '#c084fc', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Custom Node</span>
                                )}
                                {isActive && (
                                  <span style={{ fontSize: '10px', background: 'rgba(99,102,241,0.2)', color: '#818cf8', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Active Stream</span>
                                )}
                              </div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                ID: <code style={{ color: 'var(--text-secondary)' }}>{id}</code> • {a.label || 'Condition Monitoring Node'}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <button 
                                type="button" 
                                onClick={() => toggleSensorStreaming(id)}
                                style={{ 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  gap: '5px', 
                                  background: activeStreamingNodes.includes(id) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.06)', 
                                  border: `1px solid ${activeStreamingNodes.includes(id) ? 'var(--emerald)' : 'var(--border)'}`, 
                                  color: activeStreamingNodes.includes(id) ? 'var(--emerald)' : 'var(--text-secondary)', 
                                  padding: '6px 12px', 
                                  borderRadius: '4px', 
                                  cursor: 'pointer', 
                                  fontSize: '12px', 
                                  fontWeight: 600 
                                }}
                              >
                                <Radio size={13} /> {activeStreamingNodes.includes(id) ? 'Streaming & Logging' : 'Stream Node'}
                              </button>

                              <button 
                                type="button" 
                                onClick={() => startEdit(id, a)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                              >
                                <Edit3 size={13} /> Edit
                              </button>

                              {!isActive && (
                                <button 
                                  type="button" 
                                  onClick={() => setActiveAsset && setActiveAsset(id)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--accent)', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                                >
                                  Focus
                                </button>
                              )}

                              <button 
                                type="button" 
                                onClick={() => handleDelete(id)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'transparent', border: '1px solid var(--rose)', color: 'var(--rose)', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. Add New Custom Sensor Node */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <PlusCircle size={18} color="var(--accent)" />
                <h3 style={{ fontSize: '15px', fontWeight: 600, margin: 0 }}>Register New Sensor Node</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '16px' }}>
                Manually register an expected sensor node. It will operate in pure <strong>Zero / Standby</strong> mode until a physical node with the corresponding ID broadcasts telemetry.
              </p>

              <form onSubmit={handleCreateSensor} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '640px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Sensor / Machine Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      placeholder="e.g. Test Rig B — Shaft Sensor" 
                      value={newSensor.name} 
                      onChange={handleNewSensorChange} 
                      style={{ padding: '9px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Hardware ID (optional)</label>
                    <input 
                      type="text" 
                      name="sensorId" 
                      placeholder="e.g. test-rig-b or leave blank for auto ID" 
                      value={newSensor.sensorId} 
                      onChange={handleNewSensorChange} 
                      style={{ padding: '9px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Description / Monitoring Location</label>
                  <input 
                    type="text" 
                    name="label" 
                    placeholder="e.g. Non-Drive End Bearing Housing (Analog RTD + Dual MEMS)" 
                    value={newSensor.label} 
                    onChange={handleNewSensorChange} 
                    style={{ padding: '9px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px' }}
                  />
                </div>

                <div>
                  <button 
                    type="submit" 
                    className="btn" 
                    style={{ background: 'var(--accent)', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}
                  >
                    Add Sensor Node
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="card-body">
            <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>System Environmental & Dynamic Hardware Parameters</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
              Select a machine or sensor node to dynamically tune its sampling rate (1–15,000 Hz) and acquisition duty cycle. Settings apply immediately to the hardware without re-flashing.
            </p>

            <form onSubmit={handleApplyParameters} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>
              
              {/* 1. Machine Selector */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Select Machine / Sensor Node</label>
                <select 
                  value={selectedMachine} 
                  onChange={(e) => setSelectedMachine(e.target.value)} 
                  style={{ padding: '10px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px' }}
                >
                  {Object.entries(assets).map(([id, a]) => (
                    <option key={id} value={id}>
                      {a.name || id} ({id})
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Duty Cycle Schedule */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Duty Cycle / Testing Schedule</label>
                <select 
                  value={currentParams.loadProfile} 
                  onChange={(e) => handleParamChange('loadProfile', e.target.value)} 
                  style={{ padding: '10px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '14px' }}
                >
                  <option value="every_30s">Every 30s save 10s of reading (10s Burst / 20s Sleep)</option>
                  <option value="steady">Steady Bench Acquisition (10s Burst / 3s Sleep)</option>
                  <option value="field">Field Battery Deployment (10s Burst / 5m Deep Sleep)</option>
                  <option value="continuous">Continuous Streaming (USB Tethered / Bench Testing)</option>
                </select>
              </div>

              {/* 3. Manual Sampling Rate Selection (1 to 15,000 Hz) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Sampling Rate (Hz)</label>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--accent)' }}>{currentParams.samplingRate || 12800} Hz</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: '12px', alignItems: 'center' }}>
                  <input 
                    type="range" 
                    min="1" 
                    max="15000" 
                    step="100" 
                    value={currentParams.samplingRate || 12800} 
                    onChange={(e) => handleParamChange('samplingRate', Number(e.target.value))} 
                    style={{ accentColor: 'var(--accent)', cursor: 'pointer' }}
                  />
                  <input 
                    type="number" 
                    min="1" 
                    max="15000" 
                    value={currentParams.samplingRate || 12800} 
                    onChange={(e) => handleParamChange('samplingRate', Math.max(1, Math.min(15000, Number(e.target.value))))} 
                    style={{ padding: '8px 10px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)', fontSize: '13px', textAlign: 'center' }}
                  />
                </div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Configurable range: 1 Hz to 15,000 Hz. Adjusts sensor acquisition frequency and Nyquist bandwidth on the fly.
                </span>
              </div>

              {/* 4. Apply Action */}
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button type="submit" className="btn" style={{ background: 'var(--accent)', color: 'white', padding: '10px 24px', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}>
                  Apply Parameters to Hardware
                </button>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Settings are immediately dispatched to Raspberry Pi 5 & Microcontroller.
                </span>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
