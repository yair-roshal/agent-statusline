'use strict';
// Claude Code -> common model. Every field is optional: older Claude Code
// versions send less data, and segments simply hide when their data is missing.

const num = (v) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
const toMs = (sec) => (num(sec) != null ? sec * 1000 : null);

function detect(input) {
  return !!(input && typeof input === 'object' && (input.model || input.workspace || input.session_id));
}

function normalize(input) {
  const ws = input.workspace || {};
  const cw = input.context_window || {};
  const cu = cw.current_usage || {};
  const rl = input.rate_limits || {};
  const pc = input.prompt_cache || null;
  const cost = input.cost || {};

  const ctxUsed =
    cu && (num(cu.input_tokens) != null || num(cu.cache_read_input_tokens) != null)
      ? (cu.input_tokens || 0) + (cu.cache_creation_input_tokens || 0) + (cu.cache_read_input_tokens || 0)
      : null;
  const ctxSize = num(cw.context_window_size);
  let ctxPct = num(cw.used_percentage);
  if (ctxPct == null && ctxUsed != null && ctxSize) ctxPct = (ctxUsed / ctxSize) * 100;

  const limit = (o) => (o && num(o.used_percentage) != null ? { pct: o.used_percentage, resetsAt: toMs(o.resets_at) } : null);

  return {
    agent: 'claude',
    model: input.model ? { id: input.model.id || '', name: input.model.display_name || input.model.id || '' } : null,
    effort: (input.effort && input.effort.level) || null,
    thinking: input.thinking ? !!input.thinking.enabled : null,
    fast: input.fast_mode === true,
    cwd: ws.current_dir || input.cwd || process.cwd(),
    projectDir: ws.project_dir || ws.current_dir || input.cwd || null,
    repo: ws.repo || null,
    sessionName: input.session_name || null,
    version: input.version || null,
    outputStyle: (input.output_style && input.output_style.name) || null,
    cost: {
      usd: num(cost.total_cost_usd),
      durationMs: num(cost.total_duration_ms),
      apiMs: num(cost.total_api_duration_ms),
      added: num(cost.total_lines_added),
      removed: num(cost.total_lines_removed),
    },
    context: ctxPct != null || ctxUsed != null ? { pct: ctxPct, used: ctxUsed, size: ctxSize } : null,
    limits: { five: limit(rl.five_hour), week: limit(rl.seven_day) },
    cache: pc
      ? {
          warm: pc.warm !== false,
          ttl: pc.ttl || null,
          expiresAt: toMs(pc.expires_at),
          hitRatio: num(pc.hit_ratio),
        }
      : null,
  };
}

module.exports = { id: 'claude', name: 'Claude Code', detect, normalize };
