# DraDoLog

A mobile-first digital character sheet for **Dračí doupě 1.6**. Built to be used at the table during a session: track HP, magenergie, ammo, money and XP with one tap, with an undo for mis-taps.

The UI is in Czech; code and comments are in English.

## Features

- **Postava** – name, race, class, level, alignment, backstory, attributes (Síla, Obratnost, Odolnost, Inteligence, Charisma) with derived bonuses, XP.
- **Schopnosti** – class abilities unlocked by level (passive, percentage-based, active with mag cost). Casters can learn and cast spells.
- **Výbava** – inventory with weapons, ranged weapons, armour and misc items; catalog of predefined items; stackable ammo; money in měďáky; carrying capacity and encumbrance level.
- **Boj** – big HP counter (±1 / ±5), útočné číslo, obranné číslo, iniciativa, ranged ÚČ per range band, shooting with automatic ammo consumption.
- **Activity log** – last 100 changes (HP, mag, XP, money, ammo, items) with **undo** of the last 10 actions of the visit (snapshot-based, so a purchase or a level-up is reverted whole).
- **Persistence** – auto-saved to `localStorage`, with persistent storage requested so the browser does not evict it; manual backup/restore as JSON (*Uložit zálohu* / *Načíst*).
- **Installable** – a PWA: *Add to Home Screen* gives a full-screen app that works offline; on iOS it also exempts the sheet from Safari's 7-day storage wipe. Fonts are self-hosted (`@fontsource`), so nothing is fetched from Google.
- **O aplikaci** – the *i* button in the top bar opens a short about + guide dialog (native `<dialog>`, `src/components/InfoDialog.tsx`); the PJ view has its own variant.
- **Sharing with the PJ** – *Poslat PJ* hands the JSON to the phone's share sheet (Messenger, WhatsApp, mail…), or downloads it where file sharing isn't supported.

## Pán jeskyně view (`/pj.html`)

A second page of the same build for the Dungeon Master, meant for a laptop behind the screen. The PJ drops the players' JSON files onto the page (or picks them with *Načíst postavy*) and gets:

- **Družina v boji** – one row per character with životy (coloured when wounded / vyřazen), ÚČ, OČ, iniciativa, ranged ÚČ per range band, magenergie, current postih and naložení. Sortable by name, initiative or HP.
- **Postavy** – a read-only card per character; *Podrobnosti* unfolds vlastnosti, abilities with their % (postřeh included, for secret rolls), known spells, inventory, backstory and the latest log entries.

The party is kept in `localStorage` (`drd-sheet:party`) so it survives a reload. Re-importing a character's file replaces the old snapshot – matched by the character's stable `id`, or by name for files exported before ids existed. Nothing is ever sent anywhere: the PJ sees the numbers as of the moment the player exported the file, and asks for a new file when he wants fresh ones.

## Tech stack

- React 19 + TypeScript
- Vite 8 (Rolldown) with React Compiler (`babel-plugin-react-compiler`)
- `vite-plugin-pwa` (manifest + Workbox service worker)
- oxlint; `test/smoke.ts` runs with `tsx`
- No backend, no runtime dependencies beyond React and the fonts

## Getting started

Requires **Node.js 22.12+**.

```bash
npm install
npm run dev       # dev server
npm run build     # type-check + production build (also emits the service worker)
npm run preview   # serve the build locally (needed to try the PWA - the dev server has no SW)
npm test          # rules smoke test
npm run lint      # oxlint
```

## Project structure

```
index.html                # player's sheet
pj.html                   # PJ's party view
src/
├── App.tsx               # layout, tab navigation, import/export
├── main.tsx              # fonts, persistent storage, mount
├── index.css
├── PjApp.tsx             # PJ view: import, sorting, table + cards
├── pj.tsx
├── pj.css
├── screens/              # one component per tab
│   ├── PostavaScreen.tsx
│   ├── SchopnostiScreen.tsx
│   ├── VybavaScreen.tsx
│   ├── BojScreen.tsx
│   └── pj/               # read-only components of the PJ view
│       ├── PartyTable.tsx
│       ├── CharacterCard.tsx
│       └── format.ts
├── state/
│   ├── useCharacter.ts   # the store: all mutations, log, undo, persistence
│   ├── characterFile.ts  # JSON file export, download and Web Share
│   ├── party.ts          # PJ's party: merge, persistence (pure functions)
│   ├── useParty.ts       # PJ's party hook
│   ├── storage.ts        # navigator.storage.persist()
│   └── defaultCharacter.ts
├── rules/
│   ├── tables.ts         # rulebook tables (bonus, nosnost, zatížení, dostřel)
│   ├── derived.ts        # every computed stat
│   ├── abilities.ts      # ability availability, % chance, can-cast
│   └── money.ts
├── data/                 # static content: item catalog, abilities, spells
└── types/
    └── character.ts      # domain model + Czech UI labels
```

## Design notes

- **Nothing derived is stored.** The character holds only base values; ÚČ, OČ, iniciativa, bonuses, encumbrance etc. are computed in `rules/derived.ts` on every render, so edits can't leave the sheet out of sync.
- **Single store.** `useCharacter()` exposes all actions. Field edits go through `update(draft => …)`, undoable actions through `act(draft => …)`; both work on a `structuredClone` of the state. `act` keeps the previous state so undo is a plain restore; `update` replays the edit onto those snapshots so an undo never loses an edit made afterwards.
- **English keys, Czech labels.** Types use ASCII keys (`bojovnik`, `sil`, …); everything shown to the user comes from the `*_LABELS` maps in `types/character.ts`.
- **Money in měďáky.** Stored in the smallest coin to avoid rounding when splitting loot. Coins also count toward carried weight.
- **Versioned saves.** `Character.version` is checked on load/import; older versions are migrated in `normalizeCharacter()`, newer ones are rejected. Every character carries a stable `id` (filled in on load for older saves) – it is what the PJ view matches re-imports on, and the natural key should the party ever sync live.
- **Two pages, one rules engine.** `/pj.html` is a second Vite entry that reuses `rules/`, `data/` and `types/`; nothing about the rules is duplicated there.

## Adapting the rules

All numbers in `src/rules/tables.ts` are **placeholders**. Copy the real tables from *Pravidla DrD 1.6* there – it should be the only file you need to touch to match your group's maths. The percentage-skill formula in `rules/abilities.ts` (`sance`) is also a placeholder.

To add content, extend the arrays in `src/data/` (items, abilities, spells).

## Status

Personal project, work in progress. Alchemist recipe brewing is implemented in the store (`brew`) but not yet exposed in the UI.