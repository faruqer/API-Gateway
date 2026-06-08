const express = require('express');
const router = express.Router();
const { fetchNews } = require('../services/newsService');
const { cacheMiddleware } = require('../middleware/cache');
const config = require('../config');
const logger = require('../utils/logger');

router.get('/', cacheMiddleware(config.cacheTTL.news), async (req, res) => {
  const { topic, pageSize } = req.query;

  if (!topic) {
    return res.status(400).json({ error: 'Query parameter "topic" is required. Example: /news?topic=technology' });
  }

  try {
    const data = await fetchNews(topic, parseInt(pageSize, 10) || 5);
    res.json({ source: 'newsapi', data });
  } catch (err) {
    logger.error('News API error', { topic, error: err.message });
    const status = err.response?.status || 502;
    res.status(status).json({
      error: 'Failed to fetch news data',
      details: err.response?.data?.message || err.message,
    });
  }
});

module.exports = router;
