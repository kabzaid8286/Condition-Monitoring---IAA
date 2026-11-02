import React, { createContext, useState, useContext, useCallback } from 'react';
import { ASSETS as initialAssets } from '../data/systemConfig';

const AssetContext = createContext(null);

export const AssetProvider = ({ children }) => {
  const [assets, setAssets] = useState(() => {
    try {
      const saved = localStorage.getItem('condition_monitoring_assets');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure default test-rig-a is always present
        return { ...initialAssets, ...parsed };
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
    setAssets(prev => {
      const updated = {
        ...prev,
        [id]: {
          name: newAsset.name || `Sensor Node-${id}`,
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
          ...updatedFields
        }
      };
      saveAssets(updated);
      return updated;
    });
  }, []);

  const autoRegisterSensor = useCallback((id, optionalName) => {
    if (!id) return;
    const cleanId = String(id).trim();
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
        isAutoDetected: true
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
  }, []);

  return (
    <AssetContext.Provider value={{ assets, addAsset, updateAsset, autoRegisterSensor, removeAsset }}>
      {children}
    </AssetContext.Provider>
  );
};

export const useAssets = () => {
  const context = useContext(AssetContext);
  return context || { 
    assets: initialAssets, 
    addAsset: () => {}, 
    updateAsset: () => {}, 
    autoRegisterSensor: () => {}, 
    removeAsset: () => {} 
  };
};
