// Tvorba postavy (str. 26–31): turns what the player typed into the wizard
// into a complete level-1 character. Pure - the store just swaps it in.
import type { Character, LogEntry, LogKind, Povolani, Presvedceni, Rasa, Vlastnosti } from '../types/character';
import { VLASTNOSTI_ORDER } from '../types/character';
import { fromTemplate, type ItemTemplate } from '../data/catalog';
import { bonus } from '../rules/derived';
import { hpZaklad, magenergieZTabulky } from '../rules/abilities';
import { rozsahVlastnosti } from '../rules/tables';
import { toMedaky } from '../rules/money';
import { createCharacter, newId } from './defaultCharacter';

export interface Purchase {
  template: ItemTemplate;
  qty: number;
}

export interface NewCharacterDraft {
  name: string;
  rasa: Rasa;
  povolani: Povolani;
  presvedceni: Presvedceni;
  vlastnosti: Vlastnosti;
  /** The 1k6 rolled for starting money; undefined = starts penniless (by agreement with the PJ). */
  hodPenize?: number;
  purchases: Purchase[];
}

/** Životy na 1. úrovni (str. 27): základ povolání + bonus za odolnost, nejméně 1. */
export function pocatecniZivoty(povolani: Povolani, odl: number): number {
  return Math.max(1, hpZaklad(povolani) + bonus(odl));
}

/** Počáteční peníze (str. 30): (1k6+5) × 10 zlaťáků, in měďáky. */
export function pocatecniPenize(hod: number): number {
  return toMedaky({ zl: (hod + 5) * 10 });
}

export const cenaNakupu = (purchases: readonly Purchase[]): number =>
  purchases.reduce((sum, p) => sum + p.template.price * p.qty, 0);

/** Attributes outside the race/class range - the PJ may still allow them, so this only warns. */
export function mimoRozsah(draft: Pick<NewCharacterDraft, 'rasa' | 'povolani' | 'vlastnosti'>) {
  return VLASTNOSTI_ORDER.filter((v) => {
    const [min, max] = rozsahVlastnosti(draft.rasa, draft.povolani, v);
    const n = draft.vlastnosti[v];
    return n < min || n > max;
  });
}

export function buildCharacter(draft: NewCharacterDraft): Character {
  const c = createCharacter();
  c.identity = {
    name: draft.name.trim(),
    rasa: draft.rasa,
    povolani: draft.povolani,
    uroven: 1,
    presvedceni: draft.presvedceni,
  };
  c.vlastnosti = { ...draft.vlastnosti };

  const hp = pocatecniZivoty(draft.povolani, draft.vlastnosti.odl);
  c.hp = { current: hp, max: hp };
  const mag = magenergieZTabulky(c);
  c.magenergie = { current: mag, max: mag };

  const penize = draft.hodPenize === undefined ? 0 : pocatecniPenize(draft.hodPenize);
  c.money = penize;

  // The log reads newest first, so entries are written in reverse order of events.
  const entries: LogEntry[] = [];
  const note = (text: string, kind: LogKind = 'note', delta?: number) =>
    entries.unshift({ id: newId(), ts: Date.now(), kind, text, delta });

  note(`Nová postava: ${c.identity.name || 'Bezejmenný'}`);
  note(`Počáteční životy: ${hp}`);
  if (mag) note(`Magenergie podle tabulky: ${mag} magů`);
  if (penize) note('Počáteční peníze', 'money', penize);

  // One of each wearable kind goes on straight away; the player can swap later on Výbava.
  const equipped = new Set<string>();
  for (const { template, qty } of draft.purchases) {
    if (qty <= 0) continue;
    const cost = template.price * qty;
    if (cost > 0) {
      c.money -= cost;
      note(`Koupeno: ${qty}× ${template.name}`, 'money', -cost);
    } else {
      note(`Přidáno: ${qty}× ${template.name}`);
    }
    const stack = template.stackable ? c.inventory.find((i) => i.templateId === template.templateId) : undefined;
    if (stack) {
      stack.qty += qty;
      continue;
    }
    const item = fromTemplate(template, qty);
    if (item.kind !== 'ostatni' && !equipped.has(item.kind)) {
      item.equipped = true;
      equipped.add(item.kind);
    }
    c.inventory.push(item);
  }
  c.money = Math.max(0, c.money);

  c.log = entries;
  return c;
}
