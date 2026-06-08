const express = require('express');
const router = express.Router();
const { fetchCryptoPrice } = require('../services/cryptoService');
const { cacheMiddleware } = require('../middleware/cache');
const config = require('../config');
const logger = require('../utils/logger');

router.get('/', cacheMiddleware(config.cacheTTL.crypto), async (req, res) => {
  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'Query parameter "symbol" is required. Example: /crypto?symbol=BTC' });
  }

  try {
    const data = await fetchCryptoPrice(symbol);
    if (!data) {
      return res.status(404).json({ error: `Crypto symbol "${symbol}" not found` });
    }
    res.json({ source: 'coingecko', data });
  } catch (err) {
    logger.error('Crypto API error', { symbol, error: err.message });
    const status = err.response?.status || 502;
    res.status(status).json({
      error: 'Failed to fetch crypto data',
      details: err.response?.data?.message || err.message,
    });
  }
});

module.exports = router;
