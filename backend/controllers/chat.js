const dbClient = require('../config/db');
const Message = require('../models/message');
const logger = require('../utils/logger');

class ChatController {
  constructor(io) {
    this.io = io;
    this.setupSocketEvents();
  }

  setupSocketEvents() {
    this.io.on('connection', (socket) => {
      logger.info(`New client connected: ${socket.id}`);
      
      socket.on('joinRoom', async (room) => {
        socket.join(room);
        logger.info(`Client ${socket.id} joined room ${room}`);
        
        const messages = await this.getRoomMessages(room);
        socket.emit('messageHistory', messages);
      });
      
      socket.on('sendMessage', async (data) => {
        try {
          const { sender, content, room } = data;
          const message = new Message({ sender, content, room });
          
          // Insertar en MongoDB (la replicación se maneja automáticamente)
          const db = await dbClient.getDb();
          await db.collection('messages').insertOne(message);
          
          logger.info(`Message saved to MongoDB: ${message.messageId}`);
          
          // No es necesario emitir aquí, el Change Stream lo detectará
        } catch (error) {
          logger.error(`Error sending message: ${error.message}`);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });
      
      socket.on('disconnect', () => {
        logger.info(`Client disconnected: ${socket.id}`);
      });
    });
  }

  async getRoomMessages(room, limit = 50) {
    try {
      const db = await dbClient.getDb();
      const messages = await db.collection('messages')
        .find({ room })
        .sort({ timestamp: -1 })
        .limit(limit)
        .toArray();
      
      return messages.reverse();
    } catch (error) {
      logger.error(`Error fetching room messages: ${error.message}`);
      return [];
    }
  }
}

module.exports = ChatController;