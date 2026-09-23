import { useCallback, useEffect, useState } from 'react';
import type { Character, Item, LogKind, Strelna } from '../types/character';
import type { KouzloTemplate, RecipeTemplate, SchopnostTemplate } from '../types/character';
import { CATALOG, fromTemplate, type ItemTemplate } from '../data/catalog';
import { createCharacter, newId } from './defaultCharacter';
import { PRESVEDCENI_LABELS, type Presvedceni } from '../types/character';

const STORAGE_KEY = 'drd-sheet:character';

/** What actually comes out of JSON.parse: the current shape, but any version. */
type StoredCharacter = Omit<Character, 'version'> & { version: number };

function normalizePresvedceni(value: unknown): Presvedceni {
  if (typeof value === 'string') {
    if (value in PRESVEDCENI_LABELS) return value as Presvedceni;
    const match = Object.entries(PRESVEDCENI_LABELS).find(
      ([, label]) => label.toLowerCase() === value.trim().toLowerCase(),
    );
    if (match) return match[0] as Presvedceni;
  }
  return 'neutralni';
}

/** Migrate older saves and fill in fields they don't have. Null = unusable file. */
function normalize(parsed: unknown): Character | null {
  const c = parsed as StoredCharacter | null;
  if (!c || typeof c !== 'object' || typeof c.version !== 'number') return null;
  if (c.version > 2) return null;
  if (!c.identity || !c.vlastnosti || !Array.isArray(c.inventory)) return null;

  if (c.version === 1) c.version = 2;

  c.identity.presvedceni = normalizePresvedceni(c.identity.presvedceni);
  c.pribeh = typeof c.pribeh === 'string' ? c.pribeh : '';
  c.log = Array.isArray(c.log) ? c.log : [];
  c.kouzla = Array.isArray(c.kouzla) ? c.kouzla : [];
  c.recepty = Array.isArray(c.recepty) ? c.recepty : [];
  c.schopnostiMod = c.schopnostiMod ?? {};
  return c as Character;
}

function load(): Character | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalize(JSON.parse(raw)) : null;
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
    (draft: Character, kind: LogKind, text: string, delta?: number, ref?: string) => {
      draft.log.unshift({ id: newId(), ts: Date.now(), kind, text, delta, ref });
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

  const buyItem = useCallback((t: ItemTemplate, qty = 1, pay = true) => {
    update((draft) => {
      const cost = t.price * qty;
      if (pay) {
        if (draft.money < cost) return;
        draft.money -= cost;
        draft.log.push({ id: newId(), ts: Date.now(), kind: 'money', delta: -cost, text: `Koupeno: ${qty}× ${t.name}` });
      }
      const stack = t.stackable ? draft.inventory.find((i) => i.templateId === t.templateId) : undefined;
      if (stack) stack.qty += qty;
      else draft.inventory.push(fromTemplate(t, qty));
    });
  }, [update]);

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

  /** One item per kind can be worn at a time: one zbraň, one střelná zbraň, one zbroj. */
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

  /** Fire the equipped ranged weapon: uses one piece of its ammo. */
  const shoot = useCallback(
    () =>
      update((draft) => {
        const weapon = draft.inventory.find(
          (i): i is Strelna => i.kind === 'strelna' && i.equipped,
        );
        if (!weapon?.municeId) return;
        const ammo = draft.inventory.find((i) => i.templateId === weapon.municeId && i.qty > 0);
        if (!ammo) return;
        ammo.qty -= 1;
        log(draft, 'ammo', `Výstřel: ${weapon.name}`, -1, weapon.municeId);
      }),
    [update, log],
  );

  const castSpell = useCallback(
    (k: KouzloTemplate) =>
      update((draft) => {
        if (draft.magenergie.current < k.magCost) return;
        draft.magenergie.current -= k.magCost;
        log(draft, 'mag', `Seslal: ${k.name}`, -k.magCost);
      }),
    [update, log],
  );

  const learnSpell = useCallback(
    (id: string) =>
      update((draft) => {
        if (!draft.kouzla.includes(id)) draft.kouzla.push(id);
      }),
    [update],
  );

  const forgetSpell = useCallback(
    (id: string) =>
      update((draft) => {
        draft.kouzla = draft.kouzla.filter((k) => k !== id);
      }),
    [update],
  );

  /** Class ability that costs magenergie. */
  const useAbility = useCallback(
    (s: SchopnostTemplate) =>
      update((draft) => {
        const cost = s.magCost ?? 0;
        if (draft.magenergie.current < cost) return;
        draft.magenergie.current -= cost;
        log(draft, 'mag', `Použil: ${s.name}`, -cost);
      }),
    [update, log],
  );

  /** Alchymista: spend magenergie + ingredients, get the item in the inventory. */
  const brew = useCallback(
    (r: RecipeTemplate) =>
      update((draft) => {
        if (draft.magenergie.current < r.magCost || draft.money < r.surovinyCena) return;
        const template = CATALOG.find((t) => t.templateId === r.vysledekId);
        if (!template) return;

        draft.magenergie.current -= r.magCost;
        draft.money -= r.surovinyCena;

        const stack = template.stackable
          ? draft.inventory.find((i) => i.templateId === template.templateId)
          : undefined;
        if (stack) stack.qty += 1;
        else draft.inventory.push(fromTemplate(template, 1));

        // Two entries: undo once gives back mag + the item, twice gives back the coins.
        log(draft, 'money', `Suroviny: ${r.name}`, -r.surovinyCena);
        log(draft, 'craft', `Vyrobeno: ${r.name}`, -r.magCost, template.templateId);
      }),
    [update, log],
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
        if (entry.kind === 'ammo' && entry.ref) {
          const ammo = draft.inventory.find((i) => i.templateId === entry.ref);
          if (ammo) ammo.qty -= entry.delta;
        }
        if (entry.kind === 'craft' && entry.ref) {
          draft.magenergie.current -= entry.delta;
          const made = draft.inventory.find((i) => i.templateId === entry.ref);
          if (made) {
            made.qty -= 1;
            if (made.qty <= 0) draft.inventory = draft.inventory.filter((i) => i !== made);
          }
        }
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
    const parsed = normalize(JSON.parse(await file.text()));
    if (!parsed) throw new Error('Nepodporovaný formát souboru.');
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
    buyItem,
    removeItem,
    setQty,
    toggleEquipped,
    shoot,
    castSpell,
    learnSpell,
    forgetSpell,
    useAbility,
    brew,
    undoLast,
    exportJson,
    importJson,
  };
}

export type CharacterStore = ReturnType<typeof useCharacter>;