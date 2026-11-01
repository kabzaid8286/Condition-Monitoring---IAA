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

  // System-level parameters
  const [sysData, setSysData] = useState({
    loadProfile: 'steady',
    misalignment: 0,
    ambientTemp: 22.0,
    foundation: 'rigid'
  });

  const handleSysChange = (e) => {
    const { name, value } = e.target;
    setSysData(prev => ({ ...prev, [name]: value }));
  };

  const handleSysSave = (e) => {
    e.preventDefault();
    toast('System-level testing parameters saved.');
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
    if (id === 'test-rig-a') {
      toast('Primary Test Rig A cannot be deleted.', 'error');
      return;
    }

    const assetToDelete = assets[id];
    removeAsset(id);
    if (activeAsset === id && setActiveAsset) {
      setActiveAsset('test-rig-a');
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
                                {id === 'test-rig-a' && (
                                  <span style={{ fontSize: '10px', background: 'rgba(59,130,246,0.2)', color: '#60a5fa', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>Primary Node</span>
                                )}
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
                                <Radio size={13} /> Activate
                              </button>
                            )}

                            {id !== 'test-rig-a' && (
                              <button 
                                type="button" 
                                onClick={() => handleDelete(id)}
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'transparent', border: '1px solid var(--rose)', color: 'var(--rose)', padding: '6px 10px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                              >
                                <Trash2 size={13} /> Delete
                              </button>
                            )}
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
            <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>System Environmental Parameters</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
              Configure ambient temperature and test fixture specifications for the testing environment.
            </p>

            <form onSubmit={handleSysSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Duty Cycle / Testing Schedule</label>
                <select 
                  name="loadProfile" 
                  value={sysData.loadProfile} 
                  onChange={handleSysChange} 
                  style={{ padding: '10px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)' }}
                >
                  <option value="steady">Steady Bench Acquisition (10s burst / 3s sleep)</option>
                  <option value="field">Field Battery Deployment (10s burst / 5m deep sleep)</option>
                  <option value="continuous">Continuous Streaming (USB Tethered)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Ambient Rig Temp (°C)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    name="ambientTemp" 
                    value={sysData.ambientTemp} 
                    onChange={handleSysChange} 
                    style={{ padding: '10px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Rig Foundation</label>
                  <select 
                    name="foundation" 
                    value={sysData.foundation} 
                    onChange={handleSysChange} 
                    style={{ padding: '10px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)' }}
                  >
                    <option value="rigid">Rigid Mounted (ISO Class I/II)</option>
                    <option value="damped">Elastomer Damped</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <button type="submit" className="btn" style={{ background: 'var(--accent)', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                  Save Rig Configuration
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
