const fs = require('fs');
const path = require('path');
const axios = require('axios');
const dbClient = require('../../shared/config/db');
const logger = require('../../shared/config/logger');

class ReplicationService {
  constructor() {
    const nodesPath = path.join(__dirname, '../nodes/nodes.json');
    this.nodes = JSON.parse(fs.readFileSync(nodesPath));
    this.currentNode = this.nodes.find(n => n.url === process.env.CURRENT_NODE_URL);
  }

  // Replicar un mensaje a otros nodos
  async replicateMessage(message) {
    const db = await dbClient.getDb();
    const messagesCollection = db.collection('messages');
    
    try {
      // Insertar localmente primero
      await messagesCollection.insertOne(message);
      logger.info(`Message ${message.messageId} inserted locally`);
      
      // Replicar a otros nodos
      const replicationPromises = this.nodes
        .filter(node => node.url !== this.currentNode.url && node.isActive)
        .map(async node => {
          try {
            const response = await axios.post(`${node.url}/api/messages/replicate`, message, {
              headers: { 'X-Node-ID': this.currentNode.id }
            });
            logger.info(`Message ${message.messageId} replicated to ${node.url}`);
            return response.data;
          } catch (error) {
            logger.error(`Failed to replicate to ${node.url}: ${error.message}`);
            return null;
          }
        });
      
      await Promise.all(replicationPromises);
      return true;
    } catch (error) {
      logger.error(`Replication failed: ${error.message}`);
      throw error;
    }
  }

  // Sincronizar datos con otros nodos al iniciar
  async syncData() {
    try {
      const activeNodes = this.nodes.filter(node => node.isActive && node.url !== this.currentNode.url);
      if (activeNodes.length === 0) return;
      
      const db = await dbClient.getDb();
      const messagesCollection = db.collection('messages');
      
      // Obtener el último mensaje local
      const lastMessage = await messagesCollection
        .find()
        .sort({ timestamp: -1 })
        .limit(1)
        .toArray();
      
      const lastTimestamp = lastMessage.length > 0 ? lastMessage[0].timestamp : new Date(0);
      
      // Obtener mensajes más recientes de otros nodos
      const syncPromises = activeNodes.map(async node => {
        try {
          const response = await axios.get(`${node.url}/api/messages/sync?since=${lastTimestamp.toISOString()}`, {
            headers: { 'X-Node-ID': this.currentNode.id }
          });
          
          if (response.data.length > 0) {
            await messagesCollection.insertMany(response.data);
            logger.info(`Synced ${response.data.length} messages from ${node.url}`);
          }
        } catch (error) {
          logger.error(`Sync failed with ${node.url}: ${error.message}`);
        }
      });
      
      await Promise.all(syncPromises);
    } catch (error) {
      logger.error(`Data synchronization failed: ${error.message}`);
    }
  }
}

module.exports = new ReplicationService();