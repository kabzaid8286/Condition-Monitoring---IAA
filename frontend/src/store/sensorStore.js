import { create } from 'zustand';

const useSensorStore = create((set) => ({
  liveReadings: {}, // map of sensorId -> latest value
  historicalData: {}, // map of sensorId -> array of past values
  
  updateReading: (sensorId, data) => set((state) => {
    const currentHist = state.historicalData[sensorId] || [];
    const newHist = [...currentHist, data].slice(-100); // keep last 100 points
    return {
      liveReadings: {
        ...state.liveReadings,
        [sensorId]: data
      },
      historicalData: {
        ...state.historicalData,
        [sensorId]: newHist
      }
    };
  }),

  setHistoricalData: (sensorId, data) => set((state) => ({
    historicalData: {
      ...state.historicalData,
      [sensorId]: data
    }
  })),

  clearReadings: () => set({ liveReadings: {}, historicalData: {} })
}));

export default useSensorStore;
