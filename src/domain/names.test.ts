import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ELEMENT_CODES, ELEMENT_NAMES, cardRows, weaknessPhrase } from './names'

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
    expect(weaknessPhrase({ weak: [], resist: ['holy', 'lightning'] })).toBe('resists Holy, Lightning')
    expect(weaknessPhrase({ weak: [], resist: [] })).toBe('')
  })
  it("speaks every status last as the card's Weak status row, whichever field the data lists it in", () => {
    expect(weaknessPhrase({ weak: ['holy'], resist: ['fire'], status: ['sleep'] })).toBe('weak to Holy; resists Fire; weak status Sleep')
    expect(weaknessPhrase({ weak: ['holy'], resist: [], status: ['frost', 'rot'] })).toBe('weak to Holy; weak status Frostbite, Scarlet Rot')
    // Balancers: listed weak to Sleep and Strike, shown as Weak Strike and Weak status Sleep, and spoken the same way.
    expect(weaknessPhrase({ weak: ['sleep', 'strike'], resist: ['holy'], status: [] })).toBe('weak to Strike; resists Holy; weak status Sleep')
    expect(weaknessPhrase({ weak: ['bleed'], resist: [] })).toBe('weak status Blood Loss')
  })
})

describe('cardRows', () => {
  it("puts every status in the Weak status row, Balancers' listed Sleep as well as Tricephalos' fastest one", () => {
    expect(cardRows({ weak: ['sleep', 'strike'], resist: ['holy'], status: [] })).toEqual({ weak: ['strike'], resist: ['holy'], status: ['sleep'] })
    expect(cardRows({ weak: ['holy'], resist: ['fire'], status: ['sleep'] })).toEqual({ weak: ['holy'], resist: ['fire'], status: ['sleep'] })
    // Gaping Jaw is listed for Poison alone: no Weak row, the status row names it.
    expect(cardRows({ weak: ['poison'], resist: ['lightning'], status: [] })).toEqual({ weak: [], resist: ['lightning'], status: ['poison'] })
    expect(cardRows({ weak: ['madness', 'holy'], resist: [], status: ['sleep', 'madness'] })).toEqual({ weak: ['holy'], resist: [], status: ['madness', 'sleep'] })
  })
})
