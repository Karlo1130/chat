const http = require('http');
const socketIo = require('socket.io');
const app = require('./app');
const ChatController = require('./controllers/chat');
const synchronizationService = require('./services/synchronization');
const logger = require('./utils/logger');

const port = process.env.PORT || 3000;
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Inicializar controlador de chat
const chatController = new ChatController(io);

// Escuchar nuevos mensajes desde el Change Stream
synchronizationService.on('newMessage', (message) => {
  logger.info(`Broadcasting new message to room ${message.room}`);
  io.to(message.room).emit('newMessage', message);
});

server.listen(port, () => {
  logger.info(`Server running on port ${port}`);
});

// Manejo de errores
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled Rejection at: ${promise}, reason: ${reason}`);
});

process.on('uncaughtException', (error) => {
  logger.error(`Uncaught Exception: ${error.message}`);
  process.exit(1);
});