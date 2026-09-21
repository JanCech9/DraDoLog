import { useCallback, useEffect, useState } from 'react';
import type { Character, Item, LogKind } from '../types/character';
import { createCharacter, newId } from './defaultCharacter';

const STORAGE_KEY = 'drd-sheet:character';

function load(): Character | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Character;
    return parsed?.version === 1 ? parsed : null;
  } catch {
    return null;
  }
}

export function useCharacter() {
  const [character, setCharacter] = useState<Character>(() => load() ?? createCharacter());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(character));
    } catch {
      // Storage can be full or blocked - the sheet still works for this session.
    }
  }, [character]);

  /** Mutate a copy of the character; the copy becomes the new state. */
  const update = useCallback((recipe: (draft: Character) => void) => {
    setCharacter((prev) => {
      const draft = structuredClone(prev);
      recipe(draft);
      return draft;
    });
  }, []);

  const log = useCallback(
    (draft: Character, kind: LogKind, text: string, delta?: number) => {
      draft.log.unshift({ id: newId(), ts: Date.now(), kind, text, delta });
      draft.log = draft.log.slice(0, 100);
    },
    [],
  );

  const adjustHp = useCallback(
    (delta: number) =>
      update((draft) => {
        const next = Math.min(draft.hp.max, draft.hp.current + delta);
        draft.hp.current = next;
        log(draft, 'hp', delta < 0 ? 'Zranění' : 'Léčení', delta);
      }),
    [update, log],
  );

  const adjustMag = useCallback(
    (delta: number) =>
      update((draft) => {
        draft.magenergie.current = Math.max(
          0,
          Math.min(draft.magenergie.max, draft.magenergie.current + delta),
        );
        log(draft, 'mag', 'Magenergie', delta);
      }),
    [update, log],
  );

  const adjustXp = useCallback(
    (delta: number) =>
      update((draft) => {
        draft.xp = Math.max(0, draft.xp + delta);
        log(draft, 'xp', 'Zkušenosti', delta);
      }),
    [update, log],
  );

  const adjustMoney = useCallback(
    (delta: number) =>
      update((draft) => {
        draft.money = Math.max(0, draft.money + delta);
        log(draft, 'money', 'Peníze', delta);
      }),
    [update, log],
  );

  const addItem = useCallback(
    (item: Omit<Item, 'id'>) =>
      update((draft) => {
        draft.inventory.push({ ...item, id: newId() } as Item);
      }),
    [update],
  );

  const removeItem = useCallback(
    (id: string) =>
      update((draft) => {
        draft.inventory = draft.inventory.filter((item) => item.id !== id);
      }),
    [update],
  );

  const setQty = useCallback(
    (id: string, qty: number) =>
      update((draft) => {
        const item = draft.inventory.find((i) => i.id === id);
        if (item) item.qty = Math.max(0, qty);
      }),
    [update],
  );

  /** Only one zbraň and one zbroj can be worn at a time. */
  const toggleEquipped = useCallback(
    (id: string) =>
      update((draft) => {
        const target = draft.inventory.find((i) => i.id === id);
        if (!target || target.kind === 'ostatni') return;
        const next = !target.equipped;
        for (const item of draft.inventory) {
          if (item.kind === target.kind) item.equipped = false;
        }
        target.equipped = next;
      }),
    [update],
  );

  const undoLast = useCallback(
    () =>
      update((draft) => {
        const [entry] = draft.log;
        if (!entry || entry.delta === undefined) return;
        if (entry.kind === 'hp') draft.hp.current -= entry.delta;
        if (entry.kind === 'mag') draft.magenergie.current -= entry.delta;
        if (entry.kind === 'xp') draft.xp -= entry.delta;
        if (entry.kind === 'money') draft.money -= entry.delta;
        draft.log.shift();
      }),
    [update],
  );

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(character, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${character.identity.name || 'postava'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [character]);

  const importJson = useCallback(async (file: File) => {
    const parsed = JSON.parse(await file.text()) as Character;
    if (parsed?.version !== 1) throw new Error('Nepodporovaný formát souboru.');
    setCharacter(parsed);
  }, []);

  return {
    character,
    update,
    adjustHp,
    adjustMag,
    adjustXp,
    adjustMoney,
    addItem,
    removeItem,
    setQty,
    toggleEquipped,
    undoLast,
    exportJson,
    importJson,
  };
}

export type CharacterStore = ReturnType<typeof useCharacter>;
