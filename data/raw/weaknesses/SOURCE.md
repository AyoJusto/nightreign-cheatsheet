# Where the weakness data comes from

Verbatim copies from the Nightreign cheat sheet repo (`nightreign-cheatsheet`, commit c9eb829, 2026-08-31), laid
out as in its `src/` so the relative imports still resolve:

- `data/nightlords.ts` is the 10 Nightlords: per-form negation and status numbers plus `listed`, the headline weakness the game and guides name. The cheat sheet took these from an upstream Nightlord dataset (its notes do not name it) and corrected them by hand.
- `data/nightbosses.ts` is the 35 Night 1 / Night 2 bosses, transcribed from the Fextralife Elden Ring Nightreign wiki's per-boss pages (see the file header). Knight Artorias has no data on purpose.
- `summary.ts` holds the cheat sheet's worst-case rules (`summarize`). `scripts/import-seeds.ts` uses it as is.
- `types.ts` has the types the three files above share.

The damage and status icons in `data/raw/assets/damage/` are the cheat sheet's `public/icons/*.png`, the game's own icons as shown on the same wiki.

Do not edit these copies. If the numbers change, copy the files again and re-run `npm run import`.
