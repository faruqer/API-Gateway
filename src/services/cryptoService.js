const axios = require('axios');
const config = require('../config');

const SYMBOL_MAP = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  SOL: 'solana',
  DOGE: 'dogecoin',
  ADA: 'cardano',
  XRP: 'ripple',
  DOT: 'polkadot',
  MATIC: 'matic-network',
  LINK: 'chainlink',
  AVAX: 'avalanche-2',
};

async function fetchCryptoPrice(symbol) {
  const raw = Array.isArray(symbol) ? symbol[0] : symbol;
  const upper = (raw || 'BTC').toUpperCase();
  const coinId = SYMBOL_MAP[upper] || upper.toLowerCase();

  const { data } = await axios.get(
    `${config.apis.coinGecko.baseUrl}/simple/price`,
    {
      params: {
        ids: coinId,
        vs_currencies: 'usd',
        include_24hr_change: true,
        include_market_cap: true,
      },
      timeout: 10000,
    }
  );

  const coinData = data[coinId];
  if (!coinData) {
    return null;
  }

  return {
    symbol: upper,
    coinId,
    priceUsd: coinData.usd,
    change24h: coinData.usd_24h_change,
    marketCapUsd: coinData.usd_market_cap,
  };
}

module.exports = { fetchCryptoPrice, SYMBOL_MAP };
