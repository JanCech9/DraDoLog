// Hody kostkou podle Poznámek (str. 21) a Tvorby postavy (str. 26–30).
import type { Povolani, Presvedceni, Rasa, Vlastnost, Vlastnosti } from '../types/character';
import { VLASTNOSTI_ORDER } from '../types/character';
import { toMedaky } from './money';
import { OPRAVY_RASA, PRESVEDCENI_TABULKA, VLASTNOSTI_POVOLANI, VLASTNOSTI_RASA } from './tables';

export function roll(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function rollN(n: number, sides: number): number {
  let sum = 0;
  for (let i = 0; i < n; i++) sum += roll(sides);
  return sum;
}

/** 1k6+ : a six is rolled again and added, as long as sixes keep coming. */
export function roll1k6Plus(): { total: number; rolls: number[] } {
  const rolls: number[] = [];
  let r: number;
  do {
    r = roll(6);
    rolls.push(r);
  } while (r === 6);
  return { total: rolls.reduce((a, b) => a + b, 0), rolls };
}

/** k% : two k10, 00 counts as 100. */
export function rollPercent(): number {
  return roll(100);
}

/**
 * Hod na rozsah A–B (str. 21): the span decides the dice - a multiple of 5
 * means k6s, a multiple of 9 means k10s. Anything else is rolled uniformly.
 */
export function rollRange(min: number, max: number): number {
  const span = max - min;
  if (span <= 0) return min;
  if (span % 5 === 0) {
    const n = span / 5;
    return min - n + rollN(n, 6);
  }
  if (span % 9 === 0) {
    const n = span / 9;
    return min - n + rollN(n, 10);
  }
  return min + Math.floor(Math.random() * (span + 1));
}

/** Range for one attribute of a given race and class (Tabulky vlastností + Tabulka oprav). */
export function rozsahVlastnosti(rasa: Rasa, povolani: Povolani, v: Vlastnost): readonly [number, number] {
  const zakladni = VLASTNOSTI_POVOLANI[povolani][v];
  if (zakladni) {
    const o = OPRAVY_RASA[rasa][v];
    return [zakladni[0] + o, zakladni[1] + o];
  }
  return VLASTNOSTI_RASA[rasa][v];
}

/** Roll all five attributes for a race/class as the rulebook describes. */
export function rollVlastnosti(rasa: Rasa, povolani: Povolani): Vlastnosti {
  const out = {} as Vlastnosti;
  for (const v of VLASTNOSTI_ORDER) {
    const [min, max] = rozsahVlastnosti(rasa, povolani, v);
    out[v] = Math.max(1, Math.min(21, rollRange(min, max)));
  }
  return out;
}

/** Určování přesvědčení náhodně (str. 29). */
export function rollPresvedceni(rasa: Rasa): Presvedceni {
  return PRESVEDCENI_TABULKA[rasa][roll(10) - 1];
}

/** Počáteční peníze (str. 30): (1k6+5) × 10 zlaťáků, in měďáky. */
export function rollPocatecniPenize(): number {
  return toMedaky({ zl: (roll(6) + 5) * 10 });
}

/** Fatální neúspěch (str. 82): a k% roll divisible by 10 that is above the chance. */
export function jeFatalni(hod: number, sance: number): boolean {
  return hod % 10 === 0 && hod > sance;
}
