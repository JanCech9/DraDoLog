import { useState } from 'react';
import type { CharacterStore } from '../state/useCharacter';
import type { Presvedceni } from '../types/character';
import { derive } from '../rules/derived';
import { RODOVE_ZBRANE, WEIGHT_UNIT, rozsahVlastnosti } from '../rules/tables';
import { formatKostka, hpKostka, hpZaklad, magenergieZTabulky, urovenInfo } from '../rules/abilities';
import { formatMoney, toMedaky } from '../rules/money';
import { RASA_RYSY } from '../data/races';
import { CATALOG } from '../data/catalog';
import {
  POVOLANI_LABELS,
  RASA_LABELS,
  VLASTNOSTI_ORDER,
  VLASTNOST_LABELS,
  PRESVEDCENI_LABELS,
  type Povolani,
  type Rasa,
} from '../types/character';

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

export function PostavaScreen({ store }: { store: CharacterStore }) {
  const { character, update, adjustXp, adjustMoney, levelUp } = store;
  const d = derive(character);
  const { rasa, povolani, uroven } = character.identity;
  const rysy = RASA_RYSY[rasa];
  const lvl = urovenInfo(character);
  const kostka = hpKostka(povolani);
  const magTabulka = magenergieZTabulky(character);
  const rodova = CATALOG.find((t) => t.templateId === RODOVE_ZBRANE[rasa])?.name;
  const cenaVycviku = toMedaky({ zl: lvl.cena ?? 0 });

  // Dice are rolled at the table; the results are typed in here.
  const [hodPenize, setHodPenize] = useState(1);
  const [hodZivoty, setHodZivoty] = useState(kostka.n + kostka.plus);
  const pocatecniPenize = toMedaky({ zl: (hodPenize + 5) * 10 });

  function pocatecniZivoty() {
    const hp = Math.max(1, hpZaklad(povolani) + d.bonus.odl);
    update((draft) => {
      draft.hp = { current: hp, max: hp };
    });
  }

  function postoupit(zaplatit: boolean) {
    const otazka = zaplatit
      ? `Zaplatit ${lvl.cena} zl za výcvik a postoupit na ${uroven + 1}. úroveň (hod na životy ${hodZivoty})?`
      : `Postoupit na ${uroven + 1}. úroveň bez placení (hod na životy ${hodZivoty})?`;
    if (confirm(otazka)) levelUp(zaplatit, hodZivoty);
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

      <div className="field-row">
        <label className="field">
          <span>Rasa</span>
          <select
            value={rasa}
            onChange={(e) => update((draft) => void (draft.identity.rasa = e.target.value as Rasa))}
          >
            {Object.entries(RASA_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Povolání</span>
          <select
            value={povolani}
            onChange={(e) =>
              update((draft) => void (draft.identity.povolani = e.target.value as Povolani))
            }
          >
            {Object.entries(POVOLANI_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="field-row">
        <label className="field">
          <span>Úroveň</span>
          <input
            type="number"
            inputMode="numeric"
            value={uroven}
            onChange={(e) =>
              update((draft) => void (draft.identity.uroven = Math.max(1, Number(e.target.value) || 1)))
            }
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
      <p className="note">Rozsah u každé vlastnosti je podle rasy a povolání – hoď podle pravidel a zapiš.</p>
      <ul className="stats">
        {VLASTNOSTI_ORDER.map((key) => {
          const [min, max] = rozsahVlastnosti(rasa, povolani, key);
          return (
            <li key={key} className="stat">
              <span className="stat__name">
                {VLASTNOST_LABELS[key]}
                <span className="note">
                  {' '}
                  {min}–{max}
                </span>
              </span>
              <input
                className="stat__input"
                type="number"
                inputMode="numeric"
                min={1}
                max={21}
                value={character.vlastnosti[key]}
                onChange={(e) =>
                  update((draft) => void (draft.vlastnosti[key] = Number(e.target.value) || 0))
                }
              />
              <span className="stat__bonus">{signed(d.bonus[key])}</span>
            </li>
          );
        })}
      </ul>

      <h2 className="heading">Nová postava</h2>
      <p className="note">
        Životy na 1. úrovni: {hpZaklad(povolani)} + odolnost ({signed(d.bonus.odl)}) ={' '}
        {Math.max(1, hpZaklad(povolani) + d.bonus.odl)} · za každou další úroveň {formatKostka(kostka)}{' '}
        {signed(d.bonus.odl)} (nejméně 1)
        {magTabulka > 0 ? ` · magenergie podle tabulky ${magTabulka} magů` : ''}
      </p>
      <div className="field-row">
        <button type="button" className="chip" onClick={pocatecniZivoty}>
          Nastavit počáteční životy
        </button>
        <label className="field">
          <span>Padlo na 1k6</span>
          <input
            type="number"
            inputMode="numeric"
            min={1}
            max={6}
            value={hodPenize}
            onChange={(e) => setHodPenize(Math.max(1, Math.min(6, Number(e.target.value) || 1)))}
          />
        </label>
        <button
          type="button"
          className="chip"
          onClick={() =>
            confirm(`Přičíst počáteční peníze ${formatMoney(pocatecniPenize)} ((${hodPenize}+5) × 10 zl)?`) &&
            adjustMoney(pocatecniPenize)
          }
        >
          Počáteční peníze (1k6+5)×10 zl
        </button>
      </div>

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
              <input
                type="number"
                inputMode="numeric"
                min={kostka.n + kostka.plus}
                value={hodZivoty}
                onChange={(e) => setHodZivoty(Math.max(0, Number(e.target.value) || 0))}
              />
            </label>
            <button
              type="button"
              className="chip chip--on"
              disabled={!lvl.muze || character.money < cenaVycviku}
              onClick={() => postoupit(true)}
            >
              Zaplatit výcvik a postoupit
            </button>
            <button type="button" className="chip" disabled={!lvl.muze} onClick={() => postoupit(false)}>
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