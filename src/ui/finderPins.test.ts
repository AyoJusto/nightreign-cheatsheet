import { describe, expect, it } from 'vitest'
import { buildPins } from './finderPins'
import { catalog } from '../data/catalog'
import { Scouting } from '../domain/scouting'

// Real seeds: Tricephalos on the default earth.
const pool = catalog.seedsFor('tricephalos', 'default')
const coords = catalog.slotsOf('default')
const target = pool[0]
const byState = (pins: ReturnType<typeof buildPins>, state: string) => pins.filter((p) => p.state === state)

describe('the finder map', () => {
  it('first asks for the spawn: every possible spawn point, each saying how many seeds it leaves', () => {
    const pins = buildPins(Scouting.start(pool), coords, null)
    const options = byState(pins, 'spawn-option')
    expect(options.map((p) => p.slot).sort()).toEqual(Scouting.start(pool).spawnOptions().map((o) => o.slot).sort())
    const left = options.map((p) => Number(p.label.match(/leaves (\d+)$/)![1]))
    expect(left.reduce((a, b) => a + b, 0)).toBe(pool.length)
    expect(byState(pins, 'spawn')).toEqual([])
  })

  it('once the spawn is sighted, shows the player there and no more spawn options', () => {
    const scouting = Scouting.start(pool).sight({ type: 'spawn', slot: target.spawn })
    const pins = buildPins(scouting, coords, null)
    expect(byState(pins, 'spawn').map((p) => p.slot)).toEqual([target.spawn])
    expect(byState(pins, 'spawn-option')).toEqual([])
    // One pin per slot at most.
    expect(new Set(pins.map((p) => p.slot)).size).toBe(pins.length)
  })

  it('draws a sighted site with what was seen there', () => {
    const [slot, structure] = Object.entries(target.slots).find(([s, k]) => k && s !== target.spawn)!
    const scouting = Scouting.start(pool).sight({ type: 'spawn', slot: target.spawn }).sight({ type: 'structure', slot, structure: structure! })
    const pin = buildPins(scouting, coords, null).find((p) => p.slot === slot)!
    expect(pin).toMatchObject({ state: 'sighted', structure })
  })

  it('in focus mode, lights exactly the sites that could hold the structure and dims the rest', () => {
    const scouting = Scouting.start(pool).sight({ type: 'spawn', slot: target.spawn })
    const { structure, slots } = scouting.structuresInPlay()[0]
    const pins = buildPins(scouting, coords, structure)
    expect(byState(pins, 'candidate').map((p) => p.slot).sort()).toEqual([...slots].sort())
    expect(byState(pins, 'open')).toEqual([])
  })
})
