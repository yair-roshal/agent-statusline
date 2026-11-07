'use strict';
// Ready-made layouts. Each line is a list of segment ids, left to right.

const presets = {
  minimal: {
    desc: { en: 'One line: model, folder, git, context', ru: 'Одна строка: модель, папка, git, контекст' },
    lines: [['model', 'dir', 'git', 'context']],
  },
  default: {
    desc: { en: 'Session, limits with forecast, cache', ru: 'Сессия, лимиты с прогнозом, кэш' },
    lines: [
      ['model', 'dir', 'git', 'lines', 'cost'],
      ['context', 'limit5h', 'limitWeek'],
      ['forecast5h', 'windowsLeft', 'cache'],
    ],
  },
  limits: {
    desc: { en: 'Everything about limits, one per line', ru: 'Всё про лимиты, по одному в строке' },
    lines: [['limit5h', 'forecast5h'], ['limitWeek', 'forecastWeek'], ['context', 'cache'], ['windowsLeft']],
  },
  full: {
    desc: { en: 'Everything available', ru: 'Всё, что есть' },
    lines: [
      ['model', 'dir', 'git', 'session', 'clock'],
      ['context', 'limit5h', 'limitWeek'],
      ['forecast5h', 'forecastWeek', 'windowsLeft'],
      ['cost', 'duration', 'lines', 'cache', 'version'],
      ['zmanim'],
      ['quote'],
    ],
  },
  zmanim: {
    desc: { en: 'Limits + zmanim + Pirkei Avot quote', ru: 'Лимиты + зманим + цитата из Пиркей Авот' },
    lines: [['limit5h', 'forecast5h'], ['limitWeek'], ['context', 'cache'], ['windowsLeft'], ['zmanim'], ['quote']],
  },
};

module.exports = { presets };
