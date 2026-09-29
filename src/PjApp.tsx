import { useRef, useState, type DragEvent } from 'react';
import { useParty, type ImportResult } from './state/useParty';
import type { PartyMember } from './state/party';
import { derive } from './rules/derived';
import { CharacterCard } from './screens/pj/CharacterCard';
import { PartyTable } from './screens/pj/PartyTable';
import { InfoButton } from './components/InfoDialog';

type Order = 'nacteni' | 'jmeno' | 'iniciativa' | 'zivoty';

const ORDERS: Array<{ id: Order; label: string }> = [
  { id: 'nacteni', label: 'podle načtení' },
  { id: 'jmeno', label: 'podle jména' },
  { id: 'iniciativa', label: 'podle iniciativy' },
  { id: 'zivoty', label: 'podle životů' },
];

const collator = new Intl.Collator('cs');

function sorted(members: PartyMember[], order: Order): PartyMember[] {
  const list = [...members];
  switch (order) {
    case 'jmeno':
      return list.sort((a, b) => collator.compare(a.character.identity.name, b.character.identity.name));
    case 'iniciativa':
      return list.sort((a, b) => derive(b.character).iniciativa - derive(a.character).iniciativa);
    case 'zivoty':
      return list.sort((a, b) => a.character.hp.current - b.character.hp.current);
    default:
      return list;
  }
}

function describe(result: ImportResult): string {
  const parts: string[] = [];
  if (result.loaded.length) parts.push(`Načteno: ${result.loaded.join(', ')}.`);
  if (result.failed.length) parts.push(`Nešlo načíst: ${result.failed.join(', ')} – čekám JSON z deníku.`);
  return parts.join(' ');
}

export default function PjApp() {
  const { party, importFiles, remove, clear } = useParty();
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

  const members = sorted(party.members, order);

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

        {party.members.length === 0 ? (
          <section className="dropzone">
            <p className="dropzone__title">Družina je prázdná</p>
            <p className="note">
              Hráči v deníku klepnou na <strong>Poslat PJ</strong> a pošlou ti soubor postavy. Přetáhni soubory sem
              nebo je vyber přes <strong>Načíst postavy</strong>. Novější soubor stejné postavy ten starší nahradí.
            </p>
          </section>
        ) : (
          <>
            <h2 className="heading">Družina v boji</h2>
            <PartyTable members={members} />

            <h2 className="heading">Postavy</h2>
            <div className="cards">
              {members.map((m) => (
                <CharacterCard key={m.character.id} member={m} onRemove={() => remove(m.character.id)} />
              ))}
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
