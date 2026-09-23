// WARNING: every number in this file is a PLACEHOLDER.
// Copy the real tables out of Pravidla DrD 1.6 - this is the only file you
// should need to touch to make the maths match how your group plays.

import type { Dostrel, Vlastnosti } from '../types/character';

/** Label for the weight unit used across the inventory screen. */
export const WEIGHT_UNIT = 'mn';

/** Label for the distance unit used for ranged weapons. */
export const RANGE_UNIT = 'sáhů';

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


// PLACEHOLDER coefficients - replace with the numbers from your rulebook's zatížení table.
export const NOSNOST_PER_SILA = 50;
export const NOSNOST_PER_ODOLNOST = 0; // set > 0 if your table counts Odolnost too

/** Carrying capacity (in WEIGHT_UNIT) derived from vlastnosti. */
export function nosnostFormula(v: Vlastnosti): number {
  return Math.max(0, Math.round(v.sil * NOSNOST_PER_SILA + v.odl * NOSNOST_PER_ODOLNOST));
}

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

/** ÚČ modifier for shooting at each range band. */
export const DOSTREL_MOD: Record<Dostrel, number> = {
  maly: 1,
  stredni: 0,
  velky: -2,
};