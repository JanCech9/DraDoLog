import { useCallback, useEffect, useState } from 'react';
import type {
  Character,
  Item,
  KouzloTemplate,
  LogKind,
  NewItem,
  Presvedceni,
  RecipeTemplate,
  Strelna,
  Vlastnosti,
} from '../types/character';
import { PRESVEDCENI_LABELS } from '../types/character';
import { CATALOG, findTemplate, fromTemplate, type ItemTemplate } from '../data/catalog';
import { RASA_RYSY } from '../data/races';
import { createCharacter, newId } from './defaultCharacter';
import { bonus } from '../rules/derived';
import { hpKostka, formatKostka, magenergieZTabulky, meditujici, uspechAlchymisty, urovenInfo } from '../rules/abilities';
import { jeFatalni, rollN, rollPercent } from '../rules/dice';
import { hodinySpanku } from '../rules/tables';
import { toMedaky } from '../rules/money';

const STORAGE_KEY = 'drd-sheet:character';
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

/**
 * v2 → v3: weapons used to store a single `utocnost` that acted as SZ; v3
 * splits it into sila (SZ), utocnost (út) and adds trida / obourucni. Items
 * that came from the catalog get their real numbers back from it.
 */
function migrateItem(raw: Record<string, unknown>, velikost: 'A' | 'B' | 'C'): Item {
  const template = findTemplate(typeof raw.templateId === 'string' ? raw.templateId : undefined, velikost);
  const keep = {
    id: typeof raw.id === 'string' ? raw.id : newId(),
    name: typeof raw.name === 'string' ? raw.name : 'Věc',
    qty: typeof raw.qty === 'number' ? raw.qty : 1,
    weight: typeof raw.weight === 'number' ? raw.weight : 0,
    ...(typeof raw.note === 'string' ? { note: raw.note } : {}),
    ...(typeof raw.templateId === 'string' ? { templateId: raw.templateId } : {}),
  };
  if (template && template.kind === raw.kind) {
    // Placeholder weights and stats from v2 are replaced by the real catalog numbers.
    const { weight: _oldWeight, ...rest } = keep;
    const fresh = fromTemplate(template, keep.qty);
    return { ...fresh, ...rest, ...('equipped' in fresh ? { equipped: raw.equipped === true } : {}) } as Item;
  }
  const equipped = raw.equipped === true;
  switch (raw.kind) {
    case 'zbran':
      return {
        ...keep,
        kind: 'zbran',
        equipped,
        sila: typeof raw.sila === 'number' ? raw.sila : Number(raw.utocnost) || 0,
        utocnost: typeof raw.sila === 'number' ? Number(raw.utocnost) || 0 : 0,
        obrana: Number(raw.obrana) || 0,
        iniciativa: Number(raw.iniciativa) || 0,
        trida: raw.trida === 'lehka' || raw.trida === 'tezka' ? raw.trida : 'stredni',
        obourucni: raw.obourucni === true,
      };
    case 'strelna':
      return {
        ...keep,
        kind: 'strelna',
        equipped,
        sila: typeof raw.sila === 'number' ? raw.sila : Number(raw.utocnost) || 0,
        utocnost: typeof raw.sila === 'number' ? Number(raw.utocnost) || 0 : 0,
        dostrel: Array.isArray(raw.dostrel) ? (raw.dostrel.map(Number) as [number, number, number]) : [0, 0, 0],
        ...(typeof raw.municeId === 'string' ? { municeId: raw.municeId } : {}),
        trida: raw.trida === 'lehka' || raw.trida === 'tezka' ? raw.trida : 'stredni',
        vrhaci: raw.vrhaci === true,
      };
    case 'zbroj':
      return { ...keep, kind: 'zbroj', equipped, ochrana: Number(raw.ochrana) || 1 };
    case 'stit':
      return { ...keep, kind: 'stit', equipped, obrana: Number(raw.obrana) || 1 };
    default:
      return { ...keep, kind: 'ostatni' };
  }
}

/** Validate and migrate a stored/imported character; null when unusable. */
export function normalizeCharacter(parsed: unknown): Character | null {
  const c = parsed as StoredCharacter | null;
  if (!c || typeof c !== 'object' || typeof c.version !== 'number') return null;
  if (c.version > 3) return null;

  c.identity.presvedceni = normalizePresvedceni(c.identity.presvedceni);
  if (!(c.identity.rasa in RASA_RYSY)) c.identity.rasa = 'clovek';
  c.pribeh = typeof c.pribeh === 'string' ? c.pribeh : '';
  c.kouzla = Array.isArray(c.kouzla) ? c.kouzla : [];
  c.recepty = Array.isArray(c.recepty) ? c.recepty : [];
  c.schopnostiMod = c.schopnostiMod ?? {};
  c.log = Array.isArray(c.log) ? c.log : [];

  if (c.version < 3) {
    const velikost = RASA_RYSY[c.identity.rasa].velikost;
    c.inventory = (Array.isArray(c.inventory) ? c.inventory : []).map((i) =>
      migrateItem(i as unknown as Record<string, unknown>, velikost),
    );
    c.version = 3;
  }
  return c as Character;
}

function load(): Character | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeCharacter(JSON.parse(raw)) : null;
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
    (item: NewItem) =>
      update((draft) => {
        draft.inventory.push({ ...item, id: newId() } as Item);
      }),
    [update],
  );

  const buyItem = useCallback(
    (t: ItemTemplate, qty = 1, pay = true) => {
      update((draft) => {
        const cost = t.price * qty;
        if (pay && cost > 0) {
          if (draft.money < cost) return;
          draft.money -= cost;
          log(draft, 'money', `Koupeno: ${qty}× ${t.name}`, -cost);
        }
        const stack = t.stackable ? draft.inventory.find((i) => i.templateId === t.templateId) : undefined;
        if (stack) stack.qty += qty;
        else draft.inventory.push(fromTemplate(t, qty));
      });
    },
    [update, log],
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

  /** One item per kind can be worn at a time: one zbraň, one střelná, one zbroj, one štít. */
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

  /** Cast a spell; `magy` overrides the cost for spells with variable magenergie. */
  const castSpell = useCallback(
    (k: KouzloTemplate, magy?: number) =>
      update((draft) => {
        const cost = Math.max(k.magCost, magy ?? k.magCost);
        if (draft.magenergie.current < cost) return;
        draft.magenergie.current -= cost;
        log(draft, 'mag', `Seslal: ${k.name}`, -cost);
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

  /**
   * Alchymista: spend magenergie and suroviny, roll k% against the success
   * chance (str. 44). Resources are gone either way; the item appears only on success.
   */
  const brew = useCallback(
    (r: RecipeTemplate, postih = 0) =>
      update((draft) => {
        if (draft.magenergie.current < r.magCost || draft.money < r.surovinyCena) return;
        const velikost = RASA_RYSY[draft.identity.rasa].velikost;
        const template = findTemplate(r.vysledekId, velikost) ?? CATALOG.find((t) => t.templateId === r.vysledekId);
        if (!template) return;

        draft.magenergie.current -= r.magCost;
        draft.money -= r.surovinyCena;
        const sance = Math.max(0, uspechAlchymisty(draft.vlastnosti.obr) - postih);
        const hod = rollPercent();
        const uspech = hod <= sance;

        if (r.surovinyCena) log(draft, 'money', `Suroviny: ${r.name}`, -r.surovinyCena);
        if (r.magCost) log(draft, 'mag', `Výroba: ${r.name}`, -r.magCost);
        if (uspech) {
          const stack = template.stackable
            ? draft.inventory.find((i) => i.templateId === template.templateId)
            : undefined;
          if (stack) stack.qty += 1;
          else draft.inventory.push(fromTemplate(template, 1));
          log(draft, 'note', `Vyrobeno: ${r.name} (hod ${hod} ≤ ${sance} %)`);
        } else {
          log(
            draft,
            'note',
            `Výroba se nezdařila: ${r.name} (hod ${hod} > ${sance} %)${jeFatalni(hod, sance) ? ' – fatální neúspěch!' : ''}`,
          );
        }
      }),
    [update, log],
  );

  /** Set all attributes at once (character creation). */
  const setVlastnosti = useCallback(
    (v: Vlastnosti) =>
      update((draft) => {
        draft.vlastnosti = { ...v };
      }),
    [update],
  );

  /** Refill magenergie to the class table's value (kouzelník, hraničář) or set the max (alchymista). */
  const refillMag = useCallback(
    () =>
      update((draft) => {
        const max = magenergieZTabulky(draft);
        draft.magenergie.max = max;
        draft.magenergie.current = max;
        log(draft, 'note', `Magenergie nastavena podle tabulky: ${max} magů`);
      }),
    [update, log],
  );

  /** Důkladný odpočinek (str. 85): +2 životy, meditující povolání získají magenergii. */
  const rest = useCallback(
    () =>
      update((draft) => {
        const hodiny = hodinySpanku(bonus(draft.vlastnosti.odl));
        const gain = Math.min(2, draft.hp.max - draft.hp.current);
        if (gain > 0) {
          draft.hp.current += gain;
          log(draft, 'hp', `Odpočinek (${hodiny} h spánku)`, gain);
        } else {
          log(draft, 'note', `Odpočinek (${hodiny} h spánku)`);
        }
        if (meditujici(draft.identity.povolani) && draft.magenergie.max > 0) {
          const delta = draft.magenergie.max - draft.magenergie.current;
          draft.magenergie.current = draft.magenergie.max;
          if (delta) log(draft, 'mag', draft.identity.povolani === 'kouzelnik' ? 'Zaostření vůle' : 'Meditace', delta);
        }
      }),
    [update, log],
  );

  /**
   * Postup na další úroveň (str. 27, 32): roll the class HP die + bonus za
   * odolnost (at least +1), pay the training when asked to, bump the level.
   */
  const levelUp = useCallback(
    (payTraining: boolean) =>
      update((draft) => {
        const info = urovenInfo(draft);
        const cost = toMedaky({ zl: info.cena ?? 0 });
        if (payTraining && cost > 0) {
          if (draft.money < cost) return;
          draft.money -= cost;
          log(draft, 'money', `Výcvik na ${draft.identity.uroven + 1}. úroveň`, -cost);
        }
        const k = hpKostka(draft.identity.povolani);
        const hod = rollN(k.n, k.sides) + k.plus;
        const gain = Math.max(1, hod + bonus(draft.vlastnosti.odl));
        draft.identity.uroven += 1;
        draft.hp.max += gain;
        draft.hp.current += gain;
        log(draft, 'hp', `Postup na ${draft.identity.uroven}. úroveň (${formatKostka(k)} = ${hod})`, gain);
      }),
    [update, log],
  );

  /** Write a free-form line (dice results, notes) into the log. */
  const note = useCallback((text: string) => update((draft) => log(draft, 'note', text)), [update, log]);

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
    const parsed = normalizeCharacter(JSON.parse(await file.text()));
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
    brew,
    setVlastnosti,
    refillMag,
    rest,
    levelUp,
    note,
    undoLast,
    exportJson,
    importJson,
  };
}

export type CharacterStore = ReturnType<typeof useCharacter>;
