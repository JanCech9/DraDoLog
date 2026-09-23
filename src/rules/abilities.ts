import type {
  Character,
  KouzloTemplate,
  RysTemplate,
  SchopnostTemplate,
} from '../types/character';
import { SCHOPNOSTI } from '../data/abilities';
import { RYSY } from '../data/races';
import { KOUZLA } from '../data/spells';
import { bonus } from './derived';

export function schopnostiFor(c: Character): SchopnostTemplate[] {
  return SCHOPNOSTI.filter(
    (s) => s.povolani === c.identity.povolani && s.odUrovne <= c.identity.uroven,
  );
}

/** Racial traits depend only on race, so switching race updates them instantly. */
export function rysyFor(c: Character): RysTemplate[] {
  return RYSY.filter((r) => r.rasa === c.identity.rasa);
}

/** Spells the class may know at this level, whether learned yet or not. */
export function kouzlaFor(c: Character): KouzloTemplate[] {
  return KOUZLA.filter(
    (k) => k.povolani === c.identity.povolani && k.odUrovne <= c.identity.uroven,
  );
}

/** Placeholder formula; replace with the real table from the rulebook. */
export function sance(s: SchopnostTemplate, c: Character): number {
  const base = s.zakladniSance ?? 0;
  const perLevel = 5 * (c.identity.uroven - 1);
  const obr = bonus(c.vlastnosti.obr) * 5;
  const mod = c.schopnostiMod[s.id] ?? 0;
  return clamp(base + perLevel + obr + mod);
}

/**
 * Race percentages. Flat by default - if your table lets level or Obratnost
 * shift čich and sluch, mirror the sance() formula here.
 */
export function sanceRys(r: RysTemplate, c: Character): number {
  return clamp((r.hodnota ?? 0) + (c.schopnostiMod[r.id] ?? 0));
}

const clamp = (n: number) => Math.max(0, Math.min(99, n));

export const canCast = (k: KouzloTemplate, c: Character) =>
  c.magenergie.current >= k.magCost;