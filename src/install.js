'use strict';
// Wire agent-statusline into the agent's settings, keeping the previous
// value so `uninstall` can put it back.

const fs = require('fs');
const path = require('path');
const { paths, ensureDir } = require('./paths');

const BIN = path.resolve(__dirname, '..', 'bin', 'agent-statusline.js');
const q = (s) => (/^[\w@%+=:,./-]+$/.test(s) ? s : `"${s.replace(/(["\\$`])/g, '\\$1')}"`);

function command() {
  // Absolute node path: the status line runs in a non-interactive shell where
  // nvm/Homebrew PATH tweaks are often missing.
  return `${q(process.execPath)} ${q(BIN)}`;
}

function readJson(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) {
    if (e.code === 'ENOENT') return {};
    throw new Error(`Cannot parse ${file}: ${e.message}`);
  }
}

function writeJson(file, obj) {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n');
}

function installClaude({ settingsFile = paths.claudeSettings } = {}) {
  const settings = readJson(settingsFile);
  const state = readJson(paths.installState);
  const cmd = command();
  const already = settings.statusLine && settings.statusLine.command === cmd;
  if (!already) {
    if (fs.existsSync(settingsFile)) {
      const backup = `${settingsFile}.bak-agent-statusline-${Date.now()}`;
      fs.copyFileSync(settingsFile, backup);
      state.claudeBackupFile = backup;
    }
    if (!('claudePrevious' in state)) state.claudePrevious = settings.statusLine ?? null;
    settings.statusLine = { type: 'command', command: cmd, padding: 0 };
    writeJson(settingsFile, settings);
    writeJson(paths.installState, state);
  }
  return { settingsFile, command: cmd, already, backup: state.claudeBackupFile };
}

function uninstallClaude({ settingsFile = paths.claudeSettings } = {}) {
  const settings = readJson(settingsFile);
  const state = readJson(paths.installState);
  const prev = state.claudePrevious;
  if (prev) settings.statusLine = prev;
  else delete settings.statusLine;
  writeJson(settingsFile, settings);
  delete state.claudePrevious;
  writeJson(paths.installState, state);
  return { settingsFile, restored: prev || null };
}

module.exports = { installClaude, uninstallClaude, command, BIN };
