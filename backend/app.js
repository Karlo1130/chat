const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const dbClient = require('./config/db');
const Message = require('./models/message');
const synchronizationService = require('./services/synchronization');
const logger = require('./utils/logger');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Ruta de estado
app.get('/api/status', async (req, res) => {
  try {
    const db = await dbClient.getDb();
    const stats = await db.stats();
    
    res.json({
      status: 'online',
      dbStatus: stats.ok === 1 ? 'healthy' : 'unhealthy',
      dbHost: dbClient.url,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({ status: 'offline', error: error.message });
  }
});

// Inicialización
async function initialize() {
  try {
    const db = await dbClient.getDb();
    await Message.createCollection(db);
    
    // Verificar el estado del Replica Set
    const adminDb = db.admin();
    const status = await adminDb.command({ replSetGetStatus: 1 });
    logger.info('Connected to MongoDB Replica Set:', status.set);
    
    logger.info('Application initialized');
  } catch (error) {
    logger.error(`Initialization failed: ${error.message}`);
    process.exit(1);
  }
}

initialize();

module.exports = app;