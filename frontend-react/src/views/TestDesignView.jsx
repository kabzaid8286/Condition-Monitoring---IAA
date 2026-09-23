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
    removeAsset(id);
    if (activeAsset === id) {
      setActiveAsset('test-rig-a');
    }
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
          <div className="card-body" style={{ minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '16px' }}>
            <span style={{ fontSize: '48px' }}>🏗️</span>
            <div style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>System Level Testing Module</div>
            <div style={{ color: 'var(--text-muted)' }}>Multi-asset interaction testing coming soon...</div>
          </div>
        )}
      </div>
    </>
  );
}
