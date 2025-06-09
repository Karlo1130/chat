const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize, errors } = format;
const path = require('path');
const fs = require('fs');

// Crear directorio de logs si no existe
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

// Formato personalizado para los logs
const logFormat = printf(({ level, message, timestamp, stack }) => {
  let log = `${timestamp} [${level}]: ${message}`;
  if (stack) {
    log += `\n${stack}`;
  }
  return log;
});

// Logger para desarrollo (más detallado)
const devLogger = createLogger({
  level: 'debug',
  format: combine(
    colorize(),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error'
    }),
    new transports.File({
      filename: path.join(logDir, 'combined.log')
    })
  ]
});

// Logger para producción (más minimalista)
const prodLogger = createLogger({
  level: 'info',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    logFormat
  ),
  transports: [
    new transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error'
    }),
    new transports.File({
      filename: path.join(logDir, 'combined.log')
    })
  ]
});

// Elegir el logger según el entorno
const logger = process.env.NODE_ENV === 'production' ? prodLogger : devLogger;

// Función para registrar operaciones de MongoDB
logger.mongoLog = (operation, collection, query = {}, details = {}) => {
  logger.debug(`MongoDB Operation: ${operation}`, {
    collection,
    query: JSON.stringify(query),
    details: JSON.stringify(details)
  });
};

// Función para registrar conexiones de socket
logger.socketLog = (event, socketId, room = null, details = {}) => {
  logger.debug(`Socket Event: ${event}`, {
    socketId,
    room,
    details: JSON.stringify(details)
  });
};

// Función para registrar replicación de MongoDB
logger.replicationLog = (messageId, status, details = {}) => {
  logger.info(`Replication Event: ${status}`, {
    messageId,
    details: JSON.stringify(details)
  });
};

module.exports = logger;