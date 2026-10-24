import { describe, expect, it } from 'vitest'
import { parseRoute, decodeSightings, encodeSightings, findPath, seedPath, resultBackPath } from './router'

describe('routes', () => {
  it('parses known routes', () => {
    expect(parseRoute('/find/tricephalos/crater')).toEqual({ name: 'find', nightlord: 'tricephalos', earth: 'crater' })
    expect(parseRoute('/seed/042')).toEqual({ name: 'seed', id: '042' })
    expect(parseRoute('/about')).toEqual({ name: 'about' })
    expect(parseRoute('/find/unknown/great-hollow')).toEqual({ name: 'find', nightlord: 'unknown', earth: 'great-hollow' })
  })
  it('parses the reference pages', () => {
    expect(parseRoute('/')).toEqual({ name: 'home' })
    expect(parseRoute('/find')).toEqual({ name: 'pick' })
    expect(parseRoute('/nightlords')).toEqual({ name: 'nightlords' })
    expect(parseRoute('/nightlord/augur')).toEqual({ name: 'nightlord', id: 'augur' })
    expect(parseRoute('/bosses')).toEqual({ name: 'bosses' })
    expect(parseRoute('/enemy/golden-hippopotamus')).toEqual({ name: 'enemy', id: 'golden-hippopotamus' })
    expect(parseRoute('/effects/weapons')).toEqual({ name: 'effects', group: 'weapons' })
    expect(parseRoute('/builds')).toEqual({ name: 'builds', character: null })
    expect(parseRoute('/builds/wylder')).toEqual({ name: 'builds', character: 'wylder' })
  })
  it('opens the picker with a Nightlord already chosen', () => {
    expect(parseRoute('/find/augur')).toEqual({ name: 'pick', nightlord: 'augur' })
    expect(parseRoute('/find/unknown')).toEqual({ name: 'pick', nightlord: 'unknown' })
    expect(parseRoute('/find/nobody')).toEqual({ name: 'home' })
  })
  it("keeps the old cheat sheet's links working", () => {
    expect(parseRoute('/tricephalos')).toEqual({ name: 'nightlord', id: 'tricephalos' })
    expect(parseRoute('/boss/ancient-dragon')).toEqual({ name: 'enemy', id: 'ancient-dragon' })
    expect(parseRoute('/effects/relics')).toEqual({ name: 'effects', group: 'relics' })
  })
  it('sends anything unknown home', () => {
    expect(parseRoute('/enemy/nobody')).toEqual({ name: 'home' })
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
      { type: 'night1', boss: 'tree-sentinel-royal-cavalrymen' },
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

describe('paths between finder and result', () => {
  const s = decodeSightings('spawn@19,22@church,9@none')
  const seed = { nightlord: 'tricephalos', earth: 'default' } as const

  it('builds a finder path, with no query when there are no sightings', () => {
    expect(findPath('tricephalos', 'default')).toBe('/find/tricephalos/default')
    expect(findPath('unknown', 'crater', s)).toBe('/find/unknown/crater?s=spawn%4019%2C22%40church%2C9%40none')
  })
  it("sends a result's Back to its finder one sighting back", () => {
    const search = seedPath('000', s, false).split('?')[1]
    expect(resultBackPath(`?${search}`, seed)).toBe(findPath('tricephalos', 'default', s.slice(0, -1)))
  })
  it('returns an unknown-Nightlord result to the unknown finder', () => {
    const search = seedPath('000', s, true).split('?')[1]
    expect(resultBackPath(`?${search}`, seed)).toBe(findPath('unknown', 'default', s.slice(0, -1)))
  })
  it('sends a shared link to the Nightlord picker', () => {
    expect(seedPath('000', [], false)).toBe('/seed/000')
    expect(resultBackPath('', seed)).toBe('/find')
  })
})
