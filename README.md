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
src/
├── App.tsx               # layout, tab navigation, import/export
├── main.tsx
├── index.css
├── screens/              # one component per tab
│   ├── PostavaScreen.tsx
│   ├── SchopnostiScreen.tsx
│   ├── VybavaScreen.tsx
│   └── BojScreen.tsx
├── state/
│   ├── useCharacter.ts   # the store: all mutations, log, undo, persistence
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
- **Versioned saves.** `Character.version` is checked on load/import; older versions are migrated in `normalize()`, newer ones are rejected.

## Adapting the rules

All numbers in `src/rules/tables.ts` are **placeholders**. Copy the real tables from *Pravidla DrD 1.6* there – it should be the only file you need to touch to match your group's maths. The percentage-skill formula in `rules/abilities.ts` (`sance`) is also a placeholder.

To add content, extend the arrays in `src/data/` (items, abilities, spells).

## Status

Personal project, work in progress. Alchemist recipe brewing is implemented in the store (`brew`) but not yet exposed in the UI.