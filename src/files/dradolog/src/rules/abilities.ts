import type { Character, KouzloTemplate, Povolani, SchopnostTemplate } from '../types/character';
import { SCHOPNOSTI } from '../data/abilities';
import { bonus } from './derived';
import {
  HP_TABLE,
  POCET_KOUZEL,
  STOPOVANI,
  USPECH_ALCHYMISTA,
  USPECH_KOUZELNIK,
  XP_TABLE,
  magenergieAlchymista,
  magenergieHranicar,
  magenergieKouzelnik,
  type HpKostka,
} from './tables';

export function schopnostiFor(c: Character): SchopnostTemplate[] {
  return SCHOPNOSTI.filter(
    (s) => s.povolani === c.identity.povolani && s.odUrovne <= c.identity.uroven,
  );
}

/** Chance of a % ability: base for the level + n× bonus of each attribute + GM override. */
export function sance(s: SchopnostTemplate, c: Character): number {
  const tab = s.sanceUrovne ?? [];
  const idx = Math.min(Math.max(c.identity.uroven, 1), tab.length) - 1;
  const base = tab[idx] ?? 0;
  const zBonusu = (s.zavisiNa ?? []).reduce((sum, [v, n]) => sum + n * bonus(c.vlastnosti[v]), 0);
  const mod = c.schopnostiMod[s.id] ?? 0;
  return Math.max(0, Math.min(100, base + zBonusu + mod));
}

function pct(table: ReadonlyArray<readonly [number, number, number]>, value: number): number {
  return table.find(([min, max]) => value >= min && value <= max)?.[2] ?? 0;
}

/** Pravděpodobnost úspěchu kouzelníka (str. 55) by inteligence. */
export const uspechKouzelnika = (int: number) => pct(USPECH_KOUZELNIK, int);

/** Pravděpodobnost úspěchu alchymisty (str. 44) by obratnost. */
export const uspechAlchymisty = (obr: number) => pct(USPECH_ALCHYMISTA, obr);

/** Hraničářovo stopování: the four terrain chances for this level. */
export function stopovani(uroven: number) {
  const plus = STOPOVANI.zaUroven * uroven;
  return {
    venkuLehky: STOPOVANI.venku.lehky + plus,
    venkuTezky: STOPOVANI.venku.tezky + plus,
    uvnitrLehky: STOPOVANI.uvnitr.lehky + plus,
    uvnitrTezky: STOPOVANI.uvnitr.tezky + plus,
  };
}

/** Magenergie the class table gives this character (0 where the class has none). */
export function magenergieZTabulky(c: Character): number {
  const { povolani, uroven } = c.identity;
  const v = c.vlastnosti;
  switch (povolani) {
    case 'kouzelnik':
      return magenergieKouzelnik(uroven, v.int);
    case 'hranicar':
      return uroven >= 2 ? magenergieHranicar(uroven, v.int) : 0;
    case 'alchymista':
      return magenergieAlchymista(uroven, v.obr);
    default:
      return 0;
  }
}

/** Does the class regain magenergie by meditation (kouzelník, hraničář) rather than keep a stock? */
export const meditujici = (povolani: Povolani) => povolani === 'kouzelnik' || povolani === 'hranicar';

/** How many spells a kouzelník may know at this level (str. 55); hraničář knows all of his. */
export function pocetKouzel(c: Character): number | undefined {
  if (c.identity.povolani !== 'kouzelnik') return undefined;
  const idx = Math.min(Math.max(c.identity.uroven, 1), POCET_KOUZEL.length) - 1;
  return POCET_KOUZEL[idx];
}

export const canCast = (k: KouzloTemplate, c: Character) => c.magenergie.current >= k.magCost;

export interface UrovenInfo {
  /** zt needed for the next level, undefined beyond the table (level 6+). */
  dalsi?: number;
  /** Training cost in zl for the next level. */
  cena?: number;
  /** The character has enough zt to train. */
  muze: boolean;
  chybi: number;
}

/** Tabulka zkušenosti (str. 32) for the character's class and level. */
export function urovenInfo(c: Character): UrovenInfo {
  const rows = XP_TABLE[c.identity.povolani];
  const next = rows[c.identity.uroven]; // index = next level − 1
  if (!next) return { muze: false, chybi: 0 };
  const [zt, cena] = next;
  return { dalsi: zt, cena, muze: c.xp >= zt, chybi: Math.max(0, zt - c.xp) };
}

export function hpKostka(povolani: Povolani): HpKostka {
  return HP_TABLE[povolani].kostka;
}

export function hpZaklad(povolani: Povolani): number {
  return HP_TABLE[povolani].zaklad;
}

export function formatKostka(k: HpKostka): string {
  return `${k.n}k${k.sides}${k.plus ? `+${k.plus}` : ''}`;
}
