// Names and feature terms, never event lists or dates. Unrecognised names can still match lexically.
export const EVENT_ALIASES: Array<[string, RegExp]> = [
  ["valhalla", /assassin[’']?s\s+creed\s*:?\s*valhalla|刺客信条[：:]?英灵殿/giu],
  ["switchtwo", /(?:nintendo\s+)?switch\s*2|\bNS2\b/giu],
  ["nintendo", /任天堂/gu], ["playstation", /索尼|\bsony\b/giu],
  ["microsoft", /微软/gu], ["ubisoft", /育碧/gu],
  ["newgameplus", /new\s+game\s*(?:plus|\+)|新游戏\s*\+/giu],
];
export const EVENT_NOISE = /抽奖|兑换码|签到|限免|周末特惠|攻略|评测|评分汇总|播客|录音笔|\breview\b|\bhow to\b|\btips\b|\bfree play days\b|\bon sale\b|\bdeals?\b/iu;
