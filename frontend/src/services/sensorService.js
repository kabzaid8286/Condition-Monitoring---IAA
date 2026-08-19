import api from '../config/api';

export const sensorService = {
  create: async (data) => {
    const res = await api.post('/sensors', data);
    return res.data;
  },
  getById: async (id) => {
    const res = await api.get(`/sensors/${id}`);
    return res.data;
  },
  getReadings: async (sensorId, startTime, endTime, limit = 1000) => {
    const res = await api.get(`/sensors/${sensorId}/readings`, {
      params: { startTime, endTime, limit }
    });
    return res.data;
  },
  getAggregatedReadings: async (sensorId, startTime, endTime, interval) => {
    const res = await api.get(`/sensors/${sensorId}/readings/aggregated`, {
      params: { startTime, endTime, interval }
    });
    return res.data;
  },
  getLatestReadings: async (sensorId, count = 1) => {
    const res = await api.get(`/sensors/${sensorId}/readings/latest`, {
      params: { count }
    });
    return res.data;
  },
  batchCreateReadings: async (readings) => {
    const res = await api.post('/sensors/readings/batch', { readings });
    return res.data;
  }
};
