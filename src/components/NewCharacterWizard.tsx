// "Nová postava" - a step-by-step dialog that walks the player through Tvorba
// postavy (str. 26–31): identita → vlastnosti → životy a peníze → výbava →
// shrnutí. Dice are still rolled at the table; the wizard only takes the
// results and does the arithmetic. Creating the character replaces the one in
// the sheet, so the last step offers a backup first.
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import type { CharacterStore } from '../state/useCharacter';
import {
  buildCharacter,
  cenaNakupu,
  mimoRozsah,
  pocatecniPenize,
  type NewCharacterDraft,
  type Purchase,
} from '../state/newCharacter';
import { catalogFor, type ItemTemplate } from '../data/catalog';
import { RASA_RYSY } from '../data/races';
import { bonus } from '../rules/derived';
import { hodNaRozsah } from '../rules/dice';
import { formatKostka, hpKostka, hpZaklad } from '../rules/abilities';
import { formatMoney } from '../rules/money';
import { proctoNeovlada } from '../rules/restrictions';
import {
  PRESVEDCENI_TABULKA,
  RODOVE_ZBRANE,
  VLASTNOSTI_POVOLANI,
  WEIGHT_UNIT,
  rozsahVlastnosti,
} from '../rules/tables';
import {
  POVOLANI_LABELS,
  PRESVEDCENI_LABELS,
  RASA_LABELS,
  TRIDA_ZBRANE_LABELS,
  VLASTNOSTI_ORDER,
  VLASTNOST_LABELS,
  type Povolani,
  type Presvedceni,
  type Rasa,
  type Vlastnost,
} from '../types/character';
import { signed } from '../screens/format';

const STEPS = ['Identita', 'Vlastnosti', 'Životy a peníze', 'Výbava', 'Shrnutí'] as const;

/** What the player types; numbers stay text until they parse, so a half-typed field never jumps. */
interface Draft {
  name: string;
  rasa: Rasa;
  povolani: Povolani;
  presvedceni: Presvedceni;
  /** 1k10 for přesvědčení, when the player rolled instead of choosing. */
  hodPresvedceni: string;
  vlastnosti: Record<Vlastnost, string>;
  hodPenize: string;
  bezPenez: boolean;
  /** templateId → qty */
  cart: Record<string, number>;
}

const EMPTY_DRAFT: Draft = {
  name: '',
  rasa: 'clovek',
  povolani: 'bojovnik',
  presvedceni: 'neutralni',
  hodPresvedceni: '',
  vlastnosti: { sil: '', obr: '', odl: '', int: '', chs: '' },
  hodPenize: '',
  bezPenez: false,
  cart: {},
};

const parseVlastnost = (s: string): number | undefined => {
  const n = Number(s);
  return s.trim() !== '' && Number.isInteger(n) && n >= 1 && n <= 21 ? n : undefined;
};

const parseHod = (s: string, max: number): number | undefined => {
  const n = Number(s);
  return s.trim() !== '' && Number.isInteger(n) && n >= 1 && n <= max ? n : undefined;
};

/** The cart resolved against the catalog of the chosen race's size (armour prices differ). */
function cartPurchases(cart: Draft['cart'], catalog: readonly ItemTemplate[]): Purchase[] {
  return catalog.flatMap((t) => (cart[t.templateId] > 0 ? [{ template: t, qty: cart[t.templateId] }] : []));
}

/** The draft as the builder wants it; undefined while a required field is missing. */
function toNewCharacter(d: Draft, purchases: Purchase[]): NewCharacterDraft | undefined {
  const vlastnosti = {} as Record<Vlastnost, number>;
  for (const v of VLASTNOSTI_ORDER) {
    const n = parseVlastnost(d.vlastnosti[v]);
    if (n === undefined) return undefined;
    vlastnosti[v] = n;
  }
  const hod = parseHod(d.hodPenize, 6);
  if (!d.bezPenez && hod === undefined) return undefined;
  return {
    name: d.name,
    rasa: d.rasa,
    povolani: d.povolani,
    presvedceni: d.presvedceni,
    vlastnosti,
    hodPenize: d.bezPenez ? undefined : hod,
    purchases,
  };
}

export function NewCharacterButton({ store }: { store: CharacterStore }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" className="chip chip--quiet" onClick={() => setOpen(true)}>
        Nová postava
      </button>
      <NewCharacterDialog store={store} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function NewCharacterDialog({ store, open, onClose }: { store: CharacterStore; open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // React's autoFocus runs before showModal, while the dialog is still hidden.
      dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // A click on the ::backdrop is reported as a click on the <dialog> itself.
  function onClick(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <dialog ref={ref} className="dialog wizard" aria-labelledby="wizard-title" onClose={onClose} onClick={onClick}>
      {/* Mounted only while open, so every run starts from a clean draft. */}
      {open && <Wizard store={store} onClose={onClose} />}
    </dialog>
  );
}

function Wizard({ store, onClose }: { store: CharacterStore; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const body = useRef<HTMLDivElement>(null);
  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }));

  useEffect(() => {
    body.current?.scrollTo({ top: 0 });
  }, [step]);

  const catalog = catalogFor(RASA_RYSY[draft.rasa].velikost);
  const purchases = cartPurchases(draft.cart, catalog);
  const hodPenize = parseHod(draft.hodPenize, 6);
  const start = draft.bezPenez || hodPenize === undefined ? 0 : pocatecniPenize(hodPenize);
  // Can go negative when the player walks back and lowers the roll after shopping.
  const left = start - cenaNakupu(purchases);
  const ready = toNewCharacter(draft, purchases);

  const canContinue = [
    draft.name.trim() !== '',
    VLASTNOSTI_ORDER.every((v) => parseVlastnost(draft.vlastnosti[v]) !== undefined),
    draft.bezPenez || hodPenize !== undefined,
    left >= 0,
    ready !== undefined && left >= 0,
  ][step];

  const current = store.character;
  const currentTouched =
    current.identity.name.trim() !== '' || current.inventory.length > 0 || current.log.length > 0 || current.xp > 0;

  function create() {
    if (!ready) return;
    if (
      currentTouched &&
      !confirm(
        `Nahradit současnou postavu ${current.identity.name || 'Bezejmenný'} novou? Bez zálohy se k ní už nedostaneš.`,
      )
    ) {
      return;
    }
    store.replaceCharacter(buildCharacter(ready));
    onClose();
  }

  const last = step === STEPS.length - 1;

  return (
    <div className="dialog__panel">
      <header className="dialog__header">
        <div>
          <h2 id="wizard-title">Nová postava</h2>
          <p className="note">
            {step + 1}/{STEPS.length} · {STEPS[step]}
          </p>
        </div>
        <button type="button" className="chip" onClick={onClose}>
          Zrušit
        </button>
      </header>
      <ol className="wizard__steps" aria-hidden="true">
        {STEPS.map((label, i) => (
          <li key={label} className={i <= step ? 'wizard__step wizard__step--done' : 'wizard__step'} />
        ))}
      </ol>

      <div className="dialog__body wizard__body" ref={body}>
        {step === 0 && <IdentitaStep draft={draft} patch={patch} />}
        {step === 1 && <VlastnostiStep draft={draft} patch={patch} />}
        {step === 2 && <ZivotyStep draft={draft} patch={patch} />}
        {step === 3 && <VybavaStep draft={draft} patch={patch} catalog={catalog} purchases={purchases} left={left} />}
        {step === 4 && ready && (
          <ShrnutiStep
            draft={ready}
            currentName={currentTouched ? current.identity.name || 'Bezejmenný' : undefined}
            onBackup={store.exportJson}
          />
        )}
      </div>

      <footer className="wizard__footer">
        <button type="button" className="chip" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Zpět
        </button>
        {last ? (
          <button type="button" className="primary" disabled={!canContinue} onClick={create}>
            Vytvořit postavu
          </button>
        ) : (
          <button type="button" className="primary" disabled={!canContinue} onClick={() => setStep((s) => s + 1)}>
            {step === 3 && purchases.length === 0 ? 'Přeskočit' : 'Dál'}
          </button>
        )}
      </footer>
    </div>
  );
}

type StepProps = { draft: Draft; patch: (p: Partial<Draft>) => void };

function IdentitaStep({ draft, patch }: StepProps) {
  const rysy = RASA_RYSY[draft.rasa];
  const rodova = catalogFor(rysy.velikost).find((t) => t.templateId === RODOVE_ZBRANE[draft.rasa])?.name;
  const hlavni = Object.keys(VLASTNOSTI_POVOLANI[draft.povolani]) as Vlastnost[];
  const kostka = hpKostka(draft.povolani);

  function setRasa(rasa: Rasa) {
    const hod = parseHod(draft.hodPresvedceni, 10);
    // A rolled přesvědčení follows the race table; a chosen one stays.
    patch(hod ? { rasa, presvedceni: PRESVEDCENI_TABULKA[rasa][hod - 1] } : { rasa });
  }

  function setHodPresvedceni(hodPresvedceni: string) {
    const hod = parseHod(hodPresvedceni, 10);
    patch(hod ? { hodPresvedceni, presvedceni: PRESVEDCENI_TABULKA[draft.rasa][hod - 1] } : { hodPresvedceni });
  }

  return (
    <>
      <label className="field field--wide">
        <span>Jméno</span>
        <input
          value={draft.name}
          placeholder="Jméno odpovídající rase"
          data-autofocus
          onChange={(e) => patch({ name: e.target.value })}
        />
      </label>

      <div className="field-row">
        <label className="field">
          <span>Rasa</span>
          <select value={draft.rasa} onChange={(e) => setRasa(e.target.value as Rasa)}>
            {Object.entries(RASA_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Povolání</span>
          <select value={draft.povolani} onChange={(e) => patch({ povolani: e.target.value as Povolani })}>
            {Object.entries(POVOLANI_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="note">
        Velikost {rysy.velikost} · základní pohyblivost {rysy.pohyblivost} · rodová zbraň: {rodova ?? '—'} (+1 k
        ÚČ)
        {rysy.schopnost ? ` · ${rysy.schopnost.name}` : ''}
      </p>
      <p className="note">
        {POVOLANI_LABELS[draft.povolani]}: hlavní vlastnosti {hlavni.map((v) => VLASTNOST_LABELS[v]).join(' a ')} ·
        životy {hpZaklad(draft.povolani)} + odolnost na 1. úrovni, {formatKostka(kostka)} za každou další
      </p>

      <h2 className="heading">Přesvědčení</h2>
      <p className="note">Domluv se s PJ, nebo hoď 1k10 a zapiš, co padlo – tabulka je podle rasy.</p>
      <div className="field-row">
        <label className="field field--wide">
          <span>Přesvědčení</span>
          <select
            value={draft.presvedceni}
            onChange={(e) => patch({ presvedceni: e.target.value as Presvedceni, hodPresvedceni: '' })}
          >
            {Object.entries(PRESVEDCENI_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Padlo na 1k10</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={10}
            value={draft.hodPresvedceni}
            placeholder="–"
            onChange={(e) => setHodPresvedceni(e.target.value)}
          />
        </label>
      </div>
    </>
  );
}

function VlastnostiStep({ draft, patch }: StepProps) {
  const hlavni = VLASTNOSTI_POVOLANI[draft.povolani];
  const parsed = {} as Record<Vlastnost, number>;
  let complete = true;
  for (const v of VLASTNOSTI_ORDER) {
    const n = parseVlastnost(draft.vlastnosti[v]);
    if (n === undefined) complete = false;
    else parsed[v] = n;
  }
  const mimo = complete ? mimoRozsah({ rasa: draft.rasa, povolani: draft.povolani, vlastnosti: parsed }) : [];

  return (
    <>
      <p className="note">
        Rozsah je podle rasy a povolání ({RASA_LABELS[draft.rasa].toLowerCase()},{' '}
        {POVOLANI_LABELS[draft.povolani].toLowerCase()}). Hoď uvedenými kostkami a zapiš výsledek; hlavní vlastnosti
        povolání jsou zvýrazněné.
      </p>
      <ul className="stats">
        {VLASTNOSTI_ORDER.map((key) => {
          const [min, max] = rozsahVlastnosti(draft.rasa, draft.povolani, key);
          const n = parseVlastnost(draft.vlastnosti[key]);
          const kostky = hodNaRozsah(min, max);
          return (
            <li key={key} className={key in hlavni ? 'stat stat--main' : 'stat'}>
              <label className="stat__name" htmlFor={`vl-${key}`}>
                {VLASTNOST_LABELS[key]}
                <span className="note">
                  {' '}
                  {min}–{max}
                  {kostky ? ` · ${kostky}` : ''}
                </span>
              </label>
              <input
                id={`vl-${key}`}
                className="stat__input"
                type="number"
                inputMode="numeric"
                min={1}
                max={21}
                placeholder={`${min}–${max}`}
                value={draft.vlastnosti[key]}
                onChange={(e) => patch({ vlastnosti: { ...draft.vlastnosti, [key]: e.target.value } })}
              />
              <span className="stat__bonus">{n === undefined ? '' : signed(bonus(n))}</span>
            </li>
          );
        })}
      </ul>
      {mimo.length > 0 && (
        <p className="note delta--down">
          Mimo rozsah: {mimo.map((v) => VLASTNOST_LABELS[v]).join(', ')}. Jde to, pokud to PJ dovolil.
        </p>
      )}
    </>
  );
}

function ZivotyStep({ draft, patch }: StepProps) {
  const odl = parseVlastnost(draft.vlastnosti.odl) ?? 10;
  const zaklad = hpZaklad(draft.povolani);
  const hp = Math.max(1, zaklad + bonus(odl));
  const hod = parseHod(draft.hodPenize, 6);
  // The builder knows the magenergie tables; a throw-away character gives the preview.
  const vlastnosti = {} as Record<Vlastnost, number>;
  for (const v of VLASTNOSTI_ORDER) vlastnosti[v] = parseVlastnost(draft.vlastnosti[v]) ?? 10;
  const preview = buildCharacter({
    name: '',
    rasa: draft.rasa,
    povolani: draft.povolani,
    presvedceni: draft.presvedceni,
    vlastnosti,
    purchases: [],
  });

  return (
    <>
      <h2 className="heading">Životy</h2>
      <p className="note">
        Základ povolání {zaklad} + bonus za odolnost ({signed(bonus(odl))}) ={' '}
        <strong className="wizard__value">{hp}</strong> životů na 1. úrovni.
        {preview.magenergie.max > 0 ? ` Magenergie podle tabulky: ${preview.magenergie.max} magů.` : ''}
      </p>

      <h2 className="heading">Peníze</h2>
      <p className="note">Počáteční peníze jsou (1k6 + 5) × 10 zlaťáků. Hoď a zapiš, co padlo.</p>
      <div className="field-row">
        <label className="field">
          <span>Padlo na 1k6</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={6}
            disabled={draft.bezPenez}
            value={draft.hodPenize}
            placeholder="1–6"
            onChange={(e) => patch({ hodPenize: e.target.value })}
          />
        </label>
        <p className="field wizard__result">
          <span>Do měšce</span>
          <strong className="wizard__value">
            {draft.bezPenez ? '—' : hod ? `(${hod}+5) × 10 = ${formatMoney(pocatecniPenize(hod))}` : '…'}
          </strong>
        </p>
      </div>
      <label className="wizard__check">
        <input
          type="checkbox"
          checked={draft.bezPenez}
          onChange={(e) => patch({ bezPenez: e.target.checked, cart: e.target.checked ? {} : draft.cart })}
        />
        <span>Začíná bez peněz (podle domluvy s PJ)</span>
      </label>
    </>
  );
}

function VybavaStep({
  draft,
  patch,
  catalog,
  purchases,
  left,
}: StepProps & { catalog: readonly ItemTemplate[]; purchases: Purchase[]; left: number }) {
  const [query, setQuery] = useState('');
  const velikost = RASA_RYSY[draft.rasa].velikost;

  const setQty = (templateId: string, qty: number) => {
    const cart = { ...draft.cart };
    if (qty > 0) cart[templateId] = qty;
    else delete cart[templateId];
    patch({ cart });
  };

  const results = catalog.filter((t) => t.shop !== false && t.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <>
      <div className="counter">
        <span className="note">Zbývá</span>
        <strong className={left < 0 ? 'counter__value delta--down' : 'counter__value counter__value--money'}>
          {left < 0 ? `−${formatMoney(-left)}` : formatMoney(left)}
        </strong>
      </div>
      {left < 0 && <p className="note delta--down">Nakoupeno za víc, než postava má – něco vrať.</p>}
      <p className="note">
        Nakup výzbroj a výstroj za počáteční peníze – nebo přeskoč a nakup později v záložce Výbava. Zbroj a štít
        jsou pro velikost {velikost}; první zbraň, zbroj a štít si postava hned nasadí.
      </p>

      {purchases.length > 0 && (
        <>
          <h2 className="heading">V batohu</h2>
          <ul className="items">
            {purchases.map(({ template: t, qty }) => (
              <li key={t.templateId} className="item">
                <div className="item__main">
                  <span className="item__name">{t.name}</span>
                  <span className="note">{t.price ? formatMoney(t.price * qty) : 'cena dle PJ'}</span>
                </div>
                <QtyControls qty={qty} canAdd={t.price <= left} onChange={(q) => setQty(t.templateId, q)} />
              </li>
            ))}
          </ul>
        </>
      )}

      <h2 className="heading">Obchod</h2>
      <label className="field field--wide">
        <span>Hledat</span>
        <input value={query} placeholder="meč, luk, provaz…" onChange={(e) => setQuery(e.target.value)} />
      </label>
      <ul className="items">
        {results.map((t) => {
          const duvod = t.kind === 'ostatni' ? null : proctoNeovlada(draft.povolani, t);
          const qty = draft.cart[t.templateId] ?? 0;
          return (
            <li key={t.templateId} className="item">
              <div className="item__main">
                <span className="item__name">{t.name}</span>
                <span className="note">
                  {t.price ? formatMoney(t.price) : 'cena dle PJ'} · {t.weight} {WEIGHT_UNIT}
                  {t.kind === 'zbran' &&
                    ` · SZ ${t.sila} / OZ ${signed(t.obrana)} · ${TRIDA_ZBRANE_LABELS[t.trida]}${t.obourucni ? ', obouruční' : ''}`}
                  {t.kind === 'strelna' && ` · SZ ${t.sila} · ${TRIDA_ZBRANE_LABELS[t.trida]}${t.vrhaci ? ', vrhací' : ''}`}
                  {t.kind === 'zbroj' && ` · KZ ${t.ochrana}`}
                  {t.kind === 'stit' && ` · +${t.obrana} k obraně`}
                </span>
                {duvod && <span className="note delta--down">{duvod}</span>}
              </div>
              {qty > 0 ? (
                <QtyControls qty={qty} canAdd={t.price <= left} onChange={(q) => setQty(t.templateId, q)} />
              ) : (
                <button type="button" className="chip" disabled={t.price > left} onClick={() => setQty(t.templateId, 1)}>
                  {t.price ? 'Koupit' : 'Přidat'}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}

function QtyControls({ qty, canAdd, onChange }: { qty: number; canAdd: boolean; onChange: (qty: number) => void }) {
  return (
    <div className="qty" role="group" aria-label="Počet">
      <button type="button" className="chip" aria-label="Ubrat" onClick={() => onChange(qty - 1)}>
        −
      </button>
      <strong className="qty__value">{qty}</strong>
      <button type="button" className="chip" aria-label="Přidat" disabled={!canAdd} onClick={() => onChange(qty + 1)}>
        +
      </button>
    </div>
  );
}

function ShrnutiStep({
  draft,
  currentName,
  onBackup,
}: {
  draft: NewCharacterDraft;
  /** Name of the character about to be replaced; undefined when the sheet is still blank. */
  currentName?: string;
  onBackup: () => void;
}) {
  const c = buildCharacter(draft);
  const start = draft.hodPenize === undefined ? 0 : pocatecniPenize(draft.hodPenize);
  return (
    <>
      <h2 className="heading">{c.identity.name}</h2>
      <p className="note">
        {RASA_LABELS[c.identity.rasa]} · {POVOLANI_LABELS[c.identity.povolani]} · 1. úroveň ·{' '}
        {PRESVEDCENI_LABELS[c.identity.presvedceni]}
      </p>
      <ul className="stats">
        {VLASTNOSTI_ORDER.map((v) => (
          <li key={v} className="stat">
            <span className="stat__name">{VLASTNOST_LABELS[v]}</span>
            <strong className="stat__plain">{c.vlastnosti[v]}</strong>
            <span className="stat__bonus">{signed(bonus(c.vlastnosti[v]))}</span>
          </li>
        ))}
      </ul>
      <ul className="combat">
        <li>
          <span className="note">Životy</span>
          <strong>{c.hp.max}</strong>
        </li>
        {c.magenergie.max > 0 && (
          <li>
            <span className="note">Magenergie</span>
            <strong>{c.magenergie.max}</strong>
          </li>
        )}
        <li>
          <span className="note">Peníze</span>
          <strong className="counter__value--money wizard__money">{start ? formatMoney(c.money) : '—'}</strong>
          {c.money !== start && <span className="note">z {formatMoney(start)}</span>}
        </li>
      </ul>

      <h2 className="heading">Výbava</h2>
      {c.inventory.length === 0 ? (
        <p className="note">Zatím nic – nakoupíš v záložce Výbava.</p>
      ) : (
        <ul className="items">
          {c.inventory.map((item) => (
            <li key={item.id} className="item">
              <div className="item__main">
                <span className="item__name">
                  {item.qty > 1 ? `${item.qty}× ` : ''}
                  {item.name}
                </span>
                {'equipped' in item && item.equipped && <span className="note">nasazeno</span>}
              </div>
            </li>
          ))}
        </ul>
      )}

      {currentName && (
        <>
          <h2 className="heading">Pozor</h2>
          <p className="note delta--down">
            Vytvoření nahradí postavu <strong>{currentName}</strong>, která je teď v deníku. Pokud ji ještě chceš,
            nejdřív si ji ulož.
          </p>
          <button type="button" className="chip" onClick={onBackup}>
            Uložit zálohu současné postavy
          </button>
        </>
      )}
    </>
  );
}
