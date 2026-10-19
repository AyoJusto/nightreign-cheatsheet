# Curated Nightlord and night boss numbers

These files came from the original Nightreign cheat sheet (commit c9eb829, 2026-08-31) and are now edited here.

`data/nightlords.ts` holds the 10 Nightlords: per-form negation and status numbers, plus `listed`, the weakness the game and the guides name. The numbers came from an upstream Nightlord dataset and were corrected by hand.

`data/nightbosses.ts` holds the 35 Night 1 and Night 2 fights, transcribed from the Fextralife Elden Ring Nightreign wiki's per-boss pages. On 2026-10-19 every form was compared with the game-data export in `../enemies/`. Five numbers were changed to the game's own values, and Knight Artorias got its numbers from the export. The reasons are in `../enemy-rulings.md`.

`types.ts` is the shape these two files are written in. `scripts/import-enemies.ts` reads them into `src/data/enemies.json`; run `npm run import` after editing.
