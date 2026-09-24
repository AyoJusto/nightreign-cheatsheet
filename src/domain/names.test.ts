import { describe, expect, it } from 'vitest'
import { ELEMENT_BADGES, ELEMENT_NAMES } from './names'

describe('element badges', () => {
  it('give every element its own short badge, so no two elements share one', () => {
    const badges = Object.values(ELEMENT_BADGES)
    expect(Object.keys(ELEMENT_BADGES).sort()).toEqual(Object.keys(ELEMENT_NAMES).sort())
    expect(new Set(badges.map((b) => b.toLowerCase())).size).toBe(badges.length)
    for (const b of badges) expect(b).toMatch(/^[A-Z][a-z]$/)
  })
})
