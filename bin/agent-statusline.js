#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const cfgLib = require('../src/config');
const { render, styles } = require('../src/render');
const { segments, byId } = require('../src/segments');
const { presets } = require('../src/presets');
const { themes } = require('../src/themes');
const { cities } = require('../src/cities');
const { paths, ensureDir } = require('../src/paths');
const { sampleClaudeInput } = require('../src/sample');
const install = require('../src/install');

const [cmd, ...args] = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? undefined : args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true;
};

function readStdin() {
  try { return fs.readFileSync(0, 'utf8'); } catch { return ''; }
}

function isInstalled() {
  try {
    const s = JSON.parse(fs.readFileSync(paths.claudeSettings, 'utf8'));
    return !!(s.statusLine && String(s.statusLine.command || '').includes('agent-statusline'));
  } catch { return false; }
}

// ── status line mode: JSON on stdin → lines on stdout ──
function renderMode() {
  const raw = readStdin();
  let input = {};
  try { input = JSON.parse(raw || '{}'); } catch {}
  if (raw && input && typeof input === 'object' && Object.keys(input).length) {
    try { ensureDir(paths.cacheDir); fs.writeFileSync(paths.lastInput, raw); } catch {}
  }
  const cfg = cfgLib.load();
  process.stdout.write(require('../src/fit').fit(render(input, cfg)) + '\n');
}

function preview() {
  const cfg = cfgLib.load();
  const p = flag('preset');
  if (p && presets[p]) cfg.lines = presets[p].lines;
  if (typeof flag('style') === 'string') cfg.style = flag('style');
  if (typeof flag('theme') === 'string') cfg.theme = flag('theme');
  let input = sampleClaudeInput();
  if (!flag('sample')) { try { input = JSON.parse(fs.readFileSync(paths.lastInput, 'utf8')); } catch {} }
  console.log(render(input, cfg));
}

function list() {
  const lang = cfgLib.load().options.lang;
  const groups = {};
  for (const s of segments) (groups[s.group] = groups[s.group] || []).push(s);
  for (const [g, ss] of Object.entries(groups)) {
    console.log(`\n${g}:`);
    for (const s of ss) console.log(`  ${s.id.padEnd(14)} ${s.desc[lang] || s.desc.en}`);
  }
  console.log('\npresets:');
  for (const [k, v] of Object.entries(presets)) console.log(`  ${k.padEnd(14)} ${v.desc[lang] || v.desc.en}`);
  console.log(`\nstyles:  ${styles.join(', ')}   (powerline/capsule need a Nerd Font)`);
  console.log(`themes:  ${Object.keys(themes).join(', ')}`);
  console.log(`cities:  ${Object.keys(cities).join(', ')}`);
}

function mutate(fn) {
  const cfg = cfgLib.load();
  fn(cfg);
  console.log(`saved ${cfgLib.save(cfg)}`);
  console.log(render(sampleClaudeInputOrLast(), cfg));
}

function sampleClaudeInputOrLast() {
  try { return JSON.parse(fs.readFileSync(paths.lastInput, 'utf8')); } catch { return sampleClaudeInput(); }
}

function parseValue(v) {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v !== '' && !isNaN(v)) return Number(v);
  try { return JSON.parse(v); } catch { return v; }
}

const HELP = `agent-statusline — a configurable status line for Claude Code (Codex next)

  agent-statusline                  open the picker (arrows + space, live preview)
  agent-statusline install          connect to Claude Code (backs up settings.json)
  agent-statusline uninstall        restore your previous status line

  agent-statusline preset <name>    switch layout: ${Object.keys(presets).join(' | ')}
  agent-statusline add <id> [line]  show a segment (on line N, default: last line)
  agent-statusline remove <id>      hide a segment
  agent-statusline set <key> <val>  style, theme, or any option (lang, city, barWidth, quotes…)
  agent-statusline preview [--preset x] [--style y] [--theme z] [--sample]
  agent-statusline list             segments, presets, styles, themes, cities

Config: ${paths.config}`;

switch (cmd) {
  case undefined:
    if (process.stdin.isTTY) require('../src/tui').run({ installed: isInstalled });
    else renderMode();
    break;
  case 'render': renderMode(); break;
  case 'config': case 'ui': require('../src/tui').run({ installed: isInstalled }); break;
  case 'install': {
    const target = flag('target') || 'claude';
    if (target !== 'claude') { console.error(`Target "${target}" is not supported yet (Codex is on the roadmap).`); process.exit(1); }
    if (!cfgLib.exists()) {
      const cfg = cfgLib.defaults();
      const p = flag('preset');
      if (p && presets[p]) { cfg.preset = p; cfg.lines = presets[p].lines; }
      cfgLib.save(cfg);
    }
    const r = install.installClaude();
    console.log(r.already ? `Already installed in ${r.settingsFile}` : `✓ Installed into ${r.settingsFile}`);
    if (r.backup && !r.already) console.log(`  backup: ${r.backup}`);
    console.log(`  config: ${paths.config}\n  Next: run "agent-statusline" to pick segments. Changes apply on the next redraw.`);
    break;
  }
  case 'uninstall': {
    const r = install.uninstallClaude();
    console.log(r.restored ? `✓ Restored previous status line: ${r.restored.command || JSON.stringify(r.restored)}` : '✓ Status line removed');
    break;
  }
  case 'preset': {
    const name = args[0];
    if (!presets[name]) { console.error(`Unknown preset. Choose: ${Object.keys(presets).join(', ')}`); process.exit(1); }
    mutate((c) => { c.preset = name; c.lines = JSON.parse(JSON.stringify(presets[name].lines)); });
    break;
  }
  case 'add': {
    const [id, lineArg] = args;
    if (!byId[id]) { console.error(`Unknown segment "${id}". See: agent-statusline list`); process.exit(1); }
    mutate((c) => {
      c.lines = c.lines.map((l) => l.filter((x) => x !== id)).filter((l) => l.length);
      const n = lineArg ? Math.max(1, parseInt(lineArg, 10)) : c.lines.length || 1;
      while (c.lines.length < n) c.lines.push([]);
      c.lines[n - 1].push(id);
      c.preset = 'custom';
    });
    break;
  }
  case 'remove': case 'rm':
    mutate((c) => { c.lines = c.lines.map((l) => l.filter((x) => x !== args[0])).filter((l) => l.length); c.preset = 'custom'; });
    break;
  case 'set': {
    const [key, ...rest] = args;
    if (!key || !rest.length) { console.error('Usage: agent-statusline set <key> <value>'); process.exit(1); }
    const val = parseValue(rest.join(' '));
    mutate((c) => { if (key === 'style' || key === 'theme') c[key] = val; else c.options[key] = val; });
    break;
  }
  case 'preview': preview(); break;
  case 'list': case 'ls': list(); break;
  case 'path': console.log(paths.config); break;
  case 'help': case '--help': case '-h': console.log(HELP); break;
  case '--version': case '-v': console.log(require(path.join(__dirname, '..', 'package.json')).version); break;
  default: console.error(`Unknown command "${cmd}"\n\n${HELP}`); process.exit(1);
}
