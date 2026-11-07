'use strict';
// Demo input in the Claude Code status line format. Used for preview when no
// real input has been captured yet. Times are relative to "now".

function sampleClaudeInput(now = Date.now()) {
  const s = (ms) => Math.round((now + ms) / 1000);
  const M = 60e3, H = 60 * M, D = 24 * H;
  return {
    session_id: '00000000-0000-0000-0000-000000000000',
    cwd: '/home/me/projects/my-app/src',
    effort: { level: 'medium' },
    session_name: 'Refactor auth flow',
    model: { id: 'claude-opus-5-5', display_name: 'Opus 5.5' },
    workspace: {
      current_dir: '/home/me/projects/my-app/src',
      project_dir: '/home/me/projects/my-app',
      added_dirs: [],
      repo: { host: 'github.com', owner: 'me', name: 'my-app' },
    },
    version: '2.1.318',
    output_style: { name: 'default' },
    cost: {
      total_cost_usd: 1.8421,
      total_duration_ms: 41 * M,
      total_api_duration_ms: 10 * M,
      total_lines_added: 214,
      total_lines_removed: 37,
    },
    context_window: {
      total_input_tokens: 182000,
      total_output_tokens: 9100,
      context_window_size: 1000000,
      current_usage: { input_tokens: 12, output_tokens: 410, cache_creation_input_tokens: 3200, cache_read_input_tokens: 178800 },
      used_percentage: 18,
      remaining_percentage: 82,
    },
    prompt_cache: { warm: true, ttl: '1h', expires_at: s(47 * M), hit_ratio: 0.91 },
    fast_mode: false,
    thinking: { enabled: true },
    rate_limits: {
      five_hour: { used_percentage: 64, resets_at: s(1 * H + 50 * M) },
      seven_day: { used_percentage: 58, resets_at: s(3 * D + 4 * H) },
    },
    __sample: true,
  };
}

module.exports = { sampleClaudeInput };
