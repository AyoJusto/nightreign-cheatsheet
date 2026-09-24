import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { toStructureKey, toNightlord, toEvent, hasCjk } from './import-seeds.ts'

const aliases = JSON.parse(readFileSync('data/raw/aliases.json', 'utf8'))

describe('import translation', () => {
  it('translates plain and elemental structures', () => {
    expect(toStructureKey('fort')).toBe('fort')
    expect(toStructureKey('greatchurch_fire')).toBe('great-church:fire')
    expect(toStructureKey('mainencampment_eletric')).toBe('main-encampment:lightning')
    expect(toStructureKey('ScaleBearingMerchant')).toBe('scale-bearing-merchant')
  })
  it('treats empty and spawn markers', () => {
    expect(toStructureKey('')).toBeNull()
    expect(toStructureKey('empty_spawn')).toBeNull()
    expect(toStructureKey('church_spawn')).toBe('church')
  })
  it('rejects unknown source vocabulary loudly', () => {
    expect(() => toStructureKey('volcano_fire')).toThrow(/unknown structure/)
  })
  it('maps nightlords by number only', () => {
    expect(toNightlord('1_Anything')).toBe('tricephalos')
    expect(toNightlord('10_Anything')).toBe('dreglord')
  })
  it('splits event day and applies overrides', () => {
    expect(toEvent('nighthordeDay2', { nighthordeDay2: ['Night Horde'] })).toEqual({ name: 'Night Horde', day: 2 })
    expect(toEvent('mausoleum', { mausoleum: ['Mausoleum'] })).toEqual({ name: 'Mausoleum', day: null })
    expect(toEvent('', {})).toBeNull()
  })
  it('prefers the alias override over the source label', () => {
    const [base, name] = Object.entries<string>(aliases.eventNameOverrides)[0]
    expect(toEvent(`${base}Day1`, { [`${base}Day1`]: ['source label'] })).toEqual({ name, day: 1 })
  })
  it('detects non-English text', () => {
    expect(hasCjk('教堂')).toBe(true)
    expect(hasCjk('Great Church')).toBe(false)
  })
})
