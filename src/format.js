'use strict';

const MIN = 60e3, HOUR = 60 * MIN, DAY = 24 * HOUR;

// 3d 4h · 1h 50m · 12m · <1m
function dur(ms, u = { d: 'd', h: 'h', m: 'm' }) {
  if (ms == null || !Number.isFinite(ms)) return '';
  if (ms < MIN) return `<1${u.m}`;
  const d = Math.floor(ms / DAY), h = Math.floor((ms % DAY) / HOUR), m = Math.floor((ms % HOUR) / MIN);
  if (d) return h ? `${d}${u.d} ${h}${u.h}` : `${d}${u.d}`;
  if (h) return m ? `${h}${u.h} ${m}${u.m}` : `${h}${u.h}`;
  return `${m}${u.m}`;
}

// 59k · 1.2M
function tokens(n) {
  if (n == null) return '';
  if (n >= 1e6) return `${+(n / 1e6).toFixed(n >= 1e7 ? 0 : 1)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}k`;
  return String(n);
}

function usd(v) {
  if (v == null) return '';
  return v < 10 ? `$${v.toFixed(2)}` : `$${v.toFixed(1)}`;
}

// HH:MM in the given IANA zone (or local time).
function clock(ms, tz) {
  return new Date(ms).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, ...(tz ? { timeZone: tz } : {}) });
}

// Day label for a timestamp relative to today: '' (today), 'tomorrow', 'Mon'.
function dayLabel(ms, now = Date.now(), tz) {
  const opt = tz ? { timeZone: tz } : {};
  const key = (t) => new Date(t).toLocaleDateString('en-CA', opt);
  if (key(ms) === key(now)) return '';
  if (key(ms) === key(now + DAY)) return 'tomorrow';
  return new Date(ms).toLocaleDateString('en-GB', { weekday: 'short', ...opt });
}

// ▰▰▰▱▱▱
function bar(pct, width = 10, style = 'blocks') {
  const p = Math.max(0, Math.min(100, pct || 0));
  const chars = { blocks: ['▰', '▱'], line: ['━', '─'], dots: ['●', '○'], shade: ['█', '░'] }[style] || ['▰', '▱'];
  const full = Math.round((p / 100) * width);
  return chars[0].repeat(full) + chars[1].repeat(width - full);
}

function level(pct, warn = 60, crit = 85) {
  if (pct == null) return 'ok';
  return pct >= crit ? 'crit' : pct >= warn ? 'warn' : 'ok';
}

module.exports = { MIN, HOUR, DAY, dur, tokens, usd, clock, dayLabel, bar, level };
