import { useCallback, useEffect, useState } from 'react';
import {
  CHRONICLE_STORAGE_KEY,
  addEntry,
  chronicleToFile,
  createEntry,
  describeMerge,
  emptyChronicle,
  loadChronicle,
  mergeChronicles,
  readChronicleFile,
  removeEntry,
  saveChronicle,
  updateEntry,
  type Chronicle,
  type EntryPatch,
} from './chronicle';
import { shareFile } from './characterFile';

export function useChronicle() {
  const [chronicle, setChronicle] = useState<Chronicle>(() => loadChronicle() ?? emptyChronicle());
  /** One line about the last import, shown above the entries. */
  const [notice, setNotice] = useState('');

  useEffect(() => {
    saveChronicle(chronicle);
  }, [chronicle]);

  // The sheet and the PJ view share one chronicle (same origin, same key).
  // With both open at once, pick up what the other tab wrote instead of
  // overwriting it. mergeChronicles returns the same object when there is
  // nothing new, so the two tabs settle instead of echoing each other.
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== CHRONICLE_STORAGE_KEY) return;
      const theirs = loadChronicle();
      if (theirs) setChronicle((mine) => mergeChronicles(mine, theirs).chronicle);
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  /** Start a new entry (today, empty); returns its id so the screen can open it for writing. */
  const add = useCallback((defaults: EntryPatch = {}): string => {
    const entry = createEntry(defaults);
    setChronicle((c) => addEntry(c, entry));
    return entry.id;
  }, []);

  const update = useCallback((id: string, patch: EntryPatch) => setChronicle((c) => updateEntry(c, id, patch)), []);

  const remove = useCallback((id: string) => setChronicle((c) => removeEntry(c, id)), []);

  /**
   * Merge someone else's kronika.json into this one. Resolves to a line saying
   * what it brought, or to null when the file is not a chronicle at all - the
   * shared file pickers use that to fall through to the character import.
   */
  const importFile = useCallback(
    async (file: File): Promise<string | null> => {
      const incoming = await readChronicleFile(file);
      if (!incoming) return null;
      setChronicle((c) => mergeChronicles(c, incoming).chronicle);
      const text = describeMerge(mergeChronicles(chronicle, incoming));
      setNotice(text);
      return text;
    },
    [chronicle],
  );

  /** Send the chronicle to the others: share sheet where available, download otherwise. */
  const share = useCallback(() => shareFile(chronicleToFile(chronicle), 'Kronika družiny'), [chronicle]);

  return { chronicle, notice, setNotice, add, update, remove, importFile, share };
}

export type ChronicleStore = ReturnType<typeof useChronicle>;
