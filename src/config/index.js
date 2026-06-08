require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-me',
    expiresIn: '24h',
  },

  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
  },

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 60000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 60,
  },

  cacheTTL: {
    weather: parseInt(process.env.CACHE_TTL_WEATHER, 10) || 300,
    news: parseInt(process.env.CACHE_TTL_NEWS, 10) || 300,
    crypto: parseInt(process.env.CACHE_TTL_CRYPTO, 10) || 60,
  },

  apis: {
    openWeatherMap: {
      baseUrl: 'https://api.openweathermap.org/data/2.5',
      apiKey: process.env.OPENWEATHERMAP_API_KEY,
    },
    newsApi: {
      baseUrl: 'https://newsapi.org/v2',
      apiKey: process.env.NEWSAPI_API_KEY,
    },
    coinGecko: {
      baseUrl: 'https://api.coingecko.com/api/v3',
    },
  },
};
