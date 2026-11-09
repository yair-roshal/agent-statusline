'use strict';
const fs = require('fs');
const path = require('path');
const { paths, ensureDir } = require('./paths');
const { presets } = require('./presets');

const DEFAULT_OPTIONS = {
  lang: 'en',          // en | ru
  icons: true,
  indent: 0,           // spaces before each line
  barWidth: 10,
  barStyle: 'blocks',  // blocks | line | dots | shade
  windowWeeklyPct: 14, // how many % of the weekly limit one full 5h window eats
  city: 'Jerusalem',   // for zmanim: built-in name or { name, lat, lon, tz, candles }
  quotes: 'avot',      // avot | dev | stoic
  breakEvery: 90,      // minutes, for the `breathe` segment
};

function defaults() {
  return { preset: 'default', style: 'cells', theme: 'default', lines: clone(presets.default.lines), options: { ...DEFAULT_OPTIONS } };
}

const clone = (x) => JSON.parse(JSON.stringify(x));

function load(file = paths.config) {
  const base = defaults();
  let user = {};
  try { user = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  const cfg = { ...base, ...user, options: { ...base.options, ...(user.options || {}) } };
  if (!user.lines && user.preset && presets[user.preset]) cfg.lines = clone(presets[user.preset].lines);
  return cfg;
}

function save(cfg, file = paths.config) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n');
  return file;
}

function exists(file = paths.config) {
  return fs.existsSync(file);
}

module.exports = { load, save, exists, defaults, DEFAULT_OPTIONS, clone };
