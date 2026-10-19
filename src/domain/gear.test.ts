import { describe, expect, it } from 'vitest'
import { gearForTheRun, wantedAfflictions } from './gear'
import { catalog } from '../data/catalog'
import { splitStructure } from './names'

describe('gear for the run', () => {
  it("wants what the Nightlord is named weak to, Gaping Jaw's poison included", () => {
    expect(wantedAfflictions(catalog.seed('042')!).has('poison')).toBe(true)
  })

  it('points at every camp that drops a weapon of a wanted element', () => {
    const { camps, afflictions } = gearForTheRun(catalog.seed('042')!)
    expect(camps).toEqual(expect.arrayContaining(['4', '6', '11', '13', '18', '25']))
    expect(afflictions).toContain('poison')
  })

  it('points at nothing when no camp drops what the hard fights are weak to', () => {
    expect(gearForTheRun(catalog.seed('000')!)).toEqual({ camps: [], afflictions: [] })
  })

  it('only ever points at camps that carry an element', () => {
    for (const seed of catalog.all) {
      for (const slot of gearForTheRun(seed).camps) expect(splitStructure(seed.slots[slot]!).element, `${seed.id}/${slot}`).not.toBeNull()
    }
  })
})
