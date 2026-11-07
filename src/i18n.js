'use strict';
// Words used in segment text. Add a language by adding a key here.

const dict = {
  en: {
    window5h: '5h', week: 'week', ctx: 'ctx', reset: 'reset', in: 'in',
    fullAt: '100% at', lastsToReset: 'lasts till reset', perDay: '/day',
    windowsLeft: (left, n) => `${left}% left ≈ ${n} windows`,
    units: { d: 'd', h: 'h', m: 'm' },
    cache: 'cache', cold: 'cold', hit: 'hit', perHour: '/h',
    shabbatToday: 'Shabbat today', shabbatTomorrow: 'Shabbat tomorrow', shabbatIn: (n) => `Shabbat in ${n} days`,
    candles: 'Candles', sunrise: 'Sunrise', sunset: 'Shkiah', tzeit: 'Tzeit', next: 'next',
    tomorrow: 'tomorrow', session: 'session', api: 'api', breathe: 'stretch, water, look away',
  },
  ru: {
    window5h: '5ч', week: 'неделя', ctx: 'контекст', reset: 'сброс', in: 'через',
    fullAt: '100% в', lastsToReset: 'хватит до сброса', perDay: '/день',
    windowsLeft: (left, n) => `осталось ${left}% ≈ ${n} окна`,
    units: { d: 'д', h: 'ч', m: 'м' },
    cache: 'кэш', cold: 'остыл', hit: 'попаданий', perHour: '/ч',
    shabbatToday: 'Шаббат сегодня', shabbatTomorrow: 'Шаббат завтра', shabbatIn: (n) => `до Шаббата ${n} дн.`,
    candles: 'Свечи', sunrise: 'Восход', sunset: 'Шкия', tzeit: 'Цейт', next: 'далее',
    tomorrow: 'завтра', session: 'сессия', api: 'api', breathe: 'потянись, попей воды, посмотри вдаль',
  },
};

function words(lang) {
  return { ...dict.en, ...(dict[lang] || {}) };
}

module.exports = { words, languages: Object.keys(dict) };
