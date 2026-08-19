import { create } from 'zustand';

const useEquipmentStore = create((set) => ({
  equipment: [],
  selectedEquipment: null,
  filters: {},
  isLoading: false,

  setEquipment: (data) => set({ equipment: data }),
  setSelectedEquipment: (equipment) => set({ selectedEquipment: equipment }),
  setFilters: (filters) => set({ filters }),
  setLoading: (isLoading) => set({ isLoading }),
  
  updateStatus: (id, status) => set((state) => ({
    equipment: state.equipment.map(eq => eq.id === id ? { ...eq, status } : eq),
    selectedEquipment: state.selectedEquipment?.id === id 
      ? { ...state.selectedEquipment, status } 
      : state.selectedEquipment
  }))
}));

export default useEquipmentStore;
