import React, { createContext, useState, useContext, useCallback } from 'react';
import { ASSETS as initialAssets } from '../data/systemConfig';

const AssetContext = createContext(null);

export const AssetProvider = ({ children }) => {
  const getDeletedAssets = () => {
    try {
      const saved = localStorage.getItem('condition_monitoring_deleted_assets');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const [deletedAssets, setDeletedAssets] = useState(getDeletedAssets);

  const [assets, setAssets] = useState(() => {
    try {
      const saved = localStorage.getItem('condition_monitoring_assets');
      const deleted = getDeletedAssets();
      if (saved) {
        const parsed = JSON.parse(saved);
        // Exclude any deleted assets on reload
        const filtered = {};
        Object.entries(parsed).forEach(([id, val]) => {
          if (!deleted.includes(id)) {
            filtered[id] = val;
          }
        });
        return { ...initialAssets, ...filtered };
      }
    } catch (e) {
      console.warn('Error reading assets from localStorage:', e);
    }
    return initialAssets;
  });

  const saveAssets = (newAssets) => {
    try {
      localStorage.setItem('condition_monitoring_assets', JSON.stringify(newAssets));
    } catch (e) {
      console.warn('Error saving assets to localStorage:', e);
    }
  };

  const addAsset = useCallback((id, newAsset) => {
    const cleanId = String(id).trim();
    // If it was previously marked as deleted, remove it from deletedAssets
    setDeletedAssets(prev => {
      if (prev.includes(cleanId)) {
        const next = prev.filter(x => x !== cleanId);
        try {
          localStorage.setItem('condition_monitoring_deleted_assets', JSON.stringify(next));
        } catch {}
        return next;
      }
      return prev;
    });

    setAssets(prev => {
      const updated = {
        ...prev,
        [cleanId]: {
          name: newAsset.name || `Sensor Node-${cleanId}`,
          label: newAsset.label || 'Configured Sensor Node',
          basevib: 0,
          basetemp: 0,
          baserpm: 0,
          isCustom: true,
          ...newAsset
        }
      };
      saveAssets(updated);
      return updated;
    });
  }, []);

  const updateAsset = useCallback((id, updatedFields) => {
    setAssets(prev => {
      if (!prev[id]) return prev;
      const updated = {
        ...prev,
        [id]: {
          ...prev[id],
          ...updatedFields,
          isCustom: true
        }
      };
      saveAssets(updated);
      return updated;
    });
  }, []);

  const autoRegisterSensor = useCallback((id, optionalName, isLiveTelemetry = false) => {
    if (!id) return;
    const cleanId = String(id).trim();

    // Check currently deleted assets
    const currentDeleted = (() => {
      try {
        const s = localStorage.getItem('condition_monitoring_deleted_assets');
        return s ? JSON.parse(s) : [];
      } catch {
        return [];
      }
    })();

    // If from static snapshot and asset was deleted, do not auto-register
    if (!isLiveTelemetry && currentDeleted.includes(cleanId)) {
      return;
    }

    // If live telemetry arrived from a newly connected battery/board: un-delete it
    if (isLiveTelemetry && currentDeleted.includes(cleanId)) {
      setDeletedAssets(prev => {
        const next = prev.filter(x => x !== cleanId);
        try {
          localStorage.setItem('condition_monitoring_deleted_assets', JSON.stringify(next));
        } catch {}
        return next;
      });
    }

    setAssets(prev => {
      // If already registered
      if (prev[cleanId]) {
        if (optionalName && prev[cleanId].name !== optionalName && !prev[cleanId].isCustom) {
          const updated = {
            ...prev,
            [cleanId]: {
              ...prev[cleanId],
              name: optionalName
            }
          };
          saveAssets(updated);
          return updated;
        }
        return prev;
      }

      // Friendly distinct name based on ID
      let formattedName = optionalName;
      if (!formattedName) {
        if (cleanId.startsWith('xiao-')) {
          formattedName = `Sensor Node (${cleanId.replace(/^xiao-/i, '').toUpperCase()})`;
        } else if (cleanId.startsWith('sensor-')) {
          formattedName = `Sensor Node ${cleanId.replace(/^sensor-/i, '').toUpperCase()}`;
        } else {
          formattedName = cleanId.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        }
      }

      const newAsset = {
        name: formattedName,
        label: 'Auto-Detected Sensor Node',
        basevib: 0,
        basetemp: 0,
        baserpm: 0,
        isAutoDetected: true,
        isCustom: true // Ensure it can be edited in Test Design
      };

      const updated = { ...prev, [cleanId]: newAsset };
      saveAssets(updated);
      return updated;
    });
  }, []);

  const removeAsset = useCallback((id) => {
    // Prevent removing the primary test-rig-a
    if (id === 'test-rig-a') return;

    setAssets(prev => {
      const copy = { ...prev };
      delete copy[id];
      saveAssets(copy);
      return copy;
    });

    setDeletedAssets(prev => {
      const next = Array.from(new Set([...prev, id]));
      try {
        localStorage.setItem('condition_monitoring_deleted_assets', JSON.stringify(next));
      } catch (e) {
        console.warn('Error saving deleted assets:', e);
      }
      return next;
    });

    // Notify backend to remove from snapshot cache
    try {
      fetch(`/api/v1/telemetry/snapshot/${encodeURIComponent(id)}`, { method: 'DELETE' }).catch(() => {});
    } catch (e) {
      // ignore
    }
  }, []);

  return (
    <AssetContext.Provider value={{ assets, deletedAssets, addAsset, updateAsset, autoRegisterSensor, removeAsset }}>
      {children}
    </AssetContext.Provider>
  );
};

export const useAssets = () => {
  const context = useContext(AssetContext);
  return context || { 
    assets: initialAssets, 
    deletedAssets: [],
    addAsset: () => {}, 
    updateAsset: () => {}, 
    autoRegisterSensor: () => {}, 
    removeAsset: () => {} 
  };
};
