import api from '../config/api';

export const predictionService = {
  getAll: async (params) => {
    const res = await api.get('/predictions', { params });
    return res.data;
  },
  getByEquipment: async (equipmentId) => {
    const res = await api.get(`/predictions/equipment/${equipmentId}`);
    return res.data;
  },
  getHealthScore: async (equipmentId) => {
    const res = await api.get(`/predictions/equipment/${equipmentId}/health`);
    return res.data;
  },
  runPrediction: async (equipmentId) => {
    const res = await api.post(`/predictions/run`, { equipmentId });
    return res.data;
  },
  getModels: async () => {
    const res = await api.get('/predictions/models');
    return res.data;
  }
};
