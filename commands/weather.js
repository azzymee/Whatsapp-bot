// commands/weather.js
// Current weather via the OpenWeatherMap API. Requires WEATHER_API_KEY
// in .env — get a free one at https://openweathermap.org/api.

const config = require('../config/config');
const logger = require('../lib/logger');

module.exports = {
  name: 'weather',
  emoji: '⛅',
  aliases: ['wthr'],
  category: 'utility',
  description: 'Shows current weather for a city. Usage: .weather <city>',
  usage: '.weather <city>',
  async execute({ sock, from, text, prefix }) {
    if (!config.weatherApiKey) {
      await sock.sendMessage(from, {
        text:
          "Weather isn't configured yet. Get a free key at " +
          'https://openweathermap.org/api and set WEATHER_API_KEY in your .env file.',
      });
      return;
    }
    if (!text) {
      await sock.sendMessage(from, { text: `Usage: ${prefix}weather <city name>` });
      return;
    }

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        text
      )}&appid=${config.weatherApiKey}&units=metric`;
      const res = await fetch(url);
      const data = await res.json();

      if (String(data.cod) !== '200') {
        throw new Error(data.message || 'City not found.');
      }

      const desc = data.weather?.[0]?.description || 'unknown';
      const reply =
        `🌤️ *Weather in ${data.name}, ${data.sys?.country || ''}*\n\n` +
        `Condition: ${desc}\n` +
        `Temperature: ${data.main.temp}°C (feels like ${data.main.feels_like}°C)\n` +
        `Humidity: ${data.main.humidity}%\n` +
        `Wind: ${data.wind.speed} m/s`;

      await sock.sendMessage(from, { text: reply });
    } catch (err) {
      logger.error({ err }, 'weather command failed');
      await sock.sendMessage(from, { text: `❌ Couldn't get the weather: ${err.message}` });
    }
  },
};
