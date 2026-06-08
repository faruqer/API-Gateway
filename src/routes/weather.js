const express = require('express');
const router = express.Router();
const { fetchWeather } = require('../services/weatherService');
const { cacheMiddleware } = require('../middleware/cache');
const config = require('../config');
const logger = require('../utils/logger');

router.get('/', cacheMiddleware(config.cacheTTL.weather), async (req, res) => {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ error: 'Query parameter "city" is required. Example: /weather?city=London' });
  }

  try {
    const data = await fetchWeather(city);
    res.json({ source: 'openweathermap', data });
  } catch (err) {
    logger.error('Weather API error', { city, error: err.message });
    const status = err.response?.status || 502;
    res.status(status).json({
      error: 'Failed to fetch weather data',
      details: err.response?.data?.message || err.message,
    });
  }
});

module.exports = router;
