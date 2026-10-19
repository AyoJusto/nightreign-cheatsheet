import { describe, expect, it } from 'vitest'
import { Scouting, ImpossibleSighting } from './scouting'
import type { Seed } from './seed'
import { catalog } from '../data/catalog'

const seed = (id: string, spawn: string, slots: Record<string, string | null>): Seed => ({
  id, nightlord: 'tricephalos', earth: 'default', event: null, spawn, slots, inside: {},
  nights: { 1: { boss: 'A', circle: null }, 2: { boss: 'B', circle: null } },
  castle: null, oldGaol: false, markers: [],
})

const pool = [
  seed('000', '19', { '1': 'fort', '2': 'great-church:fire', '3': null }),
  seed('001', '19', { '1': 'fort', '2': 'ruins:poison', '3': 'church' }),
  seed('002', '7', { '1': 'church', '2': 'great-church:fire', '3': 'church' }),
]

describe('Scouting', () => {
  it('starts with every seed of the pool as a candidate', () => {
    expect(Scouting.start(pool).candidates().map((s) => s.id)).toEqual(['000', '001', '002'])
  })

  it('narrows candidates with a structure sighting', () => {
    const s = Scouting.start(pool).sight({ type: 'structure', slot: '2', structure: 'great-church:fire' })
    expect(s.candidates().map((c) => c.id)).toEqual(['000', '002'])
  })

  it('narrows candidates with a spawn sighting', () => {
    const s = Scouting.start(pool).sight({ type: 'spawn', slot: '7' })
    expect(s.identifiedSeed()?.id).toBe('002')
  })

  it('treats "nothing here" as a real sighting', () => {
    const s = Scouting.start(pool).sight({ type: 'nothing', slot: '3' })
    expect(s.identifiedSeed()?.id).toBe('000')
  })

  // A crafted ?s= such as 999@none must not count as "nothing" at a site this map does not have (final m3).
  it('rejects a sighting at a slot the map does not have', () => {
    expect(() => Scouting.start(pool).sight({ type: 'nothing', slot: '999' })).toThrow(ImpossibleSighting)
  })

  it('rejects a sighting that no candidate matches', () => {
    const s = Scouting.start(pool).sight({ type: 'spawn', slot: '7' })
    expect(() => s.sight({ type: 'structure', slot: '1', structure: 'fort' })).toThrow(ImpossibleSighting)
  })

  it('replaces an earlier sighting at the same slot instead of stacking', () => {
    const s = Scouting.start(pool)
      .sight({ type: 'structure', slot: '1', structure: 'fort' })
      .sight({ type: 'structure', slot: '1', structure: 'church' })
    expect(s.sightings).toHaveLength(1)
    expect(s.identifiedSeed()?.id).toBe('002')
  })

  it('lists possibilities at a slot with how many seeds each leaves, ignoring that slot\'s own sighting', () => {
    const s = Scouting.start(pool).sight({ type: 'structure', slot: '3', structure: 'church' })
    expect(s.possibilitiesAt('3')).toEqual([
      { option: 'church', remaining: 2 },
      { option: 'nothing', remaining: 1 },
    ])
    expect(s.possibilitiesAt('2')).toEqual([
      { option: 'great-church:fire', remaining: 1 },
      { option: 'ruins:poison', remaining: 1 },
    ])
  })

  it('offers spawn options with counts', () => {
    expect(Scouting.start(pool).spawnOptions()).toEqual([
      { slot: '19', remaining: 2 },
      { slot: '7', remaining: 1 },
    ])
  })

  it('reveals slots every candidate agrees on', () => {
    const s = Scouting.start(pool).sight({ type: 'spawn', slot: '19' })
    expect(s.certainSlots()).toEqual(new Map([['1', 'fort']]))
  })

  it('reveals every unsighted slot once a single candidate remains', () => {
    const s = Scouting.start(pool).sight({ type: 'spawn', slot: '7' })
    expect(s.identifiedSeed()?.id).toBe('002')
    expect(s.certainSlots()).toEqual(new Map([
      ['1', 'church'],
      ['2', 'great-church:fire'],
      ['3', 'church'],
    ]))
    // A slot already sighted is excluded, not re-reported as certain.
    const withSighting = s.sight({ type: 'structure', slot: '1', structure: 'church' })
    expect(withSighting.certainSlots()).toEqual(new Map([
      ['2', 'great-church:fire'],
      ['3', 'church'],
    ]))
  })

  it('lists structures still in play with the unsighted slots that could hold them', () => {
    const s = Scouting.start(pool).sight({ type: 'structure', slot: '1', structure: 'fort' })
    expect(s.structuresInPlay()).toContainEqual({ structure: 'great-church:fire', slots: ['2'] })
    expect(s.structuresInPlay().some((p) => p.slots.includes('1'))).toBe(false)
  })

  it('retracting a sighting widens the candidates again', () => {
    const s = Scouting.start(pool).sight({ type: 'spawn', slot: '7' }).retract('spawn')
    expect(s.candidates()).toHaveLength(3)
  })

  it('identifies every real seed by sighting its spawn and then its slots', () => {
    for (const target of catalog.all) {
      let s = Scouting.start(catalog.seedsFor(target.nightlord, target.earth)).sight({ type: 'spawn', slot: target.spawn })
      for (const [slot, key] of Object.entries(target.slots)) {
        if (s.identifiedSeed()) break
        s = s.sight(key ? { type: 'structure', slot, structure: key } : { type: 'nothing', slot })
      }
      expect(s.identifiedSeed()?.id, `seed ${target.id}`).toBe(target.id)
    }
  })
})
