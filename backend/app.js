const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const dbClient = require("../shared/config/db");
const Message = require("../shared/models/message");
const logger = require("../shared/config/logger");
const path = require("path");
const chatRoutes = require("./routes/chat");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});
app.use(express.static(path.join(__dirname, "..", "public")));

// Rutas
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});
app.use("/api/chat", chatRoutes);

// Estado del sistema
app.get("/api/status", async (req, res) => {
  try {
    const db = await dbClient.getDb();
    const stats = await db.stats();

    res.json({
      status: "online",
      dbStatus: stats.ok === 1 ? "healthy" : "unhealthy",
      dbHost: dbClient.url,
      timestamp: new Date(),
    });
  } catch (error) {
    res.status(500).json({ status: "offline", error: error.message });
  }
});

// Inicialización
async function initialize() {
  try {
    const db = await dbClient.getDb();
    await Message.createCollection(db);

    // Verifica estado del Replica Set
    const adminDb = db.admin();
    const status = await adminDb.command({ replSetGetStatus: 1 });
    logger.info(`Conectado a Replica Set: ${status.set}`);
    logger.info("Aplicación inicializada correctamente");
  } catch (error) {
    logger.error(`Fallo en la inicialización: ${error.message}`);
    process.exit(1);
  }
}

initialize();

module.exports = app;
