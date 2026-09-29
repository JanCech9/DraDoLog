import { useCallback, useEffect, useState } from 'react';
import {
  emptyParty,
  loadParty,
  parseCharacterFile,
  removeMember,
  saveParty,
  upsertMember,
  type Party,
} from './party';

export interface ImportResult {
  /** Character names that were added or refreshed. */
  loaded: string[];
  /** File names that could not be read. */
  failed: string[];
}

export function useParty() {
  const [party, setParty] = useState<Party>(() => loadParty() ?? emptyParty());

  useEffect(() => {
    saveParty(party);
  }, [party]);

  /** Import any number of exported sheets; bad files are reported, not fatal. */
  const importFiles = useCallback(async (files: Iterable<File>): Promise<ImportResult> => {
    const result: ImportResult = { loaded: [], failed: [] };
    const members = await Promise.all(
      Array.from(files).map(async (file) => {
        try {
          return await parseCharacterFile(file);
        } catch {
          result.failed.push(file.name);
          return null;
        }
      }),
    );
    const parsed = members.filter((m) => m !== null);
    for (const member of parsed) {
      result.loaded.push(member.character.identity.name || member.fileName || 'Bezejmenný');
    }
    if (parsed.length) {
      setParty((prev) => parsed.reduce(upsertMember, prev));
    }
    return result;
  }, []);

  const remove = useCallback((id: string) => setParty((prev) => removeMember(prev, id)), []);

  const clear = useCallback(() => setParty(emptyParty()), []);

  return { party, importFiles, remove, clear };
}

export type PartyStore = ReturnType<typeof useParty>;
