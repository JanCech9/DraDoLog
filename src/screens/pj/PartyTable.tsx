import type { CombatRow } from '../../state/encounter';
import { akce, poradi } from '../../state/encounter';
import { derive } from '../../rules/derived';
import { maMagenergii } from '../../rules/abilities';
import { ZATIZENI_LABELS } from '../../rules/tables';
import { DOSTREL_ORDER, POVOLANI_LABELS } from '../../types/character';
import { hpTone, signed } from './format';

interface Props {
  rows: CombatRow[];
  onRoll: (id: string, hod: number | null) => void;
  onNpcHp: (id: string, delta: number) => void;
  onNpcRemove: (id: string) => void;
}

/** One row per combatant: the numbers the PJ needs mid-combat, nothing else. */
export function PartyTable({ rows, onRoll, onNpcHp, onNpcRemove }: Props) {
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
          {rows.map((row) =>
            row.kind === 'postava' ? (
              <CharacterRow key={row.id} row={row} onRoll={onRoll} />
            ) : (
              <NpcRow key={row.id} row={row} onRoll={onRoll} onHp={onNpcHp} onRemove={onNpcRemove} />
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}

type RollHandler = Props['onRoll'];

/** "2 akce", "6 akcí" - Czech plural for the even counts the table produces. */
const pocetAkci = (n: number) => `${n} ${n >= 2 && n <= 4 ? 'akce' : 'akcí'}`;

/** Modifier, the typed-in 1k6 roll, and what they add up to. */
function IniCell({ row, onRoll }: { row: CombatRow; onRoll: RollHandler }) {
  const total = poradi(row);
  return (
    <td>
      <input
        className="party__hod"
        type="number"
        inputMode="numeric"
        min={1}
        max={6}
        placeholder="k6"
        aria-label={`Hod na iniciativu – ${row.name || 'Bezejmenný'}`}
        value={row.hod ?? ''}
        onChange={(e) => onRoll(row.id, e.target.value === '' ? null : Number(e.target.value))}
      />
      <span className="note note--inline"> {signed(row.iniciativa)}</span>
      {row.hod !== undefined && (
        <span className="note">
          = <strong>{total}</strong> · {pocetAkci(akce(total))}
        </span>
      )}
    </td>
  );
}

function CharacterRow({ row, onRoll }: { row: Extract<CombatRow, { kind: 'postava' }>; onRoll: RollHandler }) {
  const c = row.member.character;
  const d = derive(c);
  const postih = d.postihZraneni + d.postihNalozeni;
  const { povolani, uroven } = c.identity;
  const isCaster = maMagenergii(c);
  return (
    <tr>
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
      <IniCell row={row} onRoll={onRoll} />
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
}

function NpcRow({
  row,
  onRoll,
  onHp,
  onRemove,
}: {
  row: Extract<CombatRow, { kind: 'nestvura' }>;
  onRoll: RollHandler;
  onHp: Props['onNpcHp'];
  onRemove: Props['onNpcRemove'];
}) {
  const { npc } = row;
  const { current, max } = npc.hp;
  const tone = current <= 0 ? 'hp hp--out' : current * 3 < max ? 'hp hp--low' : 'hp';
  return (
    <tr className="party__npc">
      <td>
        <span className="party__name">{npc.name}</span>
        <span className="note">
          nestvůra ·{' '}
          <button type="button" className="chip chip--quiet" onClick={() => onRemove(npc.id)}>
            odebrat
          </button>
        </span>
      </td>
      <td>
        <strong className={tone}>{current}</strong>
        <span className="note note--inline"> / {max}</span>
        <span className="party__hp-buttons">
          {[-5, -1, 1].map((delta) => (
            <button key={delta} type="button" onClick={() => onHp(npc.id, delta)}>
              {signed(delta).replace('-', '−')}
            </button>
          ))}
        </span>
      </td>
      <td>
        <strong>{npc.uc || '—'}</strong>
      </td>
      <td>
        <strong>{npc.oc}</strong>
      </td>
      <IniCell row={row} onRoll={onRoll} />
      <td colSpan={4}>
        <span className="note">—</span>
      </td>
    </tr>
  );
}
