import { describe, expect, it } from 'vitest'
import { resultMap, type Layer } from './resultMap'
import { catalog } from '../data/catalog'

// Seed 008 has a Church at its spawn, a castle and a caravan; seed 000 has a Sorcerer's Rise with a clue inside.
const seed = catalog.seed('008')!
const all = new Set<Layer>(['structures', 'spawn', 'circle', 'boss', 'evergaol', 'chest', 'merchant', 'rot-blessing'])
const without = (...off: Layer[]) => new Set([...all].filter((l) => !off.includes(l)))

describe('the result map', () => {
  it('puts the player at the spawn, carrying the Church built there, and every other site as sighted art', () => {
    const { pins } = resultMap(seed, all)
    expect(pins.find((p) => p.state === 'spawn')).toMatchObject({ slot: seed.spawn, structure: 'church' })
    const built = Object.entries(seed.slots).filter(([slot, key]) => key && slot !== seed.spawn).map(([slot]) => slot)
    expect(pins.filter((p) => p.state === 'sighted').map((p) => p.slot).sort()).toEqual(built.sort())
  })

  it('with Sites off, keeps only the bare spawn', () => {
    const { pins } = resultMap(seed, without('structures'))
    expect(pins).toEqual([expect.objectContaining({ state: 'spawn', structure: null })])
  })

  it('with Spawn off, draws the Church at the spawn as a site like any other', () => {
    const { pins } = resultMap(seed, without('spawn'))
    expect(pins.find((p) => p.slot === seed.spawn)).toMatchObject({ state: 'sighted', structure: 'church' })
  })

  it("shows the castle's bosses with the Bosses layer and caravans with Sites, and only then", () => {
    const layers = (on: Set<Layer>) => new Set(resultMap(seed, on).markers!.map((m) => m.layer))
    expect(layers(all).has('castle') && layers(all).has('caravan')).toBe(true)
    expect(layers(without('boss')).has('castle')).toBe(false)
    expect(layers(without('boss')).has('boss')).toBe(false)
    expect(layers(without('structures')).has('caravan')).toBe(false)
  })

  it("writes a rise's clue with the site it belongs to", () => {
    const rise = catalog.seed('000')!
    const pin = resultMap(rise, all).pins.find((p) => p.structure?.startsWith('sorcerers-rise') && p.name)!
    expect(pin.name).toMatch(/^Rise · /)
  })
})
