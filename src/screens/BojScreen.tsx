import type { CharacterStore } from '../state/useCharacter';
import { derive } from '../rules/derived';
import { RANGE_UNIT } from '../rules/tables';
import { DOSTREL_LABELS, DOSTREL_ORDER, MAGIC_POVOLANI } from '../types/character';

const timeFormat = new Intl.DateTimeFormat('cs-CZ', { hour: '2-digit', minute: '2-digit' });

export function BojScreen({ store }: { store: CharacterStore }) {
  const { character, update, adjustHp, adjustMag, shoot, undoLast } = store;
  const d = derive(character);
  const isCaster = MAGIC_POVOLANI.includes(character.identity.povolani);
  const { strelna, ucStrelba, munice } = d;

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

      <h2 className="heading">Střelba</h2>
      {strelna && ucStrelba ? (
        <>
          <ul className="combat">
            {DOSTREL_ORDER.map((k, i) => (
              <li key={k}>
                <span className="note">
                  {DOSTREL_LABELS[k]} do {strelna.dostrel[i]} {RANGE_UNIT}
                </span>
                <strong>{ucStrelba[k]}</strong>
              </li>
            ))}
          </ul>
          <p className="note">Střelná zbraň: {strelna.name}</p>
          {munice !== undefined && (
            <div className="counter">
              <strong className="counter__value">{munice}</strong>
              <span className="note">kusů munice</span>
              <button type="button" disabled={munice === 0} onClick={shoot}>
                Vystřelit
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="note">Nemáš nasazenou střelnou zbraň. Nasaď ji ve Výbavě.</p>
      )}

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