# Where the enemy data comes from

Both JSON files here are byte-for-byte copies of community exports, fetched 2026-10-19. Do not edit them; copy them again if upstream changes.

- `bosses.json` is `data/nightreign-bosses-v1.03.5.json` from sganggs/nightreign-relic-checker (https://github.com/sganggs/nightreign-relic-checker), commit 6fe8267682149568058649b5f25a1481ac06384e, git blob 92666e791bbff9e7ae40c031f73e04a4d38df52c. The repository is GPL-3.0. The file says it was generated 2026-09-23 from game version 1.03.5 plus DLC1 (regulation 10350000), read out of the game's NpcParam and related param tables. Enemies are in `nightBosses[]`; each `variants[]` entry has `damageRates` multipliers and `resist` buildup thresholds.
- `npcs.json` is `data/curated/npcs.json` from zestones/Evil-Nightreign (https://github.com/zestones/Evil-Nightreign), commit cbf78195cf6c38c760d04d2ed40b882b0aaf2c87, git blob 620d8740c6b176384bcb9a18b4f959644d431573. That repository declares no licence. Its keys are `damage_multiplier` (phys, slash, blow for strike, thrust for pierce, magic, fire, lightning, holy) and `status_resistance`.

Both exports store damage as a multiplier on damage taken. We show negation as a percentage: negation = round((1 − multiplier) × 100), so a multiplier of 1.2 becomes −20 (takes more damage) and 0.65 becomes 35. A status resistance of 999 means immune.

A few camp and evergaol enemies are in neither export. For those, `data/raw/enemy-sources.json` carries the numbers inline, copied on 2026-10-19 from these Fextralife Elden Ring Nightreign wiki pages (first threshold of each status series):

- https://eldenringnightreign.wiki.fextralife.com/Albinauric+Archers (the archer only; the wolf comes from `npcs.json`)
- https://eldenringnightreign.wiki.fextralife.com/Perfumer
- https://eldenringnightreign.wiki.fextralife.com/Royal+Army+Knights

These pages were also read to settle the night boss disagreements in `data/raw/enemy-rulings.md`: Bell+Bearing+Hunter, Death+Rite+Bird, Death+Knight, Lord+of+Blood, Tree+Sentinel and Nameless+King. Beastly+Brigade was read to confirm which Misbegotten make up that group.
