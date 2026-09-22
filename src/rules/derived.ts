// Every computed number lives here. Nothing derived is ever stored on the
// character, so a stat edit can never leave the sheet out of sync.

import type {
  Character,
  Dostrel,
  Item,
  Strelna,
  Vlastnost,
  Vlastnosti,
  Zbran,
  Zbroj,
} from '../types/character';
import { DOSTREL_ORDER } from '../types/character';
import { coinCount } from './money';
import {
  BONUS_TABLE,
  DOSTREL_MOD,
  NOSNOST_TABLE,
  ZATIZENI_STEPS,
  type ZatizeniLevel,
} from './tables';

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

export function nosnost(sila: number): number {
  return lookup(NOSNOST_TABLE, sila);
}

export const isZbran = (item: Item): item is Zbran => item.kind === 'zbran';
export const isStrelna = (item: Item): item is Strelna => item.kind === 'strelna';
export const isZbroj = (item: Item): item is Zbroj => item.kind === 'zbroj';

export function equippedZbran(inventory: Item[]): Zbran | undefined {
  return inventory.filter(isZbran).find((z) => z.equipped);
}

export function equippedStrelna(inventory: Item[]): Strelna | undefined {
  return inventory.filter(isStrelna).find((s) => s.equipped);
}

export function equippedZbroj(inventory: Item[]): Zbroj | undefined {
  return inventory.filter(isZbroj).find((z) => z.equipped);
}

/** How many pieces of a given ammo template the character carries. */
export function ammoCount(inventory: Item[], templateId: string): number {
  return inventory
    .filter((i) => i.templateId === templateId)
    .reduce((sum, i) => sum + i.qty, 0);
}

/** Carried weight, coins included. */
export function totalWeight(character: Character): number {
  const items = character.inventory.reduce((sum, item) => sum + item.weight * item.qty, 0);
  return items + coinCount(character.money);
}

export function zatizeniFor(weight: number, capacity: number): ZatizeniLevel {
  if (capacity <= 0) return 'pretizen';
  const ratio = weight / capacity;
  return ZATIZENI_STEPS.find(([, limit]) => ratio <= limit)?.[0] ?? 'pretizen';
}

export interface DerivedStats {
  bonus: Record<Vlastnost, number>;
  zbran?: Zbran;
  strelna?: Strelna;
  zbroj?: Zbroj;
  /** Útočné číslo (melee). */
  uc: number;
  /** Ranged ÚČ per range band; undefined when no ranged weapon is equipped. */
  ucStrelba?: Record<Dostrel, number>;
  /** Ammo left for the equipped ranged weapon; undefined if it uses none. */
  munice?: number;
  /** Obranné číslo. */
  oc: number;
  iniciativa: number;
  nosnost: number;
  weight: number;
  zatizeni: ZatizeniLevel;
}

export function derive(character: Character): DerivedStats {
  const b = bonuses(character.vlastnosti);
  const zbran = equippedZbran(character.inventory);
  const strelna = equippedStrelna(character.inventory);
  const zbroj = equippedZbroj(character.inventory);
  const capacity = nosnost(character.vlastnosti.sil);
  const weight = totalWeight(character);

  // Adjust these formulas if your table reads them differently.
  const uc = b.sil + (zbran?.utocnost ?? 0);
  const oc = b.obr + (zbran?.obrana ?? 0) + (zbroj?.ochrana ?? 0);
  const iniciativa = b.obr + (zbran?.iniciativa ?? 0);

  // Ranged attacks lean on Obratnost, not Síla.
  let ucStrelba: Record<Dostrel, number> | undefined;
  if (strelna) {
    const base = b.obr + strelna.utocnost;
    ucStrelba = Object.fromEntries(
      DOSTREL_ORDER.map((k) => [k, base + DOSTREL_MOD[k]]),
    ) as Record<Dostrel, number>;
  }

  const munice = strelna?.municeId ? ammoCount(character.inventory, strelna.municeId) : undefined;

  return {
    bonus: b,
    zbran,
    strelna,
    zbroj,
    uc,
    ucStrelba,
    munice,
    oc,
    iniciativa,
    nosnost: capacity,
    weight,
    zatizeni: zatizeniFor(weight, capacity),
  };
}