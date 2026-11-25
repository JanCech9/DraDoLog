// Kronika družiny - shared by the player's sheet (a tab) and the PJ view (a
// section). Entries save as they are typed, like the rest of the sheet; there
// is no draft to lose. Sharing is a file: Poslat kroniku / Načíst kroniku.
import { useId, useRef, useState } from 'react';
import type { ChronicleStore } from '../state/useChronicle';
import {
  formatDay,
  isBlank,
  knownNames,
  visibleEntries,
  type ChronicleEntry,
  type EntryPatch,
} from '../state/chronicle';

interface Props {
  store: ChronicleStore;
  /** Pre-filled as the kronikář of a new entry - the sheet passes the character's name. */
  defaultAuthor?: string;
}

export function KronikaScreen({ store, defaultAuthor = '' }: Props) {
  const { chronicle, notice, setNotice, add, update, remove, importFile, share } = store;
  const entries = visibleEntries(chronicle);
  const names = knownNames(chronicle);
  const namesId = useId();
  const fileInput = useRef<HTMLInputElement>(null);

  // The latest session is open for reading; the rest unfold on a tap.
  const [openId, setOpenId] = useState<string | undefined>(() => entries[0]?.id);
  const [editingId, setEditingId] = useState<string>();

  /** Leave the form; an entry that was never filled in is thrown away. */
  function finishEditing() {
    const entry = entries.find((e) => e.id === editingId);
    if (entry && isBlank(entry)) remove(entry.id);
    setEditingId(undefined);
  }

  function startNew() {
    // An abandoned empty entry is reused rather than piling up another one.
    const blank = entries.find(isBlank);
    if (editingId && editingId !== blank?.id) finishEditing();
    const id = blank?.id ?? add({ author: defaultAuthor.trim() });
    setOpenId(id);
    setEditingId(id);
  }

  function startEditing(id: string) {
    if (editingId && editingId !== id) finishEditing();
    setEditingId(id);
  }

  function onDelete(entry: ChronicleEntry) {
    const name = entry.title.trim() ? `zápis „${entry.title.trim()}“` : 'tento zápis';
    if (!confirm(`Smazat ${name}? Až kroniku pošleš ostatním, zmizí i jim.`)) return;
    remove(entry.id);
    setEditingId(undefined);
  }

  async function onImport(file: File | undefined) {
    if (!file) return;
    if (!(await importFile(file))) {
      setNotice('Soubor se nepodařilo načíst. Čekám kronika.json poslaný z DraDoLogu.');
    }
  }

  return (
    <section className="kronika">
      <div className="kronika__bar">
        <h2 className="heading">Kronika družiny</h2>
        <div className="kronika__actions">
          <button type="button" className="chip chip--on" onClick={startNew}>
            Nový zápis
          </button>
          <button type="button" className="chip chip--quiet" onClick={() => void share()} disabled={!entries.length}>
            Poslat kroniku
          </button>
          <button type="button" className="chip chip--quiet" onClick={() => fileInput.current?.click()}>
            Načíst kroniku
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              void onImport(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
      </div>

      {notice && (
        <p className="note status" role="status">
          {notice}
        </p>
      )}

      {entries.length === 0 ? (
        <p className="note">
          Kronika je zatím prázdná. Po sezení sem zapiš, co se stalo, a přes <strong>Poslat kroniku</strong> ji předej
          ostatním. Kdo ji načte, tomu se zápisy sloučí s jeho vlastními – nic se nepřepíše.
        </p>
      ) : (
        <ol className="kronika__list">
          {entries.map((entry) => (
            <li key={entry.id} className="zapis">
              {entry.id === editingId ? (
                <EntryForm
                  entry={entry}
                  namesId={namesId}
                  onChange={(patch) => update(entry.id, patch)}
                  onDone={finishEditing}
                  onDelete={() => onDelete(entry)}
                />
              ) : (
                <EntryView
                  entry={entry}
                  open={entry.id === openId}
                  onToggle={() => setOpenId(entry.id === openId ? undefined : entry.id)}
                  onEdit={() => startEditing(entry.id)}
                />
              )}
            </li>
          ))}
        </ol>
      )}

      <datalist id={namesId}>
        {names.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      {entries.length > 0 && (
        <p className="note">
          Zápisy se ukládají samy, ale jen v tomto zařízení. <strong>Poslat kroniku</strong> ji předá ostatním; načtením
          cizí kroniky se zápisy sloučí a u stejného zápisu vyhraje novější úprava.
        </p>
      )}
    </section>
  );
}

function EntryView({
  entry,
  open,
  onToggle,
  onEdit,
}: {
  entry: ChronicleEntry;
  open: boolean;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const meta = [entry.pj.trim() && `PJ: ${entry.pj.trim()}`, entry.author.trim() && `kronikář: ${entry.author.trim()}`]
    .filter(Boolean)
    .join(' · ');

  return (
    <article>
      <button type="button" className="zapis__head" aria-expanded={open} onClick={onToggle}>
        <span className="zapis__date">{formatDay(entry.date)}</span>
        <span className="zapis__title">{entry.title.trim() || 'Bez názvu'}</span>
      </button>
      {open && (
        <div className="zapis__body">
          {meta && <p className="note">{meta}</p>}
          {entry.text.trim() ? (
            <p className="zapis__text">{entry.text}</p>
          ) : (
            <p className="note">Zápis zatím nemá text.</p>
          )}
          <div className="zapis__actions">
            <button type="button" className="chip" onClick={onEdit}>
              Upravit
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function EntryForm({
  entry,
  namesId,
  onChange,
  onDone,
  onDelete,
}: {
  entry: ChronicleEntry;
  namesId: string;
  onChange: (patch: EntryPatch) => void;
  onDone: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="zapis__form">
      <label className="field field--wide">
        <span>Název</span>
        <input
          value={entry.title}
          placeholder="Třeba: Noc v Mlžném hvozdu"
          // A fresh entry starts with the cursor in the title.
          autoFocus={isBlank(entry)}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </label>
      <label className="field zapis__date-field">
        <span>Datum sezení</span>
        <input
          type="date"
          value={entry.date}
          // Clearing the picker would leave an entry without a day; keep the old one.
          onChange={(e) => e.target.value && onChange({ date: e.target.value })}
        />
      </label>
      <div className="field-row">
        <label className="field">
          <span>PJ sezení</span>
          <input
            value={entry.pj}
            list={namesId}
            placeholder="Kdo vedl hru"
            onChange={(e) => onChange({ pj: e.target.value })}
          />
        </label>
        <label className="field">
          <span>Kronikář</span>
          <input
            value={entry.author}
            list={namesId}
            placeholder="Kdo zapsal"
            onChange={(e) => onChange({ author: e.target.value })}
          />
        </label>
      </div>
      <label className="field field--wide">
        <span>Co se stalo</span>
        <textarea
          className="story"
          rows={12}
          value={entry.text}
          placeholder="Kam družina došla, koho potkala, co ukořistila, kdo co provedl…"
          onChange={(e) => onChange({ text: e.target.value })}
        />
      </label>
      <div className="zapis__actions">
        <button type="button" className="chip chip--on" onClick={onDone}>
          Hotovo
        </button>
        <button type="button" className="chip chip--quiet" onClick={onDelete}>
          Smazat zápis
        </button>
      </div>
    </div>
  );
}
