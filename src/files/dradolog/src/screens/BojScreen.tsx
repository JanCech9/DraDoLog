import type { CharacterStore } from '../state/useCharacter';
import { derive } from '../rules/derived';
import { RANGE_UNIT } from '../rules/tables';
import { magenergieZTabulky, meditujici } from '../rules/abilities';
import { roll, roll1k6Plus, rollPercent } from '../rules/dice';
import { DOSTREL_LABELS, DOSTREL_ORDER, MAGIC_POVOLANI } from '../types/character';

const timeFormat = new Intl.DateTimeFormat('cs-CZ', { hour: '2-digit', minute: '2-digit' });
const signed = (n: number) => (n > 0 ? `+${n}` : String(n));

export function BojScreen({ store }: { store: CharacterStore }) {
  const { character, update, adjustHp, adjustMag, shoot, undoLast, rest, refillMag, note } = store;
  const d = derive(character);
  const { povolani, uroven } = character.identity;
  const isCaster =
    MAGIC_POVOLANI.includes(povolani) && !(povolani === 'hranicar' && uroven < 2);
  const { strelna, ucStrelba, munice } = d;
  const postih = d.postihZraneni + d.postihNalozeni;
  const magTabulka = magenergieZTabulky(character);

  function hodUtok() {
    const { total, rolls } = roll1k6Plus();
    const vysledek = total + d.uc + postih;
    note(`Hod na útok: ${rolls.join('+')} + ÚČ ${d.uc}${postih ? ` ${signed(postih)}` : ''} = ${vysledek} (zranění + útočnost ${signed(d.utocnost)})`);
  }

  function hodObrana(seZbrani: boolean) {
    const { total, rolls } = roll1k6Plus();
    const oz = seZbrani ? d.oz : -3;
    const vysledek = total + d.oc + oz + d.stitBonus + postih;
    note(
      `Hod na obranu: ${rolls.join('+')} + OČ ${d.oc} ${signed(oz)} (${seZbrani ? 'OZ' : 'bez obrany zbraní'})${d.stitBonus ? ` +${d.stitBonus} štít` : ''}${postih ? ` ${signed(postih)}` : ''} = ${vysledek}`,
    );
  }

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
        <p className={d.vyrazen ? 'note delta--down' : 'note'}>
          {character.hp.current <= 0
            ? 'Mrtev.'
            : d.vyrazen
              ? `Vyřazen z boje (mez vyřazení ${d.mezVyrazeni}).`
              : `Mez vyřazení ${d.mezVyrazeni}${d.postihZraneni ? ` · zraněn: ${d.postihZraneni} k útoku i obraně` : ''}`}
          {d.postihNalozeni ? ' · velké naložení −1' : ''}
        </p>
      </section>

      <ul className="combat">
        <li>
          <span className="note">Útočné číslo</span>
          <strong>{d.uc}</strong>
        </li>
        <li>
          <span className="note">Útočnost</span>
          <strong>{signed(d.utocnost)}</strong>
        </li>
        <li>
          <span className="note">Obranné číslo</span>
          <strong>{d.oc}</strong>
        </li>
        <li>
          <span className="note">Iniciativa</span>
          <strong>{signed(d.iniciativa)}</strong>
        </li>
      </ul>

      <p className="note">
        {d.zbran
          ? `V ruce: ${d.zbran.name} (SZ ${d.zbran.sila}, út ${signed(d.zbran.utocnost)}, OZ ${signed(d.zbran.obrana)}${d.zbran.obourucni ? ', obouruční' : ''})`
          : 'Beze zbraně (OZ −3)'}
        {d.rodovaZbran ? ' · rodová zbraň +1' : ''}
        {d.zbroj ? ` · ${d.zbroj.name} (KZ ${d.kz})` : ' · bez zbroje (KZ 1)'}
        {d.stit ? (d.stitBlokovan ? ' · štít nelze držet s obouruční zbraní' : ` · štít +${d.stitBonus} k obraně`) : ''}
      </p>
      <p className="note">
        Útok: 1k6+ + {d.uc}
        {postih ? ` ${signed(postih)}` : ''} · obrana: 1k6+ + {d.oc} {signed(d.oz)} OZ
        {d.stitBonus ? ` +${d.stitBonus} štít` : ''}
        {postih ? ` ${signed(postih)}` : ''} · zranění = rozdíl hodů {signed(d.utocnost)}, nejméně 1
      </p>
      {d.varovani.map((v) => (
        <p key={v} className="note delta--down">
          {v}
        </p>
      ))}

      <div className="field-row">
        <button type="button" className="chip" onClick={hodUtok}>
          Hodit na útok
        </button>
        <button type="button" className="chip" onClick={() => hodObrana(true)}>
          Hodit na obranu (zbraní)
        </button>
        <button type="button" className="chip" onClick={() => hodObrana(false)}>
          Obrana bez zbraně
        </button>
        <button type="button" className="chip" onClick={() => note(`Hod 1k10: ${roll(10)}`)}>
          1k10
        </button>
        <button type="button" className="chip" onClick={() => note(`Hod k%: ${rollPercent()}`)}>
          k%
        </button>
        <button
          type="button"
          className="chip"
          onClick={() => {
            const k6 = roll(6);
            note(`Hod na iniciativu: ${k6} ${signed(d.iniciativa)} = ${k6 + d.iniciativa}`);
          }}
        >
          Iniciativa
        </button>
      </div>

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
          <p className="note">
            {strelna.vrhaci ? 'Vrhací zbraň' : 'Střelná zbraň'}: {strelna.name} (SZ {strelna.sila}, út{' '}
            {signed(strelna.utocnost)}){strelna.tezkaKuse ? ' · střílí 1× za 2 kola' : ''} · cíl nejméně 2 sáhy;
            proti střelbě se nelze bránit zbraní
          </p>
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
          <p className="note">
            {meditujici(povolani)
              ? `Podle tabulky získáš ${povolani === 'kouzelnik' ? 'zaostřením vůle' : 'meditací'} ${magTabulka} magů (3 směny po důkladném spánku).`
              : `Od učitele bys na této úrovni dostal ${magTabulka} magů; použitá magenergie se alchymistovi neobnovuje.`}
          </p>
          <button type="button" className="chip" onClick={refillMag}>
            Nastavit {magTabulka} magů podle tabulky
          </button>
        </>
      )}

      <h2 className="heading">Odpočinek</h2>
      <p className="note">
        Důkladný odpočinek: +2 životy{meditujici(povolani) && isCaster ? ', plná magenergie' : ''}. Spánek trvá 8 − ½ bonusu za
        odolnost hodin.
      </p>
      <button type="button" className="chip" onClick={rest}>
        Odpočinout si
      </button>

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
