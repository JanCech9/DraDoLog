// "O aplikaci" – about + quick guide, shared by the player's sheet and the PJ view.
// Uses the native <dialog> element: focus trap, Esc to close and the backdrop
// come from the browser, so there is no extra state beyond open/closed.
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';

export type InfoVariant = 'player' | 'pj';

export function InfoButton({ variant }: { variant: InfoVariant }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="info-btn"
        aria-label="O aplikaci a nápověda"
        title="O aplikaci a nápověda"
        onClick={() => setOpen(true)}
      >
        i
      </button>
      <InfoDialog variant={variant} open={open} onClose={() => setOpen(false)} />
    </>
  );
}

function InfoDialog({ variant, open, onClose }: { variant: InfoVariant; open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  // A click on the ::backdrop is reported as a click on the <dialog> itself.
  function onClick(e: MouseEvent<HTMLDialogElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <dialog ref={ref} className="info" aria-labelledby="info-title" onClose={onClose} onClick={onClick}>
      <div className="info__panel">
        <header className="info__header">
          <h2 id="info-title">{variant === 'pj' ? 'Pohled Pána jeskyně' : 'DraDoLog'}</h2>
          <button type="button" className="chip" onClick={onClose} autoFocus>
            Zavřít
          </button>
        </header>
        <div className="info__body">{variant === 'pj' ? <PjGuide /> : <PlayerGuide />}</div>
      </div>
    </dialog>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="info__section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function PlayerGuide() {
  return (
    <>
      <p className="info__lead">
        Digitální deník postavy pro <strong>Dračí doupě 1.6</strong> (Pravidla pro začátečníky). Je dělaný pro mobil
        u stolu: kostky házíte normálně, deník hlídá čísla – životy, magenergii, munici, peníze a zkušenosti.
      </p>

      <Section title="Rychlý start">
        <ol>
          <li>
            <strong>Postava</strong> – vyplň jméno, rasu, povolání, úroveň a hozené vlastnosti.
          </li>
          <li>
            <strong>Výbava</strong> – přidej zbraně, zbroj a věci z katalogu (nebo vlastní) a nasaď je.
          </li>
          <li>
            <strong>Boj</strong> – během hry už jen ťukáš: životy, magenergie, střelba.
          </li>
        </ol>
        <p>
          Útočné a obranné číslo, iniciativu, bonusy ani naložení nezapisuješ – deník je počítá sám z vlastností a
          výbavy.
        </p>
      </Section>

      <Section title="Záložky">
        <dl>
          <dt>Postava</dt>
          <dd>Základní údaje, vlastnosti s bonusy, zkušenosti a příběh postavy.</dd>
          <dt>Schopnosti</dt>
          <dd>Schopnosti povolání podle úrovně, šance v %, kouzla (učení a sesílání) a lučba pro alchymisty.</dd>
          <dt>Výbava</dt>
          <dd>Inventář, munice, peníze, obchod a nosnost. Peníze se počítají v měďácích a také něco váží.</dd>
          <dt>Boj</dt>
          <dd>Velké počítadlo životů, ÚČ, OČ, iniciativa, střelba s odečtem munice, magenergie a odpočinek.</dd>
        </dl>
      </Section>

      <Section title="Ťukl jsem vedle">
        <p>
          V záložce <strong>Boj</strong> dole jsou <em>Poslední změny</em>. Tlačítko{' '}
          <strong>Vrátit poslední změnu</strong> vrátí poslední zápis – životy, magenergii, zkušenosti, peníze nebo
          munici – a dá se mačkat i opakovaně. Deník si pamatuje posledních 100 změn.
        </p>
      </Section>

      <Section title="Ukládání a záloha">
        <ul>
          <li>Vše se ukládá samo, ale jen v tomto prohlížeči na tomto zařízení.</li>
          <li>
            <strong>Uložit zálohu</strong> stáhne postavu jako soubor JSON, <strong>Načíst</strong> ji z něj obnoví.
          </li>
          <li>Před výměnou telefonu nebo mazáním dat prohlížeče si zálohu udělej – jinak o postavu přijdeš.</li>
        </ul>
      </Section>

      <Section title="Poslat PJ">
        <p>
          <strong>Poslat PJ</strong> otevře sdílení telefonu (Messenger, WhatsApp, e-mail…) se souborem postavy. Kde
          sdílení nejde, soubor se jen stáhne. PJ si ho načte v <a href="./pj.html">pohledu Pána jeskyně</a>. Nic se
          neposílá samo – PJ vidí čísla z chvíle, kdy jsi soubor poslal.
        </p>
      </Section>

      <p className="note info__foot">
        Osobní projekt, pořád se na něm pracuje. Nic se neodesílá na žádný server.
      </p>
    </>
  );
}

function PjGuide() {
  return (
    <>
      <p className="info__lead">
        Přehled celé družiny pro <strong>Pána jeskyně</strong>, ideálně na notebooku za zástěnou. Jen pro čtení –
        postavy spravují hráči ve svých denících.
      </p>

      <Section title="Jak dostat postavy sem">
        <ol>
          <li>
            Hráči v deníku klepnou na <strong>Poslat PJ</strong> a pošlou ti soubor.
          </li>
          <li>
            Soubory přetáhni kamkoli na stránku, nebo je vyber přes <strong>Načíst postavy</strong> (jde jich víc
            najednou).
          </li>
          <li>Novější soubor stejné postavy nahradí ten starší – stačí ho znovu přetáhnout.</li>
        </ol>
      </Section>

      <Section title="Co tu uvidíš">
        <dl>
          <dt>Družina v boji</dt>
          <dd>
            Řádek na postavu: životy (barevně při zranění a vyřazení), ÚČ, OČ, iniciativa, střelba podle dostřelu,
            magenergie, postih a naložení. Řazení přepneš v poli <strong>Pořadí</strong>.
          </dd>
          <dt>Postavy</dt>
          <dd>
            Karta každé postavy. <strong>Podrobnosti</strong> ukážou vlastnosti, schopnosti s % (včetně postřehu pro
            tajné hody), kouzla, výbavu, příběh a poslední změny.
          </dd>
        </dl>
      </Section>

      <Section title="Data">
        <ul>
          <li>Čísla jsou z okamžiku, kdy hráč soubor poslal. Pro čerstvá si řekni o nový.</li>
          <li>Družina se ukládá v tomto prohlížeči a přežije obnovení stránky.</li>
          <li>
            <strong>Vymazat družinu</strong> smaže jen tento přehled, soubory ani deníky hráčů neovlivní.
          </li>
          <li>Nic se neodesílá na žádný server.</li>
        </ul>
      </Section>

      <p className="note info__foot">
        Deník hráče najdeš na <a href="./">hlavní stránce</a>.
      </p>
    </>
  );
}
