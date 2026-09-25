// Omezení povolání ve výzbroji: úvod každé kapitoly o povolání (str. 34, 37, 43, 54, 63).
import type { Item, Povolani, TridaZbrane } from '../types/character';
import { POVOLANI_LABELS, TRIDA_ZBRANE_LABELS } from '../types/character';

interface Omezeni {
  /** Weapon classes the character may use in melee. */
  tridy: readonly TridaZbrane[];
  /** Thrown weapon classes allowed. */
  vrhaci: readonly TridaZbrane[];
  /** Bows, crossbows, slings at all? */
  strelne: boolean;
  tezkaKuse: boolean;
  /** Highest KZ the class is used to (1 = no armour). */
  maxKz: number;
  stit: boolean;
}

const VSE: readonly TridaZbrane[] = ['lehka', 'stredni', 'tezka'];

const OMEZENI: Record<Povolani, Omezeni> = {
  bojovnik: { tridy: VSE, vrhaci: VSE, strelne: true, tezkaKuse: true, maxKz: 7, stit: true },
  hranicar: { tridy: ['lehka', 'stredni'], vrhaci: VSE, strelne: true, tezkaKuse: false, maxKz: 5, stit: true },
  alchymista: { tridy: ['lehka'], vrhaci: ['lehka'], strelne: true, tezkaKuse: false, maxKz: 4, stit: false },
  kouzelnik: { tridy: ['lehka'], vrhaci: ['lehka'], strelne: false, tezkaKuse: false, maxKz: 1, stit: false },
  zlodej: { tridy: ['lehka', 'stredni'], vrhaci: VSE, strelne: true, tezkaKuse: false, maxKz: 3, stit: false },
};

/** Why the class cannot use the item, or null when it can. */
export function proctoNeovlada(povolani: Povolani, item: Pick<Item, 'kind'> & Partial<Item>): string | null {
  const o = OMEZENI[povolani];
  const kdo = POVOLANI_LABELS[povolani];
  switch (item.kind) {
    case 'zbran': {
      const trida = (item as Extract<Item, { kind: 'zbran' }>).trida;
      if (trida && !o.tridy.includes(trida)) return `${kdo} neovládá ${TRIDA_ZBRANE_LABELS[trida]} zbraně.`;
      return null;
    }
    case 'strelna': {
      const s = item as Extract<Item, { kind: 'strelna' }>;
      if (s.vrhaci) {
        if (s.trida && !o.vrhaci.includes(s.trida)) return `${kdo} neovládá ${TRIDA_ZBRANE_LABELS[s.trida]} vrhací zbraně.`;
        return null;
      }
      if (!o.strelne) return `${kdo} nepoužívá střelné zbraně.`;
      if (s.tezkaKuse && !o.tezkaKuse) return `${kdo} neovládá těžkou kuši.`;
      return null;
    }
    case 'zbroj': {
      const kz = (item as Extract<Item, { kind: 'zbroj' }>).ochrana ?? 1;
      if (kz > o.maxKz) return o.maxKz <= 1 ? `${kdo} nenosí žádnou zbroj.` : `${kdo} nosí jen zbroj do KZ ${o.maxKz}.`;
      return null;
    }
    case 'stit':
      return o.stit ? null : `${kdo} neumí používat štít.`;
    default:
      return null;
  }
}
