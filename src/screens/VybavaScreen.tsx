import { useState } from 'react';
import type { CharacterStore } from '../state/useCharacter';
import { derive } from '../rules/derived';
import { WEIGHT_UNIT, ZATIZENI_LABELS } from '../rules/tables';
import { formatMoney, toMedaky } from '../rules/money';
import { ITEM_KIND_LABELS, type Item, type ItemKind } from '../types/character';
import { CATALOG } from '../data/catalog';

const emptyForm = {
  name: '',
  kind: 'ostatni' as ItemKind,
  weight: 0,
  qty: 1,
  utocnost: 0,
  obrana: 0,
  iniciativa: 0,
  ochrana: 0,
};

export function VybavaScreen({ store }: { store: CharacterStore }) {
  const { character, addItem, buyItem, removeItem, setQty, toggleEquipped, adjustMoney } = store;
  const [form, setForm] = useState(emptyForm);
  const d = derive(character);
  const fill = Math.min(100, d.nosnost ? (d.weight / d.nosnost) * 100 : 100);

  const [query, setQuery] = useState('');
  const [pay, setPay] = useState(true);
  const results = CATALOG.filter((t) => t.name.toLowerCase().includes(query.toLowerCase()));

  function submit() {
    if (!form.name.trim()) return;
    const base = { name: form.name.trim(), weight: form.weight, qty: form.qty };
    if (form.kind === 'zbran') {
      addItem({
        ...base,
        kind: 'zbran',
        equipped: false,
        utocnost: form.utocnost,
        obrana: form.obrana,
        iniciativa: form.iniciativa,
      } as Omit<Item, 'id'>);
    } else if (form.kind === 'zbroj') {
      addItem({ ...base, kind: 'zbroj', equipped: false, ochrana: form.ochrana } as Omit<Item, 'id'>);
    } else {
      addItem({ ...base, kind: 'ostatni' } as Omit<Item, 'id'>);
    }
    setForm(emptyForm);
  }

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
          {d.weight} z {d.nosnost} {WEIGHT_UNIT}
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
      </div>

      <h2 className="heading">Batoh</h2>
      {character.inventory.length === 0 && <p className="note">Zatím nic nenosíš. Přidej první věc níže.</p>}
      <ul className="items">
        {character.inventory.map((item) => (
          <li key={item.id} className="item">
            <div className="item__main">
              <span className="item__name">{item.name}</span>
              <span className="note">
                {ITEM_KIND_LABELS[item.kind]} · {item.weight * item.qty} {WEIGHT_UNIT}
                {item.kind === 'zbran' && ` · út ${item.utocnost} / obr ${item.obrana}`}
                {item.kind === 'zbroj' && ` · ochrana ${item.ochrana}`}
              </span>
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
        ))}
      </ul>

      <h2 className="heading">Obchod</h2>
      <div className="field-row">
        <label className="field field--wide">
          <span>Hledat</span>
          <input value={query} placeholder="meč, lano…" onChange={(e) => setQuery(e.target.value)} />
        </label>
        <label className="field">
          <span>Platit</span>
          <input type="checkbox" checked={pay} onChange={(e) => setPay(e.target.checked)} />
        </label>
      </div>
      <ul className="items">
        {results.map((t) => (
          <li key={t.templateId} className="item">
            <span className="item__name">{t.name}</span>
            <span className="item__meta">{formatMoney(t.price)} · {t.weight} {WEIGHT_UNIT}</span>
            <button
              type="button"
              className="chip"
              disabled={pay && character.money < t.price}
              onClick={() => buyItem(t, 1, pay)}
            >
              {pay ? 'Koupit' : 'Přidat'}
            </button>
            <button
              type="button"
              className="chip chip--quiet"
              onClick={() => setForm({ ...emptyForm, ...t, qty: 1 })}
            >
              Upravit
            </button>
          </li>
        ))}
      </ul>

      <h2 className="heading">Přidat věc</h2>
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
          <select
            value={form.kind}
            onChange={(e) => setForm({ ...form, kind: e.target.value as ItemKind })}
          >
            {Object.entries(ITEM_KIND_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Váha za kus</span>
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
          <label className="field">
            <span>Útočnost</span>
            <input
              type="number"
              value={form.utocnost}
              onChange={(e) => setForm({ ...form, utocnost: Number(e.target.value) || 0 })}
            />
          </label>
          <label className="field">
            <span>Obrana</span>
            <input
              type="number"
              value={form.obrana}
              onChange={(e) => setForm({ ...form, obrana: Number(e.target.value) || 0 })}
            />
          </label>
          <label className="field">
            <span>Iniciativa</span>
            <input
              type="number"
              value={form.iniciativa}
              onChange={(e) => setForm({ ...form, iniciativa: Number(e.target.value) || 0 })}
            />
          </label>
        </div>
      )}

      {form.kind === 'zbroj' && (
        <div className="field-row">
          <label className="field">
            <span>Ochrana</span>
            <input
              type="number"
              value={form.ochrana}
              onChange={(e) => setForm({ ...form, ochrana: Number(e.target.value) || 0 })}
            />
          </label>
        </div>
      )}

      <button type="button" className="primary" onClick={submit}>
        Přidat do batohu
      </button>
    </div>
  );
}
