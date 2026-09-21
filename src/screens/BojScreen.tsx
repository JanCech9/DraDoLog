import type { CharacterStore } from '../state/useCharacter';
import { derive } from '../rules/derived';
import { MAGIC_POVOLANI } from '../types/character';

const timeFormat = new Intl.DateTimeFormat('cs-CZ', { hour: '2-digit', minute: '2-digit' });

export function BojScreen({ store }: { store: CharacterStore }) {
  const { character, update, adjustHp, adjustMag, undoLast } = store;
  const d = derive(character);
  const isCaster = MAGIC_POVOLANI.includes(character.identity.povolani);

  return (
    <div className="screen">
      <section className="vitals">
        <output className="vitals__value">{character.hp.current}</output>
        <label className="vitals__max">
          <span>z</span>
          <input
            type="number"
            inputMode="numeric"
            value={character.hp.max}
            onChange={(e) => update((draft) => void (draft.hp.max = Number(e.target.value) || 0))}
          />
          <span>životů</span>
        </label>
        <div className="vitals__buttons">
          <button type="button" onClick={() => adjustHp(-5)}>
            −5
          </button>
          <button type="button" onClick={() => adjustHp(-1)}>
            −1
          </button>
          <button type="button" onClick={() => adjustHp(1)}>
            +1
          </button>
          <button type="button" onClick={() => adjustHp(5)}>
            +5
          </button>
        </div>
      </section>

      <ul className="combat">
        <li>
          <span className="note">Útočné číslo</span>
          <strong>{d.uc}</strong>
        </li>
        <li>
          <span className="note">Obranné číslo</span>
          <strong>{d.oc}</strong>
        </li>
        <li>
          <span className="note">Iniciativa</span>
          <strong>{d.iniciativa}</strong>
        </li>
      </ul>

      <p className="note">
        {d.zbran ? `V ruce: ${d.zbran.name}` : 'Bez zbraně'}
        {d.zbroj ? ` · na sobě: ${d.zbroj.name}` : ' · bez zbroje'}
      </p>

      {isCaster && (
        <>
          <h2 className="heading">Magenergie</h2>
          <div className="counter">
            <button type="button" onClick={() => adjustMag(-5)}>
              −5
            </button>
            <button type="button" onClick={() => adjustMag(-1)}>
              −1
            </button>
            <strong className="counter__value">
              {character.magenergie.current} / {character.magenergie.max}
            </strong>
            <button type="button" onClick={() => adjustMag(1)}>
              +1
            </button>
            <label className="field">
              <span>Maximum</span>
              <input
                type="number"
                inputMode="numeric"
                value={character.magenergie.max}
                onChange={(e) =>
                  update((draft) => void (draft.magenergie.max = Number(e.target.value) || 0))
                }
              />
            </label>
          </div>
        </>
      )}

      <h2 className="heading">Poslední změny</h2>
      {character.log.length === 0 ? (
        <p className="note">Nic se zatím nestalo.</p>
      ) : (
        <>
          <button type="button" className="chip" onClick={undoLast}>
            Vrátit poslední změnu
          </button>
          <ol className="log">
            {character.log.slice(0, 12).map((entry) => (
              <li key={entry.id}>
                <span className="note">{timeFormat.format(entry.ts)}</span>
                <span>{entry.text}</span>
                {entry.delta !== undefined && (
                  <span className={entry.delta < 0 ? 'delta delta--down' : 'delta delta--up'}>
                    {entry.delta > 0 ? `+${entry.delta}` : entry.delta}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
