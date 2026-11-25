import type { CharacterStore } from '../state/useCharacter';
import { derive } from '../rules/derived';
import { maMagenergii, magenergieZTabulky, meditujici } from '../rules/abilities';
import { dnyJidla, formatDny } from '../rules/food';
import { signed } from './format';
import { NumberInput } from '../components/NumberInput';

const timeFormat = new Intl.DateTimeFormat('cs-CZ', { hour: '2-digit', minute: '2-digit' });

export function BojScreen({ store }: { store: CharacterStore }) {
  const { character, update, adjustHp, adjustMag, rest, eat, refillMag } = store;
  const d = derive(character);
  const { povolani } = character.identity;
  const isCaster = maMagenergii(character);
  const postih = d.postihZraneni + d.postihNalozeni;
  const magTabulka = magenergieZTabulky(character);
  const jidlo = dnyJidla(character.inventory);

  return (
    <div className="screen">
      <section className="vitals">
        <output className="vitals__value">{character.hp.current}</output>
        <label className="vitals__max">
          <span>z</span>
          <NumberInput
            min={0}
            value={character.hp.max}
            onChange={(n) => update((draft) => void (draft.hp.max = n))}
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
          <span className="note">ÚČ na dálku</span>
          <strong>{d.ucDalka ?? '—'}</strong>
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
          ? `V ruce: ${d.zbran.name} (SZ ${d.zbran.sila}, OZ ${signed(d.zbran.obrana)}${d.zbran.obourucni ? ', obouruční' : ''})`
          : 'Beze zbraně (OZ −3)'}
        {d.strelna ? ` · na dálku: ${d.strelna.name} (SZ ${d.strelna.sila})` : ''}
        {d.rodovaZbran ? ' · rodová zbraň +1' : ''}
        {d.zbroj ? ` · ${d.zbroj.name} (KZ ${d.kz})` : ' · bez zbroje (KZ 1)'}
        {d.stit ? (d.stitBlokovan ? ' · štít nelze držet s obouruční zbraní' : ` · štít +${d.stitBonus} k obraně`) : ''}
      </p>
      <p className="note">
        Útok: 1k6+ + {d.uc}
        {postih ? ` ${signed(postih)}` : ''}
        {d.ucDalka !== undefined ? ` · na dálku: 1k6+ + ${d.ucDalka}${postih ? ` ${signed(postih)}` : ''}` : ''} · obrana: 1k6+ + {d.oc} {signed(d.oz)} OZ
        {d.stitBonus ? ` +${d.stitBonus} štít` : ''}
        {postih ? ` ${signed(postih)}` : ''} · zranění = rozdíl hodů · iniciativa: 1k6{' '}
        {signed(d.iniciativa)}
      </p>
      {d.varovani.map((v) => (
        <p key={v} className="note delta--down">
          {v}
        </p>
      ))}

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
              <NumberInput
                min={0}
                value={character.magenergie.max}
                onChange={(n) => update((draft) => void (draft.magenergie.max = n))}
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

      <h2 className="heading">Odpočinek a jídlo</h2>
      <p className="note">
        Důkladný odpočinek: +2 životy{meditujici(povolani) && isCaster ? ', plná magenergie' : ''}. Spánek trvá 8 − ½ bonusu za
        odolnost hodin.
      </p>
      <p className={jidlo ? 'note' : 'note delta--down'}>
        {jidlo ? `Jídlo v batohu vystačí na ${formatDny(jidlo)}.` : 'Nemáš u sebe žádné jídlo.'}
      </p>
      <div className="field-row">
        <button type="button" className="chip" onClick={rest}>
          Odpočinout si
        </button>
        <button type="button" className="chip" disabled={!jidlo} onClick={eat}>
          Najíst se
        </button>
      </div>

      <h2 className="heading">Poslední změny</h2>
      {character.log.length === 0 ? (
        <p className="note">Nic se zatím nestalo.</p>
      ) : (
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
      )}
    </div>
  );
}