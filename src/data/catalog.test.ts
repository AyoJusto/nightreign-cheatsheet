import { readFileSync, readdirSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { catalog } from './catalog'
import { NIGHTLORDS, EARTHS, DAMAGE_NAMES, structureName } from '../domain/names'

const raw = readFileSync('src/data/seeds.json', 'utf8')
const aliases = JSON.parse(readFileSync('data/raw/aliases.json', 'utf8'))

// Text source only: a binary asset (an image, a font) never carries readable text, and reading one as
// text risks a false CJK-range hit on bytes that just happen to land there. seeds.json is read above.
const TEXT_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.css', '.json', '.html'])
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) return walk(full)
    return TEXT_EXT.has(extname(entry.name)) ? [full] : []
  })
// seeds.json is read (and checked) separately as `raw`, by its posix-style path either way join gives it.
const srcFiles = walk('src').filter((f) => f.split(/[\\/]/).join('/') !== 'src/data/seeds.json')

describe('seed data', () => {
  it('holds all 520 seeds', () => {
    expect(catalog.all.length).toBe(520)
  })
  it('gives every structure a display name and every used slot coordinates', () => {
    for (const seed of catalog.all) {
      const coords = catalog.slotsOf(seed.earth)
      expect(coords[seed.spawn], `seed ${seed.id} spawn`).toBeDefined()
      for (const [slot, key] of Object.entries(seed.slots)) {
        if (key) {
          expect(() => structureName(key)).not.toThrow()
          expect(coords[slot], `seed ${seed.id} slot ${slot}`).toBeDefined()
        }
      }
    }
  })
  it("marks where an event stands, with its day, and nowhere for one that follows the players", () => {
    const events = (id: string) => catalog.all.find((s) => s.id === id)!.markers.filter((m) => m.layer === 'event')
    expect(events('242').map((m) => m.label)).toEqual(['Meteor Strike · Day 1'])
    expect(events('128').map((m) => m.label)).toEqual(['Mausoleum'])
    expect(events('252')).toEqual([]) // an Augur Raid, which the source slips an '@event' slot onto
  })
  it('lets every seed be identified from its full layout and spawn', () => {
    const seen = new Map<string, string>()
    for (const seed of catalog.all) {
      const fingerprint = JSON.stringify([seed.nightlord, seed.earth, seed.spawn, seed.slots])
      expect(seen.get(fingerprint), `seed ${seed.id} duplicates ${seen.get(fingerprint)}`).toBeUndefined()
      seen.set(fingerprint, seed.id)
    }
  })
  it('never contains internal nightlord names or non-English text', () => {
    const sources: [string, string][] = [
      ['src/data/seeds.json', raw],
      ...srcFiles.map((f): [string, string] => [f, readFileSync(f, 'utf8')]),
    ]
    for (const [file, text] of sources) {
      for (const name of aliases.internalNightlordNames) expect(text, `${file}: ${name}`).not.toMatch(new RegExp(`\\b${name}\\b`, 'i'))
      expect(text, file).not.toMatch(/[\u3000-\u9FFF\uFF00-\uFFEF]/)
    }
  })
  it('knows where the castle is on every map a castle crew holds', () => {
    for (const seed of catalog.all) {
      if (!seed.castle) continue
      const at = catalog.castleOf(seed.earth)
      expect(at, `seed ${seed.id}`).toBeDefined()
      for (const point of [at!.crew, at!.rooftop, at!.basement]) {
        expect(point.x).toBeGreaterThan(0)
        expect(point.y).toBeGreaterThan(0)
      }
    }
    expect(catalog.castleOf('great-hollow')).toBeUndefined()
  })
  it("says what is inside the sites of every Limveld seed, and only on built slots or open-ground caravans", () => {
    for (const seed of catalog.all) {
      const labels = Object.entries(seed.inside)
      if (seed.earth !== 'great-hollow') expect(labels.length, `seed ${seed.id}`).toBeGreaterThan(0)
      for (const [slot, label] of labels) {
        expect(seed.slots[slot] !== null || label === 'Caravans', `seed ${seed.id} slot ${slot} ${label}`).toBe(true)
      }
    }
  })
  it('knows every Nightlord weakness, and every night boss weakness the data has', () => {
    for (const n of NIGHTLORDS) expect(catalog.nightlordWeakness(n.id).weak.length, n.id).toBeGreaterThan(0)
    const missing = new Set<string>()
    for (const seed of catalog.all) {
      for (const night of [1, 2] as const) if (!catalog.nightBossWeakness(seed.nights[night].boss)) missing.add(seed.nights[night].boss)
    }
    expect([...missing]).toEqual(['Artorias'])
  })
  it('offers every nightlord at least one shifting earth', () => {
    for (const n of NIGHTLORDS) expect(catalog.earthsFor(n.id).length).toBeGreaterThan(0)
    expect(EARTHS.length).toBe(6)
  })
})

describe('game art for the new look', () => {
  const size = (file: string) => statSync(`public/${file}`).size
  it('has an icon for every damage type and status the weaknesses name', () => {
    for (const key of Object.keys(DAMAGE_NAMES)) expect(size(`damage/${key}.webp`), key).toBeLessThan(30_000)
  })
  it('has every map marker, each within the 30 KB budget', () => {
    for (const name of ['unknown', 'spawn-option', 'player', 'field-boss', 'great-boss', 'evergaol', 'chest', 'merchant', 'caravan']) {
      expect(size(`markers/${name}.webp`), name).toBeLessThan(30_000)
    }
  })
  it('has a map thumbnail for every earth, each within 25 KB', () => {
    for (const earth of EARTHS) expect(size(`maps/thumb/${earth.id}.webp`), earth.id).toBeLessThanOrEqual(25_000)
  })
  it('self-hosts EB Garamond within 60 KB, with its licence', () => {
    expect(size('fonts/eb-garamond-latin.woff2')).toBeLessThan(60_000)
    expect(readFileSync('public/fonts/OFL.txt', 'utf8')).toMatch(/SIL Open Font License/)
  })
})

describe('islands', () => {
  it("frames each earth's whole island, every site on it", () => {
    for (const { id } of EARTHS) {
      const island = catalog.islandOf(id)
      for (const slot of Object.values(catalog.slotsOf(id))) {
        expect(slot.x, id).toBeGreaterThan(island.x0)
        expect(slot.x, id).toBeLessThan(island.x1)
        expect(slot.y, id).toBeGreaterThan(island.y0)
        expect(slot.y, id).toBeLessThan(island.y1)
      }
      expect(island.x0, id).toBeGreaterThanOrEqual(0)
      expect(island.x1, id).toBeLessThanOrEqual(1000)
    }
  })
})

describe('boss crests', () => {
  it("marks the bosses the game draws with its red great crest, and only those", () => {
    const seed = catalog.all.find((s) => s.id === '1003')!
    const great = (name: string) => seed.markers.find((m) => m.layer === 'boss' && m.label === name)?.great === true
    // Seed 1003 as the game draws it (docs/specs/screens/compare/ref-desktop-result.png).
    for (const name of ['Black Blade Kindred', 'Draconic Tree Sentinel', 'Ancestor Spirit', 'Magma Wyrm']) expect(great(name), name).toBe(true)
    for (const name of ['Royal Revenant', 'Ancient Hero of Zamor', 'Elder Lion', "Night's Cavalry"]) expect(great(name), name).toBe(false)
    expect(catalog.all.every((s) => s.markers.every((m) => m.great === undefined || m.layer === 'boss'))).toBe(true)
  })
  it('places the field boss south-west of the lake on the seeds whose sheet spells that spot without "Far"', () => {
    // The DLC sheet (seeds 1000 on) writes "Southwest of Lake" for the spot the base sheet calls "Far Southwest of Lake".
    const seed = catalog.all.find((s) => s.id === '1003')!
    expect(seed.markers).toContainEqual({ layer: 'boss', x: 309, y: 823, label: 'Grafted Scion' })
  })
})
