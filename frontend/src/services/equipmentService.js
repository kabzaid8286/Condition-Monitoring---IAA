import api from '../config/api';

export const equipmentService = {
  getAll: async (params) => {
    const res = await api.get('/equipment', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/equipment/${id}`);
    return res.data;
  },
  create: async (data) => {
    const res = await api.post('/equipment', data);
    return res.data;
  },
  update: async (id, data) => {
    const res = await api.put(`/equipment/${id}`, data);
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/equipment/${id}`);
    return res.data;
  },
  getTypes: async () => {
    const res = await api.get('/equipment/types');
    return res.data;
  },
  getHealth: async (id) => {
    const res = await api.get(`/equipment/${id}/health`);
    return res.data;
  }
};
