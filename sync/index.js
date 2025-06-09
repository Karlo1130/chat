const synchronizationService = require('./services/synchronization');
const replicationService = require('./services/replication');
const logger = require('../shared/config/logger');

synchronizationService.on('newMessage', async (message) => {
  logger.info(`Replicating message ${message.messageId}`);
  await replicationService.replicateMessage(message);
});

synchronizationService.setupChangeStream();