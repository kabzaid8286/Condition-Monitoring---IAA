import api from '../config/api';

export const reportService = {
  getAll: async () => {
    const res = await api.get('/reports');
    return res.data;
  },
  generate: async (data) => {
    const res = await api.post('/reports/generate', data);
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/reports/${id}`);
    return res.data;
  },
  download: async (id) => {
    const res = await api.get(`/reports/${id}/download`, { responseType: 'blob' });
    return res.data;
  },
  delete: async (id) => {
    const res = await api.delete(`/reports/${id}`);
    return res.data;
  }
};
