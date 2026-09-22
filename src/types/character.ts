// Domain model for a Dračí doupě 1.6 character sheet.
// Keys are English; every string shown in the UI comes from the *_LABELS maps.

export type Rasa = 'clovek' | 'trpaslik' | 'elf' | 'hobit' | 'kroll' | 'barbar';
export type Povolani = 'bojovnik' | 'hranicar' | 'alchymista' | 'kouzelnik' | 'zlodej';
export type Vlastnost = 'sil' | 'obr' | 'odl' | 'int' | 'chs';
export type Presvedceni = | 'zakonne-dobro' | 'zmatene-dobro' | 'neutralni' | 'zmatene-zlo' | 'zakonne-zlo';


export const RASA_LABELS: Record<Rasa, string> = {
  clovek: 'Člověk',
  trpaslik: 'Trpaslík',
  elf: 'Elf',
  hobit: 'Hobit',
  kroll: 'Kroll',
  barbar: 'Barbar',
};

export const POVOLANI_LABELS: Record<Povolani, string> = {
  bojovnik: 'Bojovník',
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

export const VLASTNOSTI_ORDER: readonly Vlastnost[] = ['sil', 'obr', 'odl', 'int', 'chs'];

/** Classes that track magenergie. */
export const MAGIC_POVOLANI: readonly Povolani[] = ['kouzelnik', 'alchymista'];

export type Vlastnosti = Record<Vlastnost, number>;

export type ItemKind = 'zbran' | 'strelna' | 'zbroj' | 'ostatni';

export const ITEM_KIND_LABELS: Record<ItemKind, string> = {
  zbran: 'Zbraň',
  strelna: 'Střelná zbraň',
  zbroj: 'Zbroj',
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
  /** Weight in the unit your table uses. See WEIGHT_UNIT in rules/tables.ts. */
  weight: number;
  qty: number;
  note?: string;
}

export interface Zbran extends ItemBase {
  kind: 'zbran';
  equipped: boolean;
  utocnost: number;
  obrana: number;
  iniciativa: number;
}

export interface Strelna extends ItemBase {
  kind: 'strelna';
  equipped: boolean;
  utocnost: number;
  /** Range limits in sáhy, in DOSTREL_ORDER: [malý, střední, velký]. */
  dostrel: [number, number, number];
  /** templateId of the ammo stack this weapon consumes. */
  municeId?: string;
}

export interface Zbroj extends ItemBase {
  kind: 'zbroj';
  equipped: boolean;
  /** Quality of the armour, subtracted from incoming damage. */
  ochrana: number;
}

export interface Ostatni extends ItemBase {
  kind: 'ostatni';
}

export type Item = Zbran | Strelna | Zbroj | Ostatni;

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
  version: 1;
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
}