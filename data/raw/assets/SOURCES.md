# Asset sources

Everything here is fetched or copied once; the app never fetches at runtime. `npm run import` turns it into `public/`.

## markers/ (map markers, fetched 2026-09-24)

From the Fextralife Elden Ring Nightreign wiki's map legend on its Locations page (https://eldenringnightreign.wiki.fextralife.com/Locations):

- `field-boss.png` from https://static0.fextralifeimages.com/file/eldenringnightreign/2/2b/Field-boss-map-icon-nightreign-wiki-guide.png
- `evergaol.png` from https://static0.fextralifeimages.com/file/eldenringnightreign/e/e2/Evergaol-map-icon-nightreign-wiki-guide.png
- `chest.png` is the game's Buried Treasure icon, the only chest on the legend: https://static0.fextralifeimages.com/file/eldenringnightreign/d/df/Buried-treature-map-icon-nightreign-wiki-guide.png
- `merchant.png` is the game's merchant map icon: https://static0.fextralifeimages.com/file/eldenringnightreign/3/35/Merchants-and-smithing-tables-map-icon-nightreign-wiki-guide.png

The wiki has no "?" unexplored-site orb, player marker, great boss crest or caravan icon. I checked the whole file list with the wiki's `api.php?action=query&list=allimages`, about 7,700 files. So:

- `unknown.svg` (a soft gold flame-glow with a thin "?"), `player.svg` (a pale arrowhead on a dark disc in a faint bronze ring) and `caravan.svg` (a covered cart) were drawn for Bonfire Buddy.
- `public/markers/great-boss.webp` is `field-boss.png` hue-shifted to red by the import.
- `public/markers/spawn-option.webp` is `unknown.svg` hue-shifted to teal by the import, for a possible spawn point.
- `public/markers/evergaol.webp` gets a faint violet rim glow from the import, for the sealed evergaol.

## damage/ (damage and status icons)

The game's 14 icons, copied from the nightreign-cheatsheet repo (`public/icons/*.png`, commit c9eb829). That repo took them from the same wiki.

## Elsewhere

- `public/fonts/eb-garamond-latin.woff2` is EB Garamond from Google Fonts: https://fonts.gstatic.com/s/ebgaramond/v33/SlGUmQSNjdsmc35JDF1K5GR1SDk.woff2 (the latin subset of the variable font, weights 400 to 600), the closest free match to the game's Garamond.
- `public/fonts/OFL.txt` is its licence: https://raw.githubusercontent.com/google/fonts/main/ofl/ebgaramond/OFL.txt
- `nightlords/unknown.webp` is the game's hidden-Nightlord portrait (Deep of Night), from https://nightreign-seed-finder.com/Images/nightlordIcons/unknown_nightlord.webp. Fextralife, wiki.gg and Fandom carry no copy.
- `maps/`, `icons/`, `elements/`, `nightlords/`: see `scripts/fetch-raw.ts`.
