'use strict';
// Colors are xterm-256 codes: [foreground, background].
// `seg` sets the normal color per segment; `levels` overrides it when a
// segment reports warn / crit / info etc.

const themes = {
  default: {
    def: [252, 238],
    seg: {
      model: [183, 54], dir: [117, 24], git: [150, 22], session: [223, 238], version: [245, 236], clock: [250, 237],
      context: [152, 30], limit5h: [117, 25], limitWeek: [153, 61], forecast5h: [229, 58], forecastWeek: [229, 58],
      windowsLeft: [150, 65], cost: [221, 94], duration: [250, 239], lines: [156, 28], cache: [216, 130],
      zmanim: [220, 94], quote: [223, 239], breathe: [159, 31], text: [252, 238], command: [252, 238],
    },
    levels: { warn: [221, 136], crit: [210, 124], info: [245, 237], gold: [220, 94], sand: [223, 239] },
    sep: 240,
  },
  nord: {
    def: [253, 59],
    seg: {
      model: [110, 60], dir: [116, 24], git: [150, 65], context: [109, 23], limit5h: [110, 24], limitWeek: [146, 60],
      cost: [222, 95], cache: [180, 94], zmanim: [222, 95], quote: [188, 59], windowsLeft: [150, 65],
    },
    levels: { warn: [222, 136], crit: [174, 131], info: [103, 237], gold: [222, 95], sand: [188, 59] },
    sep: 60,
  },
  sunset: {
    def: [230, 52],
    seg: {
      model: [218, 89], dir: [223, 130], git: [229, 136], context: [216, 166], limit5h: [215, 130], limitWeek: [217, 125],
      cost: [228, 94], cache: [209, 88], zmanim: [222, 130], quote: [224, 95], windowsLeft: [229, 100],
    },
    levels: { warn: [227, 172], crit: [203, 88], info: [181, 237], gold: [221, 130], sand: [224, 95] },
    sep: 95,
  },
  mono: {
    def: [252, 238], seg: {},
    levels: { warn: [255, 242], crit: [231, 160], info: [244, 236], gold: [252, 238], sand: [250, 237] },
    sep: 242,
  },
};

function colorsFor(theme, id, level) {
  const t = themes[theme] || themes.default;
  if (level && level !== 'ok' && t.levels[level]) return t.levels[level];
  return t.seg[id] || themes.default.seg[id] || t.def;
}

module.exports = { themes, colorsFor };
