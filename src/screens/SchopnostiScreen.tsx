import type { CharacterStore } from '../state/useCharacter';
import { schopnostiFor, sance, canCast } from '../rules/abilities';
import { KOUZLA } from '../data/spells';
import { MAGIC_POVOLANI } from '../types/character';

export function SchopnostiScreen({ store }: { store: CharacterStore }) {
  const { character, castSpell, learnSpell, update } = store;
  const { povolani, uroven } = character.identity;

  const schopnosti = schopnostiFor(character);
  const isCaster = MAGIC_POVOLANI.includes(povolani);
  const dostupna = KOUZLA.filter((k) => k.povolani === povolani && k.odUrovne <= uroven);
  const znama = dostupna.filter((k) => character.kouzla.includes(k.id));
  const kNauceni = dostupna.filter((k) => !character.kouzla.includes(k.id));

  return (
    <div className="screen">
      <h2 className="heading">Schopnosti</h2>
      {schopnosti.length === 0 ? (
        <p className="note">Pro tuto úroveň nemáš zapsané žádné schopnosti.</p>
      ) : (
        <ul className="items">
          {schopnosti.map((s) => (
            <li key={s.id} className="item">
              <div className="item__main">
                <span className="item__name">{s.name}</span>
                <span className="note">
                  {s.popis ?? `od ${s.odUrovne}. úrovně`}
                  {s.kind === 'aktivni' && s.magCost ? ` · ${s.magCost} mag` : ''}
                </span>
              </div>
              {s.kind === 'procentni' && (
                <strong className="stat__bonus">{sance(s, character)} %</strong>
              )}
              {s.kind === 'aktivni' && s.magCost !== undefined && (
                <button
                  type="button"
                  className="chip"
                  disabled={character.magenergie.current < s.magCost}
                  onClick={() =>
                    update((draft) => {
                      draft.magenergie.current -= s.magCost!;
                      draft.log.unshift({
                        id: crypto.randomUUID(),
                        ts: Date.now(),
                        kind: 'mag',
                        delta: -s.magCost!,
                        text: `Použil: ${s.name}`,
                      });
                    })
                  }
                >
                  Použít
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {isCaster && (
        <>
          <h2 className="heading">Kouzla</h2>
          <p className="note">
            Magenergie {character.magenergie.current} / {character.magenergie.max}
          </p>
          <ul className="items">
            {znama.map((k) => (
              <li key={k.id} className="item">
                <div className="item__main">
                  <span className="item__name">{k.name}</span>
                  <span className="note">
                    {k.magCost} mag
                    {k.dosah ? ` · dosah ${k.dosah}` : ''}
                    {k.trvani ? ` · trvání ${k.trvani}` : ''}
                  </span>
                </div>
                <button
                  type="button"
                  className="chip"
                  disabled={!canCast(k, character)}
                  onClick={() => castSpell(k)}
                >
                  Seslat
                </button>
              </li>
            ))}
          </ul>
          {znama.length === 0 && <p className="note">Zatím neznáš žádné kouzlo.</p>}

          {kNauceni.length > 0 && (
            <>
              <h2 className="heading">Naučit se</h2>
              <div className="field-row">
                {kNauceni.map((k) => (
                  <button key={k.id} type="button" className="chip" onClick={() => learnSpell(k.id)}>
                    {k.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}