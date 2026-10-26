import React, { createContext, useState, useContext } from 'react';
import { ASSETS as initialAssets } from '../data/mockData';

const AssetContext = createContext();

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

  const addAsset = (id, newAsset) => {
    const assetWithFlag = { ...newAsset, isCustom: true };
    setAssets(prev => {
      const updated = { ...prev, [id]: assetWithFlag };
      try {
        localStorage.setItem('condition_monitoring_assets', JSON.stringify(updated));
      } catch (e) {
        console.warn('Error saving assets to localStorage:', e);
      }
      return updated;
    });
  };

  const removeAsset = (id) => {
    setAssets(prev => {
      const copy = { ...prev };
      delete copy[id];
      try {
        localStorage.setItem('condition_monitoring_assets', JSON.stringify(copy));
      } catch (e) {
        console.warn('Error saving assets to localStorage:', e);
      }
      return copy;
    });
  };

  return (
    <AssetContext.Provider value={{ assets, addAsset, removeAsset }}>
      {children}
    </AssetContext.Provider>
  );
};

export const useAssets = () => useContext(AssetContext);
