'use strict';
// Plain node tests: `npm test`. Uses a throwaway HOME so nothing real is touched.
const os = require('os');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'agent-statusline-test-'));
process.env.AGENT_STATUSLINE_HOME = path.join(tmp, 'config');
process.env.XDG_CACHE_HOME = path.join(tmp, 'cache');

const { render } = require('../src/render');
const cfgLib = require('../src/config');
const { presets } = require('../src/presets');
const { segments, forecast } = require('../src/segments');
const { dayTimes } = require('../src/sun');
const { clock, dur, HOUR, DAY } = require('../src/format');
const { sampleClaudeInput } = require('../src/sample');
const { itemsFromLines, linesFromItems, sortItems } = require('../src/tui');
const install = require('../src/install');
const { themes } = require('../src/themes');

let n = 0;
const test = (name, fn) => {
  try { fn(); n++; console.log(`✓ ${name}`); } catch (e) { console.error(`✗ ${name}\n  ${e.stack}`); process.exitCode = 1; }
};
const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');

test('every preset × style × theme renders without throwing', () => {
  for (const [name, p] of Object.entries(presets)) for (const style of ['plain', 'powerline', 'capsule']) for (const theme of Object.keys(themes)) {
    const out = render(sampleClaudeInput(), { ...cfgLib.defaults(), lines: p.lines, style, theme });
    assert.ok(strip(out).trim().length > 0, `${name}/${style}/${theme} empty`);
    assert.strictEqual(out.split('\n').length, p.lines.length, `${name} line count`);
  }
});

test('every segment renders with full data and survives empty input', () => {
  const cfg = { ...cfgLib.defaults(), lines: [segments.map((s) => s.id)], options: { ...cfgLib.DEFAULT_OPTIONS, text: 'hi', command: 'echo ok' } };
  const out = strip(render(sampleClaudeInput(), cfg));
  for (const w of ['Opus 5.5', 'my-app/src', '18%', '64%', '58%', '$1.84', '+214', 'cache', 'hi', 'ok']) assert.ok(out.includes(w), `missing ${w} in ${out}`);
  render({}, cfg);
  render(null, cfg);
  render({ model: 'weird', rate_limits: { five_hour: null } }, cfg);
});

test('russian language', () => {
  const cfg = { ...cfgLib.defaults(), lines: [['limit5h', 'windowsLeft']], options: { ...cfgLib.DEFAULT_OPTIONS, lang: 'ru' } };
  const out = strip(render(sampleClaudeInput(), cfg, { color: false }));
  assert.ok(out.includes('сброс 1ч'), out);
  assert.ok(out.includes('осталось 42%'), out);
});

test('forecast: fast burn hits 100% before reset, slow burn lasts', () => {
  const now = Date.now();
  // 1h into a 5h window, 50% used → 100% in another hour, reset in 4h
  const fast = forecast({ pct: 50, resetsAt: now + 4 * HOUR }, 5 * HOUR, now);
  assert.ok(Math.abs(fast.fullAt - (now + HOUR)) < 1000);
  const slow = forecast({ pct: 10, resetsAt: now + 1 * HOUR }, 5 * HOUR, now);
  assert.deepStrictEqual(slow, { ok: true });
  assert.strictEqual(forecast({ pct: 0, resetsAt: now + HOUR }, 5 * HOUR, now), null);
});

test('sun times match published Jerusalem zmanim (±2 min)', () => {
  const tz = 'Asia/Jerusalem';
  const t = dayTimes('2026-11-08', { lat: 31.778, lon: 35.235, tz });
  const mins = (ms) => { const [h, m] = clock(ms, tz).split(':').map(Number); return h * 60 + m; };
  assert.ok(Math.abs(mins(t.sunrise) - (6 * 60 + 1)) <= 2, clock(t.sunrise, tz));
  assert.ok(Math.abs(mins(t.sunset) - (16 * 60 + 44)) <= 2, clock(t.sunset, tz));
  assert.ok(Math.abs(mins(t.tzeit) - (17 * 60 + 21)) <= 2, clock(t.tzeit, tz));
  const la = dayTimes('2026-06-21', { lat: 34.0522, lon: -118.2437, tz: 'America/Los_Angeles' });
  assert.ok(la.sunrise < la.sunset && la.sunset < la.tzeit, 'LA order');
});

test('dur formatting', () => {
  assert.strictEqual(dur(3 * DAY + 4 * HOUR), '3d 4h');
  assert.strictEqual(dur(HOUR + 50 * 60e3), '1h 50m');
  assert.strictEqual(dur(30e3), '<1m');
});

test('picker items ⇄ lines round trip', () => {
  for (const p of Object.values(presets)) assert.deepStrictEqual(linesFromItems(sortItems(itemsFromLines(p.lines))), p.lines);
});

test('install / uninstall restores the previous status line', () => {
  const settingsFile = path.join(tmp, 'settings.json');
  const prev = { type: 'command', command: '/old/statusline.sh', padding: 0 };
  fs.writeFileSync(settingsFile, JSON.stringify({ model: 'opus', statusLine: prev }));
  const r = install.installClaude({ settingsFile });
  const after = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  assert.ok(after.statusLine.command.includes('agent-statusline.js'));
  assert.strictEqual(after.model, 'opus');
  assert.ok(fs.existsSync(r.backup));
  assert.ok(install.installClaude({ settingsFile }).already);
  install.uninstallClaude({ settingsFile });
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(settingsFile, 'utf8')).statusLine, prev);
});

test('render is fast (< 30 ms per redraw, no git)', () => {
  const cfg = { ...cfgLib.defaults(), lines: presets.zmanim.lines };
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < 50; i++) render(sampleClaudeInput(), cfg);
  const ms = Number(process.hrtime.bigint() - t0) / 1e6 / 50;
  assert.ok(ms < 30, `${ms.toFixed(1)} ms`);
});

fs.rmSync(tmp, { recursive: true, force: true });
console.log(process.exitCode ? '\nFAILED' : `\nall ${n} tests passed`);
