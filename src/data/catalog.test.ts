import { readFileSync, readdirSync } from 'node:fs'
import { extname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { catalog } from './catalog'
import { NIGHTLORDS, EARTHS, structureName } from '../domain/names'

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
  it('has fight notes for every night and castle boss', () => {
    for (const seed of catalog.all) {
      const bosses = [seed.nights[1].boss, seed.nights[2].boss, seed.castle?.basement, seed.castle?.rooftop]
      for (const boss of bosses) if (boss) expect(catalog.bossNotes(boss), `seed ${seed.id} ${boss}`).toBeTruthy()
    }
  })
  it('offers every nightlord at least one shifting earth', () => {
    for (const n of NIGHTLORDS) expect(catalog.earthsFor(n.id).length).toBeGreaterThan(0)
    expect(EARTHS.length).toBe(6)
  })
})
