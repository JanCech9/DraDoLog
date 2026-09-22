// Domain model for a Dračí doupě 1.6 character sheet.
// Keys are English; every string shown in the UI comes from the *_LABELS maps.

export type Rasa = 'clovek' | 'trpaslik' | 'elf' | 'hobit' | 'kroll' | 'barbar';
export type Povolani = 'bojovnik' | 'hranicar' | 'alchymista' | 'kouzelnik' | 'zlodej';
export type Vlastnost = 'sil' | 'obr' | 'odl' | 'int' | 'chs';

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

export const VLASTNOSTI_ORDER: readonly Vlastnost[] = ['sil', 'obr', 'odl', 'int', 'chs'];

/** Classes that track magenergie. */
export const MAGIC_POVOLANI: readonly Povolani[] = ['kouzelnik', 'alchymista'];

export type Vlastnosti = Record<Vlastnost, number>;

export type ItemKind = 'zbran' | 'zbroj' | 'ostatni';

export const ITEM_KIND_LABELS: Record<ItemKind, string> = {
  zbran: 'Zbraň',
  zbroj: 'Zbroj',
  ostatni: 'Ostatní',
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

export interface Zbroj extends ItemBase {
  kind: 'zbroj';
  equipped: boolean;
  /** Quality of the armour, subtracted from incoming damage. */
  ochrana: number;
}

export interface Ostatni extends ItemBase {
  kind: 'ostatni';
}

export type Item = Zbran | Zbroj | Ostatni;

export type LogKind = 'hp' | 'xp' | 'money' | 'mag' | 'note';

export interface LogEntry {
  id: string;
  ts: number;
  kind: LogKind;
  delta?: number;
  text: string;
}

export interface Character {
  /** Bump this when the shape changes so old saves can be migrated or discarded. */
  version: 1;
  identity: {
    name: string;
    rasa: Rasa;
    povolani: Povolani;
    uroven: number;
    presvedceni: string;
  };
  /** Base values only - every bonus is derived from these at render time. */
  vlastnosti: Vlastnosti;
  hp: { current: number; max: number };
  magenergie: { current: number; max: number };
  xp: number;
  /** Stored in the smallest coin (měďák) to avoid rounding when splitting loot. */
  money: number;
  inventory: Item[];
  log: LogEntry[];
}
