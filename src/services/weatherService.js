const axios = require('axios');
const config = require('../config');

async function fetchWeather(city) {
  const { data } = await axios.get(
    `${config.apis.openWeatherMap.baseUrl}/weather`,
    {
      params: {
        q: city,
        appid: config.apis.openWeatherMap.apiKey,
        units: 'metric',
      },
      timeout: 10000,
    }
  );

  return {
    city: data.name,
    country: data.sys?.country,
    temperature: data.main?.temp,
    feelsLike: data.main?.feels_like,
    humidity: data.main?.humidity,
    description: data.weather?.[0]?.description,
    windSpeed: data.wind?.speed,
    icon: data.weather?.[0]?.icon,
  };
}

module.exports = { fetchWeather };
