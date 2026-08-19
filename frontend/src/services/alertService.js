import api from '../config/api';

export const alertService = {
  getAll: async (params) => {
    const res = await api.get('/alerts', { params });
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/alerts/${id}`);
    return res.data;
  },
  acknowledge: async (id) => {
    const res = await api.put(`/alerts/${id}/acknowledge`);
    return res.data;
  },
  resolve: async (id) => {
    const res = await api.put(`/alerts/${id}/resolve`);
    return res.data;
  },
  getRules: async () => {
    const res = await api.get('/alerts/rules');
    return res.data;
  },
  createRule: async (data) => {
    const res = await api.post('/alerts/rules', data);
    return res.data;
  },
  updateRule: async (id, data) => {
    const res = await api.put(`/alerts/rules/${id}`, data);
    return res.data;
  },
  deleteRule: async (id) => {
    const res = await api.delete(`/alerts/rules/${id}`);
    return res.data;
  },
  getStats: async () => {
    const res = await api.get('/alerts/stats');
    return res.data;
  }
};
