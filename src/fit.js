'use strict';
// Keep every status line narrower than the terminal. A line that wraps makes the
// host UI miscount its rows, and old frames are left behind as duplicated lines.
const fs = require('fs');
const tty = require('tty');

const MARGIN = 3;

function termColumns() {
  const env = parseInt(process.env.AGENT_STATUSLINE_COLUMNS || process.env.COLUMNS, 10);
  if (env > 0) return env;
  for (const s of [process.stdout, process.stderr]) if (s && s.isTTY && s.columns) return s.columns;
  try {
    const fd = fs.openSync('/dev/tty', 'r');
    try { const c = new tty.WriteStream(fd).columns; if (c > 0) return c; } finally { try { fs.closeSync(fd); } catch {} }
  } catch {}
  return 0; // unknown → do not cut
}

// BMP symbols that are emoji by default (East Asian Width "W") → 2 columns
const WIDE_BMP = [
  [0x231a, 0x231b], [0x23e9, 0x23ec], [0x23f0, 0x23f0], [0x23f3, 0x23f3], [0x25fd, 0x25fe], [0x2614, 0x2615],
  [0x2648, 0x2653], [0x267f, 0x267f], [0x2693, 0x2693], [0x26a1, 0x26a1], [0x26aa, 0x26ab], [0x26bd, 0x26be],
  [0x26c4, 0x26c5], [0x26ce, 0x26ce], [0x26d4, 0x26d4], [0x26ea, 0x26ea], [0x26f2, 0x26f3], [0x26f5, 0x26f5],
  [0x26fa, 0x26fa], [0x26fd, 0x26fd], [0x2705, 0x2705], [0x270a, 0x270b], [0x2728, 0x2728], [0x274c, 0x274c],
  [0x274e, 0x274e], [0x2753, 0x2755], [0x2757, 0x2757], [0x2795, 0x2797], [0x27b0, 0x27b0], [0x27bf, 0x27bf],
  [0x2b1b, 0x2b1c], [0x2b50, 0x2b50], [0x2b55, 0x2b55],
];

function charWidth(cp) {
  if (cp === 0x200d || (cp >= 0xfe00 && cp <= 0xfe0f) || (cp >= 0x0300 && cp <= 0x036f)) return 0;
  if (cp >= 0x2300 && cp <= 0x2bff && WIDE_BMP.some(([a, b]) => cp >= a && cp <= b)) return 2;
  if (cp >= 0x1f000 || (cp >= 0x1100 && cp <= 0x115f) || (cp >= 0x2e80 && cp <= 0xa4cf) ||
      (cp >= 0xac00 && cp <= 0xd7a3) || (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0xff00 && cp <= 0xff60)) return 2;
  return 1;
}

const ANSI = /^\x1b\[[0-9;]*[A-Za-z]/;

function fitLine(line, max) {
  let out = '', w = 0, i = 0;
  while (i < line.length) {
    const m = line[i] === '\x1b' && ANSI.exec(line.slice(i));
    if (m) { out += m[0]; i += m[0].length; continue; }
    const cp = line.codePointAt(i);
    const ch = String.fromCodePoint(cp);
    const cw = charWidth(cp);
    if (w + cw > max - 1) {
      // is there anything visible left? if not, the line already fits
      if (w + visibleWidth(line.slice(i)) <= max) return line;
      return out + '…\x1b[0m';
    }
    out += ch; w += cw; i += ch.length;
  }
  return out;
}

function visibleWidth(s) {
  let w = 0;
  for (const ch of s.replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')) w += charWidth(ch.codePointAt(0));
  return w;
}

function fit(text, cols = termColumns()) {
  if (!cols) return text;
  const max = Math.max(10, cols - MARGIN);
  return text.split('\n').map((l) => fitLine(l, max)).join('\n');
}

module.exports = { fit, termColumns, visibleWidth };
