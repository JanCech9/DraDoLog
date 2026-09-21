// WARNING: every number in this file is a PLACEHOLDER.
// Copy the real tables out of Pravidla DrD 1.6 - this is the only file you
// should need to touch to make the maths match how your group plays.

/** Label for the weight unit used across the inventory screen. */
export const WEIGHT_UNIT = 'mincí';

/** [minValue, maxValue, bonus] - first matching row wins. */
export const BONUS_TABLE: ReadonlyArray<readonly [number, number, number]> = [
  [-Infinity, 1, -5],
  [2, 2, -4],
  [3, 3, -3],
  [4, 5, -2],
  [6, 7, -1],
  [8, 12, 0],
  [13, 14, 1],
  [15, 16, 2],
  [17, 18, 3],
  [19, 20, 4],
  [21, Infinity, 5],
];

/** [minSila, maxSila, carrying capacity] - first matching row wins. */
export const NOSNOST_TABLE: ReadonlyArray<readonly [number, number, number]> = [
  [-Infinity, 5, 300],
  [6, 10, 600],
  [11, 14, 1000],
  [15, 17, 1500],
  [18, 20, 2200],
  [21, Infinity, 3000],
];

export type ZatizeniLevel = 'nezatizen' | 'lehce' | 'stredne' | 'tezce' | 'pretizen';

/** Upper bound of each band, as a multiple of nosnost. */
export const ZATIZENI_STEPS: ReadonlyArray<readonly [ZatizeniLevel, number]> = [
  ['nezatizen', 1],
  ['lehce', 1.5],
  ['stredne', 2],
  ['tezce', 3],
  ['pretizen', Infinity],
];

export const ZATIZENI_LABELS: Record<ZatizeniLevel, string> = {
  nezatizen: 'Nezatížen',
  lehce: 'Lehce zatížen',
  stredne: 'Středně zatížen',
  tezce: 'Těžce zatížen',
  pretizen: 'Přetížen',
};
