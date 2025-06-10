const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const SynchronizationService = require('./services/synchronization');
const dbClient = require('../shared/config/db');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  }
});

const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// WebSocket: manejar unión a salas
io.on('connection', (socket) => {
  console.log('Cliente conectado');

  socket.on('joinRoom', (room) => {
    socket.join(room);
    console.log(`Cliente se unió a la sala: ${room}`);
  });

  socket.on('disconnect', () => {
    console.log('Cliente desconectado');
  });
});


SynchronizationService.on('newMessage', (message) => {
  io.to(message.room).emit('newMessage', message);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Sync/WebSocket server running on port ${PORT}`);
});

