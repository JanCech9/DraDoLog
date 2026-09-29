# DraDoLog

A mobile-first digital character sheet for **Dračí doupě 1.6**. Built to be used at the table during a session: track HP, magenergie, ammo, money and XP with one tap, with an undo for mis-taps.

The UI is in Czech; code and comments are in English.

## Features

- **Postava** – name, race, class, level, alignment, backstory, attributes (Síla, Obratnost, Odolnost, Inteligence, Charisma) with derived bonuses, XP.
- **Schopnosti** – class abilities unlocked by level (passive, percentage-based, active with mag cost). Casters can learn and cast spells.
- **Výbava** – inventory with weapons, ranged weapons, armour and misc items; catalog of predefined items; stackable ammo; money in měďáky; carrying capacity and encumbrance level.
- **Boj** – big HP counter (±1 / ±5), útočné číslo, obranné číslo, iniciativa, ranged ÚČ per range band, shooting with automatic ammo consumption.
- **Activity log** – last 100 changes (HP, mag, XP, money, ammo) with **undo** of the latest entry.
- **Persistence** – auto-saved to `localStorage`; manual backup/restore as JSON (*Uložit zálohu* / *Načíst*).
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
- oxlint
- No backend, no runtime dependencies beyond React

## Getting started

Requires **Node.js 22.12+**.

```bash
npm install
npm run dev       # dev server
npm run build     # type-check + production build
npm run preview   # serve the build locally
npm run lint      # oxlint
```

## Project structure

```
index.html                # player's sheet
pj.html                   # PJ's party view
src/
├── App.tsx               # layout, tab navigation, import/export
├── main.tsx
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
- **Single store.** `useCharacter()` exposes all actions; every change goes through `update(draft => …)`, which works on a `structuredClone` of the state.
- **English keys, Czech labels.** Types use ASCII keys (`bojovnik`, `sil`, …); everything shown to the user comes from the `*_LABELS` maps in `types/character.ts`.
- **Money in měďáky.** Stored in the smallest coin to avoid rounding when splitting loot. Coins also count toward carried weight.
- **Versioned saves.** `Character.version` is checked on load/import; older versions are migrated in `normalizeCharacter()`, newer ones are rejected. Every character carries a stable `id` (filled in on load for older saves) – it is what the PJ view matches re-imports on, and the natural key should the party ever sync live.
- **Two pages, one rules engine.** `/pj.html` is a second Vite entry that reuses `rules/`, `data/` and `types/`; nothing about the rules is duplicated there.

## Adapting the rules

All numbers in `src/rules/tables.ts` are **placeholders**. Copy the real tables from *Pravidla DrD 1.6* there – it should be the only file you need to touch to match your group's maths. The percentage-skill formula in `rules/abilities.ts` (`sance`) is also a placeholder.

To add content, extend the arrays in `src/data/` (items, abilities, spells).

## Status

Personal project, work in progress. Alchemist recipe brewing is implemented in the store (`brew`) but not yet exposed in the UI.