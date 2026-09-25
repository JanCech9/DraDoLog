import { useState } from 'react';
import type { CharacterStore } from '../state/useCharacter';
import type { KouzloTemplate } from '../types/character';
import {
  pocetKouzel,
  sance,
  schopnostiFor,
  stopovani,
  uspechAlchymisty,
  uspechKouzelnika,
} from '../rules/abilities';
import { derive } from '../rules/derived';
import { formatMoney } from '../rules/money';
import { KOUZLA } from '../data/spells';
import { RECEPTY } from '../data/recipes';
import { RASA_RYSY } from '../data/races';
import { MAGIC_POVOLANI } from '../types/character';

const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

function KouzloRadek({
  k,
  store,
  known,
  canLearn,
}: {
  k: KouzloTemplate;
  store: CharacterStore;
  known: boolean;
  canLearn: boolean;
}) {
  const { character, castSpell, learnSpell, forgetSpell } = store;
  const [magy, setMagy] = useState(k.magCost);
  const [open, setOpen] = useState(false);
  const cost = Math.max(k.magCost, magy);

  return (
    <li className="item">
      <div className="item__main">
        <span className="item__name">
          {k.name}
          {k.jmeno ? <span className="note"> ({k.jmeno})</span> : null}
        </span>
        <span className="note">
          {k.magCostPopis ?? `${k.magCost} magů`}
          {k.past ? ` · past ${k.past}` : ''}
          {k.dosah ? ` · dosah ${k.dosah}` : ''}
          {k.vyvolani ? ` · vyvolání ${k.vyvolani}` : ''}
          {k.trvani ? ` · trvání ${k.trvani}` : ''}
        </span>
        {open && (
          <span className="note">
            {k.rozsah ? `Rozsah: ${k.rozsah}. ` : ''}
            {k.popis}
          </span>
        )}
      </div>
      <button type="button" className="chip chip--quiet" onClick={() => setOpen((o) => !o)}>
        {open ? 'Méně' : 'Popis'}
      </button>
      {known ? (
        <>
          {k.magCostPopis && (
            <input
              className="item__qty"
              type="number"
              inputMode="numeric"
              min={k.magCost}
              value={magy}
              title="Magenergie vložená do kouzla"
              onChange={(e) => setMagy(Number(e.target.value) || k.magCost)}
            />
          )}
          <button
            type="button"
            className="chip"
            disabled={character.magenergie.current < cost}
            onClick={() => castSpell(k, cost)}
          >
            Seslat ({cost})
          </button>
          <button type="button" className="chip chip--quiet" onClick={() => forgetSpell(k.id)}>
            Odebrat
          </button>
        </>
      ) : (
        <button type="button" className="chip" disabled={!canLearn} onClick={() => learnSpell(k.id)}>
          Naučit se
        </button>
      )}
    </li>
  );
}

export function SchopnostiScreen({ store }: { store: CharacterStore }) {
  const { character, brew } = store;
  const { povolani, uroven, rasa } = character.identity;
  const d = derive(character);
  const rysy = RASA_RYSY[rasa];

  const schopnosti = schopnostiFor(character);
  const isCaster = MAGIC_POVOLANI.includes(povolani) && povolani !== 'alchymista';
  const kouzlaOd = povolani === 'hranicar' ? 2 : 1;
  const dostupna = KOUZLA.filter((k) => k.povolani === povolani && k.odUrovne <= uroven);
  const znama = dostupna.filter((k) => character.kouzla.includes(k.id));
  const kNauceni = dostupna.filter((k) => !character.kouzla.includes(k.id));
  const limit = pocetKouzel(character);
  const canLearn = limit === undefined || znama.length < limit;
  const stopy = stopovani(uroven);
  const sanceLucby = uspechAlchymisty(character.vlastnosti.obr);
  const [postihLucby, setPostihLucby] = useState(0);

  return (
    <div className="screen">
      <h2 className="heading">Rasa</h2>
      <p className="note">
        {rysy.schopnost ? (
          <>
            <strong>{rysy.schopnost.name}.</strong> {rysy.schopnost.popis}
          </>
        ) : (
          rysy.poznamka
        )}
      </p>
      <p className="note">
        Postřeh na objekty {d.postrehObjekty} %, na mechanismy {d.postrehMechanismy} % (hoď k% − postřeh, PJ porovná
        s nápadností; hledání 4 čtverečních sáhů = 1 směna). Náhodné objevení: k% − bonus za Int ({signed(d.bonus.int)}).
      </p>

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
                  {s.id === 'stopovani'
                    ? ` Na tvé úrovni: venku ${stopy.venkuLehky} / ${stopy.venkuTezky} %, uvnitř ${stopy.uvnitrLehky} / ${stopy.uvnitrTezky} %.`
                    : ''}
                  {s.id === 'lecba-vlastnich-zraneni' ? ` Teď ${2 * (uroven - 1)} životů denně.` : ''}
                  {s.id === 'kouzelnicka-kouzla'
                    ? ` Úspěch kouzla ${uspechKouzelnika(character.vlastnosti.int)} %, znáš nejvýše ${limit ?? '—'} kouzel.`
                    : ''}
                  {s.id === 'lucba' ? ` Úspěch výroby ${sanceLucby} %.` : ''}
                  {s.id === 'odolnost-vuci-jedum'
                    ? ` Tvůj bonus proti jedům: ${signed(d.bonus.odl >= 0 ? Math.max(d.bonus.odl * 2, d.bonus.odl + 1) : Math.ceil(d.bonus.odl / 2))}.`
                    : ''}
                </span>
              </div>
              {s.kind === 'procentni' && (
                <strong className="stat__bonus">{sance(s, character)} %</strong>
              )}
            </li>
          ))}
        </ul>
      )}

      {isCaster && uroven >= kouzlaOd && (
        <>
          <h2 className="heading">Kouzla</h2>
          <p className="note">
            Magenergie {character.magenergie.current} / {character.magenergie.max}
            {limit !== undefined ? ` · známá kouzla ${znama.length} / ${limit}` : ''}
            {povolani === 'kouzelnik' ? ` · úspěch seslání ${uspechKouzelnika(character.vlastnosti.int)} % (k%)` : ''}
            {' · nepřetržitě lze kouzlit '}
            {2 * character.vlastnosti.odl} kol, pak 3 směny odpočinku
          </p>
          <ul className="items">
            {znama.map((k) => (
              <KouzloRadek key={k.id} k={k} store={store} known canLearn />
            ))}
          </ul>
          {znama.length === 0 && <p className="note">Zatím neznáš žádné kouzlo.</p>}

          {kNauceni.length > 0 && (
            <>
              <h2 className="heading">Naučit se</h2>
              {!canLearn && <p className="note">Na této úrovni už víc kouzel neznáš – další při postupu.</p>}
              <ul className="items">
                {kNauceni.map((k) => (
                  <KouzloRadek key={k.id} k={k} store={store} known={false} canLearn={canLearn} />
                ))}
              </ul>
            </>
          )}
        </>
      )}
      {isCaster && uroven < kouzlaOd && (
        <p className="note">Hraničář začíná kouzlit od 2. úrovně.</p>
      )}

      {povolani === 'alchymista' && (
        <>
          <h2 className="heading">Lučba</h2>
          <p className="note">
            Magenergie v truhle {character.magenergie.current} / {character.magenergie.max} · peníze na suroviny{' '}
            {formatMoney(character.money)} · úspěch {sanceLucby} % (v boji −10 % za každého nepřítele do 2 sáhů;
            neúspěch spotřebuje suroviny i magenergii)
          </p>
          <label className="field">
            <span>Postih k úspěchu (%)</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={10}
              value={postihLucby}
              onChange={(e) => setPostihLucby(Math.max(0, Number(e.target.value) || 0))}
            />
          </label>
          <ul className="items">
            {RECEPTY.filter((r) => r.odUrovne <= uroven).map((r) => (
              <li key={r.id} className="item">
                <div className="item__main">
                  <span className="item__name">{r.name}</span>
                  <span className="note">
                    {r.magCost} magů · suroviny {formatMoney(r.surovinyCena)}
                    {r.zaklad ? ` · základ ${r.zaklad}` : ''}
                    {r.vyroba ? ` · výroba ${r.vyroba}${r.doma ? ' (jen doma)' : ''}` : ''}
                    {r.trvani ? ` · trvání ${r.trvani}` : ''}
                  </span>
                  {r.popis && <span className="note">{r.popis}</span>}
                </div>
                <button
                  type="button"
                  className="chip"
                  disabled={character.magenergie.current < r.magCost || character.money < r.surovinyCena}
                  onClick={() => brew(r, postihLucby)}
                >
                  Vyrobit
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
