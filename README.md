# Nightreign

A companion for Elden Ring: Nightreign. Find your seed mid-run, see its whole map, and tap any boss on it to see what it is weak to. Nightlords, every boss, relic and weapon effects, and character builds are one search away.

## Running it

```bash
npm install
npm run dev
```

```bash
npx tsc -b         # types
npm test           # unit tests
npm run e2e        # browser tests at phone and desktop size; builds and serves the site itself
npm run import     # rebuild src/data from data/raw after editing a source
```

## How it is laid out

The code is split by what it is about. `src/domain` holds seeds and scouting: the sightings that narrow a run down to one seed. `src/bestiary` holds enemies, their negation and status numbers, and how a fight is assessed. `src/loadout` holds relic and weapon effects and builds. `src/ui` is the React app on top of them.

`data/raw` is where every number comes from, with a note on each source. The seed maps come from the community seed projects, the enemy numbers from game-data exports checked against the Fextralife wiki, and the effects and builds from the community spreadsheet. `npm run import` turns them into `src/data`, and the tests fail if a name on any seed has no enemy behind it.

It deploys to GitHub Pages from `main`.
