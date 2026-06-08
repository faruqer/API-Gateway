const jwt = require('jsonwebtoken');
const config = require('../config');
const { apiKeyRepo } = require('../db/repositories');
const logger = require('../utils/logger');

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
      req.apiKey = decoded.apiKey || 'jwt-user';
      return next();
    } catch (err) {
      logger.warn('Invalid JWT token', { error: err.message });
      return res.status(401).json({ error: 'Invalid or expired JWT token' });
    }
  }

  const apiKey = req.headers['x-api-key'];
  if (!apiKey) {
    return res.status(401).json({
      error: 'Authentication required. Provide x-api-key header or Authorization Bearer token.',
    });
  }

  const record = apiKeyRepo.findByKey(apiKey);
  if (!record) {
    logger.warn('Invalid API key attempt', { apiKey });
    return res.status(403).json({ error: 'Invalid or inactive API key' });
  }

  req.user = { owner: record.owner };
  req.apiKey = apiKey;
  next();
}

function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, { expiresIn: config.jwt.expiresIn });
}

module.exports = { authenticate, generateToken };
