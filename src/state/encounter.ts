// The fight in progress, as the PJ tracks it: monsters / NPCs he typed in, plus
// this round's initiative rolls for everyone at the table. Unlike the party
// (read-only snapshots of the players' sheets) this is the PJ's own, editable
// data, so it lives under its own storage key and has its own lifetime.

import type { PartyMember } from './party';
import { derive } from '../rules/derived';
import { newId } from './defaultCharacter';

export const ENCOUNTER_STORAGE_KEY = 'drd-sheet:encounter';

export interface Npc {
  id: string;
  name: string;
  hp: { current: number; max: number };
  /** Free text - monsters often have several attacks ("5 / 3+2"). Nothing computes with it. */
  uc: string;
  oc: number;
  /** Modifier to the initiative roll, same meaning as DerivedStats.iniciativa. */
  iniciativa: number;
}

export type NpcDraft = Omit<Npc, 'id' | 'hp'> & { hp: number };

export interface Encounter {
  version: 1;
  npcs: Npc[];
  /** This round's 1k6 initiative rolls, keyed by character id / npc id. */
  hody: Record<string, number>;
}

export const emptyEncounter = (): Encounter => ({ version: 1, npcs: [], hody: {} });

/** Add `count` copies; several of a kind (or a repeated name) get numbered: "Skřet 1", "Skřet 2"… */
export function addNpcs(encounter: Encounter, draft: NpcDraft, count = 1): Encounter {
  const name = draft.name.trim() || 'Nestvůra';
  const taken = encounter.npcs.filter((n) => n.name === name || n.name.startsWith(`${name} `)).length;
  const numbered = count > 1 || taken > 0;
  const added: Npc[] = Array.from({ length: Math.max(1, count) }, (_, i) => ({
    ...draft,
    id: newId(),
    name: numbered ? `${name} ${taken + i + 1}` : name,
    hp: { current: draft.hp, max: draft.hp },
  }));
  return { ...encounter, npcs: [...encounter.npcs, ...added] };
}

export function adjustNpcHp(encounter: Encounter, id: string, delta: number): Encounter {
  return {
    ...encounter,
    npcs: encounter.npcs.map((n) =>
      n.id === id ? { ...n, hp: { ...n.hp, current: Math.max(0, Math.min(n.hp.max, n.hp.current + delta)) } } : n,
    ),
  };
}

export function removeNpc(encounter: Encounter, id: string): Encounter {
  const { [id]: _dropped, ...hody } = encounter.hody;
  return { ...encounter, npcs: encounter.npcs.filter((n) => n.id !== id), hody };
}

/** Record a roll for a player or a monster; null clears it. */
export function setHod(encounter: Encounter, id: string, hod: number | null): Encounter {
  const { [id]: _old, ...rest } = encounter.hody;
  return { ...encounter, hody: hod === null ? rest : { ...rest, [id]: hod } };
}

/** New round: everybody rolls again, the monsters stay. */
export const newRound = (encounter: Encounter): Encounter => ({ ...encounter, hody: {} });

// --- one list for the whole fight ---

interface RowBase {
  id: string;
  name: string;
  hp: number;
  /** Initiative modifier. */
  iniciativa: number;
  /** This round's roll, when it has been entered. */
  hod?: number;
}

export type CombatRow =
  | (RowBase & { kind: 'postava'; member: PartyMember; obr: number })
  | (RowBase & { kind: 'nestvura'; npc: Npc });

/** Players first (in import order), then monsters - the sort keys are precomputed once. */
export function combatRows(members: PartyMember[], encounter: Encounter): CombatRow[] {
  return [
    ...members.map((member): CombatRow => {
      const c = member.character;
      return {
        kind: 'postava',
        id: c.id,
        name: c.identity.name,
        hp: c.hp.current,
        iniciativa: derive(c).iniciativa,
        hod: encounter.hody[c.id],
        obr: c.vlastnosti.obr,
        member,
      };
    }),
    ...encounter.npcs.map(
      (npc): CombatRow => ({
        kind: 'nestvura',
        id: npc.id,
        name: npc.name,
        hp: npc.hp.current,
        iniciativa: npc.iniciativa,
        hod: encounter.hody[npc.id],
        npc,
      }),
    ),
  ];
}

/** Roll + modifier; before the roll is entered, just the modifier. */
export const poradi = (row: CombatRow): number => (row.hod ?? 0) + row.iniciativa;

/** Tabulka iniciativy a akcí (str. 78): ≤ 0 → 0, 1–6 → 2, 7–12 → 4… */
export const akce = (iniciativa: number): number => (iniciativa <= 0 ? 0 : Math.ceil(iniciativa / 6) * 2);

export type Order = 'nacteni' | 'jmeno' | 'iniciativa' | 'zivoty';

const collator = new Intl.Collator('cs');

export function sortRows(rows: CombatRow[], order: Order): CombatRow[] {
  const list = [...rows];
  switch (order) {
    case 'jmeno':
      return list.sort((a, b) => collator.compare(a.name, b.name));
    case 'iniciativa':
      // Tie → higher obratnost (str. 78); monsters have none, so those ties keep their order (PJ decides).
      return list.sort(
        (a, b) =>
          poradi(b) - poradi(a) || (a.kind === 'postava' && b.kind === 'postava' ? b.obr - a.obr : 0),
      );
    case 'zivoty':
      return list.sort((a, b) => a.hp - b.hp);
    default:
      return list;
  }
}

// --- storage ---

const num = (v: unknown, fallback = 0): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

export function normalizeEncounter(parsed: unknown): Encounter | null {
  const e = parsed as Partial<Encounter> | null;
  if (!e || typeof e !== 'object' || !Array.isArray(e.npcs)) return null;
  const npcs: Npc[] = [];
  for (const raw of e.npcs as Array<Partial<Npc>>) {
    if (!raw || typeof raw.id !== 'string') continue;
    const max = Math.max(0, num(raw.hp?.max));
    npcs.push({
      id: raw.id,
      name: typeof raw.name === 'string' ? raw.name : 'Nestvůra',
      hp: { max, current: Math.max(0, Math.min(max, num(raw.hp?.current, max))) },
      uc: typeof raw.uc === 'string' ? raw.uc : '',
      oc: num(raw.oc),
      iniciativa: num(raw.iniciativa),
    });
  }
  const hody: Record<string, number> = {};
  for (const [id, hod] of Object.entries(e.hody ?? {})) {
    if (typeof hod === 'number' && Number.isFinite(hod)) hody[id] = hod;
  }
  return { version: 1, npcs, hody };
}

export function loadEncounter(): Encounter | null {
  try {
    const raw = localStorage.getItem(ENCOUNTER_STORAGE_KEY);
    return raw ? normalizeEncounter(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveEncounter(encounter: Encounter): void {
  try {
    localStorage.setItem(ENCOUNTER_STORAGE_KEY, JSON.stringify(encounter));
  } catch {
    // Storage full or blocked - the fight still lives for this session.
  }
}
