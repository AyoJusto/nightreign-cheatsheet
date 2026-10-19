import { describe, expect, it } from 'vitest'
import { collapseRepeats } from './collapseRepeats'

describe('collapseRepeats', () => {
  it('collapses consecutive equal items into one group with a count', () => {
    const groups = collapseRepeats(['Divine Beast Warrior', 'Divine Beast Warrior', 'Erdtree Avatar'], (s) => s)
    expect(groups).toEqual([
      { item: 'Divine Beast Warrior', count: 2 },
      { item: 'Erdtree Avatar', count: 1 },
    ])
  })

  it('keeps non-adjacent repeats as separate groups', () => {
    const groups = collapseRepeats(['Erdtree Avatar', 'Divine Beast Warrior', 'Erdtree Avatar'], (s) => s)
    expect(groups).toEqual([
      { item: 'Erdtree Avatar', count: 1 },
      { item: 'Divine Beast Warrior', count: 1 },
      { item: 'Erdtree Avatar', count: 1 },
    ])
  })

  it('passes single and empty lists through unchanged', () => {
    expect(collapseRepeats([], (s: string) => s)).toEqual([])
    expect(collapseRepeats(['Erdtree Avatar'], (s) => s)).toEqual([{ item: 'Erdtree Avatar', count: 1 }])
  })
})
