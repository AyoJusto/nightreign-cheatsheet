import { describe, expect, it } from 'vitest'
import { assess } from './assess'
import type { Form } from './enemy'

const form = (negation: Partial<Form['negation']> = {}, buildup: Partial<Form['buildup']> = {}, label: string | null = null): Form => ({
  label,
  negation: { standard: 0, slash: 0, strike: 0, pierce: 0, magic: 0, fire: 0, lightning: 0, holy: 0, ...negation },
  buildup: { bleed: 252, frost: 252, rot: 252, poison: 252, sleep: 252, madness: 252, ...buildup },
})

describe('assessing a fight', () => {
  it('is weak to the damage types tied at the lowest negation below zero', () => {
    const verdict = assess([form({ holy: -20, fire: -20, pierce: -10 })])
    expect(verdict.weakTo).toEqual(['fire', 'holy'])
    expect(verdict.weakBy).toBe(-20)
  })

  it('claims no weakness when nothing goes below zero', () => {
    expect(assess([form({ fire: 10 })]).weakTo).toEqual([])
    expect(assess([form({ fire: 10 })]).weakBy).toBeNull()
  })

  it('resists the damage types tied at the highest negation above zero', () => {
    expect(assess([form({ fire: 50, magic: 20 })]).resists).toEqual(['fire'])
  })

  it('counts a fight of several forms by its worst form', () => {
    const verdict = assess([form({ fire: -40, holy: -10 }), form({ fire: 10, holy: -10 })])
    expect(verdict.weakTo).toEqual(['holy'])
    expect(verdict.negation.fire).toBe(10)
  })

  it('lets one immune form make a status useless for the whole fight', () => {
    const verdict = assess([form({}, { poison: 154 }), form({}, { poison: 'immune' })])
    expect(verdict.buildup.poison).toBe('immune')
    expect(verdict.immuneTo).toEqual(['poison'])
  })

  it('names the statuses tied at the fastest buildup', () => {
    const verdict = assess([form({}, { poison: 154, rot: 154, sleep: 'immune' })])
    expect(verdict.fastest).toEqual(['poison', 'rot'])
    expect(verdict.fastestAt).toBe(154)
  })

  it('counts the fastest statuses as a weakness only when they stand out from the rest', () => {
    expect(assess([form({}, { sleep: 154 })]).weakStatuses).toEqual(['sleep'])
    expect(assess([form({}, { bleed: 154, frost: 154, rot: 154, poison: 154, sleep: 154 })]).weakStatuses).toEqual([])
  })

  it('names a weakness only one form has when the worst case has none', () => {
    const verdict = assess([form({ fire: -30 }, {}, 'Phase 1'), form({ fire: 10 }, {}, 'Phase 2')])
    expect(verdict.weakTo).toEqual([])
    expect(verdict.oneForm).toEqual({ label: 'Phase 1', weakTo: ['fire'], by: -30 })
  })

  it('names no one-form weakness when the worst case already has one', () => {
    expect(assess([form({ fire: -30, holy: -10 }), form({ holy: -10 })]).oneForm).toBeNull()
  })
})
