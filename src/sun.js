'use strict';
// Sunrise / sunset / sun-below-horizon times without dependencies
// (US Naval Observatory "Almanac for Computers" algorithm, accuracy ~1 minute).

const RAD = Math.PI / 180;
const sin = (d) => Math.sin(d * RAD), cos = (d) => Math.cos(d * RAD), tan = (d) => Math.tan(d * RAD);
const asin = (x) => Math.asin(x) / RAD, acos = (x) => Math.acos(x) / RAD, atan = (x) => Math.atan(x) / RAD;
const mod = (a, b) => ((a % b) + b) % b;

// Local calendar date (YYYY-MM-DD) of a moment in the zone tz.
function ymdIn(ms, tz) {
  return new Date(ms).toLocaleDateString('en-CA', { timeZone: tz });
}

/**
 * Moment (ms) when the sun reaches `zenith` degrees on local date ymd.
 * zenith 90.833 = sunrise/sunset, 98.5 = 8.5° below the horizon (tzeit).
 */
function sunEvent(ymd, lat, lon, tz, zenith, rising) {
  const [y, m, d] = ymd.split('-').map(Number);
  const N = Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 0)) / 864e5);
  const lngHour = lon / 15;
  const t = N + ((rising ? 6 : 18) - lngHour) / 24;
  const M = 0.9856 * t - 3.289;
  const L = mod(M + 1.916 * sin(M) + 0.02 * sin(2 * M) + 282.634, 360);
  let RA = mod(atan(0.91764 * tan(L)), 360);
  RA = (RA + (Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90)) / 15;
  const sinDec = 0.39782 * sin(L);
  const cosDec = cos(asin(sinDec));
  const cosH = (cos(zenith) - sinDec * sin(lat)) / (cosDec * cos(lat));
  if (cosH > 1 || cosH < -1) return null; // polar day / night
  const H = (rising ? 360 - acos(cosH) : acos(cosH)) / 15;
  const UT = H + RA - 0.06571 * t - 6.622 - lngHour;
  let ms = Date.UTC(y, m - 1, d) + mod(UT, 24) * 36e5;
  // Shift by a day if the UTC time landed on a neighbouring local date.
  for (let i = 0; i < 2 && ymdIn(ms, tz) !== ymd; i++) ms += ymdIn(ms, tz) < ymd ? 864e5 : -864e5;
  return ms;
}

function dayTimes(ymd, { lat, lon, tz }) {
  return {
    sunrise: sunEvent(ymd, lat, lon, tz, 90.833, true),
    sunset: sunEvent(ymd, lat, lon, tz, 90.833, false),
    tzeit: sunEvent(ymd, lat, lon, tz, 98.5, false),
  };
}

module.exports = { sunEvent, dayTimes, ymdIn };
