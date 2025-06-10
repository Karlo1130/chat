const { EventEmitter } = require('events');
const dbClient = require('../../shared/config/db');
const logger = require('../../shared/config/logger');

class SynchronizationService extends EventEmitter {
  constructor() {
    super();
    this.setupChangeStream();
  }

  async setupChangeStream() {
    try {
      const db = await dbClient.getDb();
      const messagesCollection = db.collection('messages');

      const changeStream = messagesCollection.watch([], { fullDocument: 'updateLookup' });

      changeStream.on('change', (change) => {
        if (change.operationType === 'insert') {
          logger.info(`New message detected via Change Stream: ${change.fullDocument.messageId}`);
          this.emit('newMessage', change.fullDocument);
        }
      });

      changeStream.on('error', (error) => {
        logger.error(`Change Stream error: ${error.message}`);
        setTimeout(() => this.setupChangeStream(), 5000);
      });

      logger.info('Change Stream started for messages');
    } catch (error) {
      logger.error(`Failed to set up Change Stream: ${error.message}`);
      setTimeout(() => this.setupChangeStream(), 5000);
    }
  }
}

module.exports = new SynchronizationService();
