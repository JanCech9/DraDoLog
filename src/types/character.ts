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

/** Classes that track magenergie. Add 'hranicar' if your table plays it that way. */
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

export type LogKind = 'hp' | 'xp' | 'money' | 'mag' | 'ammo' | 'craft' | 'note';

export interface LogEntry {
  id: string;
  ts: number;
  kind: LogKind;
  delta?: number;
  text: string;
  /** For 'ammo' and 'craft' entries: templateId of the stack, so undo can fix it. */
  ref?: string;
}

export interface Character {
  /** Bump this when the shape changes so old saves can be migrated or discarded. */
  version: 2;
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
  /** Known recipe ids (alchymista). */
  recepty: string[];
  /** Manual per-ability overrides, e.g. GM-granted bonus to a % skill. */
  schopnostiMod: Record<string, number>;
}

export type SchopnostKind = 'pasivni' | 'procentni' | 'aktivni';

export interface SchopnostTemplate {
  id: string;
  name: string;
  povolani: Povolani;
  /** Level from which the class gets it. */
  odUrovne: number;
  kind: SchopnostKind;
  /** For 'aktivni'. */
  magCost?: number;
  /** For 'procentni': base chance at level 1; see rules/abilities.ts. */
  zakladniSance?: number;
  popis?: string;
}

export type RysKind = 'pasivni' | 'procentni' | 'dosah';

/** Racial trait: infravidění, čich, sluch and friends. Derived from rasa, never stored. */
export interface RysTemplate {
  id: string;
  name: string;
  rasa: Rasa;
  kind: RysKind;
  /** For 'dosah': range in sáhy. For 'procentni': base chance in %. */
  hodnota?: number;
  popis?: string;
}

export interface KouzloTemplate {
  id: string;
  name: string;
  povolani: Povolani;       // 'kouzelnik' | 'hranicar'
  odUrovne: number;
  magCost: number;
  dosah?: string;           // free text, units vary per spell
  rozsah?: string;
  vyvolani?: string;
  trvani?: string;
  popis?: string;
}

export interface RecipeTemplate {  // alchymista
  id: string;
  name: string;
  odUrovne: number;
  magCost: number;
  /** In měďáky, cost of ingredients. */
  surovinyCena: number;
  /** Catalog templateId of the resulting item. */
  vysledekId: string;
}