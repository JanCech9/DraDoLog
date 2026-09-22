import type { Item } from '../types/character';
import { toMedaky } from '../rules/money';
import { newId } from '../state/defaultCharacter';

// Omit that works per union member, so kind-specific props survive
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

export type ItemTemplate = DistributiveOmit<Item, 'id' | 'qty' | 'equipped' | 'note'> & {
  templateId: string;
  /** In měďáky */
  price: number;
  /** Merge into an existing stack instead of adding a new row */
  stackable?: boolean;
};

// ⚠ Placeholder numbers: copy the real ones from Pravidla 1.6
export const CATALOG: readonly ItemTemplate[] = [
  // Zbraně na blízko
  { templateId: 'dyka', kind: 'zbran', name: 'Dýka', weight: 10, utocnost: 1, obrana: 0, iniciativa: 1, price: toMedaky({ st: 5 }) },
  { templateId: 'kratky-mec', kind: 'zbran', name: 'Krátký meč', weight: 30, utocnost: 2, obrana: 1, iniciativa: 0, price: toMedaky({ zl: 1 }) },
  { templateId: 'dlouhy-mec', kind: 'zbran', name: 'Dlouhý meč', weight: 50, utocnost: 3, obrana: 1, iniciativa: 0, price: toMedaky({ zl: 3 }) },

  // Střelné zbraně
  { templateId: 'prak', kind: 'strelna', name: 'Prak', weight: 5, utocnost: 0, dostrel: [8, 20, 40], municeId: 'kameny', price: toMedaky({ st: 2 }) },
  { templateId: 'kratky-luk', kind: 'strelna', name: 'Krátký luk', weight: 20, utocnost: 1, dostrel: [10, 25, 50], municeId: 'sipy', price: toMedaky({ zl: 2 }) },
  { templateId: 'dlouhy-luk', kind: 'strelna', name: 'Dlouhý luk', weight: 30, utocnost: 2, dostrel: [15, 35, 70], municeId: 'sipy', price: toMedaky({ zl: 5 }) },
  { templateId: 'lehka-kuse', kind: 'strelna', name: 'Lehká kuše', weight: 50, utocnost: 3, dostrel: [12, 30, 60], municeId: 'sipky', price: toMedaky({ zl: 8 }) },

  // Munice (cena za kus)
  { templateId: 'sipy', kind: 'ostatni', name: 'Šípy', weight: 1, price: toMedaky({ md: 5 }), stackable: true },
  { templateId: 'sipky', kind: 'ostatni', name: 'Šipky do kuše', weight: 1, price: toMedaky({ md: 8 }), stackable: true },
  { templateId: 'kameny', kind: 'ostatni', name: 'Kameny do praku', weight: 1, price: toMedaky({ md: 1 }), stackable: true },

  // Zbroje
  { templateId: 'kozena-zbroj', kind: 'zbroj', name: 'Kožená zbroj', weight: 150, ochrana: 1, price: toMedaky({ zl: 2 }) },
  { templateId: 'krouzkova-zbroj', kind: 'zbroj', name: 'Kroužková zbroj', weight: 300, ochrana: 3, price: toMedaky({ zl: 10 }) },

  // Ostatní
  { templateId: 'pochoden', kind: 'ostatni', name: 'Pochodeň', weight: 5, price: toMedaky({ md: 5 }), stackable: true },
  { templateId: 'lano', kind: 'ostatni', name: 'Lano (10 m)', weight: 40, price: toMedaky({ st: 2 }), stackable: true },
  { templateId: 'davka-jidla', kind: 'ostatni', name: 'Denní dávka jídla', weight: 10, price: toMedaky({ st: 1 }), stackable: true },
];

const AMMO_IDS = new Set(
  CATALOG.flatMap((t) => (t.kind === 'strelna' && t.municeId ? [t.municeId] : [])),
);

/** Catalog items that some ranged weapon uses as ammo. */
export const AMMO_TEMPLATES = CATALOG.filter((t) => AMMO_IDS.has(t.templateId));

export function fromTemplate(t: ItemTemplate, qty = 1): Item {
  const { price: _p, stackable: _s, ...rest } = t;
  const base = { ...rest, id: newId(), qty };
  return (rest.kind === 'ostatni' ? base : { ...base, equipped: false }) as Item;
}