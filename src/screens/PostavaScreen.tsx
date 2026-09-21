import type { CharacterStore } from '../state/useCharacter';
import { derive } from '../rules/derived';
import { WEIGHT_UNIT } from '../rules/tables';
import {
  POVOLANI_LABELS,
  RASA_LABELS,
  VLASTNOSTI_ORDER,
  VLASTNOST_LABELS,
  type Povolani,
  type Rasa,
} from '../types/character';

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

export function PostavaScreen({ store }: { store: CharacterStore }) {
  const { character, update, adjustXp } = store;
  const d = derive(character);

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
            value={character.identity.rasa}
            onChange={(e) =>
              update((draft) => void (draft.identity.rasa = e.target.value as Rasa))
            }
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
            value={character.identity.povolani}
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
            value={character.identity.uroven}
            onChange={(e) =>
              update((draft) => void (draft.identity.uroven = Number(e.target.value) || 0))
            }
          />
        </label>
        <label className="field">
          <span>Přesvědčení</span>
          <input
            value={character.identity.presvedceni}
            placeholder="např. zmatené dobro"
            onChange={(e) => update((draft) => void (draft.identity.presvedceni = e.target.value))}
          />
        </label>
      </div>

      <h2 className="heading">Vlastnosti</h2>
      <ul className="stats">
        {VLASTNOSTI_ORDER.map((key) => (
          <li key={key} className="stat">
            <span className="stat__name">{VLASTNOST_LABELS[key]}</span>
            <input
              className="stat__input"
              type="number"
              inputMode="numeric"
              value={character.vlastnosti[key]}
              onChange={(e) =>
                update((draft) => void (draft.vlastnosti[key] = Number(e.target.value) || 0))
              }
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

      <p className="note">
        Nosnost {d.nosnost} {WEIGHT_UNIT} · neseš {d.weight} {WEIGHT_UNIT}
      </p>
    </div>
  );
}
