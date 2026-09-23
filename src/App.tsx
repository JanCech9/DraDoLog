import { useRef, useState } from 'react';
import { useCharacter } from './state/useCharacter';
import { PostavaScreen } from './screens/PostavaScreen';
import { SchopnostiScreen } from './screens/SchopnostiScreen';
import { VybavaScreen } from './screens/VybavaScreen';
import { BojScreen } from './screens/BojScreen';

type Tab = 'postava' | 'schopnosti' | 'vybava' | 'boj';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'postava', label: 'Postava' },
  { id: 'schopnosti', label: 'Schopnosti' },
  { id: 'vybava', label: 'Výbava' },
  { id: 'boj', label: 'Boj' },
];

export default function App() {
  const store = useCharacter();
  const [tab, setTab] = useState<Tab>('boj');
  const fileInput = useRef<HTMLInputElement>(null);

  async function onImport(file: File | undefined) {
    if (!file) return;
    try {
      await store.importJson(file);
    } catch {
      alert('Soubor se nepodařilo načíst. Čekám JSON vyexportovaný z tohoto deníku.');
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>{store.character.identity.name || 'Deník dobrodruha'}</h1>
        <div className="topbar__actions">
          <button type="button" className="chip chip--quiet" onClick={store.exportJson}>
            Uložit zálohu
          </button>
          <button type="button" className="chip chip--quiet" onClick={() => fileInput.current?.click()}>
            Načíst
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json"
            hidden
            onChange={(e) => {
              void onImport(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
        </div>
      </header>

      <main>
        {tab === 'postava' && <PostavaScreen store={store} />}
        {tab === 'schopnosti' && <SchopnostiScreen store={store} />}
        {tab === 'vybava' && <VybavaScreen store={store} />}
        {tab === 'boj' && <BojScreen store={store} />}
      </main>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={tab === t.id ? 'tabs__tab tabs__tab--active' : 'tabs__tab'}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}