class Message {
  constructor({ sender, content, timestamp, room, messageId }) {
    this.sender = sender;
    this.content = content;
    this.timestamp = timestamp || new Date();
    this.room = room || 'general';
    this.messageId = messageId || require('uuid').v4();
  }

  static async createCollection(db) {
    try {
      await db.createCollection('messages', {
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            required: ['sender', 'content', 'timestamp', 'room', 'messageId'],
            properties: {
              sender: { bsonType: 'string' },
              content: { bsonType: 'string' },
              timestamp: { bsonType: 'date' },
              room: { bsonType: 'string' },
              messageId: { bsonType: 'string' }
            }
          }
        }
      });
      
      // Crear índices para mejorar el rendimiento
      await db.collection('messages').createIndex({ room: 1 });
      await db.collection('messages').createIndex({ timestamp: 1 });
      await db.collection('messages').createIndex({ messageId: 1 }, { unique: true });
      
      console.log('Messages collection created with schema validation');
    } catch (error) {
      if (error.codeName === 'NamespaceExists') {
        console.log('Messages collection already exists');
      } else {
        throw error;
      }
    }
  }
}

module.exports = Message;