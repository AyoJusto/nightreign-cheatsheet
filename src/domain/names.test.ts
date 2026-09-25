import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ELEMENT_CODES, ELEMENT_NAMES, weaknessPhrase } from './names'

describe('element emblems', () => {
  it('ship for every element the app knows, since badges show the emblem, not a colour or code', () => {
    for (const element of Object.keys(ELEMENT_NAMES)) expect(existsSync(`public/elements/${element}.webp`), element).toBe(true)
  })
})

describe('element codes', () => {
  it("give every element its own two letters, the fallback when an emblem can't load", () => {
    const codes = Object.values(ELEMENT_CODES)
    expect(Object.keys(ELEMENT_CODES).sort()).toEqual(Object.keys(ELEMENT_NAMES).sort())
    expect(new Set(codes.map((c) => c.toLowerCase())).size).toBe(codes.length)
    for (const c of codes) expect(c).toMatch(/^[A-Z][a-z]$/)
  })
})

describe('weaknessPhrase', () => {
  it('speaks what a card shows: weak first, then resists, in the game words', () => {
    expect(weaknessPhrase({ weak: ['holy', 'pierce'], resist: ['fire'] })).toBe('weak to Holy, Pierce; resists Fire')
    expect(weaknessPhrase({ weak: ['bleed'], resist: [] })).toBe('weak to Blood Loss')
    expect(weaknessPhrase({ weak: [], resist: ['holy', 'lightning'] })).toBe('resists Holy, Lightning')
    expect(weaknessPhrase({ weak: [], resist: [] })).toBe('')
  })
})
