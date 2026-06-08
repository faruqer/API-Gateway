const config = require('../config');
const logger = require('../utils/logger');

const buckets = new Map();

function rateLimiter(req, res, next) {
  const key = req.apiKey || req.ip;
  const now = Date.now();
  const { windowMs, maxRequests } = config.rateLimit;

  if (!buckets.has(key)) {
    buckets.set(key, []);
  }

  const timestamps = buckets.get(key);

  while (timestamps.length && timestamps[0] <= now - windowMs) {
    timestamps.shift();
  }

  if (timestamps.length >= maxRequests) {
    logger.warn('Rate limit exceeded', { key, count: timestamps.length });
    res.set('Retry-After', Math.ceil(windowMs / 1000));
    return res.status(429).json({
      error: 'Too many requests. Please try again later.',
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    });
  }

  timestamps.push(now);

  res.set('X-RateLimit-Limit', String(maxRequests));
  res.set('X-RateLimit-Remaining', String(maxRequests - timestamps.length));
  res.set('X-RateLimit-Reset', String(Math.ceil((timestamps[0] + windowMs) / 1000)));

  next();
}

setInterval(() => {
  const now = Date.now();
  const { windowMs } = config.rateLimit;
  for (const [key, timestamps] of buckets) {
    while (timestamps.length && timestamps[0] <= now - windowMs) {
      timestamps.shift();
    }
    if (timestamps.length === 0) {
      buckets.delete(key);
    }
  }
}, 5 * 60 * 1000);

module.exports = rateLimiter;
