'use strict';
const os = require('os');
const path = require('path');
const fs = require('fs');

const home = os.homedir();
const configDir = process.env.AGENT_STATUSLINE_HOME || path.join(process.env.XDG_CONFIG_HOME || path.join(home, '.config'), 'agent-statusline');
const cacheDir = path.join(process.env.XDG_CACHE_HOME || path.join(home, '.cache'), 'agent-statusline');

const paths = {
  configDir,
  config: process.env.AGENT_STATUSLINE_CONFIG || path.join(configDir, 'config.json'),
  cacheDir,
  lastInput: path.join(cacheDir, 'last-input.json'),
  installState: path.join(configDir, 'install-state.json'),
  claudeSettings: path.join(process.env.CLAUDE_CONFIG_DIR || path.join(home, '.claude'), 'settings.json'),
};

function ensureDir(dir) {
  try { fs.mkdirSync(dir, { recursive: true }); } catch {}
}

// Small file cache so slow segments (git) don't run on every redraw.
function cached(key, ttlMs, fn) {
  const file = path.join(cacheDir, `c-${key.replace(/[^a-z0-9_-]/gi, '_').slice(-120)}.json`);
  try {
    const st = fs.statSync(file);
    if (Date.now() - st.mtimeMs < ttlMs) return JSON.parse(fs.readFileSync(file, 'utf8')).v;
  } catch {}
  const v = fn();
  try { ensureDir(cacheDir); fs.writeFileSync(file, JSON.stringify({ v })); } catch {}
  return v;
}

module.exports = { paths, ensureDir, cached };
