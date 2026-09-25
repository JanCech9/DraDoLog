// Every computed number lives here. Nothing derived is ever stored on the
// character, so a stat edit can never leave the sheet out of sync.

import type {
  Character,
  Dostrel,
  Item,
  Stit,
  Strelna,
  Velikost,
  Vlastnost,
  Vlastnosti,
  Zbran,
  Zbroj,
} from '../types/character';
import { DOSTREL_ORDER } from '../types/character';
import { RASA_RYSY } from '../data/races';
import { coinCount } from './money';
import {
  BOJESCHOPNOST,
  BONUS_TABLE,
  DOSTREL_MOD,
  INICIATIVA_VALECNIK_5,
  RODOVE_ZBRANE,
  ZATIZENI_BOJ,
  ZATIZENI_INICIATIVA,
  ZATIZENI_POHYBLIVOST,
  ZATIZENI_STEPS,
  nosnostForBonus,
  type ZatizeniLevel,
} from './tables';
import { proctoNeovlada } from './restrictions';

function lookup(table: ReadonlyArray<readonly [number, number, number]>, value: number): number {
  return table.find(([min, max]) => value >= min && value <= max)?.[2] ?? 0;
}

export function bonus(value: number): number {
  return lookup(BONUS_TABLE, value);
}

export function bonuses(v: Vlastnosti): Record<Vlastnost, number> {
  return {
    sil: bonus(v.sil),
    obr: bonus(v.obr),
    odl: bonus(v.odl),
    int: bonus(v.int),
    chs: bonus(v.chs),
  };
}

/** Nosnost in mn from the strength attribute (Tabulka nosnosti, str. 83). */
export function nosnost(sila: number): number {
  return nosnostForBonus(bonus(sila));
}

export const isZbran = (item: Item): item is Zbran => item.kind === 'zbran';
export const isStrelna = (item: Item): item is Strelna => item.kind === 'strelna';
export const isZbroj = (item: Item): item is Zbroj => item.kind === 'zbroj';
export const isStit = (item: Item): item is Stit => item.kind === 'stit';

export function equippedZbran(inventory: Item[]): Zbran | undefined {
  return inventory.filter(isZbran).find((z) => z.equipped);
}

export function equippedStrelna(inventory: Item[]): Strelna | undefined {
  return inventory.filter(isStrelna).find((s) => s.equipped);
}

export function equippedZbroj(inventory: Item[]): Zbroj | undefined {
  return inventory.filter(isZbroj).find((z) => z.equipped);
}

export function equippedStit(inventory: Item[]): Stit | undefined {
  return inventory.filter(isStit).find((s) => s.equipped);
}

/** How many pieces of a given ammo template the character carries. */
export function ammoCount(inventory: Item[], templateId: string): number {
  return inventory
    .filter((i) => i.templateId === templateId)
    .reduce((sum, i) => sum + i.qty, 0);
}

/** Carried weight, coins included (every coin weighs 1 mn). */
export function totalWeight(character: Character): number {
  const items = character.inventory.reduce((sum, item) => sum + item.weight * item.qty, 0);
  return items + coinCount(character.money);
}

export function zatizeniFor(weight: number, capacity: number): ZatizeniLevel {
  if (capacity <= 0) return 'pretizen';
  const ratio = weight / capacity;
  return ZATIZENI_STEPS.find(([, limit]) => ratio <= limit)?.[0] ?? 'pretizen';
}

/** Mez vyřazení (str. 71): share of max HP by odolnost, rounded half up, at least 1. */
export function mezVyrazeni(odolnost: number, maxHp: number): number {
  const row = BOJESCHOPNOST.find(([min, max]) => odolnost >= min && odolnost <= max);
  const podil = row?.[2] ?? 0;
  return Math.max(1, Math.round(maxHp * podil));
}

/** Postih k útoku i obraně, má-li postava méně než ⅓ životů (str. 71). */
export function postihBojeschopnosti(odolnost: number, hp: { current: number; max: number }): number {
  if (hp.current * 3 >= hp.max) return 0;
  const row = BOJESCHOPNOST.find(([min, max]) => odolnost >= min && odolnost <= max);
  return row?.[3] ?? 0;
}

export interface DerivedStats {
  bonus: Record<Vlastnost, number>;
  velikost: Velikost;
  zbran?: Zbran;
  strelna?: Strelna;
  zbroj?: Zbroj;
  stit?: Stit;
  /** The equipped melee or ranged weapon is the race's rodová zbraň (+1 ÚČ). */
  rodovaZbran: boolean;
  /** Útočné číslo (melee) = SZ + bonus za sílu (+1 rodová), never below 0. */
  uc: number;
  /** Útočnost of the melee weapon - added to damage on a hit. */
  utocnost: number;
  /** Ranged ÚČ per range band; undefined when no ranged weapon is equipped. */
  ucStrelba?: Record<Dostrel, number>;
  /** Ammo left for the equipped ranged weapon; undefined if it uses none. */
  munice?: number;
  /** Kvalita zbroje used for OČ (no armour = 1). */
  kz: number;
  /** Obranné číslo = KZ + bonus za obratnost, never below 0. */
  oc: number;
  /** Obrana zbraně added when parrying (−3 with no weapon). */
  oz: number;
  /** Shield bonus to the defence roll; 0 when none or the weapon needs both hands. */
  stitBonus: number;
  /** Shield is carried but blocked by a two-handed weapon. */
  stitBlokovan: boolean;
  /** Modifier to the initiative roll (rozšířený souboj). */
  iniciativa: number;
  nosnost: number;
  weight: number;
  zatizeni: ZatizeniLevel;
  /** Základní pohyblivost = rasa + bonus Obr + 2× bonus Sil (1–21). */
  pohyblivostZakladni: number;
  /** Okamžitá pohyblivost after load. */
  pohyblivost: number;
  pohyblivostBonus: number;
  mezVyrazeni: number;
  vyrazen: boolean;
  /** Attack/defence modifier from wounds (0, −1, −2, −3). */
  postihZraneni: number;
  /** Attack/defence modifier from load (0 or −1). */
  postihNalozeni: number;
  /** Postřeh na objekty / mechanismy in % (str. 86), thief bonuses included. */
  postrehObjekty: number;
  postrehMechanismy: number;
  /** Equipped items the class is not trained for, with the reason. */
  varovani: string[];
}

export function derive(character: Character): DerivedStats {
  const { rasa, povolani, uroven } = character.identity;
  const b = bonuses(character.vlastnosti);
  const rysy = RASA_RYSY[rasa];
  const zbran = equippedZbran(character.inventory);
  const strelna = equippedStrelna(character.inventory);
  const zbroj = equippedZbroj(character.inventory);
  const stit = equippedStit(character.inventory);
  const capacity = nosnost(character.vlastnosti.sil);
  const weight = totalWeight(character);
  const zatizeni = zatizeniFor(weight, capacity);

  const rodova = RODOVE_ZBRANE[rasa];
  const rodovaMelee = zbran?.templateId === rodova;
  const rodovaStrelba = strelna?.templateId === rodova;

  // Souboj tváří v tvář (str. 68): ÚČ = SZ + Sil (+1 rodová), min 0.
  const uc = Math.max(0, (zbran?.sila ?? 0) + b.sil + (rodovaMelee ? 1 : 0));
  const utocnost = zbran?.utocnost ?? 0;

  // Obrana (str. 72): OČ = KZ + Obr, min 0; OZ and shield go on the roll.
  const kz = zbroj?.ochrana ?? 1;
  const oc = Math.max(0, kz + b.obr);
  const oz = zbran ? zbran.obrana : -3;
  const stitBlokovan = !!stit && !!zbran?.obourucni;
  const stitBonus = stit && !stitBlokovan ? stit.obrana : 0;

  // Střelecký souboj (str. 74): ÚČ = SZ + Obr (+1 rodová), min 0, ± dostřel.
  let ucStrelba: Record<Dostrel, number> | undefined;
  if (strelna) {
    const base = Math.max(0, strelna.sila + b.obr + (rodovaStrelba ? 1 : 0));
    ucStrelba = Object.fromEntries(
      DOSTREL_ORDER.map((k) => [k, base + DOSTREL_MOD[k]]),
    ) as Record<Dostrel, number>;
  }
  const munice = strelna?.municeId ? ammoCount(character.inventory, strelna.municeId) : undefined;

  // Pohyblivost (str. 83).
  const pohyblivostZakladni = Math.max(1, Math.min(21, rysy.pohyblivost + b.obr + 2 * b.sil));
  const pohyblivost = Math.ceil(pohyblivostZakladni * ZATIZENI_POHYBLIVOST[zatizeni]);

  // Iniciativa v rozšířeném souboji (str. 78).
  const iniciativa =
    (zbran?.iniciativa ?? 0) +
    (strelna?.tezkaKuse ? -3 : 0) +
    ZATIZENI_INICIATIVA[zatizeni] +
    (povolani === 'bojovnik' && uroven >= 5 ? INICIATIVA_VALECNIK_5 : 0);

  const mez = mezVyrazeni(character.vlastnosti.odl, character.hp.max);

  // Postřeh (str. 86) + zlodějovy bonusy (str. 64).
  const int = character.vlastnosti.int;
  let postrehObjekty = int + rysy.postrehObjekty;
  let postrehMechanismy = Math.floor(int / 2) + rysy.postrehMechanismy;
  if (povolani === 'zlodej') {
    const lvl = Math.min(Math.max(uroven, 1), 5) - 1;
    postrehObjekty += [15, 20, 25, 30, 35][lvl] + 3 * b.obr + (character.schopnostiMod['objeveni-objektu'] ?? 0);
    postrehMechanismy += [10, 15, 20, 25, 30][lvl] + 2 * b.obr + (character.schopnostiMod['objeveni-mechanismu'] ?? 0);
  }

  const varovani = [zbran, strelna, zbroj, stit]
    .flatMap((i) => (i ? [proctoNeovlada(povolani, i)] : []))
    .filter((r): r is string => !!r);

  return {
    bonus: b,
    velikost: rysy.velikost,
    zbran,
    strelna,
    zbroj,
    stit,
    rodovaZbran: rodovaMelee || rodovaStrelba,
    uc,
    utocnost,
    ucStrelba,
    munice,
    kz,
    oc,
    oz,
    stitBonus,
    stitBlokovan,
    iniciativa,
    nosnost: capacity,
    weight,
    zatizeni,
    pohyblivostZakladni,
    pohyblivost,
    pohyblivostBonus: bonus(pohyblivost),
    mezVyrazeni: mez,
    vyrazen: character.hp.current <= mez,
    postihZraneni: postihBojeschopnosti(character.vlastnosti.odl, character.hp),
    postihNalozeni: ZATIZENI_BOJ[zatizeni],
    postrehObjekty,
    postrehMechanismy,
    varovani,
  };
}
