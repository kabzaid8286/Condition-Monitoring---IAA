function createStreamProcessor(mqttClient, socketServer, redisBridge) {
  
  let processedMessages = 0;
  let processingErrors = 0;

  setInterval(() => {
    console.log(`[${new Date().toISOString()}] Stream Processor Stats - Processed: ${processedMessages}, Errors: ${processingErrors}`);
  }, 60000);

  const processSensorMessage = (topic, payloadBuffer) => {
    try {
      // 1. Parse topic
      // Expected topic: sensors/{equipment_id}/{sensor_type}
      const parts = topic.split('/');
      if (parts.length < 3 || parts[0] !== 'sensors') {
        console.warn(`[${new Date().toISOString()}] Invalid topic format: ${topic}`);
        return;
      }

      const equipmentId = parts[1];
      const sensorType = parts[2];

      // 2. Parse payload
      const payloadString = payloadBuffer.toString();
      const payload = JSON.parse(payloadString);

      // 3. Normalize data
      const normalizedData = {
        equipmentId,
        sensorType,
        value: payload.value,
        unit: payload.unit,
        timestamp: payload.timestamp || new Date().toISOString(),
        quality: payload.quality || 100
      };

      // 4. Forward to Socket.IO
      socketServer.emitSensorData(equipmentId, normalizedData);

      // 5. Forward to Redis
      redisBridge.publishSensorData(normalizedData);
      
      processedMessages++;
    } catch (err) {
      processingErrors++;
      console.error(`[${new Date().toISOString()}] Error processing message from topic ${topic}:`, err.message);
    }
  };

  // Wire up MQTT client
  mqttClient.setOnMessage(processSensorMessage);

  return {
    processSensorMessage,
    getStats: () => ({ processedMessages, processingErrors })
  };
}

module.exports = { createStreamProcessor };
