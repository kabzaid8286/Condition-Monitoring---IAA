const Redis = require('ioredis');

function createRedisBridge(config) {
  const { redisUrl, socketServer } = config;
  
  console.log(`[${new Date().toISOString()}] Connecting to Redis at ${redisUrl}...`);
  
  const pubClient = new Redis(redisUrl);
  const subClient = new Redis(redisUrl);

  pubClient.on('connect', () => console.log(`[${new Date().toISOString()}] Redis Pub Client connected.`));
  pubClient.on('error', (err) => console.error(`[${new Date().toISOString()}] Redis Pub Error:`, err));

  subClient.on('connect', () => {
    console.log(`[${new Date().toISOString()}] Redis Sub Client connected.`);
    
    // Subscribe to channels
    subClient.subscribe('channel:alerts', 'channel:equipment_status', (err, count) => {
      if (err) {
        console.error(`[${new Date().toISOString()}] Redis Subscribe Error:`, err);
      } else {
        console.log(`[${new Date().toISOString()}] Redis Subscribed to ${count} channels.`);
      }
    });
  });
  subClient.on('error', (err) => console.error(`[${new Date().toISOString()}] Redis Sub Error:`, err));

  // Handle incoming messages from Redis
  subClient.on('message', (channel, message) => {
    try {
      const data = JSON.parse(message);
      if (channel === 'channel:alerts') {
        if (data.equipmentId) {
          socketServer.emitAlert(data.equipmentId, data);
        }
      } else if (channel === 'channel:equipment_status') {
        if (data.equipmentId) {
          socketServer.emitEquipmentStatus(data.equipmentId, data);
        }
      }
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Error parsing Redis message on channel ${channel}:`, err);
    }
  });

  // Batching mechanism
  let batchBuffer = [];
  const MAX_BATCH_SIZE = 100;
  const FLUSH_INTERVAL_MS = 1000;

  const flushBatch = async () => {
    if (batchBuffer.length === 0) return;
    
    const currentBatch = [...batchBuffer];
    batchBuffer = [];
    
    try {
      const pipeline = pubClient.pipeline();
      for (const item of currentBatch) {
        pipeline.xadd('stream:sensor_readings', '*', 'data', JSON.stringify(item));
      }
      await pipeline.exec();
    } catch (err) {
      console.error(`[${new Date().toISOString()}] Error flushing Redis batch:`, err);
    }
  };

  const flushInterval = setInterval(flushBatch, FLUSH_INTERVAL_MS);

  const bridgeAPI = {
    publishSensorData: (data) => {
      batchBuffer.push(data);
      if (batchBuffer.length >= MAX_BATCH_SIZE) {
        flushBatch();
      }
    },
    publishBatch: (dataArray) => {
      batchBuffer.push(...dataArray);
      if (batchBuffer.length >= MAX_BATCH_SIZE) {
        flushBatch();
      }
    },
    close: async () => {
      clearInterval(flushInterval);
      await flushBatch();
      await pubClient.quit();
      await subClient.quit();
    }
  };

  return bridgeAPI;
}

module.exports = { createRedisBridge };
