import React, { createContext, useState, useContext } from 'react';
import { ASSETS as initialAssets } from '../data/mockData';

const AssetContext = createContext();

export const AssetProvider = ({ children }) => {
  const [assets, setAssets] = useState(initialAssets);

  const addAsset = (id, newAsset) => {
    // Add a flag to indicate it's a custom asset that can be deleted
    const assetWithFlag = { ...newAsset, isCustom: true };
    setAssets(prev => ({ ...prev, [id]: assetWithFlag }));
  };

  const removeAsset = (id) => {
    setAssets(prev => {
      const copy = { ...prev };
      delete copy[id];
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
