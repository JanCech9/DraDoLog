import { useState } from 'react';
import type { CharacterStore } from '../state/useCharacter';
import type { Presvedceni } from '../types/character';
import { derive } from '../rules/derived';
import { RODOVE_ZBRANE, WEIGHT_UNIT } from '../rules/tables';
import { formatKostka, hpKostka, urovenInfo } from '../rules/abilities';
import { formatMoney, toMedaky } from '../rules/money';
import { RASA_RYSY } from '../data/races';
import { CATALOG } from '../data/catalog';
import {
  POVOLANI_LABELS,
  RASA_LABELS,
  VLASTNOSTI_ORDER,
  VLASTNOST_LABELS,
  PRESVEDCENI_LABELS,
} from '../types/character';
import { signed } from './format';
import { NumberInput } from '../components/NumberInput';

export function PostavaScreen({ store }: { store: CharacterStore }) {
  const { character, update, adjustXp, levelUp } = store;
  const d = derive(character);
  const { rasa, povolani, uroven } = character.identity;
  const rysy = RASA_RYSY[rasa];
  const lvl = urovenInfo(character);
  const kostka = hpKostka(povolani);
  const rodova = CATALOG.find((t) => t.templateId === RODOVE_ZBRANE[rasa])?.name;
  const cenaVycviku = toMedaky({ zl: lvl.cena ?? 0 });

  // The HP die is rolled at the table; the result is typed in here.
  const [hodZivotyZadany, setHodZivoty] = useState<number>();
  const hodZivoty = hodZivotyZadany ?? kostka.n + kostka.plus;

  function postoupit(zaplatit: boolean) {
    if (zaplatit && character.money < cenaVycviku) {
      alert(`Na výcvik nemáš dost peněz – stojí ${lvl.cena} zl, máš ${formatMoney(character.money)}.`);
      return;
    }
    const varovani = lvl.muze
      ? ''
      : `Pozor: na ${uroven + 1}. úroveň potřebuješ ${lvl.dalsi} zt, máš jen ${character.xp} (chybí ${lvl.chybi}).\n\n`;
    const presto = lvl.muze ? '' : 'Přesto ';
    const otazka = zaplatit
      ? `${presto}zaplatit ${lvl.cena} zl za výcvik a postoupit na ${uroven + 1}. úroveň (hod na životy ${hodZivoty})?`
      : `${presto}postoupit na ${uroven + 1}. úroveň bez placení (hod na životy ${hodZivoty})?`;
    // Capitalise the first letter when there is no "Přesto" in front.
    if (!confirm(varovani + otazka.charAt(0).toUpperCase() + otazka.slice(1))) return;
    levelUp(zaplatit, hodZivoty);
    setHodZivoty(undefined); // next level, new roll
  }

  return (
    <div className="screen">
      <label className="field field--wide">
        <span>Jméno</span>
        <input
          value={character.identity.name}
          placeholder="Bezejmenný"
          onChange={(e) => update((draft) => void (draft.identity.name = e.target.value))}
        />
      </label>
      {!character.identity.name && (
        <p className="note">
          Novou postavu založíš tlačítkem <strong>Nová postava</strong> nahoře – projde tě rasou, povoláním, hody na
          vlastnosti, životy, penězi i nákupem výbavy.
        </p>
      )}

      {/* Fixed at creation (Nová postava in the top bar); only the level and alignment move. */}
      <div className="field-row">
        <p className="field">
          <span>Rasa</span>
          <strong className="field__value">{RASA_LABELS[rasa]}</strong>
        </p>
        <p className="field">
          <span>Povolání</span>
          <strong className="field__value">{POVOLANI_LABELS[povolani]}</strong>
        </p>
      </div>

      <div className="field-row">
        <label className="field">
          <span>Úroveň</span>
          <NumberInput
            min={1}
            value={uroven}
            onChange={(n) => update((draft) => void (draft.identity.uroven = n))}
          />
        </label>
        <label className="field">
          <span>Přesvědčení</span>
          <select
            value={character.identity.presvedceni}
            onChange={(e) =>
              update((draft) => void (draft.identity.presvedceni = e.target.value as Presvedceni))
            }
          >
            {Object.entries(PRESVEDCENI_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="note">
        Velikost {rysy.velikost} · pohyblivost {d.pohyblivostZakladni} ({signed(d.pohyblivostBonus)} po naložení{' '}
        {d.pohyblivost}) · rodová zbraň: {rodova ?? '—'} (+1 k ÚČ)
        {rysy.schopnost ? ` · ${rysy.schopnost.name}` : ''}
      </p>

      <h2 className="heading">Vlastnosti</h2>
      <ul className="stats">
        {VLASTNOSTI_ORDER.map((key) => (
          <li key={key} className="stat">
            <span className="stat__name">{VLASTNOST_LABELS[key]}</span>
            <NumberInput
              className="stat__input"
              min={1}
              max={21}
              value={character.vlastnosti[key]}
              onChange={(n) => update((draft) => void (draft.vlastnosti[key] = n))}
            />
            <span className="stat__bonus">{signed(d.bonus[key])}</span>
          </li>
        ))}
      </ul>

      <h2 className="heading">Zkušenosti</h2>
      <div className="counter">
        <button type="button" onClick={() => adjustXp(-10)}>
          −10
        </button>
        <strong className="counter__value">{character.xp}</strong>
        <button type="button" onClick={() => adjustXp(10)}>
          +10
        </button>
        <button type="button" onClick={() => adjustXp(100)}>
          +100
        </button>
      </div>
      {lvl.dalsi !== undefined ? (
        <>
          <p className="note">
            Na {uroven + 1}. úroveň potřebuješ {lvl.dalsi} zt
            {lvl.muze ? ' – máš dost.' : ` – chybí ${lvl.chybi}.`} Výcvik stojí {lvl.cena} zl, trvá 2 měsíce hracího
            času a k tomu strava a ubytování (asi 60 zl měsíčně).
          </p>
          <div className="field-row">
            <label className="field">
              <span>Hod na životy ({formatKostka(kostka)})</span>
              <NumberInput
                min={0}
                fallback={kostka.n + kostka.plus}
                value={hodZivoty}
                onChange={setHodZivoty}
              />
            </label>
            <button type="button" className={lvl.muze ? 'chip chip--on' : 'chip'} onClick={() => postoupit(true)}>
              Zaplatit výcvik a postoupit
            </button>
            <button type="button" className="chip" onClick={() => postoupit(false)}>
              Postoupit bez placení
            </button>
          </div>
        </>
      ) : (
        <p className="note">Tabulka zkušenosti v Pravidlech pro začátečníky končí 6. úrovní.</p>
      )}

      <p className="note">
        Nosnost {d.nosnost} {WEIGHT_UNIT} · neseš {d.weight} {WEIGHT_UNIT}
      </p>
      <h2 className="heading">Příběh</h2>
      <label className="field field--wide">
        <span className="sr-only">Příběh postavy</span>
        <textarea
          className="story"
          rows={8}
          value={character.pribeh}
          placeholder="Odkud pochází, co hledá, koho nenávidí…"
          onChange={(e) => update((draft) => void (draft.pribeh = e.target.value))}
        />
      </label>
    </div>
  );
}