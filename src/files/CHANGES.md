# DraDoLog – rules implemented from Pravidla pro začátečníky 1.6

Drop the `src/` folder over the existing project (same paths). `App.tsx`, `main.tsx`,
`rules/money.ts` and `index.css` are unchanged and not included. Type-checks with the
project's strict `tsconfig` and builds with Vite 8. Existing saves (`version: 2`) are
migrated automatically on load/import.

## Replaced placeholders
| File | Was | Now |
|---|---|---|
| `rules/tables.ts` | "every number is a PLACEHOLDER" | Bonus table, nosnost by Sil bonus (360 + 30×bonus), naložení ×1/×2/×3/×4 → pohyblivost 1/¾/½/¼, dostřel +1/0/−1, XP + training cost per class/level, HP dice per class, magenergie tables (kouzelník/hraničář by Int, alchymista by Obr), spell count, kouzelník/alchymista success %, bojeschopnost, race & class attribute ranges, Tabulka oprav, alignment 1k10 table, rodové zbraně, tracking, sleep hours |
| `data/catalog.ts` | 15 made-up items | All 34 melee weapons (SZ / útočnost / OZ / třída / obouruční / iniciativa), 5 ranged + 10 thrown, ammo, 6 armours **sized A/B/C**, shield, 24 pieces of výstroj with book weights, 33 alchemist products (not in shop) |
| `data/spells.ts` | 2 fake spells | 27 kouzelnická + 9 hraničářská spells with magenergie (min + scaling text), past, dosah, rozsah, vyvolání, trvání, description |
| `data/abilities.ts` | 2 entries | 31 class abilities; zloděj's real % table (5 levels) with attribute multipliers |
| `data/races.ts` | wrong infravidění flags | kudůk added; size, pohyblivost, special sense (čich/infravidění/ultrasluch), postřeh bonuses |
| `rules/abilities.ts` | `sance()` guessed formula | real table lookup + n×bonus + GM override; XP/level info, HP dice, magenergie from tables, spell limit |

## Model changes (`types/character.ts`, save version 3)
- `Rasa` gains `kuduk`; `POVOLANI_LABELS.bojovnik` = "Válečník" (storage key unchanged).
- `Zbran`: `sila` (SZ) and `utocnost` (út) are now separate; `trida`, `obourucni`, `delka` added.
- `Strelna`: `sila`, `trida`, `vrhaci`, `tezkaKuse` added.
- New item kind `stit` (shield bonus to the defence roll). `MAGIC_POVOLANI` now includes hraničář.
- `KouzloTemplate`: `jmeno`, `magCostPopis`, `past`; `RecipeTemplate`: `zaklad`, `trvani`, `vyroba`, `doma`, `popis`.
- Migration: catalog items get their real numbers back; custom v2 weapons map `utocnost` → `sila`.

## New rules in `rules/derived.ts`
ÚČ = SZ + Sil bonus (+1 rodová zbraň, min 0) · OČ = KZ + Obr bonus (no armour = KZ 1, min 0) ·
OZ (−3 without a weapon) and shield (+1, blocked by a two-handed weapon) on the defence roll ·
útočnost shown as the damage modifier · mez vyřazení and the < ⅓ HP penalty · pohyblivost
(race + Obr + 2×Sil, reduced by load) · initiative modifier for the extended system (two-handed,
těžká kuše, load, válečník 5+) · postřeh na objekty/mechanismy incl. zloděj bonuses ·
class restriction warnings (`rules/restrictions.ts`).

## New actions in `state/useCharacter.ts`
`levelUp(payTraining)` rolls the class HP die + Odl (min 1), optionally pays training ·
`rest()` +2 HP and refills magenergie for meditating classes (logs sleep hours) ·
`refillMag()` sets magenergie from the class table · `brew(recipe, postih)` rolls k% against the
alchemist's chance, detects fatal failure, consumes resources either way ·
`castSpell(k, magy)` for variable-cost spells · `forgetSpell`, `setVlastnosti`, `note`.

## Screens
- **Postava**: attribute ranges for the chosen race/class next to each field, "Hodit vlastnosti
  podle pravidel", random alignment, starting HP and money, XP needed / training cost for the next
  level with a level-up button, size / pohyblivost / rodová zbraň line.
- **Boj**: ÚČ, útočnost, OČ, initiative modifier; roll formula line; wound status (mez vyřazení,
  postih, vyřazen, mrtev); dice buttons (1k6+ attack/defence, 1k10, k%, initiative) that log to the
  journal; magenergie with "set from table"; rest button; hraničář gets magenergie from level 2.
- **Schopnosti**: race trait, postřeh, class abilities with live numbers (zloděj %, stopování per
  level, léčba per level, kouzelník success %, alchymista success %), spells with full stats and
  a learn limit (kouzelník), variable magenergie input, alchemy recipes with "Vyrobit".
- **Výbava**: shop sized for the character, SZ/út/OZ/třída/obouruční fields, shield kind, class
  restriction warnings on carried and shop items, 4× nosnost ceiling and pohyblivost shown.

## Tests
`test/smoke.ts` reproduces the rulebook's worked examples (Krwell, Hrun, Sindor, Trn, Kytička, ranges,
restrictions, data integrity); `test/migrate.ts` covers the v2 → v3 migration. Run with any TS
runner, e.g. `npx tsx test/smoke.ts`.
