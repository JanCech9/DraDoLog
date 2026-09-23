import type { CharacterStore } from '../state/useCharacter';
import { canCast, kouzlaFor, rysyFor, sance, sanceRys, schopnostiFor } from '../rules/abilities';
import { RANGE_UNIT } from '../rules/tables';
import { VELIKOST } from '../data/races';
import { MAGIC_POVOLANI, RASA_LABELS } from '../types/character';

export function SchopnostiScreen({ store }: { store: CharacterStore }) {
  const { character, castSpell, learnSpell, forgetSpell, useAbility } = store;
  const { rasa, povolani } = character.identity;

  const rysy = rysyFor(character);
  const schopnosti = schopnostiFor(character);
  const isCaster = MAGIC_POVOLANI.includes(povolani);
  const dostupna = kouzlaFor(character);
  const znama = dostupna.filter((k) => character.kouzla.includes(k.id));
  const kNauceni = dostupna.filter((k) => !character.kouzla.includes(k.id));

  return (
    <div className="screen">
      <h2 className="heading">Rasa</h2>
      <p className="note">
        {RASA_LABELS[rasa]} · velikost {VELIKOST[rasa]}
      </p>
      {rysy.length === 0 ? (
        <p className="note">Tato rasa nemá zvláštní rysy.</p>
      ) : (
        <ul className="items">
          {rysy.map((r) => (
            <li key={r.id} className="item">
              <div className="item__main">
                <span className="item__name">{r.name}</span>
                {r.popis && <span className="note">{r.popis}</span>}
              </div>
              {r.kind === 'procentni' && (
                <strong className="stat__bonus">{sanceRys(r, character)} %</strong>
              )}
              {r.kind === 'dosah' && (
                <strong className="stat__bonus">
                  {r.hodnota} {RANGE_UNIT}
                </strong>
              )}
            </li>
          ))}
        </ul>
      )}

      <h2 className="heading">Schopnosti povolání</h2>
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
                  {s.kind === 'aktivni' && s.magCost !== undefined && ` · ${s.magCost} mag`}
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
                  onClick={() => useAbility(s)}
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
          {znama.length === 0 ? (
            <p className="note">Zatím neznáš žádné kouzlo.</p>
          ) : (
            <ul className="items">
              {znama.map((k) => (
                <li key={k.id} className="item">
                  <div className="item__main">
                    <span className="item__name">{k.name}</span>
                    <span className="note">
                      {k.magCost} mag
                      {k.dosah && ` · dosah ${k.dosah}`}
                      {k.rozsah && ` · rozsah ${k.rozsah}`}
                      {k.trvani && ` · trvání ${k.trvani}`}
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
                  <button
                    type="button"
                    className="chip chip--quiet"
                    onClick={() => forgetSpell(k.id)}
                  >
                    Zapomenout
                  </button>
                </li>
              ))}
            </ul>
          )}

          {kNauceni.length > 0 && (
            <>
              <h2 className="heading">Naučit se</h2>
              <div className="field-row">
                {kNauceni.map((k) => (
                  <button
                    key={k.id}
                    type="button"
                    className="chip"
                    onClick={() => learnSpell(k.id)}
                  >
                    {k.name} ({k.magCost} mag)
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