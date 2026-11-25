// Kronika družiny: one record per session, written by whoever feels like it.
// There is no server, so the chronicle travels as a file (kronika.json) just
// like the character sheets do. Unlike a sheet it has many authors, so an
// import never replaces - it merges entry by entry, the newer edit winning.
// Everything here is pure; persistence and React live in useChronicle.ts.

import { newId } from './defaultCharacter';

export const CHRONICLE_STORAGE_KEY = 'drd-sheet:chronicle';
export const CHRONICLE_FILE_NAME = 'kronika.json';

export interface ChronicleEntry {
  id: string;
  /** Real-world day of the session, YYYY-MM-DD. */
  date: string;
  title: string;
  text: string;
  /** Who wrote the entry down. */
  author: string;
  /** Who ran the game that session - the group takes turns. */
  pj: string;
  /** ms since epoch; keeps same-day entries in the order they were started. */
  createdAt: number;
  /** ms since epoch of the last edit; the newer copy wins a merge. */
  updatedAt: number;
  /**
   * Tombstone. A deleted entry stays in the data (emptied) so that merging an
   * older file from someone else does not bring it back.
   */
  deleted?: true;
}

export interface Chronicle {
  version: 1;
  /** Tells a chronicle file apart from a character sheet on import. */
  kind: 'kronika';
  entries: ChronicleEntry[];
}

export type EntryPatch = Partial<Pick<ChronicleEntry, 'date' | 'title' | 'text' | 'author' | 'pj'>>;

export const emptyChronicle = (): Chronicle => ({ version: 1, kind: 'kronika', entries: [] });

/** Local calendar day as YYYY-MM-DD (toISOString would give the UTC day). */
export function isoDay(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

const dayFormat = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'long', year: 'numeric' });

/** "2026-11-21" → "21. listopadu 2026"; anything unparsable is shown as it is. */
export function formatDay(date: string): string {
  if (!ISO_DAY.test(date)) return date;
  const [y, m, d] = date.split('-').map(Number);
  return dayFormat.format(new Date(y, m - 1, d));
}

export function createEntry(defaults: EntryPatch = {}, now: number = Date.now()): ChronicleEntry {
  return {
    id: newId(),
    date: isoDay(new Date(now)),
    title: '',
    text: '',
    author: '',
    pj: '',
    ...defaults,
    createdAt: now,
    updatedAt: now,
  };
}

export function addEntry(chronicle: Chronicle, entry: ChronicleEntry): Chronicle {
  return { ...chronicle, entries: [...chronicle.entries, entry] };
}

export function updateEntry(chronicle: Chronicle, id: string, patch: EntryPatch, now: number = Date.now()): Chronicle {
  return {
    ...chronicle,
    entries: chronicle.entries.map((e) => (e.id === id && !e.deleted ? { ...e, ...patch, updatedAt: now } : e)),
  };
}

/** Delete = turn into a tombstone, see ChronicleEntry.deleted. */
export function removeEntry(chronicle: Chronicle, id: string, now: number = Date.now()): Chronicle {
  return {
    ...chronicle,
    entries: chronicle.entries.map((e) =>
      e.id === id ? { ...e, title: '', text: '', author: '', pj: '', updatedAt: now, deleted: true } : e,
    ),
  };
}

export const isBlank = (e: ChronicleEntry): boolean => !e.title.trim() && !e.text.trim();

/** What the screen shows: live entries, newest session first. */
export function visibleEntries(chronicle: Chronicle): ChronicleEntry[] {
  return chronicle.entries
    .filter((e) => !e.deleted)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt || a.id.localeCompare(b.id));
}

/** Names already used as author or PJ - offered as suggestions in the form. */
export function knownNames(chronicle: Chronicle): string[] {
  const names = new Set<string>();
  for (const e of chronicle.entries) {
    if (e.author.trim()) names.add(e.author.trim());
    if (e.pj.trim()) names.add(e.pj.trim());
  }
  return [...names].sort((a, b) => a.localeCompare(b, 'cs'));
}

export interface MergeResult {
  chronicle: Chronicle;
  /** Entries that were not here before. */
  added: number;
  /** Entries replaced by a newer edit from the other side. */
  updated: number;
  /** Entries the other side had deleted. */
  removed: number;
}

/**
 * Bring `incoming` into `local`. Entries are matched by id; where both sides
 * have one, the later `updatedAt` wins as a whole (no per-field merging - two
 * people rewriting the same entry between syncs is rare enough). When the
 * incoming file has nothing new, `local` itself is returned, so callers can
 * skip the state update.
 */
export function mergeChronicles(local: Chronicle, incoming: Chronicle): MergeResult {
  const byId = new Map(local.entries.map((e) => [e.id, e]));
  let added = 0;
  let updated = 0;
  let removed = 0;
  let changed = false;

  for (const theirs of incoming.entries) {
    const mine = byId.get(theirs.id);
    if (!mine) {
      byId.set(theirs.id, theirs);
      changed = true;
      // An unknown tombstone is kept (it may still be needed against a third copy) but not counted.
      if (!theirs.deleted) added++;
    } else if (theirs.updatedAt > mine.updatedAt) {
      byId.set(theirs.id, theirs);
      changed = true;
      if (theirs.deleted && !mine.deleted) removed++;
      else if (!theirs.deleted) updated++;
    }
  }

  if (!changed) return { chronicle: local, added, updated, removed };
  return { chronicle: { ...local, entries: [...byId.values()] }, added, updated, removed };
}

function str(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

/** Validate a stored/imported chronicle; null when it is not one of ours. */
export function normalizeChronicle(parsed: unknown): Chronicle | null {
  const c = parsed as Partial<Chronicle> | null;
  if (!c || typeof c !== 'object' || c.kind !== 'kronika') return null;
  if (typeof c.version !== 'number' || c.version > 1) return null;
  if (!Array.isArray(c.entries)) return null;

  const entries: ChronicleEntry[] = [];
  const seen = new Set<string>();
  for (const raw of c.entries as Array<Partial<ChronicleEntry> | null>) {
    if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string' || !raw.id || seen.has(raw.id)) continue;
    seen.add(raw.id);
    const updatedAt = typeof raw.updatedAt === 'number' ? raw.updatedAt : 0;
    entries.push({
      id: raw.id,
      date: ISO_DAY.test(str(raw.date)) ? str(raw.date) : isoDay(new Date(updatedAt || Date.now())),
      title: str(raw.title),
      text: str(raw.text),
      author: str(raw.author),
      pj: str(raw.pj),
      createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : updatedAt,
      updatedAt,
      ...(raw.deleted === true ? { deleted: true as const } : {}),
    });
  }
  return { version: 1, kind: 'kronika', entries };
}

export function loadChronicle(): Chronicle | null {
  try {
    const raw = localStorage.getItem(CHRONICLE_STORAGE_KEY);
    return raw ? normalizeChronicle(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

export function saveChronicle(chronicle: Chronicle): void {
  try {
    localStorage.setItem(CHRONICLE_STORAGE_KEY, JSON.stringify(chronicle));
  } catch {
    // Storage full or blocked - the chronicle still lives for this session.
  }
}

export function chronicleToFile(chronicle: Chronicle): File {
  return new File([JSON.stringify(chronicle, null, 2)], CHRONICLE_FILE_NAME, { type: 'application/json' });
}

/**
 * Read a file as a chronicle; null when it is something else (a character
 * sheet, broken JSON…). The shared file pickers and the PJ's drop zone use
 * this to route a kronika.json to the chronicle instead of rejecting it.
 */
export async function readChronicleFile(file: File): Promise<Chronicle | null> {
  try {
    return normalizeChronicle(JSON.parse(await file.text()));
  } catch {
    return null;
  }
}

/** "2 nové zápisy, 1 upravený." - what an import did, for the status line. */
export function describeMerge(result: MergeResult): string {
  const parts: string[] = [];
  const plural = (n: number, one: string, few: string, many: string) => (n === 1 ? one : n < 5 ? few : many);
  if (result.added) parts.push(`${result.added} ${plural(result.added, 'nový zápis', 'nové zápisy', 'nových zápisů')}`);
  if (result.updated) parts.push(`${result.updated} ${plural(result.updated, 'upravený', 'upravené', 'upravených')}`);
  if (result.removed) parts.push(`${result.removed} ${plural(result.removed, 'smazaný', 'smazané', 'smazaných')}`);
  return parts.length ? `Kronika: ${parts.join(', ')}.` : 'Kronika: nic nového, už máš všechno.';
}
