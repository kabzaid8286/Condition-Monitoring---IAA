import { create } from 'zustand';

const useAlertStore = create((set) => ({
  alerts: [],
  activeCount: 0,
  unacknowledgedCount: 0,
  filters: {},
  
  setAlerts: (alerts) => set({
    alerts,
    activeCount: alerts.filter(a => a.status === 'active').length,
    unacknowledgedCount: alerts.filter(a => a.status === 'active' && !a.acknowledged).length
  }),
  
  addAlert: (alert) => set((state) => {
    const newAlerts = [alert, ...state.alerts];
    return {
      alerts: newAlerts,
      activeCount: newAlerts.filter(a => a.status === 'active').length,
      unacknowledgedCount: newAlerts.filter(a => a.status === 'active' && !a.acknowledged).length
    };
  }),

  acknowledgeAlert: (id) => set((state) => {
    const newAlerts = state.alerts.map(a => a.id === id ? { ...a, acknowledged: true } : a);
    return {
      alerts: newAlerts,
      unacknowledgedCount: newAlerts.filter(a => a.status === 'active' && !a.acknowledged).length
    };
  }),

  resolveAlert: (id) => set((state) => {
    const newAlerts = state.alerts.map(a => a.id === id ? { ...a, status: 'resolved' } : a);
    return {
      alerts: newAlerts,
      activeCount: newAlerts.filter(a => a.status === 'active').length,
      unacknowledgedCount: newAlerts.filter(a => a.status === 'active' && !a.acknowledged).length
    };
  }),

  setFilters: (filters) => set({ filters })
}));

export default useAlertStore;
