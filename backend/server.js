const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');
const ChatController = require('./controllers/chat');
const dbClient = require('../shared/config/db');
const logger = require('../shared/config/logger');

const port = process.env.PORT || 3000;
const server = http.createServer(app);

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 minutos
    skipMiddlewares: true
  }
});

// Inicializar controlador del chat (podría manejar rutas REST)
const chatController = new ChatController(io);

// Manejar conexiones WebSocket
io.on('connection', (socket) => {
  logger.info(`New client connected: ${socket.id}`);

  // Unirse a una sala
  socket.on('joinRoom', async (room) => {
    socket.join(room);
    logger.socketLog('join', socket.id, room);

    const db = await dbClient.getDb();
    const messages = await db.collection('messages')
      .find({ room })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    socket.emit('messageHistory', messages.reverse());
  });

  socket.on('disconnect', () => {
    logger.info(`Client disconnected: ${socket.id}`);
  });
});

// Iniciar el servidor
server.listen(port, () => {
  logger.info(`API server running on port ${port}`);
});

// Manejo global de errores
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});

