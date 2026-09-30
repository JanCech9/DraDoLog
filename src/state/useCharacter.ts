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
} from '../types/character';
import { PRESVEDCENI_LABELS } from '../types/character';
import { CATALOG, findTemplate, fromTemplate, type ItemTemplate } from '../data/catalog';
import { RASA_RYSY } from '../data/races';
import { createCharacter, newId } from './defaultCharacter';
import { characterToFile, downloadFile, shareFile } from './characterFile';
import { bonus } from '../rules/derived';
import {
  hpKostka,
  hpZaklad,
  formatKostka,
  magenergieZTabulky,
  meditujici,
  uspechAlchymisty,
  urovenInfo,
} from '../rules/abilities';
import { hodinySpanku } from '../rules/tables';
import { toMedaky } from '../rules/money';

const STORAGE_KEY = 'drd-sheet:character';
type StoredCharacter = Omit<Character, 'version'> & { version: number };

/** How many actions can be undone. Kept in memory only - a reload starts fresh. */
const UNDO_DEPTH = 10;

interface Timeline {
  current: Character;
  /** Snapshots taken right before each undoable action, newest first. */
  past: Character[];
}

/** Mutates a draft; returning false means "nothing happened" (no state change, nothing to undo). */
type Recipe = (draft: Character) => void | false;

/** Run a recipe on a copy of the character; null when the recipe declined to change anything. */
function apply(character: Character, recipe: Recipe): Character | null {
  const draft = structuredClone(character);
  return recipe(draft) === false ? null : draft;
}

function log(draft: Character, kind: LogKind, text: string, delta?: number, ref?: string): void {
  draft.log.unshift({ id: newId(), ts: Date.now(), kind, text, delta, ref });
  draft.log = draft.log.slice(0, 100);
}

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
  if (!c.identity || typeof c.identity !== 'object') return null;

  if (typeof c.id !== 'string' || !c.id) c.id = newId();
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
  const [timeline, setTimeline] = useState<Timeline>(() => ({
    current: load() ?? createCharacter(),
    past: [],
  }));
  const character = timeline.current;

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(character));
    } catch {
      // Storage can be full or blocked - the sheet still works for this session.
    }
  }, [character]);

  /**
   * Edit a field (name, attributes, max HP, item quantity…). Not undoable by
   * itself - but the edit is applied to every remembered snapshot as well, so
   * undoing an action never throws away an edit made after it.
   */
  const update = useCallback((recipe: (draft: Character) => void) => {
    setTimeline((t) => ({
      current: apply(t.current, recipe) ?? t.current,
      past: t.past.map((c) => apply(c, recipe) ?? c),
    }));
  }, []);

  /**
   * Perform an undoable action: the state before it is remembered and every
   * action logs what it did, so "undo" always reverts the top log entry.
   * A recipe returns false when nothing happened (not enough money, no ammo…)
   * so that there is nothing to undo and nothing in the log.
   */
  const act = useCallback((recipe: Recipe) => {
    setTimeline((t) => {
      const next = apply(t.current, recipe);
      if (!next) return t;
      return { current: next, past: [t.current, ...t.past].slice(0, UNDO_DEPTH) };
    });
  }, []);

  const adjustHp = useCallback(
    (delta: number) =>
      act((draft) => {
        // Only the part of the delta that actually applied is logged (and undone).
        const applied = Math.min(draft.hp.max, draft.hp.current + delta) - draft.hp.current;
        if (!applied) return false;
        draft.hp.current += applied;
        log(draft, 'hp', applied < 0 ? 'Zranění' : 'Léčení', applied);
      }),
    [act],
  );

  const adjustMag = useCallback(
    (delta: number) =>
      act((draft) => {
        const m = draft.magenergie;
        const applied = Math.max(0, Math.min(m.max, m.current + delta)) - m.current;
        if (!applied) return false;
        m.current += applied;
        log(draft, 'mag', 'Magenergie', applied);
      }),
    [act],
  );

  const adjustXp = useCallback(
    (delta: number) =>
      act((draft) => {
        const applied = Math.max(0, draft.xp + delta) - draft.xp;
        if (!applied) return false;
        draft.xp += applied;
        log(draft, 'xp', 'Zkušenosti', applied);
      }),
    [act],
  );

  const adjustMoney = useCallback(
    (delta: number) =>
      act((draft) => {
        const applied = Math.max(0, draft.money + delta) - draft.money;
        if (!applied) return false;
        draft.money += applied;
        log(draft, 'money', 'Peníze', applied);
      }),
    [act],
  );

  const addItem = useCallback(
    (item: NewItem) =>
      act((draft) => {
        draft.inventory.push({ ...item, id: newId() } as Item);
        log(draft, 'note', `Přidáno: ${item.qty}× ${item.name}`);
      }),
    [act],
  );

  const buyItem = useCallback(
    (t: ItemTemplate, qty = 1, pay = true) => {
      act((draft) => {
        const cost = t.price * qty;
        if (pay && cost > 0) {
          if (draft.money < cost) return false;
          draft.money -= cost;
          log(draft, 'money', `Koupeno: ${qty}× ${t.name}`, -cost);
        } else {
          log(draft, 'note', `Přidáno: ${qty}× ${t.name}`);
        }
        const stack = t.stackable ? draft.inventory.find((i) => i.templateId === t.templateId) : undefined;
        if (stack) stack.qty += qty;
        else draft.inventory.push(fromTemplate(t, qty));
      });
    },
    [act],
  );

  const removeItem = useCallback(
    (id: string) =>
      act((draft) => {
        const item = draft.inventory.find((i) => i.id === id);
        if (!item) return false;
        draft.inventory = draft.inventory.filter((i) => i.id !== id);
        log(draft, 'note', `Zahozeno: ${item.qty}× ${item.name}`);
      }),
    [act],
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
      act((draft) => {
        const weapon = draft.inventory.find(
          (i): i is Strelna => i.kind === 'strelna' && i.equipped,
        );
        if (!weapon?.municeId) return false;
        const ammo = draft.inventory.find((i) => i.templateId === weapon.municeId && i.qty > 0);
        if (!ammo) return false;
        ammo.qty -= 1;
        log(draft, 'ammo', `Výstřel: ${weapon.name}`, -1, weapon.municeId);
      }),
    [act],
  );

  /** Cast a spell; `magy` overrides the cost for spells with variable magenergie. */
  const castSpell = useCallback(
    (k: KouzloTemplate, magy?: number) =>
      act((draft) => {
        const cost = Math.max(k.magCost, magy ?? k.magCost);
        if (draft.magenergie.current < cost) return false;
        draft.magenergie.current -= cost;
        log(draft, 'mag', `Seslal: ${k.name}`, -cost);
      }),
    [act],
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
   * Alchymista: spend magenergie and suroviny, compare the k% rolled at the
   * table with the success chance (str. 44). Resources are gone either way;
   * the item appears only on success.
   */
  const brew = useCallback(
    (r: RecipeTemplate, hod: number, postih = 0) =>
      act((draft) => {
        if (hod < 1 || hod > 100) return false;
        if (draft.magenergie.current < r.magCost || draft.money < r.surovinyCena) return false;
        const velikost = RASA_RYSY[draft.identity.rasa].velikost;
        const template = findTemplate(r.vysledekId, velikost) ?? CATALOG.find((t) => t.templateId === r.vysledekId);
        if (!template) return false;

        draft.magenergie.current -= r.magCost;
        draft.money -= r.surovinyCena;
        const sance = Math.max(0, uspechAlchymisty(draft.vlastnosti.obr) - postih);
        const uspech = hod <= sance;
        // Fatální neúspěch (str. 82): a failed k% divisible by 10.
        const fatalni = !uspech && hod % 10 === 0;

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
            `Výroba se nezdařila: ${r.name} (hod ${hod} > ${sance} %)${fatalni ? ' – fatální neúspěch!' : ''}`,
          );
        }
      }),
    [act],
  );

  /** Refill magenergie to the class table's value (kouzelník, hraničář) or set the max (alchymista). */
  const refillMag = useCallback(
    () =>
      act((draft) => {
        const max = magenergieZTabulky(draft);
        if (draft.magenergie.max === max && draft.magenergie.current === max) return false;
        draft.magenergie.max = max;
        draft.magenergie.current = max;
        log(draft, 'note', `Magenergie nastavena podle tabulky: ${max} magů`);
      }),
    [act],
  );

  /** Životy nové postavy na 1. úrovni (str. 27): základ povolání + bonus za odolnost, nejméně 1. */
  const pocatecniZivoty = useCallback(
    () =>
      act((draft) => {
        const hp = Math.max(1, hpZaklad(draft.identity.povolani) + bonus(draft.vlastnosti.odl));
        if (draft.hp.current === hp && draft.hp.max === hp) return false;
        draft.hp = { current: hp, max: hp };
        log(draft, 'note', `Počáteční životy: ${hp}`);
      }),
    [act],
  );

  /** Důkladný odpočinek (str. 85): +2 životy, meditující povolání získají magenergii. */
  const rest = useCallback(
    () =>
      act((draft) => {
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
    [act],
  );

  /**
   * Postup na další úroveň (str. 27, 32): `hod` is the class HP die rolled at
   * the table; add bonus za odolnost (at least +1 total), pay the training
   * when asked to, bump the level.
   */
  const levelUp = useCallback(
    (payTraining: boolean, hod: number) =>
      act((draft) => {
        const info = urovenInfo(draft);
        const cost = toMedaky({ zl: info.cena ?? 0 });
        if (payTraining && cost > 0) {
          if (draft.money < cost) return false;
          draft.money -= cost;
          log(draft, 'money', `Výcvik na ${draft.identity.uroven + 1}. úroveň`, -cost);
        }
        const k = hpKostka(draft.identity.povolani);
        const gain = Math.max(1, hod + bonus(draft.vlastnosti.odl));
        draft.identity.uroven += 1;
        draft.hp.max += gain;
        draft.hp.current += gain;
        log(draft, 'hp', `Postup na ${draft.identity.uroven}. úroveň (${formatKostka(k)} = ${hod})`, gain);
      }),
    [act],
  );

  /** Restore the snapshot taken before the last action - log entry included. */
  const undoLast = useCallback(() => {
    setTimeline((t) => {
      const [previous, ...past] = t.past;
      return previous ? { current: previous, past } : t;
    });
  }, []);

  const exportJson = useCallback(() => {
    downloadFile(characterToFile(character));
  }, [character]);

  /** Send the sheet to the PJ: share sheet where available, download otherwise. */
  const shareJson = useCallback(
    () => shareFile(characterToFile(character), character.identity.name || 'Postava'),
    [character],
  );

  const importJson = useCallback(async (file: File) => {
    const parsed = normalizeCharacter(JSON.parse(await file.text()));
    if (!parsed) throw new Error('Nepodporovaný formát souboru.');
    // A different character: snapshots of the old one would make no sense to restore.
    setTimeline({ current: parsed, past: [] });
  }, []);

  return {
    character,
    /** True while there is an action of this visit to undo. */
    canUndo: timeline.past.length > 0,
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
    refillMag,
    pocatecniZivoty,
    rest,
    levelUp,
    undoLast,
    exportJson,
    shareJson,
    importJson,
  };
}

export type CharacterStore = ReturnType<typeof useCharacter>;