// Domain model for a Dračí doupě 1.6 character sheet.
// Keys are English; every string shown in the UI comes from the *_LABELS maps.

export type Rasa = 'clovek' | 'trpaslik' | 'kuduk' | 'elf' | 'hobit' | 'kroll' | 'barbar';
// 'bojovnik' is kept as the storage key of the class the rules call "válečník".
export type Povolani = 'bojovnik' | 'hranicar' | 'alchymista' | 'kouzelnik' | 'zlodej';
export type Vlastnost = 'sil' | 'obr' | 'odl' | 'int' | 'chs';
export type Presvedceni =
  | 'zakonne-dobro'
  | 'zmatene-dobro'
  | 'neutralni'
  | 'zmatene-zlo'
  | 'zakonne-zlo';
export type SchopnostKind = 'pasivni' | 'procentni' | 'aktivni';
/** Size class of a playable race (monsters go up to E). */
export type Velikost = 'A' | 'B' | 'C';
/** Weapon class as used by the class restrictions (lehká / střední / těžká). */
export type TridaZbrane = 'lehka' | 'stredni' | 'tezka';

export const RASA_LABELS: Record<Rasa, string> = {
  clovek: 'Člověk',
  trpaslik: 'Trpaslík',
  kuduk: 'Kudůk',
  elf: 'Elf',
  hobit: 'Hobit',
  kroll: 'Kroll',
  barbar: 'Barbar',
};

export const POVOLANI_LABELS: Record<Povolani, string> = {
  bojovnik: 'Válečník',
  hranicar: 'Hraničář',
  alchymista: 'Alchymista',
  kouzelnik: 'Kouzelník',
  zlodej: 'Zloděj',
};

export const VLASTNOST_LABELS: Record<Vlastnost, string> = {
  sil: 'Síla',
  obr: 'Obratnost',
  odl: 'Odolnost',
  int: 'Inteligence',
  chs: 'Charisma',
};

export const PRESVEDCENI_LABELS: Record<Presvedceni, string> = {
  'zakonne-dobro': 'Zákonné dobro',
  'zmatene-dobro': 'Zmatené dobro',
  neutralni: 'Neutrální',
  'zmatene-zlo': 'Zmatené zlo',
  'zakonne-zlo': 'Zákonné zlo',
};

export const TRIDA_ZBRANE_LABELS: Record<TridaZbrane, string> = {
  lehka: 'lehká',
  stredni: 'střední',
  tezka: 'těžká',
};

export const VLASTNOSTI_ORDER: readonly Vlastnost[] = ['sil', 'obr', 'odl', 'int', 'chs'];

/**
 * Classes that work with magenergie. Kouzelník and hraničář regain it by
 * meditation (hraničář only from level 2); alchymista keeps a stock in his
 * truhla that never regenerates.
 */
export const MAGIC_POVOLANI: readonly Povolani[] = ['kouzelnik', 'hranicar', 'alchymista'];

export type Vlastnosti = Record<Vlastnost, number>;

export type ItemKind = 'zbran' | 'strelna' | 'zbroj' | 'stit' | 'ostatni';

export const ITEM_KIND_LABELS: Record<ItemKind, string> = {
  zbran: 'Zbraň',
  strelna: 'Střelná / vrhací zbraň',
  zbroj: 'Zbroj',
  stit: 'Štít',
  ostatni: 'Ostatní',
};

export type Dostrel = 'maly' | 'stredni' | 'velky';

export const DOSTREL_ORDER: readonly Dostrel[] = ['maly', 'stredni', 'velky'];

export const DOSTREL_LABELS: Record<Dostrel, string> = {
  maly: 'Malý',
  stredni: 'Střední',
  velky: 'Velký',
};

interface ItemBase {
  id: string;
  name: string;
  /** Set when the item came from the catalog; used to merge stackable rows. */
  templateId?: string;
  /** Weight in mince (mn). See WEIGHT_UNIT in rules/tables.ts. */
  weight: number;
  qty: number;
  note?: string;
}

export interface Zbran extends ItemBase {
  kind: 'zbran';
  equipped: boolean;
  /** Síla zbraně (SZ) - goes into ÚČ. */
  sila: number;
  /** Útočnost (út) - added to damage on a hit. */
  utocnost: number;
  /** Obrana zbraně (OZ) - added to the defence roll when parrying. */
  obrana: number;
  trida: TridaZbrane;
  /** Two-handed: no shield can be used with it. */
  obourucni: boolean;
  /** Modifier to the initiative roll in the extended combat system (−2 = "ztrácí iniciativu"). */
  iniciativa: number;
  /** Reach in hexes (extended combat), e.g. "1", "1–2". */
  delka?: string;
}

export interface Strelna extends ItemBase {
  kind: 'strelna';
  equipped: boolean;
  /** Síla zbraně (SZ). */
  sila: number;
  /** Útočnost (út). */
  utocnost: number;
  /** Range limits in sáhy, in DOSTREL_ORDER: [malý, střední, velký]. */
  dostrel: [number, number, number];
  /** templateId of the ammo stack this weapon consumes. */
  municeId?: string;
  trida: TridaZbrane;
  /** Thrown weapon (as opposed to a bow / crossbow / sling). */
  vrhaci: boolean;
  /** Těžká kuše: fires once per two rounds, válečník only. */
  tezkaKuse?: boolean;
}

export interface Zbroj extends ItemBase {
  kind: 'zbroj';
  equipped: boolean;
  /** Kvalita zbroje (KZ). No armour at all counts as KZ 1. */
  ochrana: number;
}

export interface Stit extends ItemBase {
  kind: 'stit';
  equipped: boolean;
  /** Bonus to the defence roll (+1 ordinary shield, +2 kouzelný štít). */
  obrana: number;
}

export interface Ostatni extends ItemBase {
  kind: 'ostatni';
}

export type Item = Zbran | Strelna | Zbroj | Stit | Ostatni;

/** Omit that distributes over a union, so kind-specific props survive. */
export type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

/** An item before it gets an id (what addItem accepts). */
export type NewItem = DistributiveOmit<Item, 'id'>;

export type LogKind = 'hp' | 'xp' | 'money' | 'mag' | 'ammo' | 'note';

export interface LogEntry {
  id: string;
  ts: number;
  kind: LogKind;
  delta?: number;
  text: string;
  /** For 'ammo' entries: templateId of the stack, so undo can put the shot back. */
  ref?: string;
}

export interface Character {
  /** Bump this when the shape changes so old saves can be migrated or discarded. */
  version: 3;
  identity: {
    name: string;
    rasa: Rasa;
    povolani: Povolani;
    uroven: number;
    presvedceni: Presvedceni;
  };
  /** Base values only - every bonus is derived from these at render time. */
  pribeh: string;
  vlastnosti: Vlastnosti;
  hp: { current: number; max: number };
  magenergie: { current: number; max: number };
  xp: number;
  /** Stored in the smallest coin (měďák) to avoid rounding when splitting loot. */
  money: number;
  inventory: Item[];
  log: LogEntry[];
  /** Known spell ids. Class abilities are derived from level, not stored. */
  kouzla: string[];
  /** Known recipe ids (alchymista). Empty = every recipe of the level is available. */
  recepty: string[];
  /** Manual per-ability overrides, e.g. GM-granted bonus to a % skill. */
  schopnostiMod: Record<string, number>;
}

export interface SchopnostTemplate {
  id: string;
  name: string;
  povolani: Povolani;
  /** Level from which the class gets it. */
  odUrovne: number;
  kind: SchopnostKind;
  /** For 'aktivni'. */
  magCost?: number;
  /**
   * For 'procentni': base chance per level (index 0 = level 1). The last value
   * is reused for higher levels. See rules/abilities.ts.
   */
  sanceUrovne?: readonly number[];
  /** For 'procentni': [attribute, multiplier] pairs whose bonus is added. */
  zavisiNa?: ReadonlyArray<readonly [Vlastnost, number]>;
  popis?: string;
}

export interface KouzloTemplate {
  id: string;
  name: string;
  /** Name in the language of the spell books, e.g. *Artak bárak*. */
  jmeno?: string;
  povolani: Povolani; // 'kouzelnik' | 'hranicar'
  odUrovne: number;
  /** Minimum magenergie of one casting (for variable spells: the cheapest variant). */
  magCost: number;
  /** How the cost scales, e.g. "3 za 1. blesk, 2 za každý další". */
  magCostPopis?: string;
  /** Save the target rolls, in the rulebook's notation "Int – 6 – 0". */
  past?: string;
  dosah?: string; // free text, units vary per spell
  rozsah?: string;
  vyvolani?: string;
  trvani?: string;
  popis?: string;
}

export interface RecipeTemplate {
  // alchymista
  id: string;
  name: string;
  odUrovne: number;
  magCost: number;
  /** In měďáky, cost of ingredients (suroviny). */
  surovinyCena: number;
  /** Catalog templateId of the resulting item. */
  vysledekId: string;
  zaklad?: string;
  trvani?: string;
  vyroba?: string;
  /** Needs a laboratory ("doma") - cannot be made on the road. */
  doma?: boolean;
  popis?: string;
}
