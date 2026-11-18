import type { Item } from '../types/character';
import { CATALOG, fromTemplate } from '../data/catalog';

/** Week packs from the shop and the daily rations they are split into once opened. */
const DEN_ZA_TYDEN: Readonly<Record<string, string>> = {
  'jidlo-tyden': 'jidlo-den',
  'jidlo-tyden-dehydrovane': 'jidlo-den-dehydrovane',
};
const DENNI = new Set(Object.values(DEN_ZA_TYDEN));

const isTyden = (i: Item) => i.templateId !== undefined && i.templateId in DEN_ZA_TYDEN;
const isDen = (i: Item) => i.templateId !== undefined && DENNI.has(i.templateId);

/** How many days the food in the backpack lasts. */
export function dnyJidla(inventory: readonly Item[]): number {
  return inventory.reduce((sum, i) => sum + (isDen(i) ? i.qty : isTyden(i) ? i.qty * 7 : 0), 0);
}

/** "1 den", "3 dny", "7 dní" */
export function formatDny(n: number): string {
  return `${n} ${n === 1 ? 'den' : n >= 2 && n <= 4 ? 'dny' : 'dní'}`;
}

/**
 * Eat one day's ration. Opened rations go first; otherwise one week pack is
 * opened and split into 7 daily rations (same total weight). Returns the new
 * inventory, or null when there is nothing to eat.
 */
export function snistDen(inventory: readonly Item[]): Item[] | null {
  const inv = inventory.map((i) => ({ ...i }));
  let den = inv.find((i) => isDen(i) && i.qty > 0);
  if (!den) {
    const tyden = inv.find((i) => isTyden(i) && i.qty > 0);
    const t = tyden && CATALOG.find((c) => c.templateId === DEN_ZA_TYDEN[tyden.templateId!]);
    if (!tyden || !t) return null;
    tyden.qty -= 1;
    den = fromTemplate(t, 7);
    inv.push(den);
  }
  den.qty -= 1;
  return inv.filter((i) => i.qty > 0 || !(isDen(i) || isTyden(i)));
}
