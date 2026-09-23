import React, { useState } from 'react';
import { useAssets } from '../contexts/AssetContext';
import { toast } from '../utils/toast';

export default function TestDesignView({ activeAsset, setActiveAsset }) {
  const [activeTab, setActiveTab] = useState('component');
  const { assets, addAsset, removeAsset } = useAssets();
  
  const [formData, setFormData] = useState({
    machineName: 'Custom Rig X',
    baseVib: 2.5,
    baseTemp: 45.0,
    rpm: 1500,
    torque: 50.0
  });

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
    toast('System-level parameters applied globally to all components.');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    const id = formData.machineName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    addAsset(id, {
      name: formData.machineName,
      label: 'Custom Configuration',
      basevib: parseFloat(formData.baseVib),
      basetemp: parseFloat(formData.baseTemp),
      baserpm: parseFloat(formData.rpm)
    });
    toast(`Configuration saved for ${formData.machineName}! It is now available in the system.`);
  };

  const handleDelete = (id) => {
    const assetToDelete = assets[id];
    removeAsset(id);
    if (activeAsset === id) {
      setActiveAsset('test-rig-a');
    }
    toast(`${assetToDelete ? assetToDelete.name : 'Machine'} deleted successfully.`, 'error');
  };

  const customAssets = Object.entries(assets).filter(([id, a]) => a.isCustom);

  return (
    <>
      <div>
        <div className="page-title">⚙️ Test Design</div>
        <div className="page-title-sub">Configure and customize testing scenarios (Admin Only)</div>
      </div>

      <div className="card" style={{ marginTop: "20px" }}>
        <div className="model-tabs" style={{ marginBottom: "20px" }}>
          <button
            className={`model-tab ${activeTab === 'component' ? 'active' : ''}`}
            onClick={() => setActiveTab('component')}
          >
            Component Testing
          </button>
          <button
            className={`model-tab ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            System Level Testing
          </button>
        </div>

        {activeTab === 'component' && (
          <div className="card-body">
            <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>Custom Machine Configuration</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
              Define the baseline parameters for a new test component. These values will be used to simulate sensor telemetry.
            </p>
            
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Machine Name</label>
                <input 
                  type="text" 
                  name="machineName" 
                  value={formData.machineName} 
                  onChange={handleChange} 
                  style={{ padding: '10px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Base Vibration (mm/s)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    name="baseVib" 
                    value={formData.baseVib} 
                    onChange={handleChange} 
                    style={{ padding: '10px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Base Temperature (°C)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    name="baseTemp" 
                    value={formData.baseTemp} 
                    onChange={handleChange} 
                    style={{ padding: '10px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Rotation Speed (RPM)</label>
                  <input 
                    type="number" 
                    name="rpm" 
                    value={formData.rpm} 
                    onChange={handleChange} 
                    style={{ padding: '10px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Torque (Nm)</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    name="torque" 
                    value={formData.torque} 
                    onChange={handleChange} 
                    style={{ padding: '10px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)' }}
                  />
                </div>
              </div>

              <div style={{ marginTop: '16px' }}>
                <button type="submit" className="btn" style={{ background: 'var(--accent)', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                  Save Configuration
                </button>
              </div>
            </form>

            {customAssets.length > 0 && (
              <div style={{ marginTop: '40px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>Manage Custom Machines</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '600px' }}>
                  {customAssets.map(([id, a]) => (
                    <div key={id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '6px' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{a.name}</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Vib: {a.basevib} | Temp: {a.basetemp} | RPM: {a.baserpm}</div>
                      </div>
                      <button 
                        onClick={() => handleDelete(id)}
                        style={{ background: 'transparent', border: '1px solid var(--rose)', color: 'var(--rose)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'system' && (
          <div className="card-body">
            <h3 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: 600 }}>Global System Parameters</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
              Configure environmental and multi-component interaction variables that affect the entire test rig.
            </p>

            <form onSubmit={handleSysSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Duty Cycle / Load Profile</label>
                <select 
                  name="loadProfile" 
                  value={sysData.loadProfile} 
                  onChange={handleSysChange} 
                  style={{ padding: '10px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)' }}
                >
                  <option value="steady">Steady State (Nominal Load)</option>
                  <option value="ramp">Ramp-Up Test</option>
                  <option value="cyclic">Cyclic Loading (Fatigue)</option>
                  <option value="estop">Emergency Stop Simulation</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Coupling Misalignment Factor: {sysData.misalignment}%
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="15" 
                  name="misalignment" 
                  value={sysData.misalignment} 
                  onChange={handleSysChange} 
                />
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Affects vibration transmission between Motor and Gearbox.</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Ambient Temp (°C)</label>
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
                  <label style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Foundation Stiffness</label>
                  <select 
                    name="foundation" 
                    value={sysData.foundation} 
                    onChange={handleSysChange} 
                    style={{ padding: '10px 12px', background: 'var(--bg-glass)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-primary)' }}
                  >
                    <option value="rigid">Rigid (Standard)</option>
                    <option value="moderate">Moderate</option>
                    <option value="soft">Soft (Increases baseline vibration)</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-glass)', padding: '16px', border: '1px solid var(--border)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Projected System Health Impact</div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: sysData.misalignment > 5 ? 'var(--amber)' : 'var(--green)' }}>
                    {100 - (sysData.misalignment * 2) - (sysData.foundation === 'soft' ? 10 : 0)}%
                  </div>
                </div>
                <button type="submit" className="btn" style={{ background: 'var(--accent)', color: 'white', padding: '10px 20px', borderRadius: '6px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
                  Apply System Profile
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
