import { useEffect } from 'react';
import useSocket from './useSocket';
import useSensorStore from '../store/sensorStore';

export const useSensorData = (equipmentId) => {
  const { subscribe, unsubscribe, onSensorData } = useSocket();
  const { updateReading, liveReadings, historicalData } = useSensorStore();

  useEffect(() => {
    if (!equipmentId) return;

    const room = `equipment:${equipmentId}`;
    subscribe(room);

    const cleanup = onSensorData((data) => {
      // Expecting data: { sensorId, value, timestamp }
      updateReading(data.sensorId, data);
    });

    return () => {
      if (cleanup) cleanup();
      unsubscribe(room);
    };
  }, [equipmentId, subscribe, unsubscribe, onSensorData, updateReading]);

  return { liveReadings, historicalData };
};

export default useSensorData;
