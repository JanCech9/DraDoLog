import { useState } from 'react';
import type { CharacterStore } from '../state/useCharacter';
import { derive } from '../rules/derived';
import { RANGE_UNIT, WEIGHT_UNIT, ZATIZENI_LABELS } from '../rules/tables';
import { proctoNeovlada } from '../rules/restrictions';
import { formatMoney, toMedaky } from '../rules/money';
import {
  DOSTREL_LABELS,
  DOSTREL_ORDER,
  ITEM_KIND_LABELS,
  TRIDA_ZBRANE_LABELS,
  type Item,
  type ItemKind,
  type TridaZbrane,
} from '../types/character';
import { AMMO_TEMPLATES, catalogFor, type ItemTemplate } from '../data/catalog';

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

const emptyForm = {
  name: '',
  kind: 'ostatni' as ItemKind,
  weight: 0,
  qty: 1,
  sila: 0,
  utocnost: 0,
  obrana: 0,
  iniciativa: 0,
  trida: 'stredni' as TridaZbrane,
  obourucni: false,
  vrhaci: false,
  ochrana: 1,
  stit: 1,
  dostrel: [0, 0, 0] as [number, number, number],
  municeId: '',
};
type Form = typeof emptyForm;

function fromCatalog(t: ItemTemplate): Form {
  const f: Form = { ...emptyForm, name: t.name, kind: t.kind, weight: t.weight };
  switch (t.kind) {
    case 'zbran':
      return { ...f, sila: t.sila, utocnost: t.utocnost, obrana: t.obrana, iniciativa: t.iniciativa, trida: t.trida, obourucni: t.obourucni };
    case 'strelna':
      return { ...f, sila: t.sila, utocnost: t.utocnost, dostrel: t.dostrel, municeId: t.municeId ?? '', trida: t.trida, vrhaci: t.vrhaci };
    case 'zbroj':
      return { ...f, ochrana: t.ochrana };
    case 'stit':
      return { ...f, stit: t.obrana };
    default:
      return f;
  }
}

function itemMeta(item: Item): string {
  switch (item.kind) {
    case 'zbran':
      return ` · SZ ${item.sila} / út ${signed(item.utocnost)} / OZ ${signed(item.obrana)} · ${TRIDA_ZBRANE_LABELS[item.trida]}${item.obourucni ? ', obouruční' : ''}`;
    case 'strelna':
      return ` · SZ ${item.sila} / út ${signed(item.utocnost)} · dostřel ${item.dostrel.join('/')} ${RANGE_UNIT}${item.vrhaci ? ' · vrhací' : ''}`;
    case 'zbroj':
      return ` · KZ ${item.ochrana}`;
    case 'stit':
      return ` · +${item.obrana} k obraně`;
    default:
      return '';
  }
}

export function VybavaScreen({ store }: { store: CharacterStore }) {
  const { character, addItem, buyItem, removeItem, setQty, toggleEquipped, adjustMoney } = store;
  const [form, setForm] = useState<Form>(emptyForm);
  const d = derive(character);
  const fill = Math.min(100, d.nosnost ? (d.weight / d.nosnost) * 100 : 100);
  const catalog = catalogFor(d.velikost);

  const [query, setQuery] = useState('');
  const [pay, setPay] = useState(true);
  const results = catalog.filter(
    (t) => t.shop !== false && t.name.toLowerCase().includes(query.toLowerCase()),
  );

  function submit() {
    if (!form.name.trim()) return;
    const base = { name: form.name.trim(), weight: form.weight, qty: form.qty };
    if (form.kind === 'zbran') {
      addItem({
        ...base,
        kind: 'zbran',
        equipped: false,
        sila: form.sila,
        utocnost: form.utocnost,
        obrana: form.obrana,
        iniciativa: form.iniciativa,
        trida: form.trida,
        obourucni: form.obourucni,
      });
    } else if (form.kind === 'strelna') {
      addItem({
        ...base,
        kind: 'strelna',
        equipped: false,
        sila: form.sila,
        utocnost: form.utocnost,
        dostrel: form.dostrel,
        municeId: form.municeId || undefined,
        trida: form.trida,
        vrhaci: form.vrhaci,
      });
    } else if (form.kind === 'zbroj') {
      addItem({ ...base, kind: 'zbroj', equipped: false, ochrana: form.ochrana });
    } else if (form.kind === 'stit') {
      addItem({ ...base, kind: 'stit', equipped: false, obrana: form.stit });
    } else {
      addItem({ ...base, kind: 'ostatni' });
    }
    setForm(emptyForm);
  }

  function setDostrel(index: number, value: number) {
    const next = [...form.dostrel] as [number, number, number];
    next[index] = value;
    setForm({ ...form, dostrel: next });
  }

  const numField = (label: string, key: 'sila' | 'utocnost' | 'obrana' | 'iniciativa' | 'ochrana' | 'stit') => (
    <label className="field" key={key}>
      <span>{label}</span>
      <input
        type="number"
        inputMode="numeric"
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) || 0 })}
      />
    </label>
  );

  const tridaField = (
    <label className="field">
      <span>Třída</span>
      <select value={form.trida} onChange={(e) => setForm({ ...form, trida: e.target.value as TridaZbrane })}>
        {Object.entries(TRIDA_ZBRANE_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="screen">
      <section className="load">
        <p className="load__level" data-level={d.zatizeni}>
          {ZATIZENI_LABELS[d.zatizeni]}
        </p>
        <div className="load__track">
          <div className="load__fill" data-level={d.zatizeni} style={{ width: `${fill}%` }} />
        </div>
        <p className="note">
          {d.weight} z {d.nosnost} {WEIGHT_UNIT} (uneseš nejvýše {d.nosnost * 4}) · pohyblivost {d.pohyblivost}
          {d.zatizeni === 'tezce' ? ' · velké naložení: −1 k útoku i obraně' : ''}
        </p>
      </section>

      <h2 className="heading">Peníze</h2>
      <div className="counter">
        <button type="button" onClick={() => adjustMoney(-toMedaky({ st: 1 }))}>
          −1 st
        </button>
        <strong className="counter__value counter__value--money">{formatMoney(character.money)}</strong>
        <button type="button" onClick={() => adjustMoney(toMedaky({ st: 1 }))}>
          +1 st
        </button>
        <button type="button" onClick={() => adjustMoney(toMedaky({ zl: 1 }))}>
          +1 zl
        </button>
        <button type="button" onClick={() => adjustMoney(toMedaky({ zl: 10 }))}>
          +10 zl
        </button>
      </div>

      <h2 className="heading">Batoh</h2>
      {character.inventory.length === 0 && <p className="note">Zatím nic nenosíš. Přidej první věc níže.</p>}
      <ul className="items">
        {character.inventory.map((item) => {
          const duvod = item.kind === 'ostatni' ? null : proctoNeovlada(character.identity.povolani, item);
          return (
            <li key={item.id} className="item">
              <div className="item__main">
                <span className="item__name">{item.name}</span>
                <span className="note">
                  {ITEM_KIND_LABELS[item.kind]} · {item.weight * item.qty} {WEIGHT_UNIT}
                  {itemMeta(item)}
                </span>
                {duvod && <span className="note delta--down">{duvod}</span>}
              </div>
              <input
                className="item__qty"
                type="number"
                inputMode="numeric"
                value={item.qty}
                onChange={(e) => setQty(item.id, Number(e.target.value) || 0)}
              />
              {item.kind !== 'ostatni' && (
                <button
                  type="button"
                  className={item.equipped ? 'chip chip--on' : 'chip'}
                  onClick={() => toggleEquipped(item.id)}
                >
                  {item.equipped ? 'Nasazeno' : 'Nasadit'}
                </button>
              )}
              <button type="button" className="chip chip--quiet" onClick={() => removeItem(item.id)}>
                Zahodit
              </button>
            </li>
          );
        })}
      </ul>

      <h2 className="heading">Obchod</h2>
      <p className="note">
        Zbroj a štít jsou pro velikost {d.velikost}. Ceny jsou orientační; „dle PJ“ znamená, že pravidla cenu neuvádějí.
      </p>
      <div className="field-row">
        <label className="field field--wide">
          <span>Hledat</span>
          <input value={query} placeholder="meč, luk, provaz…" onChange={(e) => setQuery(e.target.value)} />
        </label>
        <label className="field">
          <span>Platit</span>
          <input type="checkbox" checked={pay} onChange={(e) => setPay(e.target.checked)} />
        </label>
      </div>
      <ul className="items">
        {results.map((t) => {
          const duvod = t.kind === 'ostatni' ? null : proctoNeovlada(character.identity.povolani, t);
          return (
            <li key={t.templateId} className="item">
              <div className="item__main">
                <span className="item__name">{t.name}</span>
                <span className="note">
                  {t.price ? formatMoney(t.price) : 'cena dle PJ'} · {t.weight} {WEIGHT_UNIT}
                  {t.kind === 'zbran' && ` · SZ ${t.sila} / út ${signed(t.utocnost)} / OZ ${signed(t.obrana)} · ${TRIDA_ZBRANE_LABELS[t.trida]}${t.obourucni ? ', obouruční' : ''}`}
                  {t.kind === 'strelna' && ` · SZ ${t.sila} / út ${signed(t.utocnost)} · dostřel ${t.dostrel.join('/')}`}
                  {t.kind === 'zbroj' && ` · KZ ${t.ochrana}`}
                  {t.kind === 'stit' && ` · +${t.obrana} k obraně`}
                </span>
                {duvod && <span className="note delta--down">{duvod}</span>}
              </div>
              <button
                type="button"
                className="chip"
                disabled={pay && character.money < t.price}
                onClick={() => buyItem(t, 1, pay)}
              >
                {pay && t.price ? 'Koupit' : 'Přidat'}
              </button>
              <button type="button" className="chip chip--quiet" onClick={() => setForm(fromCatalog(t))}>
                Upravit
              </button>
            </li>
          );
        })}
      </ul>

      <h2 className="heading">Přidat vlastní věc</h2>
      <div className="field-row">
        <label className="field field--wide">
          <span>Název</span>
          <input
            value={form.name}
            placeholder="Dlouhý meč"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </label>
      </div>
      <div className="field-row">
        <label className="field">
          <span>Druh</span>
          <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as ItemKind })}>
            {Object.entries(ITEM_KIND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Váha za kus ({WEIGHT_UNIT})</span>
          <input
            type="number"
            inputMode="numeric"
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: Number(e.target.value) || 0 })}
          />
        </label>
        <label className="field">
          <span>Počet</span>
          <input
            type="number"
            inputMode="numeric"
            value={form.qty}
            onChange={(e) => setForm({ ...form, qty: Number(e.target.value) || 0 })}
          />
        </label>
      </div>

      {form.kind === 'zbran' && (
        <div className="field-row">
          {numField('Síla zbraně (SZ)', 'sila')}
          {numField('Útočnost', 'utocnost')}
          {numField('Obrana zbraně (OZ)', 'obrana')}
          {numField('Iniciativa (rozš. souboj)', 'iniciativa')}
          {tridaField}
          <label className="field">
            <span>Obouruční</span>
            <input
              type="checkbox"
              checked={form.obourucni}
              onChange={(e) => setForm({ ...form, obourucni: e.target.checked })}
            />
          </label>
        </div>
      )}

      {form.kind === 'strelna' && (
        <>
          <div className="field-row">
            {numField('Síla zbraně (SZ)', 'sila')}
            {numField('Útočnost', 'utocnost')}
            {tridaField}
            <label className="field">
              <span>Vrhací</span>
              <input
                type="checkbox"
                checked={form.vrhaci}
                onChange={(e) => setForm({ ...form, vrhaci: e.target.checked })}
              />
            </label>
            <label className="field">
              <span>Munice</span>
              <select value={form.municeId} onChange={(e) => setForm({ ...form, municeId: e.target.value })}>
                <option value="">Bez munice</option>
                {AMMO_TEMPLATES.map((t) => (
                  <option key={t.templateId} value={t.templateId}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="field-row">
            {DOSTREL_ORDER.map((k, i) => (
              <label key={k} className="field">
                <span>{DOSTREL_LABELS[k]} dostřel</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={form.dostrel[i]}
                  onChange={(e) => setDostrel(i, Number(e.target.value) || 0)}
                />
              </label>
            ))}
          </div>
        </>
      )}

      {form.kind === 'zbroj' && <div className="field-row">{numField('Kvalita zbroje (KZ)', 'ochrana')}</div>}
      {form.kind === 'stit' && <div className="field-row">{numField('Bonus k obraně', 'stit')}</div>}

      <button type="button" className="primary" onClick={submit}>
        Přidat do batohu
      </button>
    </div>
  );
}
