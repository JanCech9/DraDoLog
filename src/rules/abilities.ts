import type { Character, KouzloTemplate, SchopnostTemplate } from '../types/character';
import { SCHOPNOSTI } from '../data/abilities';
import { bonus } from './derived';

export function schopnostiFor(c: Character): SchopnostTemplate[] {
  return SCHOPNOSTI.filter(
    (s) => s.povolani === c.identity.povolani && s.odUrovne <= c.identity.uroven,
  );
}

/** Placeholder formula; replace with the real table from the rulebook. */
export function sance(s: SchopnostTemplate, c: Character): number {
  const base = s.zakladniSance ?? 0;
  const perLevel = 5 * (c.identity.uroven - 1);
  const obr = bonus(c.vlastnosti.obr) * 5;
  const mod = c.schopnostiMod[s.id] ?? 0;
  return Math.max(0, Math.min(99, base + perLevel + obr + mod));
}

export const canCast = (k: KouzloTemplate, c: Character) =>
  c.magenergie.current >= k.magCost;