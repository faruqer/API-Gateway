const express = require('express');
const router = express.Router();
const { fetchWeather } = require('../services/weatherService');
const { fetchNews } = require('../services/newsService');
const { fetchCryptoPrice } = require('../services/cryptoService');
const { cacheMiddleware } = require('../middleware/cache');
const config = require('../config');
const logger = require('../utils/logger');

router.get('/', cacheMiddleware(config.cacheTTL.weather), async (req, res) => {
  const { city, crypto, topic } = req.query;

  if (!city && !crypto && !topic) {
    return res.status(400).json({
      error: 'At least one query parameter is required: city, crypto, or topic.',
      example: '/dashboard?city=London&crypto=BTC&topic=technology',
    });
  }

  const results = {};
  const errors = {};

  const promises = [];

  if (city) {
    promises.push(
      fetchWeather(city)
        .then((data) => { results.weather = data; })
        .catch((err) => {
          logger.error('Dashboard – weather error', { city, error: err.message });
          errors.weather = err.response?.data?.message || err.message;
        })
    );
  }

  if (crypto) {
    promises.push(
      fetchCryptoPrice(crypto)
        .then((data) => { results.crypto = data; })
        .catch((err) => {
          logger.error('Dashboard – crypto error', { crypto, error: err.message });
          errors.crypto = err.response?.data?.message || err.message;
        })
    );
  }

  if (topic) {
    promises.push(
      fetchNews(topic)
        .then((data) => { results.news = data; })
        .catch((err) => {
          logger.error('Dashboard – news error', { topic, error: err.message });
          errors.news = err.response?.data?.message || err.message;
        })
    );
  }

  await Promise.all(promises);

  const response = { data: results };
  if (Object.keys(errors).length > 0) {
    response.errors = errors;
  }

  res.json(response);
});

module.exports = router;
