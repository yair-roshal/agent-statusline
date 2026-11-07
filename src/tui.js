'use strict';
// Interactive picker: one screen, arrows + space, live preview, Enter saves.

const fs = require('fs');
const { segments } = require('./segments');
const { presets } = require('./presets');
const { themes } = require('./themes');
const { languages } = require('./i18n');
const cfgLib = require('./config');
const { render, styles } = require('./render');
const { paths } = require('./paths');
const { sampleClaudeInput } = require('./sample');

const ESC = '\x1b[';
const dim = (s) => `${ESC}2m${s}${ESC}0m`;
const bold = (s) => `${ESC}1m${s}${ESC}0m`;
const inv = (s) => `${ESC}7m${s}${ESC}0m`;
const cyan = (s) => `${ESC}36m${s}${ESC}0m`;
const green = (s) => `${ESC}32m${s}${ESC}0m`;

const UI = {
  en: {
    title: 'agent-statusline — choose what your status line shows',
    keys: '↑↓ move   space on/off   ←→ line   [ ] reorder   p preset   s style   t theme   g language   i icons   enter save   q quit',
    preview: 'Preview', sample: '(demo data — real data appears after the first run inside Claude Code)', real: '(your last real session data)',
    saved: 'Saved to', notInstalled: 'Not connected to Claude Code yet — run: agent-statusline install', unsaved: 'unsaved',
  },
  ru: {
    title: 'agent-statusline — выбери, что показывать в строке статуса',
    keys: '↑↓ выбор   пробел вкл/выкл   ←→ строка   [ ] порядок   p пресет   s стиль   t тема   g язык   i иконки   enter сохранить   q выход',
    preview: 'Предпросмотр', sample: '(демо-данные — реальные появятся после первого запуска в Claude Code)', real: '(данные твоей последней сессии)',
    saved: 'Сохранено в', notInstalled: 'Ещё не подключено к Claude Code — выполни: agent-statusline install', unsaved: 'не сохранено',
  },
};

function itemsFromLines(lines) {
  const items = [];
  lines.forEach((ids, i) => ids.forEach((id) => segments.some((s) => s.id === id) && items.push({ id, on: true, line: i + 1 })));
  for (const s of segments) if (!items.some((x) => x.id === s.id)) items.push({ id: s.id, on: false, line: 1 });
  return items;
}

function linesFromItems(items) {
  const max = Math.max(0, ...items.filter((x) => x.on).map((x) => x.line));
  const out = [];
  for (let l = 1; l <= max; l++) {
    const ids = items.filter((x) => x.on && x.line === l).map((x) => x.id);
    if (ids.length) out.push(ids);
  }
  return out;
}

function sortItems(items) {
  // stable: enabled by line, then disabled in their current order
  return items.map((x, i) => ({ x, i })).sort((a, b) => (a.x.on ? a.x.line : 99) - (b.x.on ? b.x.line : 99) || a.i - b.i).map((o) => o.x);
}

function loadPreviewInput() {
  try { return { input: JSON.parse(fs.readFileSync(paths.lastInput, 'utf8')), real: true }; } catch {}
  return { input: sampleClaudeInput(), real: false };
}

function run({ installed }) {
  if (!process.stdin.isTTY) {
    console.error('agent-statusline config needs an interactive terminal.');
    process.exit(1);
  }
  const cfg = cfgLib.load();
  let items = sortItems(itemsFromLines(cfg.lines));
  let cur = 0;
  let dirty = false;
  let flash = '';
  const preview = loadPreviewInput();
  const out = process.stdout;

  const cycle = (list, v) => list[(list.indexOf(v) + 1) % list.length];

  function draw() {
    const L = UI[cfg.options.lang] || UI.en;
    const lang = cfg.options.lang;
    const cols = out.columns || 100;
    const lines = [];
    lines.push(bold(L.title) + (dirty ? '  ' + cyan(`● ${L.unsaved}`) : ''));
    lines.push(dim(L.keys));
    lines.push(
      `preset ${cyan(cfg.preset || 'custom')}   style ${cyan(cfg.style)}   theme ${cyan(cfg.theme)}   lang ${cyan(lang)}   icons ${cyan(cfg.options.icons !== false ? 'on' : 'off')}`,
    );
    lines.push('');
    let lastLine = null;
    items.forEach((it, i) => {
      const s = segments.find((x) => x.id === it.id);
      const group = it.on ? `L${it.line}` : '  ';
      if (it.on && it.line !== lastLine) lastLine = it.line;
      if (!it.on && lastLine !== 'off') { lastLine = 'off'; lines.push(dim('  ── off ──')); }
      const box = it.on ? green('[x]') : '[ ]';
      const desc = (s.desc[lang] || s.desc.en);
      let row = `${box} ${it.on ? cyan(group) : group}  ${it.id.padEnd(13)} ${dim(desc)}`;
      if (row.length > cols + 30) row = row.slice(0, cols + 27) + '…';
      lines.push(i === cur ? inv(' ' + `${it.on ? '[x]' : '[ ]'} ${group}  ${it.id.padEnd(13)} ${desc}`.slice(0, cols - 2) + ' ') : ' ' + row);
    });
    lines.push('');
    lines.push(bold(L.preview) + ' ' + dim(preview.real ? L.real : L.sample));
    const pv = render(preview.input, { ...cfg, lines: linesFromItems(items) });
    lines.push(pv || dim('—'));
    lines.push('');
    if (flash) lines.push(flash);
    else if (!installed()) lines.push(dim(L.notInstalled));
    out.write(`${ESC}H${ESC}2J` + lines.join('\n') + '\n');
  }

  function changed() { dirty = true; cfg.preset = 'custom'; flash = ''; }

  function key(k) {
    const it = items[cur];
    const id = it && it.id;
    const refocus = () => { items = sortItems(items); cur = items.findIndex((x) => x.id === id); };
    switch (k) {
      case '\u001b[A': case 'k': cur = (cur - 1 + items.length) % items.length; break;
      case '\u001b[B': case 'j': cur = (cur + 1) % items.length; break;
      case ' ': it.on = !it.on; changed(); refocus(); break;
      case '\u001b[C': case 'l': it.line = Math.min(9, (it.on ? it.line : 0) + 1); it.on = true; changed(); refocus(); break;
      case '\u001b[D': case 'h': if (it.on) { if (it.line > 1) it.line--; else it.on = false; changed(); refocus(); } break;
      case '[': case ']': {
        const j = cur + (k === '[' ? -1 : 1);
        const o = items[j];
        if (o && o.on === it.on && (!it.on || o.line === it.line)) { items[cur] = o; items[j] = it; cur = j; changed(); }
        break;
      }
      case 'p': {
        const names = Object.keys(presets);
        const next = cycle(names, cfg.preset) || names[0];
        items = sortItems(itemsFromLines(presets[next].lines));
        cur = 0; dirty = true; cfg.preset = next;
        flash = cyan(`preset: ${next} — ${presets[next].desc[cfg.options.lang] || presets[next].desc.en}`);
        break;
      }
      case 's': cfg.style = cycle(styles, cfg.style); dirty = true; break;
      case 't': cfg.theme = cycle(Object.keys(themes), cfg.theme); dirty = true; break;
      case 'g': cfg.options.lang = cycle(languages, cfg.options.lang); dirty = true; break;
      case 'i': cfg.options.icons = cfg.options.icons === false; dirty = true; break;
      case '\r': case '\n': case 'w': {
        cfg.lines = linesFromItems(items);
        const file = cfgLib.save(cfg);
        dirty = false;
        flash = green(`✓ ${(UI[cfg.options.lang] || UI.en).saved} ${file}`);
        if (k !== 'w') return quit(0);
        break;
      }
      case 'q': case '\u001b': case '\u0003': return quit(0);
      default: return;
    }
    draw();
  }

  function quit(code) {
    out.write(`${ESC}?25h${ESC}?1049l`);
    if (flash) console.log(flash.replace(/\x1b\[[0-9;]*m/g, ''));
    process.exit(code);
  }

  out.write(`${ESC}?1049h${ESC}?25l`); // alternate screen, hide cursor
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (chunk) => {
    // arrows arrive as 3-char sequences; everything else one char at a time
    const re = /\u001b\[[A-D]|\u001b|[\s\S]/g;
    let m;
    while ((m = re.exec(chunk))) key(m[0]);
  });
  out.on('resize', draw);
  draw();
}

module.exports = { run, itemsFromLines, linesFromItems, sortItems };
