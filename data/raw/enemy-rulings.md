# Night boss rulings: cheat sheet vs game-data export

Every form of the 35 night bosses in `legacy/src/data/nightbosses.ts` (40 seed spellings map onto them through `aliases.json`) was compared, all 14 numbers, with the row of `enemies/bosses.json` that matches the fight. That is the "Night Boss" variant where one exists, otherwise the entry's base row. The Leyndell Knight forms were compared with `enemies/npcs.json` because `bosses.json` has no row for them. Negation is shown as a percentage, where negative means the boss takes more damage.

The export is read from the game's own param tables, so it wins. The exception is when Fextralife agrees with the cheat sheet and the export row may not be the right enemy.

| Boss, form | Stat | Cheat sheet | Export | Fextralife | Use | Why |
|---|---|---|---|---|---|---|
| Bell Bearing Hunter | pierce | −10 | 10 | −10 | 10 | All five export rows (field, castle basement, night, two base) say 10 and every other number matches, so the row is right and the wiki's sign is the error the cheat sheet copied. |
| Death Rite Bird | rot | 253 | 252 | 253 | 252 | 253 appears nowhere in the export, whose thresholds are 20, 63, 84, 112, 154, 231, 252, 308 and 542, and all eight Death Rite Bird rows say 252. |
| Death Knight | sleep | Immune | 252 | Immune | 252 | The night boss (Longhaft Axe), Blacksmith boss (Twinaxes) and base rows all say 252 and every other number matches, so the export row is right. |
| Lord of Blood | bleed | 154 | 112 | 154 | 112 | Both export rows (night boss and base) say 112 and the other 13 numbers match exactly, so this is a transcription difference on the wiki, not a wrong row. This one was not on the known list. |
| Tree Sentinel & Royal Cavalrymen, Leyndell Knight | sleep | 112 | Immune | 112 | 112 (low confidence) | The only export row is the generic `Leyndell Knight` NPC (43530190) in `npcs.json`, not a night boss cavalry row, so the match is uncertain and the wiki backs the cheat sheet; revisit if a cavalry row turns up. |
| Draconic Tree Sentinel & Royal Cavalrymen, Leyndell Knight | sleep | 112 | Immune | 112 | 112 (low confidence) | Same form and same row as above. |

These looked like disagreements but are not. Each matches its own export row exactly once the right row is used:

- Centipede Demon, Centipede Grub (severed tail). The export lists the grub as a separate entry, `Centipede Grub` (chrs 7711/7712), at bleed 154, frost 154, rot 252, poison 252. That matches the cheat sheet. Comparing the grub with the `Centipede Demon` entry (bleed 252, frost 252) is what shows a false mismatch.
- Demi-Human Queen & Swordmaster, swordmaster form. `Demi-Human Swordmaster` Night Boss (58100910) matches all 14 numbers, slash −20 included. The false mismatch comes from comparing it with the `Demi-Human Queen` entry, whose slash is −10.
- Nameless King, phase 1. The export files the dragon phase as a separate entry, `Storm King`, which matches the cheat sheet exactly (lightning −31, frost 154, poison 252), and so does Fextralife. The export's `Nameless King` entry is phase 2 only, and the cheat sheet matches that too.
- Draconic Tree Sentinel and Tree Sentinel, sentinel forms. Both match their Night Boss rows exactly.

Two forms have no export row:

- Leyndell Knight's horse, in both cavalry fights. Neither export has a row for it. Fextralife agrees with the cheat sheet on every number (slash −10, lightning 20, holy 20, all statuses 112, madness immune). Keep the cheat sheet values.
- Knight Artorias. The cheat sheet has no data on purpose, because its Fextralife page copied another boss's blocks. The export has its own rows: `Knight Artorias` Night Boss (77200010) and base (77200000) agree with each other and differ from the Night Aspect expedition's numbers. Use the export: negation standard 0, slash 10, strike −10, pierce 0, magic 15, fire 10, lightning −10, holy −10; bleed, frost, rot and poison 542; sleep and madness immune. `enemy-sources.json` points Artorias at this export row.

The other 28 night bosses matched the export on every form and every number.
