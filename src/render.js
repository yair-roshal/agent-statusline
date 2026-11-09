'use strict';
const { byId } = require('./segments');
const { colorsFor } = require('./themes');
const { words } = require('./i18n');
const claude = require('./adapters/claude');

const adapters = [claude];
const ESC = '\x1b[';
const reset = `${ESC}0m`;
const fg = (n) => `${ESC}38;5;${n}m`;
const bg = (n) => `${ESC}48;5;${n}m`;

function normalize(input, agent) {
  const a = adapters.find((x) => x.id === agent) || adapters.find((x) => x.detect(input)) || claude;
  return a.normalize(input || {});
}

function renderSegment(id, d, c) {
  const s = byId[id];
  if (!s) return null;
  try {
    const r = s.render(d, c);
    if (!r || !r.text) return null;
    const icons = c.o.icons !== false;
    const text = icons && r.icon ? `${r.icon} ${r.text}` : r.text;
    const cell = r.cell && { ...r.cell, text: icons && r.icon ? `${r.icon} ${r.cell.text}` : r.cell.text };
    const rich = r.rich && r.rich.filter((x) => icons || !x.icon);
    return { id, text, level: r.level || 'ok', cell, rich };
  } catch {
    return null; // one broken segment must never break the whole line
  }
}

function paintPlain(parts, cfg, color) {
  if (!color) return parts.map((p) => p.text).join('  ·  ');
  const t = require('./themes').themes[cfg.theme] || require('./themes').themes.default;
  const sep = `${fg(t.sep)} │ ${reset}`;
  return parts.map((p) => `${ESC}1m${fg(colorsFor(cfg.theme, p.id, p.level)[0])}${p.text}${reset}`).join(sep);
}

function paintPowerline(parts, cfg, color) {
  if (!color) return parts.map((p) => ` ${p.text} `).join('');
  let out = '';
  parts.forEach((p, i) => {
    const [f, b] = colorsFor(cfg.theme, p.id, p.level);
    if (i > 0) {
      const prev = colorsFor(cfg.theme, parts[i - 1].id, parts[i - 1].level)[1];
      out += `${fg(prev)}${bg(b)}`;
    }
    out += `${bg(b)}${fg(f)} ${p.text} `;
  });
  const last = colorsFor(cfg.theme, parts[parts.length - 1].id, parts[parts.length - 1].level)[1];
  return out + `${reset}${fg(last)}${reset}`;
}

function paintCapsule(parts, cfg, color) {
  if (!color) return parts.map((p) => `(${p.text})`).join(' ');
  return parts
    .map((p) => {
      const [f, b] = colorsFor(cfg.theme, p.id, p.level);
      return `${fg(b)}${bg(b)}${fg(f)}${p.text}${reset}${fg(b)}${reset}`;
    })
    .join(' ');
}

// "cells": truecolor blocks with an arrow and a grey caption after them
// (limits / context), colored text for everything else.
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(';');
const fgx = (h) => `${ESC}38;2;${hex(h)}m`;
const bgx = (h) => `${ESC}48;2;${hex(h)}m`;
const CELL = {
  limit5h: ['#cfe6f5', '#3a5c72'], limitWeek: ['#d8eefb', '#48677c'], context: ['#ffffff', '#6a6a6a'],
  shells: ['#1a1a1a', '#ffb454'], warn: ['#4a3c00', '#f5e6a8'], crit: ['#5c1a16', '#f2b8b5'],
};
const INK = {
  gold: '#ffd75f', sky: '#87d7ff', orange: '#ff8f6b', violet: '#d7afff', sand: '#f5deb3',
  green: '#a6e3a1', yellow: '#f9e2af', red: '#f38ba8', grey: '#a8a8a8', dim: '#6c6c6c', label: '#9a9a9a',
};

function paintCells(parts, cfg, color) {
  if (!color) {
    return parts.map((p) => (p.cell ? `[${p.cell.text}] ${p.cell.label}` : p.rich ? p.rich.map((x) => x.t).join('') : p.text)).join('  ');
  }
  return parts
    .map((p) => {
      if (p.cell) {
        const [f, b] = (p.id !== 'shells' && p.level !== 'ok' && CELL[p.level]) || CELL[p.id] || CELL.context;
        const B = p.cell.bold ? `${ESC}1m` : '';
        return `${bgx(b)}${fgx(f)}${B} ${p.cell.text} ${reset}${fgx(b)}\uE0B0${reset}${B}${fgx(INK[p.cell.labelColor] || INK.label)}${p.cell.label}${reset}`;
      }
      if (p.rich) {
        return p.rich.map((x) => `${fgx(INK[x.c] || INK.grey)}${x.t}${reset}`).join('');
      }
      return `${fg(colorsFor(cfg.theme, p.id, p.level)[0])}${p.text}${reset}`;
    })
    .join('  ');
}

const styles = { cells: paintCells, plain: paintPlain, powerline: paintPowerline, capsule: paintCapsule };

/** input: raw agent JSON; returns the full multi-line string. */
function render(input, cfg, { now = Date.now(), agent, color = !process.env.NO_COLOR } = {}) {
  const d = normalize(input, agent);
  const c = { now, o: cfg.options || {}, w: words((cfg.options || {}).lang) };
  const paint = styles[cfg.style] || paintPlain;
  const pad = ' '.repeat(c.o.indent || 0);
  const out = [];
  for (const line of cfg.lines || []) {
    const parts = line.map((id) => renderSegment(id, d, c)).filter(Boolean);
    if (parts.length) out.push(pad + paint(parts, cfg, color));
  }
  return out.join('\n');
}

module.exports = { render, normalize, styles: Object.keys(styles) };
