const express = require('express');
const router = express.Router();
const dbClient = require('../../shared/config/db');
const logger = require('../../shared/config/logger');

// Obtener historial de mensajes
router.get('/messages/:room', async (req, res) => {
  try {
    const db = await dbClient.getDb();
    const messages = await db.collection('messages')
      .find({ room: req.params.room })
      .sort({ timestamp: -1 })
      .limit(100)
      .toArray();
    
    res.json(messages.reverse());
  } catch (error) {
    logger.error(`Error fetching messages: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Enviar mensaje
router.post('/messages', async (req, res) => {
  try {
    const { sender, content, room } = req.body;
    const message = {
      sender,
      content,
      room,
      timestamp: new Date(),
      messageId: require('uuid').v4()
    };

    const db = await dbClient.getDb();
    await db.collection('messages').insertOne(message);
    
    logger.info(`New message from ${sender} in room ${room}`);
    res.status(201).json(message);
  } catch (error) {
    logger.error(`Error sending message: ${error.message}`);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
