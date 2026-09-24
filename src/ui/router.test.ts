import { describe, expect, it } from 'vitest'
import { parseRoute } from './router'
import { decodeSightings, encodeSightings } from './useSightings'

describe('routes', () => {
  it('parses known routes', () => {
    expect(parseRoute('/find/tricephalos/crater')).toEqual({ name: 'find', nightlord: 'tricephalos', earth: 'crater' })
    expect(parseRoute('/seed/042')).toEqual({ name: 'seed', id: '042' })
    expect(parseRoute('/about')).toEqual({ name: 'about' })
  })
  it('sends anything unknown home', () => {
    expect(parseRoute('/find/nobody/crater')).toEqual({ name: 'home' })
    expect(parseRoute('/seed/nope')).toEqual({ name: 'home' })
    expect(parseRoute('/wat')).toEqual({ name: 'home' })
  })
})

describe('sightings in the URL', () => {
  it('round-trips', () => {
    const s = [
      { type: 'spawn', slot: '19' },
      { type: 'structure', slot: '22', structure: 'great-church:fire' },
      { type: 'nothing', slot: '9' },
    ] as const
    expect(decodeSightings(encodeSightings(s))).toEqual(s)
  })
  it('drops malformed parts', () => {
    expect(decodeSightings('spawn@19,@@,22@<script>,9@none')).toEqual([
      { type: 'spawn', slot: '19' },
      { type: 'nothing', slot: '9' },
    ])
  })
})
