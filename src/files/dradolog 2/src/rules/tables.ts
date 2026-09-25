// Tables from Dračí doupě 1.6, Pravidla pro začátečníky - Průvodce hrou.
// Page numbers refer to the printed book. Everything the sheet computes
// comes from here; rules/derived.ts and rules/abilities.ts only combine them.

import type { Dostrel, Povolani, Presvedceni, Rasa, Vlastnost } from '../types/character';

/** Label for the weight unit used across the inventory screen (1 mn ≈ 50 g). */
export const WEIGHT_UNIT = 'mn';

/** Label for the distance unit used for ranged weapons (1 sáh ≈ 1 m). */
export const RANGE_UNIT = 'sáhů';

/** Tabulka postihů a bonusů (str. 27): [minValue, maxValue, bonus]. */
export const BONUS_TABLE: ReadonlyArray<readonly [number, number, number]> = [
  [-Infinity, 1, -5],
  [2, 3, -4],
  [4, 5, -3],
  [6, 7, -2],
  [8, 9, -1],
  [10, 12, 0],
  [13, 14, 1],
  [15, 16, 2],
  [17, 18, 3],
  [19, 20, 4],
  [21, Infinity, 5],
];

/** Tabulka nosnosti (str. 83): nosnost in mn by bonus za sílu. */
export function nosnostForBonus(bonusSil: number): number {
  const clamped = Math.max(-5, Math.min(5, bonusSil));
  return 360 + 30 * clamped;
}

/**
 * Tabulka naložení (str. 83). Keys are kept from the first version of the
 * sheet (they drive the CSS); labels are the rulebook's terms.
 */
export type ZatizeniLevel = 'nezatizen' | 'lehce' | 'stredne' | 'tezce' | 'pretizen';

/** Upper bound of each band, as a multiple of nosnost. */
export const ZATIZENI_STEPS: ReadonlyArray<readonly [ZatizeniLevel, number]> = [
  ['nezatizen', 1],
  ['lehce', 2],
  ['stredne', 3],
  ['tezce', 4],
  ['pretizen', Infinity],
];

export const ZATIZENI_LABELS: Record<ZatizeniLevel, string> = {
  nezatizen: 'Bez naložení',
  lehce: 'Mírné naložení',
  stredne: 'Střední naložení',
  tezce: 'Velké naložení',
  pretizen: 'Přetížen - tolik neuneseš',
};

/** Part of the base pohyblivost that remains at each load level. */
export const ZATIZENI_POHYBLIVOST: Record<ZatizeniLevel, number> = {
  nezatizen: 1,
  lehce: 3 / 4,
  stredne: 1 / 2,
  tezce: 1 / 4,
  pretizen: 0,
};

/** Initiative modifier per load level (rozšířený souboj, str. 78). */
export const ZATIZENI_INICIATIVA: Record<ZatizeniLevel, number> = {
  nezatizen: 0,
  lehce: -1,
  stredne: -3,
  tezce: -5,
  pretizen: -5,
};

/** Attack and defence roll modifier per load level (základní souboj). */
export const ZATIZENI_BOJ: Record<ZatizeniLevel, number> = {
  nezatizen: 0,
  lehce: 0,
  stredne: 0,
  tezce: -1,
  pretizen: -1,
};

/** ÚČ modifier for shooting at each range band (str. 75). */
export const DOSTREL_MOD: Record<Dostrel, number> = {
  maly: 1,
  stredni: 0,
  velky: -1,
};

/** Tabulka zkušenosti (str. 32): [zt needed, training cost in zl] per level, index 0 = level 1. */
export const XP_TABLE: Record<Povolani, ReadonlyArray<readonly [number, number]>> = {
  bojovnik: [[0, 0], [450, 2], [900, 4], [1825, 8], [3675, 13], [7400, 19]],
  hranicar: [[0, 0], [525, 2], [1050, 4], [2075, 8], [4125, 13], [8225, 19]],
  alchymista: [[0, 0], [575, 2], [1150, 4], [2300, 8], [4650, 13], [9325, 19]],
  kouzelnik: [[0, 0], [610, 2], [1250, 4], [2575, 8], [5250, 13], [10750, 19]],
  zlodej: [[0, 0], [325, 2], [730, 4], [1575, 8], [3450, 12], [7450, 18]],
};

/** Tabulka životů (str. 27): base HP at level 1 and the die rolled per level. */
export interface HpKostka {
  n: number;
  sides: number;
  plus: number;
}
export const HP_TABLE: Record<Povolani, { zaklad: number; kostka: HpKostka }> = {
  bojovnik: { zaklad: 10, kostka: { n: 1, sides: 10, plus: 0 } },
  hranicar: { zaklad: 8, kostka: { n: 1, sides: 6, plus: 2 } },
  alchymista: { zaklad: 7, kostka: { n: 1, sides: 6, plus: 1 } },
  kouzelnik: { zaklad: 6, kostka: { n: 1, sides: 6, plus: 0 } },
  zlodej: { zaklad: 6, kostka: { n: 1, sides: 6, plus: 0 } },
};

/** A 2-D table indexed by [level-1][attribute band]; bands are [min, max]. */
interface BandTable {
  bands: ReadonlyArray<readonly [number, number]>;
  rows: ReadonlyArray<ReadonlyArray<number>>;
}

function bandLookup(t: BandTable, uroven: number, value: number): number {
  const row = t.rows[Math.min(Math.max(uroven, 1), t.rows.length) - 1];
  let col = t.bands.findIndex(([min, max]) => value >= min && value <= max);
  if (col === -1) col = value < t.bands[0][0] ? 0 : t.bands.length - 1;
  return row[col];
}

/** Tabulka kouzelníkovy magenergie (str. 54): by level and inteligence. */
export const MAGENERGIE_KOUZELNIK: BandTable = {
  bands: [[8, 9], [10, 11], [12, 13], [14, 15], [16, 17], [18, 19], [20, 21]],
  rows: [
    [7, 7, 8, 8, 8, 9, 9],
    [10, 11, 12, 12, 12, 13, 14],
    [12, 14, 15, 16, 17, 18, 20],
    [14, 17, 19, 20, 21, 23, 26],
    [17, 20, 22, 24, 26, 28, 31],
  ],
};

/** Tabulka hraničářovy magenergie (str. 40): by level and inteligence. */
export const MAGENERGIE_HRANICAR: BandTable = {
  bands: [[6, 7], [8, 9], [10, 11], [12, 13], [14, 15], [16, 17], [18, 19]],
  rows: [
    [0, 0, 0, 0, 0, 0, 0],
    [3, 3, 3, 3, 3, 3, 3],
    [6, 6, 7, 7, 7, 8, 8],
    [10, 10, 11, 11, 11, 12, 13],
    [12, 13, 13, 14, 15, 15, 16],
  ],
};

/** Tabulka alchymistovy magenergie (str. 44): magy received from the teacher, by level and obratnost. */
export const MAGENERGIE_ALCHYMISTA: BandTable = {
  bands: [[8, 9], [10, 11], [12, 13], [14, 14], [15, 16], [17, 18], [19, 20]],
  rows: [
    [7, 7, 8, 8, 8, 9, 9],
    [15, 16, 17, 18, 19, 20, 21],
    [31, 35, 38, 40, 42, 45, 49],
    [62, 70, 76, 80, 84, 90, 98],
    [126, 131, 142, 150, 158, 169, 184],
  ],
};

export function magenergieKouzelnik(uroven: number, int: number): number {
  return bandLookup(MAGENERGIE_KOUZELNIK, uroven, int);
}
export function magenergieHranicar(uroven: number, int: number): number {
  return bandLookup(MAGENERGIE_HRANICAR, uroven, int);
}
export function magenergieAlchymista(uroven: number, obr: number): number {
  return bandLookup(MAGENERGIE_ALCHYMISTA, uroven, obr);
}

/** Tabulka počtu kouzel (str. 55): how many spells a kouzelník may know, index 0 = level 1. */
export const POCET_KOUZEL: readonly number[] = [3, 5, 7, 9, 11];

/** Pravděpodobnost úspěchu kouzelníka (str. 55): [minInt, maxInt, %]. */
export const USPECH_KOUZELNIK: ReadonlyArray<readonly [number, number, number]> = [
  [-Infinity, 9, 32],
  [10, 12, 47],
  [13, 14, 61],
  [15, 16, 74],
  [17, 18, 85],
  [19, 20, 95],
  [21, Infinity, 99],
];

/** Pravděpodobnost úspěchu alchymisty (str. 44): [minObr, maxObr, %]. */
export const USPECH_ALCHYMISTA: ReadonlyArray<readonly [number, number, number]> = [
  [-Infinity, 9, 32],
  [10, 12, 47],
  [13, 14, 61],
  [15, 16, 74],
  [17, 18, 85],
  [19, Infinity, 95],
];

/** Tabulka bojeschopnosti (str. 71): [minOdl, maxOdl, share of max HP for vyřazení, postih under ⅓ HP]. */
export const BOJESCHOPNOST: ReadonlyArray<readonly [number, number, number, number]> = [
  [-Infinity, 5, 1 / 4, -3],
  [6, 11, 1 / 6, -2],
  [12, 16, 1 / 8, -1],
  [17, Infinity, 0, 0], // mez vyřazení = 1 život
];

/** Tabulka vlastností podle rasy (str. 26): [min, max] per attribute. */
export const VLASTNOSTI_RASA: Record<Rasa, Record<Vlastnost, readonly [number, number]>> = {
  hobit: { sil: [3, 8], obr: [11, 16], odl: [8, 13], int: [10, 15], chs: [8, 18] },
  kuduk: { sil: [5, 10], obr: [10, 15], odl: [10, 15], int: [9, 14], chs: [7, 12] },
  trpaslik: { sil: [7, 12], obr: [7, 12], odl: [12, 17], int: [8, 13], chs: [7, 12] },
  elf: { sil: [6, 11], obr: [10, 15], odl: [6, 11], int: [12, 17], chs: [8, 18] },
  clovek: { sil: [6, 16], obr: [9, 14], odl: [9, 14], int: [10, 15], chs: [2, 17] },
  barbar: { sil: [10, 15], obr: [8, 13], odl: [11, 16], int: [6, 11], chs: [1, 16] },
  kroll: { sil: [11, 16], obr: [5, 10], odl: [13, 18], int: [2, 7], chs: [1, 11] },
};

/** Tabulka vlastností podle povolání (str. 26): the two base attributes, human ranges. */
export const VLASTNOSTI_POVOLANI: Record<Povolani, Partial<Record<Vlastnost, readonly [number, number]>>> = {
  bojovnik: { sil: [13, 18], odl: [13, 18] },
  hranicar: { sil: [11, 16], int: [12, 17] },
  alchymista: { obr: [13, 18], odl: [12, 17] },
  kouzelnik: { int: [14, 19], chs: [13, 18] },
  zlodej: { obr: [14, 19], chs: [12, 17] },
};

/** Tabulka oprav (str. 27): added to both ends of the class range for the race. */
export const OPRAVY_RASA: Record<Rasa, Record<Vlastnost, number>> = {
  hobit: { sil: -5, obr: 2, odl: 0, int: -2, chs: 3 },
  kuduk: { sil: -3, obr: 1, odl: 1, int: -2, chs: 0 },
  trpaslik: { sil: 1, obr: -2, odl: 3, int: -3, chs: -2 },
  elf: { sil: 0, obr: 1, odl: -4, int: 2, chs: 2 },
  clovek: { sil: 0, obr: 0, odl: 0, int: 0, chs: 0 },
  barbar: { sil: 1, obr: -1, odl: 1, int: 0, chs: -2 },
  kroll: { sil: 3, obr: -4, odl: 3, int: -6, chs: -5 },
};

/** Určování přesvědčení (str. 29): 1k10 → přesvědčení, index 0 = roll 1. */
export const PRESVEDCENI_TABULKA: Record<Rasa, readonly Presvedceni[]> = {
  hobit: ['zakonne-dobro', 'zakonne-dobro', 'zmatene-dobro', 'zmatene-dobro', 'zmatene-dobro', 'neutralni', 'neutralni', 'zmatene-zlo', 'zmatene-zlo', 'zakonne-zlo'],
  kuduk: ['zakonne-dobro', 'zakonne-dobro', 'zmatene-dobro', 'zmatene-dobro', 'zmatene-dobro', 'neutralni', 'neutralni', 'zmatene-zlo', 'zmatene-zlo', 'zakonne-zlo'],
  trpaslik: ['zakonne-dobro', 'zakonne-dobro', 'zmatene-dobro', 'zmatene-dobro', 'neutralni', 'neutralni', 'neutralni', 'zmatene-zlo', 'zmatene-zlo', 'zakonne-zlo'],
  elf: ['zakonne-dobro', 'zakonne-dobro', 'zakonne-dobro', 'zmatene-dobro', 'zmatene-dobro', 'zmatene-dobro', 'neutralni', 'neutralni', 'zmatene-zlo', 'zmatene-zlo'],
  clovek: ['zakonne-dobro', 'zakonne-dobro', 'zmatene-dobro', 'zmatene-dobro', 'neutralni', 'neutralni', 'zmatene-zlo', 'zmatene-zlo', 'zakonne-zlo', 'zakonne-zlo'],
  barbar: ['zakonne-dobro', 'zmatene-dobro', 'zmatene-dobro', 'neutralni', 'neutralni', 'neutralni', 'zmatene-zlo', 'zmatene-zlo', 'zakonne-zlo', 'zakonne-zlo'],
  kroll: ['zmatene-dobro', 'zmatene-dobro', 'neutralni', 'neutralni', 'neutralni', 'zmatene-zlo', 'zmatene-zlo', 'zmatene-zlo', 'zakonne-zlo', 'zakonne-zlo'],
};

/** Tabulka rodových zbraní (str. 68): catalog templateId of each race's weapon (+1 ÚČ). */
export const RODOVE_ZBRANE: Record<Rasa, string> = {
  hobit: 'lehka-kuse',
  kuduk: 'sekera',
  trpaslik: 'valecna-sekera',
  elf: 'dlouhy-luk',
  clovek: 'siroky-mec',
  barbar: 'mec-bastard',
  kroll: 'tezky-kyj',
};

/** Initiative bonus a válečník gets for "3 útoky za 2 kola" (from level 5). */
export const INICIATIVA_VALECNIK_5 = 3;

/** Hraničářovo stopování (str. 37): base chance per terrain, +2 % per level. */
export const STOPOVANI = {
  venku: { lehky: 80, tezky: 50 },
  uvnitr: { lehky: 60, tezky: 40 },
  zaUroven: 2,
  zaTvora: 3,
  za24h: -10,
} as const;

/** Odpočinek (str. 85): hours of sleep needed = 8 − ½ bonus za odolnost (round up). */
export function hodinySpanku(bonusOdl: number): number {
  return Math.ceil(8 - bonusOdl / 2);
}
