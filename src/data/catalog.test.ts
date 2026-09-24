import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { catalog } from './catalog'
import { NIGHTLORDS, EARTHS, structureName } from '../domain/names'

const raw = readFileSync('src/data/seeds.json', 'utf8')
const aliases = JSON.parse(readFileSync('data/raw/aliases.json', 'utf8'))

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
    for (const name of aliases.internalNightlordNames) expect(raw).not.toMatch(new RegExp(`\\b${name}\\b`, 'i'))
    expect(raw).not.toMatch(/[\u3000-\u9FFF\uFF00-\uFFEF]/)
  })
  it('offers every nightlord at least one shifting earth', () => {
    for (const n of NIGHTLORDS) expect(catalog.earthsFor(n.id).length).toBeGreaterThan(0)
    expect(EARTHS.length).toBe(6)
  })
})
