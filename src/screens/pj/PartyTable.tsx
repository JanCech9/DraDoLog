import type { PartyMember } from '../../state/party';
import { derive } from '../../rules/derived';
import { ZATIZENI_LABELS } from '../../rules/tables';
import { DOSTREL_ORDER, MAGIC_POVOLANI, POVOLANI_LABELS } from '../../types/character';
import { hpTone, signed } from './format';

/** One row per character: the numbers the PJ needs mid-combat, nothing else. */
export function PartyTable({ members }: { members: PartyMember[] }) {
  return (
    <div className="table-scroll">
      <table className="party">
        <thead>
          <tr>
            <th>Postava</th>
            <th>Životy</th>
            <th>ÚČ</th>
            <th>OČ</th>
            <th>Ini</th>
            <th>Střelba</th>
            <th>Magy</th>
            <th>Postih</th>
            <th>Naložení</th>
          </tr>
        </thead>
        <tbody>
          {members.map(({ character: c }) => {
            const d = derive(c);
            const postih = d.postihZraneni + d.postihNalozeni;
            const { povolani, uroven } = c.identity;
            const isCaster = MAGIC_POVOLANI.includes(povolani) && !(povolani === 'hranicar' && uroven < 2);
            return (
              <tr key={c.id}>
                <td>
                  <span className="party__name">{c.identity.name || 'Bezejmenný'}</span>
                  <span className="note">
                    {POVOLANI_LABELS[povolani]} {uroven}
                  </span>
                </td>
                <td>
                  <strong className={hpTone(d, c.hp)}>{c.hp.current}</strong>
                  <span className="note note--inline"> / {c.hp.max}</span>
                  <span className="note">mez {d.mezVyrazeni}</span>
                </td>
                <td>
                  <strong>{d.uc}</strong>
                  <span className="note">út {signed(d.utocnost)}</span>
                </td>
                <td>
                  <strong>{d.oc}</strong>
                  <span className="note">
                    OZ {signed(d.oz)}
                    {d.stitBonus ? `, štít +${d.stitBonus}` : ''}
                  </span>
                </td>
                <td>
                  <strong>{signed(d.iniciativa)}</strong>
                </td>
                <td>
                  {d.ucStrelba ? (
                    <>
                      <strong>{DOSTREL_ORDER.map((k) => d.ucStrelba![k]).join(' / ')}</strong>
                      <span className="note">{d.munice !== undefined ? `munice ${d.munice}` : d.strelna?.name}</span>
                    </>
                  ) : (
                    <span className="note">—</span>
                  )}
                </td>
                <td>
                  {isCaster ? (
                    <>
                      <strong>{c.magenergie.current}</strong>
                      <span className="note note--inline"> / {c.magenergie.max}</span>
                    </>
                  ) : (
                    <span className="note">—</span>
                  )}
                </td>
                <td>
                  <strong className={postih ? 'delta--down' : ''}>{postih ? signed(postih) : '—'}</strong>
                </td>
                <td>
                  <span className={d.zatizeni === 'pretizen' ? 'delta--down' : d.zatizeni === 'tezce' ? 'money' : ''}>
                    {ZATIZENI_LABELS[d.zatizeni]}
                  </span>
                  <span className="note">pohyblivost {d.pohyblivost}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
