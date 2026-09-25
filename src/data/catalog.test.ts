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
    for (const name of ['unknown', 'player', 'field-boss', 'great-boss', 'evergaol', 'chest', 'merchant']) {
      expect(size(`markers/${name}.webp`), name).toBeLessThan(30_000)
    }
  })
  it('has a map thumbnail for every earth, each within 25 KB', () => {
    for (const earth of EARTHS) expect(size(`maps/thumb/${earth.id}.webp`), earth.id).toBeLessThanOrEqual(25_000)
  })
  it('self-hosts Cinzel within 60 KB, with its licence', () => {
    expect(size('fonts/cinzel-latin.woff2')).toBeLessThan(60_000)
    expect(readFileSync('public/fonts/OFL.txt', 'utf8')).toMatch(/SIL Open Font License/)
  })
})
