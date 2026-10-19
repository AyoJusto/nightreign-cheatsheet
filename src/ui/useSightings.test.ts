import { describe, expect, it } from 'vitest'
import { Scouting } from '../domain/scouting'
import { record, stepBack, type Timeline } from './useSightings'
import { catalog } from '../data/catalog'

const pool = catalog.seedsFor('tricephalos', 'default')
const target = pool[0]
const slotWithTwoOptions = Object.keys(target.slots).find((s) => Scouting.start(pool).possibilitiesAt(s).length >= 2)!
const [a, b] = Scouting.start(pool).possibilitiesAt(slotWithTwoOptions).map(({ option }) =>
  option === 'nothing' ? { type: 'nothing' as const, slot: slotWithTwoOptions } : { type: 'structure' as const, slot: slotWithTwoOptions, structure: option })

describe('Undo walks back through every change', () => {
  it('restores the previous value after a change', () => {
    let t: Timeline = { now: Scouting.start(pool), past: [] }
    const first = t.now.sight(a)
    t = record(t, first)
    t = record(t, t.now.sight(b))
    t = stepBack(t)
    expect(t.now.sightings).toEqual(first.sightings)
  })

  it('restores every sighting after a reset', () => {
    let t: Timeline = { now: Scouting.start(pool), past: [] }
    t = record(t, t.now.sight({ type: 'spawn', slot: target.spawn }))
    const key = target.slots[slotWithTwoOptions]
    t = record(t, t.now.sight(key ? { type: 'structure', slot: slotWithTwoOptions, structure: key } : { type: 'nothing', slot: slotWithTwoOptions }))
    const before = t.now.sightings
    t = record(t, Scouting.start(pool))
    t = stepBack(t)
    expect(t.now.sightings).toEqual(before)
  })

  it('has nothing to undo once the history is empty', () => {
    const t: Timeline = { now: Scouting.start(pool), past: [] }
    expect(stepBack(t)).toBe(t)
  })
})
