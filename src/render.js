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
    const text = c.o.icons !== false && r.icon ? `${r.icon} ${r.text}` : r.text;
    return { id, text, level: r.level || 'ok' };
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

const styles = { plain: paintPlain, powerline: paintPowerline, capsule: paintCapsule };

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
