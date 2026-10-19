import { describe, expect, it } from 'vitest'
import { groupByKind } from './structureGroups'

describe('groupByKind', () => {
  it('gives each kind one group holding its element variants, plain first', () => {
    expect(groupByKind(['ruins:fire', 'church', 'ruins', 'great-church:holy', 'ruins:bleed'])).toEqual([
      { kind: 'church', variants: ['church'] },
      { kind: 'great-church', variants: ['great-church:holy'] },
      { kind: 'ruins', variants: ['ruins', 'ruins:bleed', 'ruins:fire'] },
    ])
  })

  it('keeps kinds in a stable order, so strip items hold their place between sightings', () => {
    const before = groupByKind(['fort', 'township', 'church'])
    const after = groupByKind(['township', 'church', 'fort:magic'])
    expect(after.map((g) => g.kind)).toEqual(before.map((g) => g.kind))
  })

  it('is empty when nothing is in play', () => {
    expect(groupByKind([])).toEqual([])
  })
})
