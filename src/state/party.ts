// The PJ's copy of the party: a snapshot of every player's sheet, as last
// imported. Nothing here is edited - the players' phones stay the source of
// truth; the PJ just re-imports a newer file when he wants fresh numbers.

import type { Character } from '../types/character';
import { normalizeCharacter } from './useCharacter';

export const PARTY_STORAGE_KEY = 'drd-sheet:party';

export interface PartyMember {
  character: Character;
  /** When this snapshot was imported (ms since epoch). */
  importedAt: number;
  fileName?: string;
}

export interface Party {
  version: 1;
  members: PartyMember[];
}

export const emptyParty = (): Party => ({ version: 1, members: [] });

const nameKey = (c: Character) => c.identity.name.trim().toLowerCase();

/**
 * Same character = same id. Files exported before ids existed get a fresh
 * random id on every import, so a non-empty matching name also counts.
 */
export function sameCharacter(a: Character, b: Character): boolean {
  if (a.id === b.id) return true;
  const name = nameKey(a);
  return name !== '' && name === nameKey(b);
}

/** Replace the member this snapshot belongs to, or add a new one at the end. */
export function upsertMember(party: Party, member: PartyMember): Party {
  const index = party.members.findIndex((m) => sameCharacter(m.character, member.character));
  const members = [...party.members];
  if (index === -1) members.push(member);
  else members[index] = member;
  return { ...party, members };
}

export function removeMember(party: Party, id: string): Party {
  return { ...party, members: party.members.filter((m) => m.character.id !== id) };
}

/** Validate a stored party; members whose sheet no longer parses are dropped. */
export function normalizeParty(parsed: unknown): Party | null {
  const p = parsed as Partial<Party> | null;
  if (!p || typeof p !== 'object' || !Array.isArray(p.members)) return null;
  const members: PartyMember[] = [];
  for (const raw of p.members as Array<Partial<PartyMember>>) {
    const character = normalizeCharacter(raw?.character);
    if (!character) continue;
    members.push({
      character,
      importedAt: typeof raw.importedAt === 'number' ? raw.importedAt : Date.now(),
      ...(typeof raw.fileName === 'string' ? { fileName: raw.fileName } : {}),
    });
  }
  return { version: 1, members };
}

export function loadParty(): Party | null {
  try {
    const raw = localStorage.getItem(PARTY_STORAGE_KEY);
    return raw ? normalizeParty(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveParty(party: Party): void {
  try {
    localStorage.setItem(PARTY_STORAGE_KEY, JSON.stringify(party));
  } catch {
    // Storage full or blocked - the party still lives for this session.
  }
}

/** Parse one exported sheet; throws when the file is not one of ours. */
export async function parseCharacterFile(file: File): Promise<PartyMember> {
  const character = normalizeCharacter(JSON.parse(await file.text()));
  if (!character) throw new Error('Nepodporovaný formát souboru.');
  return { character, importedAt: Date.now(), fileName: file.name };
}
