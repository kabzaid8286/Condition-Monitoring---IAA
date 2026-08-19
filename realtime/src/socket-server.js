const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

function createSocketServer(httpServer, config) {
  const { corsOrigin, jwtSecret } = config;
  
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin,
      methods: ["GET", "POST"]
    }
  });

  console.log(`[${new Date().toISOString()}] Socket.IO Server initialized with CORS origin: ${corsOrigin}`);

  let connectedClients = 0;

  // Middleware for authentication
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    
    if (!token) {
      console.warn(`[${new Date().toISOString()}] Connection attempt without token (socket ID: ${socket.id})`);
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, jwtSecret);
      socket.user = decoded;
      next();
    } catch (err) {
      console.error(`[${new Date().toISOString()}] JWT Verification failed:`, err.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    connectedClients++;
    console.log(`[${new Date().toISOString()}] Client connected: ${socket.id} | User: ${socket.user?.id || 'Unknown'} | Total: ${connectedClients}`);

    socket.on('subscribe', (data) => {
      if (data && data.room) {
        socket.join(data.room);
        console.log(`[${new Date().toISOString()}] Client ${socket.id} joined room: ${data.room}`);
      }
    });

    socket.on('unsubscribe', (data) => {
      if (data && data.room) {
        socket.leave(data.room);
        console.log(`[${new Date().toISOString()}] Client ${socket.id} left room: ${data.room}`);
      }
    });

    socket.on('disconnect', () => {
      connectedClients--;
      console.log(`[${new Date().toISOString()}] Client disconnected: ${socket.id} | Total: ${connectedClients}`);
    });
  });

  setInterval(() => {
    console.log(`[${new Date().toISOString()}] Socket.IO Stats - Connected Clients: ${connectedClients}`);
  }, 60000);

  const serverAPI = {
    emitSensorData: (equipmentId, data) => {
      io.to(`equipment:${equipmentId}`).emit('sensor:data', data);
    },
    emitAlert: (equipmentId, alertData) => {
      io.to(`equipment:${equipmentId}`).emit('alert:new', alertData);
      io.to('alerts').emit('alert:new', alertData);
    },
    emitEquipmentStatus: (equipmentId, statusData) => {
      io.to(`equipment:${equipmentId}`).emit('equipment:status', statusData);
    },
    close: () => {
      io.close();
    }
  };

  return serverAPI;
}

module.exports = { createSocketServer };
