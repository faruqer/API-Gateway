const Redis = require('ioredis');
const config = require('../config');
const logger = require('../utils/logger');

let redis;
let redisAvailable = false;

try {
  redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password || undefined,
    maxRetriesPerRequest: 1,
    retryStrategy(times) {
      if (times > 3) {
        logger.warn('Redis unavailable – caching disabled');
        redisAvailable = false;
        return null;
      }
      return Math.min(times * 200, 2000);
    },
  });

  redis.on('connect', () => {
    redisAvailable = true;
    logger.info('Redis connected');
  });

  redis.on('error', (err) => {
    redisAvailable = false;
    logger.warn('Redis error', { error: err.message });
  });
} catch (err) {
  logger.warn('Redis not available – caching disabled', { error: err.message });
}

function cacheMiddleware(ttl) {
  return async (req, res, next) => {
    if (!redisAvailable) return next();

    const cacheKey = `gw:${req.originalUrl}`;

    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        logger.debug('Cache HIT', { key: cacheKey });
        const parsed = JSON.parse(cached);
        return res.json({ ...parsed, _cached: true });
      }
    } catch (err) {
      logger.warn('Cache read error', { error: err.message });
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (redisAvailable && res.statusCode >= 200 && res.statusCode < 300) {
        redis.setex(cacheKey, ttl, JSON.stringify(body)).catch((err) => {
          logger.warn('Cache write error', { error: err.message });
        });
      }
      return originalJson(body);
    };

    next();
  };
}

function getRedis() {
  return redis;
}

module.exports = { cacheMiddleware, getRedis, isAvailable: () => redisAvailable };
