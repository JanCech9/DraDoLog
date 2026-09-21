// Every computed number lives here. Nothing derived is ever stored on the
// character, so a stat edit can never leave the sheet out of sync.

import type { Character, Item, Vlastnost, Vlastnosti, Zbran, Zbroj } from '../types/character';
import { coinCount } from './money';
import {
  BONUS_TABLE,
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
export const isZbroj = (item: Item): item is Zbroj => item.kind === 'zbroj';

export function equippedZbran(inventory: Item[]): Zbran | undefined {
  return inventory.filter(isZbran).find((z) => z.equipped);
}

export function equippedZbroj(inventory: Item[]): Zbroj | undefined {
  return inventory.filter(isZbroj).find((z) => z.equipped);
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
  zbroj?: Zbroj;
  /** Útočné číslo. */
  uc: number;
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
  const zbroj = equippedZbroj(character.inventory);
  const capacity = nosnost(character.vlastnosti.sil);
  const weight = totalWeight(character);

  // Adjust these three formulas if your table reads them differently.
  const uc = b.sil + (zbran?.utocnost ?? 0);
  const oc = b.obr + (zbran?.obrana ?? 0) + (zbroj?.ochrana ?? 0);
  const iniciativa = b.obr + (zbran?.iniciativa ?? 0);

  return {
    bonus: b,
    zbran,
    zbroj,
    uc,
    oc,
    iniciativa,
    nosnost: capacity,
    weight,
    zatizeni: zatizeniFor(weight, capacity),
  };
}
