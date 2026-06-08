const axios = require('axios');
const config = require('../config');

async function fetchNews(topic, pageSize = 5) {
  const { data } = await axios.get(
    `${config.apis.newsApi.baseUrl}/everything`,
    {
      params: {
        q: topic,
        pageSize,
        sortBy: 'publishedAt',
        language: 'en',
      },
      headers: {
        'X-Api-Key': config.apis.newsApi.apiKey,
      },
      timeout: 10000,
    }
  );

  return {
    topic,
    totalResults: data.totalResults,
    articles: (data.articles || []).map((a) => ({
      title: a.title,
      source: a.source?.name,
      url: a.url,
      publishedAt: a.publishedAt,
      description: a.description,
    })),
  };
}

module.exports = { fetchNews };
