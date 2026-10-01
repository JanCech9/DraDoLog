import { useRef, useState, type DragEvent } from 'react';
import { useParty, type ImportResult } from './state/useParty';
import { useEncounter } from './state/useEncounter';
import { combatRows, sortRows, type Order } from './state/encounter';
import { CharacterCard } from './screens/pj/CharacterCard';
import { PartyTable } from './screens/pj/PartyTable';
import { NpcForm } from './screens/pj/NpcForm';
import { InfoButton } from './components/InfoDialog';

const ORDERS: Array<{ id: Order; label: string }> = [
  { id: 'nacteni', label: 'podle načtení' },
  { id: 'jmeno', label: 'podle jména' },
  { id: 'iniciativa', label: 'podle iniciativy' },
  { id: 'zivoty', label: 'podle životů' },
];

function describe(result: ImportResult): string {
  const parts: string[] = [];
  if (result.loaded.length) parts.push(`Načteno: ${result.loaded.join(', ')}.`);
  if (result.failed.length) parts.push(`Nešlo načíst: ${result.failed.join(', ')} – čekám JSON z deníku.`);
  return parts.join(' ');
}

export default function PjApp() {
  const { party, importFiles, remove, clear } = useParty();
  const fight = useEncounter();
  const [order, setOrder] = useState<Order>('nacteni');
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  async function load(files: Iterable<File> | null | undefined) {
    if (!files) return;
    setStatus(describe(await importFiles(files)));
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    void load(e.dataTransfer.files);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    if (!dragging) setDragging(true);
  }

  function clearParty() {
    if (confirm('Vymazat celou družinu? Soubory hráčů to neovlivní.')) {
      clear();
      setStatus('');
    }
  }

  function endFight() {
    if (confirm('Ukončit boj? Nestvůry a hody na iniciativu se smažou, družina zůstane.')) fight.end();
  }

  const { npcs, hody } = fight.encounter;
  const rows = sortRows(combatRows(party.members, fight.encounter), order);
  const inFight = npcs.length > 0 || Object.keys(hody).length > 0;

  return (
    <div
      className={dragging ? 'app app--pj app--dragging' : 'app app--pj'}
      onDragOver={onDragOver}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <header className="topbar">
        <h1>Pán jeskyně</h1>
        <div className="topbar__actions">
          <label className="field field--inline">
            <span>Pořadí</span>
            <select value={order} onChange={(e) => setOrder(e.target.value as Order)}>
              {ORDERS.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="chip chip--on" onClick={() => fileInput.current?.click()}>
            Načíst postavy
          </button>
          {party.members.length > 0 && (
            <button type="button" className="chip chip--quiet" onClick={clearParty}>
              Vymazat družinu
            </button>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            multiple
            hidden
            onChange={(e) => {
              void load(e.target.files);
              e.target.value = '';
            }}
          />
          <InfoButton variant="pj" />
        </div>
      </header>

      <main className="screen">
        {status && <p className="note status">{status}</p>}

        {party.members.length === 0 && (
          <section className="dropzone">
            <p className="dropzone__title">Družina je prázdná</p>
            <p className="note">
              Hráči v deníku klepnou na <strong>Poslat PJ</strong> a pošlou ti soubor postavy. Přetáhni soubory sem
              nebo je vyber přes <strong>Načíst postavy</strong>. Novější soubor stejné postavy ten starší nahradí.
            </p>
          </section>
        )}

        <div className="heading-row">
          <h2 className="heading">Družina v boji</h2>
          {inFight && (
            <span className="heading-row__actions">
              <button type="button" className="chip chip--on" onClick={fight.nextRound}>
                Nové kolo
              </button>
              <button type="button" className="chip chip--quiet" onClick={endFight}>
                Ukončit boj
              </button>
            </span>
          )}
        </div>
        {rows.length > 0 && (
          <PartyTable rows={rows} onRoll={fight.roll} onNpcHp={fight.adjustHp} onNpcRemove={fight.remove} />
        )}
        <NpcForm onAdd={fight.add} />

        {party.members.length > 0 && (
          <>
            <h2 className="heading">Postavy</h2>
            <div className="cards">
              {rows.map(
                (row) =>
                  row.kind === 'postava' && (
                    <CharacterCard key={row.id} member={row.member} onRemove={() => remove(row.id)} />
                  ),
              )}
            </div>
            <p className="note">
              Čísla jsou z okamžiku, kdy hráč soubor poslal. Pro čerstvá čísla si nech poslat nový – přetáhni ho sem.
            </p>
          </>
        )}
      </main>
    </div>
  );
}
