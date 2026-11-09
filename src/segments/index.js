'use strict';
// All segments. Each one gets the normalized data `d` and context `c`
// ({ now, o: options, w: words }) and returns null (hide) or
// { icon, text, level: 'ok' | 'warn' | 'crit' | 'info' }.

const path = require('path');
const fs = require('fs');
const { execFileSync } = require('child_process');
const f = require('../format');
const { cached } = require('../paths');
const { dayTimes, ymdIn } = require('../sun');
const { resolveCity } = require('../cities');
const quotes = require('../quotes');

const segments = [];
const def = (s) => segments.push(s);

// ───────────── session ─────────────

def({
  id: 'model', group: 'session',
  desc: { en: 'Model, effort, thinking, fast mode', ru: 'Модель, effort, thinking, fast mode' },
  render(d) {
    if (!d.model) return null;
    let t = d.model.name;
    if (d.effort) t += ` · ${d.effort}`;
    if (d.thinking) t += ' 🧠';
    if (d.fast) t += ' ⚡';
    return { icon: '◆', text: t };
  },
});

def({
  id: 'dir', group: 'session',
  desc: { en: 'Project folder (+ subfolder you are in)', ru: 'Папка проекта (+ подпапка, где ты сейчас)' },
  render(d) {
    const root = d.projectDir || d.cwd;
    if (!root) return null;
    let t = path.basename(root);
    if (d.cwd && d.cwd !== root && d.cwd.startsWith(root + path.sep)) t += '/' + path.relative(root, d.cwd);
    return { icon: '📁', text: t };
  },
});

def({
  id: 'git', group: 'session',
  desc: { en: 'Branch, changed files, ahead/behind', ru: 'Ветка, изменённые файлы, ahead/behind' },
  render(d, c) {
    if (!d.cwd) return null;
    const g = cached(`git-${d.cwd}`, c.o.gitCacheMs ?? 5000, () => readGit(d.cwd));
    if (!g || !g.branch) return null;
    let t = g.branch;
    if (g.changed) t += ` ●${g.changed}`;
    if (g.ahead) t += ` ↑${g.ahead}`;
    if (g.behind) t += ` ↓${g.behind}`;
    return { icon: '', text: t, level: g.changed ? 'warn' : 'ok' };
  },
});

function readGit(cwd) {
  try {
    const out = execFileSync('git', ['-C', cwd, 'status', '--porcelain=v2', '--branch', '--untracked-files=normal'], {
      encoding: 'utf8', timeout: 800, stdio: ['ignore', 'pipe', 'ignore'],
    });
    const g = { branch: '', changed: 0, ahead: 0, behind: 0 };
    for (const line of out.split('\n')) {
      if (line.startsWith('# branch.head ')) g.branch = line.slice(14);
      else if (line.startsWith('# branch.oid ') && !g.branch) g.branch = line.slice(13, 20);
      else if (line.startsWith('# branch.ab ')) {
        const m = line.match(/\+(\d+) -(\d+)/);
        if (m) { g.ahead = +m[1]; g.behind = +m[2]; }
      } else if (line && !line.startsWith('#')) g.changed++;
    }
    if (g.branch === '(detached)') g.branch = 'detached';
    return g;
  } catch {
    return null;
  }
}

def({
  id: 'session', group: 'session',
  desc: { en: 'Session name', ru: 'Имя сессии' },
  render: (d) => (d.sessionName ? { icon: '💬', text: d.sessionName } : null),
});

def({
  id: 'version', group: 'session',
  desc: { en: 'Agent version', ru: 'Версия агента' },
  render: (d) => (d.version ? { icon: '', text: `v${d.version}`, level: 'info' } : null),
});

def({
  id: 'clock', group: 'session',
  desc: { en: 'Current time', ru: 'Текущее время' },
  render: (d, c) => ({ icon: '🕐', text: f.clock(c.now, c.o.timezone), level: 'info' }),
});

// ───────────── usage ─────────────

def({
  id: 'context', group: 'usage',
  desc: { en: 'Context window: bar, %, tokens', ru: 'Контекст: полоска, %, токены' },
  render(d, c) {
    const x = d.context;
    if (!x) return null;
    const pct = x.pct ?? 0;
    let t = `${c.w.ctx} ${f.bar(pct, c.o.barWidth, c.o.barStyle)} ${Math.round(pct)}%`;
    if (x.used != null && x.size) t += ` · ${f.tokens(x.used)}/${f.tokens(x.size)}`;
    const cell = { text: x.used != null ? `${x.used.toLocaleString('en-US')} (${Math.round(pct)}%)` : `${Math.round(pct)}%`, label: c.w.labelContext };
    return { icon: '◔', text: t, level: f.level(pct, 50, 80), cell };
  },
});

for (const [id, key, label, icon] of [['limit5h', 'five', 'window5h', '◱'], ['limitWeek', 'week', 'week', '◑']]) {
  def({
    id, group: 'usage',
    desc: key === 'five'
      ? { en: '5-hour limit: bar, %, time to reset', ru: 'Лимит 5 часов: полоска, %, время до сброса' }
      : { en: 'Weekly limit: bar, %, time to reset', ru: 'Недельный лимит: полоска, %, время до сброса' },
    render(d, c) {
      const l = d.limits[key];
      if (!l) return null;
      let t = `${c.w[label]} ${f.bar(l.pct, c.o.barWidth, c.o.barStyle)} ${Math.round(l.pct)}%`;
      const left = l.resetsAt && l.resetsAt > c.now ? f.dur(l.resetsAt - c.now, c.w.units) : '';
      if (left) t += ` · ${c.w.reset} ${left}`;
      const cell = {
        text: `${f.bar(l.pct, c.o.barWidth, 'shade')} ${Math.round(l.pct)}%${left ? ` (${left})` : ''}`,
        label: key === 'five' ? c.w.labelWindow5h : c.w.labelWeek,
      };
      return { icon, text: t, level: f.level(l.pct, 70, 90), cell };
    },
  });
}

// Pace forecast: at the burn rate since the window started, when do we hit 100%?
function forecast(l, spanMs, now) {
  if (!l || !l.resetsAt || l.pct <= 0) return null;
  const start = l.resetsAt - spanMs;
  const elapsed = now - start;
  if (elapsed < 10 * f.MIN || l.resetsAt <= now) return null;
  if (l.pct >= 100) return { fullAt: now };
  const fullAt = now + ((100 - l.pct) / l.pct) * elapsed;
  return fullAt < l.resetsAt ? { fullAt } : { ok: true };
}

for (const [id, key, span, label] of [['forecast5h', 'five', 5 * f.HOUR, 'window5h'], ['forecastWeek', 'week', 7 * f.DAY, 'week']]) {
  def({
    id, group: 'usage',
    desc: key === 'five'
      ? { en: 'When the 5h limit runs out at current pace', ru: 'Когда кончится лимит 5ч при текущем темпе' }
      : { en: 'When the weekly limit runs out at current pace', ru: 'Когда кончится недельный лимит при текущем темпе' },
    render(d, c) {
      const r = forecast(d.limits[key], span, c.now);
      if (!r) return null;
      if (r.ok) return { icon: '✓', text: `${c.w[label]} ${c.w.lastsToReset}`, level: 'ok' };
      const day = f.dayLabel(r.fullAt, c.now, c.o.timezone);
      const when = (day ? (day === 'tomorrow' ? c.w.tomorrow : day) + ' ' : '') + f.clock(r.fullAt, c.o.timezone);
      return { icon: '⏳', text: `${c.w[label]} ${c.w.fullAt} ${when}`, level: r.fullAt - c.now < 30 * f.MIN ? 'crit' : 'warn' };
    },
  });
}

def({
  id: 'windowsLeft', group: 'usage',
  desc: { en: 'How many full 5h windows fit in the weekly remainder', ru: 'Сколько полных 5-часовых окон влезает в остаток недели' },
  render(d, c) {
    const wk = d.limits.week;
    if (!wk) return null;
    const per = c.o.windowWeeklyPct || 14; // one full 5h window ≈ this % of the week
    const left = Math.max(0, 100 - wk.pct);
    const n = left / per;
    let t = c.w.windowsLeft(Math.round(left), n.toFixed(1));
    if (wk.resetsAt && wk.resetsAt > c.now) {
      const days = Math.max(1, (wk.resetsAt - c.now) / f.DAY);
      t += ` · ${Math.round(left / days)}%${c.w.perDay}`;
    }
    const lvl = n < 1 ? 'crit' : n < 2 ? 'warn' : 'ok';
    const col = lvl === 'crit' ? 'red' : lvl === 'warn' ? 'yellow' : 'green';
    const long = c.w.windowsLeftLong(per, Math.round(left), Math.round(n * 100), n.toFixed(1));
    const perDay = t.includes(' · ') ? t.slice(t.lastIndexOf(' · ')) : '';
    return { icon: '✱', text: t, level: lvl, rich: [{ t: '✱ ', c: col, icon: true }, { t: long + perDay, c: col }] };
  },
});

def({
  id: 'cost', group: 'usage',
  desc: { en: 'Session cost and $/hour', ru: 'Стоимость сессии и $/час' },
  render(d, c) {
    const { usd, durationMs } = d.cost;
    if (usd == null) return null;
    let t = f.usd(usd);
    if (durationMs > 5 * f.MIN) t += ` · ${f.usd(usd / (durationMs / f.HOUR))}${c.w.perHour}`;
    return { icon: '💰', text: t };
  },
});

def({
  id: 'duration', group: 'usage',
  desc: { en: 'Session duration and share of API time', ru: 'Длительность сессии и доля времени API' },
  render(d, c) {
    const { durationMs, apiMs } = d.cost;
    if (durationMs == null) return null;
    let t = f.dur(durationMs, c.w.units);
    if (apiMs && durationMs > 0) t += ` · ${c.w.api} ${Math.round((apiMs / durationMs) * 100)}%`;
    return { icon: '⏱', text: t, level: 'info' };
  },
});

def({
  id: 'lines', group: 'usage',
  desc: { en: 'Lines added / removed this session', ru: 'Строк добавлено / удалено за сессию' },
  render(d) {
    const { added, removed } = d.cost;
    if (!added && !removed) return null;
    return { icon: '✎', text: `+${added || 0} −${removed || 0}` };
  },
});

def({
  id: 'cache', group: 'usage',
  desc: { en: 'Prompt cache: warm/cold, minutes left, hit rate', ru: 'Кэш промптов: тёплый/остыл, сколько минут осталось, попадания' },
  render(d, c) {
    const k = d.cache;
    if (!k) return null;
    const left = k.expiresAt ? k.expiresAt - c.now : null;
    if (!k.warm || (left != null && left <= 0)) return { icon: '❄', text: `${c.w.cache} ${c.w.cold}`, level: 'warn' };
    let t = c.w.cache;
    if (left != null) t += ` ${f.dur(left, c.w.units)}`;
    if (k.hitRatio != null) t += ` · ${c.w.hit} ${Math.round(k.hitRatio * 100)}%`;
    return { icon: '🔥', text: t, level: left != null && left < 5 * f.MIN ? 'warn' : 'ok' };
  },
});

// ───────────── extras ─────────────

def({
  id: 'zmanim', group: 'extras',
  desc: { en: 'Days to Shabbat, sunrise / shkiah / tzeit, next zman (options.city)', ru: 'Дни до Шаббата, восход / шкия / цейт, ближайший зман (options.city)' },
  render(d, c) {
    const city = resolveCity(c.o.city || 'Jerusalem');
    if (!city) return null;
    const ymd = ymdIn(c.now, city.tz);
    const wd = new Date(`${ymd}T12:00:00Z`).getUTCDay(); // 0 Sun … 6 Sat
    const z = dayTimes(ymd, city);
    const t = (ms) => (ms ? f.clock(ms, city.tz) : '—');
    const parts = [];
    const daysLeft = 6 - wd;
    if (wd === 5 && z.sunset) parts.push(`🕯 ${c.w.candles} ${t(z.sunset - city.candles * f.MIN)}`);
    else parts.push(`🕯 ${daysLeft === 0 ? c.w.shabbatToday : daysLeft === 1 ? c.w.shabbatTomorrow : c.w.shabbatIn(daysLeft)}`);
    parts.push(`☀ ${t(z.sunrise)}`, `🌇 ${t(z.sunset)}`, `✨ ${t(z.tzeit)}`);
    const next = [[c.w.sunrise, z.sunrise], [c.w.sunset, z.sunset], [c.w.tzeit, z.tzeit]].find(([, ms]) => ms && ms > c.now);
    if (next) parts.push(`${c.w.next}: ${next[0]} ${c.w.in} ${f.dur(next[1] - c.now, c.w.units)}`);
    if (city.name && c.o.showCity !== false) parts.push(city.name);
    const dot = { t: ' · ', c: 'dim' };
    const shabbat = wd === 5 && z.sunset
      ? `${c.w.candles} ${t(z.sunset - city.candles * f.MIN)}`
      : daysLeft === 0 ? c.w.shabbatToday : daysLeft === 1 ? c.w.shabbatTomorrow : c.w.shabbatIn(daysLeft);
    const rich = [
      { t: '🕯 ', c: 'gold', icon: true }, { t: shabbat, c: 'gold' }, dot,
      { t: '☀ ', c: 'sky', icon: true }, { t: `${c.w.sunrise} ${t(z.sunrise)}`, c: 'sky' }, dot,
      { t: '🌇 ', c: 'orange', icon: true }, { t: `${c.w.sunset} ${t(z.sunset)}`, c: 'orange' }, dot,
      { t: '✨ ', c: 'violet', icon: true }, { t: `${c.w.tzeit} ${t(z.tzeit)}`, c: 'violet' },
    ];
    if (city.name && c.o.showCity !== false) rich.push({ t: ` (${city.name})`, c: 'grey', plain: true });
    if (next && c.o.zmanimNext !== false) rich.push(dot, { t: `${c.w.next}: ${next[0]} ${c.w.in} ${f.dur(next[1] - c.now, c.w.units)}`, c: 'grey', plain: true });
    return { icon: '', text: parts.join(' · '), level: 'gold', rich };
  },
});

def({
  id: 'quote', group: 'extras',
  desc: { en: 'Quote of the day (avot / dev / stoic / your file)', ru: 'Цитата дня (avot / dev / stoic / свой файл)' },
  render(d, c) {
    let list = quotes[c.o.quotes || 'avot'] || quotes.avot;
    if (c.o.quotesFile) {
      try { list = JSON.parse(fs.readFileSync(c.o.quotesFile, 'utf8')); } catch {}
    }
    if (!list.length) return null;
    const day = Math.floor((c.now - new Date(c.now).getTimezoneOffset() * f.MIN) / f.DAY);
    const [text, author] = list[day % list.length];
    const rich = [{ t: '📜 ', c: 'sand', icon: true }, { t: `“${text}”`, c: 'sand' }];
    if (author) rich.push({ t: ` — ${author}`, c: 'grey' });
    return { icon: '📜', text: `“${text}”${author ? ` — ${author}` : ''}`, level: 'sand', rich };
  },
});

def({
  id: 'breathe', group: 'extras',
  desc: { en: 'Break reminder after N minutes of session (options.breakEvery)', ru: 'Напоминание о перерыве через N минут сессии (options.breakEvery)' },
  render(d, c) {
    const every = (c.o.breakEvery || 90) * f.MIN;
    const ms = d.cost.durationMs;
    if (!ms || ms < every) return null;
    return { icon: '🧘', text: `${f.dur(ms, c.w.units)} — ${c.w.breathe}`, level: 'warn' };
  },
});

def({
  id: 'text', group: 'extras',
  desc: { en: 'Your own static text (options.text)', ru: 'Свой текст (options.text)' },
  render: (d, c) => (c.o.text ? { icon: '', text: String(c.o.text) } : null),
});

def({
  id: 'command', group: 'extras',
  desc: { en: 'Output of your shell command, cached 30s (options.command)', ru: 'Вывод твоей shell-команды, кэш 30 с (options.command)' },
  render(d, c) {
    if (!c.o.command) return null;
    const out = cached(`cmd-${c.o.command}`, (c.o.commandCacheSec ?? 30) * 1000, () => {
      try {
        return execFileSync('/bin/sh', ['-c', c.o.command], { encoding: 'utf8', timeout: 1500, cwd: d.cwd && fs.existsSync(d.cwd) ? d.cwd : undefined, stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      } catch { return ''; }
    });
    return out ? { icon: '', text: out.split('\n')[0] } : null;
  },
});

// Background shells Claude Code started (the "· 1 shell" in its footer):
// bash processes under the claude process that source a shell snapshot.
function countShells() {
  try {
    const rows = execFileSync('ps', ['-axo', 'pid=,ppid=,command='], { encoding: 'utf8', timeout: 800, stdio: ['ignore', 'pipe', 'ignore'] })
      .split('\n').map((l) => l.trim().match(/^(\d+)\s+(\d+)\s+(.*)$/)).filter(Boolean)
      .map((m) => ({ pid: +m[1], ppid: +m[2], cmd: m[3] }));
    const byPid = new Map(rows.map((r) => [r.pid, r]));
    let cur = byPid.get(process.pid), claude = null;
    for (let i = 0; cur && i < 8; i++) {
      if (/(^|\/)claude(\s|$)/.test(cur.cmd)) { claude = cur.pid; break; }
      cur = byPid.get(cur.ppid);
    }
    if (!claude) return 0;
    return rows.filter((r) => r.ppid === claude && r.cmd.includes('shell-snapshots/snapshot-') && !r.cmd.includes('agent-statusline')).length;
  } catch { return 0; }
}

def({
  id: 'shells', group: 'session',
  desc: { en: 'Background shells running (highlighted)', ru: 'Запущенные фоновые shell (с подсветкой)' },
  render(d, c) {
    if (process.platform === 'win32') return null;
    const n = cached(`shells-${d.sessionId || process.ppid}`, c.o.shellsCacheMs ?? 3000, countShells);
    if (!n) return null;
    const text = c.w.shells(n);
    return { icon: '▶', text, level: 'warn', cell: { text, label: c.w.labelShells, bold: true, labelColor: 'gold' } };
  },
});

const byId = Object.fromEntries(segments.map((s) => [s.id, s]));

module.exports = { segments, byId, forecast };
