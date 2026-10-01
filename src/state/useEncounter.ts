import { useCallback, useEffect, useState } from 'react';
import {
  addNpcs,
  adjustNpcHp,
  emptyEncounter,
  loadEncounter,
  newRound,
  removeNpc,
  saveEncounter,
  setHod,
  type Encounter,
  type NpcDraft,
} from './encounter';

export function useEncounter() {
  const [encounter, setEncounter] = useState<Encounter>(() => loadEncounter() ?? emptyEncounter());

  useEffect(() => {
    saveEncounter(encounter);
  }, [encounter]);

  const add = useCallback((draft: NpcDraft, count: number) => setEncounter((e) => addNpcs(e, draft, count)), []);
  const adjustHp = useCallback((id: string, delta: number) => setEncounter((e) => adjustNpcHp(e, id, delta)), []);
  const remove = useCallback((id: string) => setEncounter((e) => removeNpc(e, id)), []);
  const roll = useCallback((id: string, hod: number | null) => setEncounter((e) => setHod(e, id, hod)), []);
  const nextRound = useCallback(() => setEncounter(newRound), []);
  const end = useCallback(() => setEncounter(emptyEncounter()), []);

  return { encounter, add, adjustHp, remove, roll, nextRound, end };
}

export type EncounterStore = ReturnType<typeof useEncounter>;
