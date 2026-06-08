require('dotenv').config();

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const config = require('./config');
const logger = require('./utils/logger');
const { authenticate } = require('./middleware/auth');
const rateLimiter = require('./middleware/rateLimiter');
const requestLogger = require('./middleware/requestLogger');
const { closeDb } = require('./db/database');

const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/auth', require('./routes/auth'));

app.use(authenticate);
app.use(rateLimiter);
app.use(requestLogger);

app.use('/weather', require('./routes/weather'));
app.use('/news', require('./routes/news'));
app.use('/crypto', require('./routes/crypto'));
app.use('/dashboard', require('./routes/dashboard'));

app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    availableRoutes: [
      'GET /health',
      'POST /auth/token',
      'POST /auth/keys',
      'GET /auth/keys',
      'GET /auth/logs',
      'GET /weather?city=London',
      'GET /news?topic=technology',
      'GET /crypto?symbol=BTC',
      'GET /dashboard?city=London&crypto=BTC&topic=technology',
    ],
  });
});

app.use((err, req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(config.port, () => {
  logger.info(`API Gateway running on http://localhost:${config.port}`);
  logger.info(`Environment: ${config.nodeEnv}`);
});

function shutdown(signal) {
  logger.info(`${signal} received – shutting down gracefully`);
  server.close(() => {
    closeDb();
    logger.info('Server closed');
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
