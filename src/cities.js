'use strict';
// Built-in cities for the `zmanim` segment. Use one by name
// (options.city = "Jerusalem") or give your own object:
// { "name": "Haifa", "lat": 32.794, "lon": 34.989, "tz": "Asia/Jerusalem", "candles": 30 }
// `candles` = minutes before sunset for Friday candle lighting (default 18).

const cities = {
  Jerusalem: { lat: 31.778, lon: 35.235, tz: 'Asia/Jerusalem', candles: 40 },
  'Tel Aviv': { lat: 32.0853, lon: 34.7818, tz: 'Asia/Jerusalem', candles: 18 },
  Haifa: { lat: 32.794, lon: 34.9896, tz: 'Asia/Jerusalem', candles: 30 },
  'Beer Sheva': { lat: 31.2518, lon: 34.7913, tz: 'Asia/Jerusalem', candles: 18 },
  'New York': { lat: 40.7128, lon: -74.006, tz: 'America/New_York', candles: 18 },
  'Crown Heights': { lat: 40.6694, lon: -73.9422, tz: 'America/New_York', candles: 18 },
  'Los Angeles': { lat: 34.0522, lon: -118.2437, tz: 'America/Los_Angeles', candles: 18 },
  Miami: { lat: 25.7617, lon: -80.1918, tz: 'America/New_York', candles: 18 },
  Toronto: { lat: 43.6532, lon: -79.3832, tz: 'America/Toronto', candles: 18 },
  London: { lat: 51.5074, lon: -0.1278, tz: 'Europe/London', candles: 18 },
  Paris: { lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris', candles: 18 },
  Berlin: { lat: 52.52, lon: 13.405, tz: 'Europe/Berlin', candles: 18 },
  Moscow: { lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow', candles: 18 },
  Kyiv: { lat: 50.4501, lon: 30.5234, tz: 'Europe/Kyiv', candles: 18 },
  Dnipro: { lat: 48.4647, lon: 35.0462, tz: 'Europe/Kyiv', candles: 18 },
  Minsk: { lat: 53.9006, lon: 27.559, tz: 'Europe/Minsk', candles: 18 },
  Antwerp: { lat: 51.2194, lon: 4.4025, tz: 'Europe/Brussels', candles: 18 },
  Melbourne: { lat: -37.8136, lon: 144.9631, tz: 'Australia/Melbourne', candles: 18 },
  'Buenos Aires': { lat: -34.6037, lon: -58.3816, tz: 'America/Argentina/Buenos_Aires', candles: 18 },
  Johannesburg: { lat: -26.2041, lon: 28.0473, tz: 'Africa/Johannesburg', candles: 18 },
};

function resolveCity(c) {
  if (!c) return null;
  if (typeof c === 'object') return c.lat != null && c.lon != null && c.tz ? { candles: 18, name: '', ...c } : null;
  const key = Object.keys(cities).find((k) => k.toLowerCase() === String(c).toLowerCase());
  return key ? { name: key, ...cities[key] } : null;
}

module.exports = { cities, resolveCity };
