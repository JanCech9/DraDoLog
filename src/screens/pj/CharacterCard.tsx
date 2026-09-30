import { useState } from 'react';
import type { PartyMember } from '../../state/party';
import { derive } from '../../rules/derived';
import { maMagenergii, sance, schopnostiFor, urovenInfo } from '../../rules/abilities';
import { formatMoney } from '../../rules/money';
import { RANGE_UNIT, WEIGHT_UNIT, ZATIZENI_LABELS } from '../../rules/tables';
import { KOUZLA } from '../../data/spells';
import {
  DOSTREL_LABELS,
  DOSTREL_ORDER,
  ITEM_KIND_LABELS,
  POVOLANI_LABELS,
  PRESVEDCENI_LABELS,
  RASA_LABELS,
  VLASTNOSTI_ORDER,
  VLASTNOST_LABELS,
} from '../../types/character';

import { hpStatus, hpTone, signed, stampFormat } from './format';

export function CharacterCard({ member, onRemove }: { member: PartyMember; onRemove: () => void }) {
  const { character: c, importedAt } = member;
  const d = derive(c);
  const { rasa, povolani, uroven, presvedceni } = c.identity;
  const [open, setOpen] = useState(false);
  const isCaster = maMagenergii(c);
  const postih = d.postihZraneni + d.postihNalozeni;
  const { strelna, ucStrelba } = d;
  const lvl = urovenInfo(c);
  const schopnosti = schopnostiFor(c);
  const znamaKouzla = KOUZLA.filter((k) => c.kouzla.includes(k.id));
  const name = c.identity.name || 'Bezejmenný';

  function remove() {
    if (confirm(`Odebrat postavu ${name} z družiny?`)) onRemove();
  }

  return (
    <article className="card">
      <header className="card__head">
        <div>
          <h2 className="card__name">{name}</h2>
          <p className="note">
            {RASA_LABELS[rasa]} · {POVOLANI_LABELS[povolani]} · {uroven}. úroveň · {PRESVEDCENI_LABELS[presvedceni]}
          </p>
        </div>
        <p className="note card__stamp">načteno {stampFormat.format(importedAt)}</p>
      </header>

      <ul className="combat">
        <li>
          <span className="note">Životy</span>
          <strong className={hpTone(d, c.hp)}>
            {c.hp.current}
            <span className="note"> / {c.hp.max}</span>
          </strong>
        </li>
        <li>
          <span className="note">ÚČ</span>
          <strong>{d.uc}</strong>
        </li>
        <li>
          <span className="note">OČ</span>
          <strong>{d.oc}</strong>
        </li>
        <li>
          <span className="note">Ini</span>
          <strong>{signed(d.iniciativa)}</strong>
        </li>
      </ul>

      <p className={c.hp.current <= 0 || d.vyrazen ? 'note delta--down' : 'note'}>
        {hpStatus(d, c.hp)}
        {postih ? ` Postih ${signed(postih)} k útoku i obraně.` : ''}
      </p>

      <p className="note">
        {d.zbran
          ? `${d.zbran.name} (SZ ${d.zbran.sila}, út ${signed(d.zbran.utocnost)}, OZ ${signed(d.zbran.obrana)})`
          : 'Beze zbraně (OZ −3)'}
        {d.rodovaZbran ? ' · rodová +1' : ''}
        {d.zbroj ? ` · ${d.zbroj.name} (KZ ${d.kz})` : ' · bez zbroje'}
        {d.stit ? (d.stitBlokovan ? ' · štít blokován' : ` · štít +${d.stitBonus}`) : ''}
      </p>

      {strelna && ucStrelba && (
        <p className="note">
          {strelna.name}: ÚČ{' '}
          {DOSTREL_ORDER.map(
            (k, i) => `${ucStrelba[k]} (${DOSTREL_LABELS[k].toLowerCase()} do ${strelna.dostrel[i]} ${RANGE_UNIT})`,
          ).join(' · ')}
          {d.munice !== undefined ? ` · munice ${d.munice}` : ''}
        </p>
      )}

      {isCaster && (
        <p className="note">
          Magenergie <strong className="inline-strong">{c.magenergie.current}</strong> / {c.magenergie.max}
          {znamaKouzla.length ? ` · ${znamaKouzla.length} známých kouzel` : ''}
        </p>
      )}

      <p className="note">
        {ZATIZENI_LABELS[d.zatizeni]} ({d.weight} / {d.nosnost} {WEIGHT_UNIT}) · pohyblivost {d.pohyblivost} ·{' '}
        <span className="money">{formatMoney(c.money)}</span> · {c.xp} zt
        {lvl.dalsi !== undefined ? (lvl.muze ? ' – může postoupit' : ` (na další úroveň ${lvl.dalsi})`) : ''}
      </p>

      {d.varovani.map((v) => (
        <p key={v} className="note delta--down">
          {v}
        </p>
      ))}

      {open && (
        <div className="card__details">
          <h3 className="heading">Vlastnosti</h3>
          <ul className="stats stats--compact">
            {VLASTNOSTI_ORDER.map((key) => (
              <li key={key} className="stat">
                <span className="stat__name">{VLASTNOST_LABELS[key]}</span>
                <span className="stat__value">{c.vlastnosti[key]}</span>
                <span className="stat__bonus">{signed(d.bonus[key])}</span>
              </li>
            ))}
          </ul>

          <h3 className="heading">Schopnosti</h3>
          <p className="note">
            Postřeh na objekty {d.postrehObjekty} %, na mechanismy {d.postrehMechanismy} %.
          </p>
          {schopnosti.length > 0 && (
            <ul className="items">
              {schopnosti.map((s) => (
                <li key={s.id} className="item item--tight">
                  <span className="item__main">{s.name}</span>
                  {s.kind === 'procentni' && <strong className="stat__bonus">{sance(s, c)} %</strong>}
                  {s.kind === 'aktivni' && s.magCost !== undefined && (
                    <span className="note">{s.magCost} magů</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {znamaKouzla.length > 0 && (
            <>
              <h3 className="heading">Kouzla</h3>
              <ul className="items">
                {znamaKouzla.map((k) => (
                  <li key={k.id} className="item item--tight">
                    <span className="item__main">{k.name}</span>
                    <span className="note">
                      {k.magCostPopis ?? `${k.magCost} magů`}
                      {k.past ? ` · past ${k.past}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          <h3 className="heading">Výbava</h3>
          {c.inventory.length === 0 ? (
            <p className="note">Nic nenese.</p>
          ) : (
            <ul className="items">
              {c.inventory.map((item) => (
                <li key={item.id} className="item item--tight">
                  <span className="item__main">
                    {item.qty !== 1 ? `${item.qty}× ` : ''}
                    {item.name}
                    {item.kind !== 'ostatni' && item.equipped ? <span className="note"> · nasazeno</span> : null}
                  </span>
                  <span className="note">
                    {ITEM_KIND_LABELS[item.kind]} · {item.weight * item.qty} {WEIGHT_UNIT}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {c.pribeh.trim() && (
            <>
              <h3 className="heading">Příběh</h3>
              <p className="story-text">{c.pribeh}</p>
            </>
          )}

          {c.log.length > 0 && (
            <>
              <h3 className="heading">Poslední změny</h3>
              <ol className="log">
                {c.log.slice(0, 8).map((entry) => (
                  <li key={entry.id}>
                    <span className="note">{stampFormat.format(entry.ts)}</span>
                    <span>{entry.text}</span>
                    {entry.delta !== undefined && (
                      <span className={entry.delta < 0 ? 'delta delta--down' : 'delta delta--up'}>
                        {signed(entry.delta)}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}

      <footer className="card__actions">
        <button type="button" className="chip" onClick={() => setOpen((o) => !o)}>
          {open ? 'Méně' : 'Podrobnosti'}
        </button>
        <button type="button" className="chip chip--quiet" onClick={remove}>
          Odebrat
        </button>
      </footer>
    </article>
  );
}
