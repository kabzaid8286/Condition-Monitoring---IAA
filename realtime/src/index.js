require('dotenv').config();
const express = require('express');
const http = require('http');
const { createSocketServer } = require('./socket-server');
const { createMQTTClient } = require('./mqtt-client');
const { createRedisBridge } = require('./redis-bridge');
const { createStreamProcessor } = require('./stream-processor');

const PORT = process.env.PORT || 3001;
const MQTT_BROKER_URL = process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-change-in-production';

async function bootstrap() {
  console.log(`[${new Date().toISOString()}] Starting Real-time Server...`);

  // Express App & HTTP Server
  const app = express();
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const httpServer = http.createServer(app);

  // Initialize Services
  const socketServer = createSocketServer(httpServer, {
    corsOrigin: CORS_ORIGIN,
    jwtSecret: JWT_SECRET
  });

  const redisBridge = createRedisBridge({
    redisUrl: REDIS_URL,
    socketServer
  });

  const mqttClient = createMQTTClient({
    brokerUrl: MQTT_BROKER_URL
  });

  // Initialize Stream Processor
  const streamProcessor = createStreamProcessor(mqttClient, socketServer, redisBridge);

  // Start HTTP Server
  httpServer.listen(PORT, () => {
    console.log(`[${new Date().toISOString()}] HTTP Server running on port ${PORT}`);
  });

  // Graceful Shutdown
  const shutdown = async (signal) => {
    console.log(`\n[${new Date().toISOString()}] Received ${signal}, shutting down gracefully...`);
    
    // Disconnect MQTT
    if (mqttClient && mqttClient.end) {
      mqttClient.end(true);
      console.log(`[${new Date().toISOString()}] MQTT Client disconnected.`);
    }

    // Close Redis
    if (redisBridge && redisBridge.close) {
      await redisBridge.close();
      console.log(`[${new Date().toISOString()}] Redis Bridge closed.`);
    }

    // Close Socket.IO
    if (socketServer && socketServer.close) {
      socketServer.close();
      console.log(`[${new Date().toISOString()}] Socket.IO server closed.`);
    }

    // Close HTTP Server
    httpServer.close(() => {
      console.log(`[${new Date().toISOString()}] HTTP Server closed.`);
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch(err => {
  console.error(`[${new Date().toISOString()}] Fatal error during bootstrap:`, err);
  process.exit(1);
});
