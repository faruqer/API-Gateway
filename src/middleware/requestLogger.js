const { requestLogRepo } = require('../db/repositories');
const logger = require('../utils/logger');

function requestLogger(req, res, next) {
  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - start) / 1e6;

    const logEntry = {
      apiKey: req.apiKey || null,
      method: req.method,
      path: req.path,
      query: JSON.stringify(req.query),
      statusCode: res.statusCode,
      responseTimeMs: parseFloat(durationMs.toFixed(2)),
      ip: req.ip,
      error: res.statusCode >= 400 ? res.statusMessage : null,
    };

    try {
      requestLogRepo.insert(logEntry);
    } catch (err) {
      logger.error('Failed to write request log to DB', { error: err.message });
    }

    const level = res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info';
    logger[level]('Request completed', logEntry);
  });

  next();
}

module.exports = requestLogger;
