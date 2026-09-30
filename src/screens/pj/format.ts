// Small formatting helpers shared by the PJ table and cards.
import type { DerivedStats } from '../../rules/derived';

export { signed } from '../format';

export const stampFormat = new Intl.DateTimeFormat('cs-CZ', {
  day: 'numeric',
  month: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

/** Colour class for the HP figure: out of the fight, wounded, or fine. */
export function hpTone(d: DerivedStats, hp: { current: number; max: number }): string {
  if (hp.current <= 0 || d.vyrazen) return 'hp hp--out';
  if (d.postihZraneni) return 'hp hp--low';
  return 'hp';
}

/** "Mrtev." / "Vyřazen…" / "Mez vyřazení n." - the line under the HP figure. */
export function hpStatus(d: DerivedStats, hp: { current: number; max: number }): string {
  if (hp.current <= 0) return 'Mrtev.';
  if (d.vyrazen) return `Vyřazen z boje (mez vyřazení ${d.mezVyrazeni}).`;
  return `Mez vyřazení ${d.mezVyrazeni}.`;
}
