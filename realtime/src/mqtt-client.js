const mqtt = require('mqtt');

function createMQTTClient(config) {
  const { brokerUrl } = config;
  console.log(`[${new Date().toISOString()}] Connecting to MQTT broker at ${brokerUrl}...`);

  const client = mqtt.connect(brokerUrl, {
    reconnectPeriod: 5000,
    connectTimeout: 30000,
  });

  const stats = {
    messagesReceived: 0,
    errors: 0
  };

  // Event handlers
  client.on('connect', () => {
    console.log(`[${new Date().toISOString()}] MQTT Connected successfully.`);
    client.subscribe('sensors/#', (err) => {
      if (err) {
        console.error(`[${new Date().toISOString()}] MQTT Subscription Error:`, err);
        stats.errors++;
      } else {
        console.log(`[${new Date().toISOString()}] MQTT Subscribed to topics: sensors/#`);
      }
    });
  });

  client.on('reconnect', () => {
    console.log(`[${new Date().toISOString()}] MQTT Reconnecting...`);
  });

  client.on('offline', () => {
    console.warn(`[${new Date().toISOString()}] MQTT Offline.`);
  });

  client.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] MQTT Error:`, err);
    stats.errors++;
  });

  client.on('close', () => {
    console.log(`[${new Date().toISOString()}] MQTT Connection closed.`);
  });

  // Track stats
  setInterval(() => {
    console.log(`[${new Date().toISOString()}] MQTT Stats - Messages Received: ${stats.messagesReceived}, Errors: ${stats.errors}`);
  }, 60000);

  // Expose onMessage function hook
  let onMessageHandler = null;
  
  client.on('message', (topic, payload) => {
    stats.messagesReceived++;
    if (onMessageHandler) {
      onMessageHandler(topic, payload);
    }
  });

  return {
    client,
    setOnMessage: (handler) => {
      onMessageHandler = handler;
    },
    end: (force) => client.end(force),
    getStats: () => stats
  };
}

module.exports = { createMQTTClient };
