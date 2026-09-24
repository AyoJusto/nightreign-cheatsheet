import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { toStructureKey, toNightlord, toEvent, hasCjk, toBossNotes, keyBackground, oceanCoverage } from './import-seeds.ts'

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

  describe('boss notes', () => {
    const details = [
      { key: 'tree_sentinel', name: 'Tree Sentinel', summary: 'Keep moving.' },
      { key: 'demi_human_queen', name: 'Demi-Human Queen', summary: 'Kill the adds.' },
      { key: 'mute', name: 'Mute', summary: '' },
    ]
    it('keys notes by the name the run card shows, joined on the source key', () => {
      expect(toBossNotes(details, [['Tree Sentinel and Royal Cavalrymen', 'tree_sentinel']])).toEqual({ 'Tree Sentinel and Royal Cavalrymen': 'Keep moving.' })
    })
    it('joins by name when the source gives no key', () => {
      expect(toBossNotes(details, [['Demi-Human Queen', null]])).toEqual({ 'Demi-Human Queen': 'Kill the adds.' })
    })
    it('leaves out bosses without notes instead of writing blanks', () => {
      expect(toBossNotes(details, [['Trolls', 'trolls'], ['Mute', 'mute'], ['Evergaol Knight', null]])).toEqual({})
    })
    it('drops non-English notes', () => {
      expect(toBossNotes([{ key: 'x', name: 'X', summary: '樹' }], [['X', 'x']])).toEqual({})
    })
    it('rejects one shown name meaning two bosses', () => {
      expect(() => toBossNotes(details, [['Sentinel', 'tree_sentinel'], ['Sentinel', 'demi_human_queen']])).toThrow(/two bosses/)
    })
  })
})

describe('map background keying', () => {
  const OCEAN = [73, 119, 153] as const
  const LAND = [120, 100, 60] as const
  // 11x11: an ocean border two pixels deep, land inside, and a 3x3 "lake" of ocean colour at the centre.
  const island = () => {
    const size = 11
    const rgba = new Uint8Array(size * size * 4)
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const edge = x < 2 || y < 2 || x > 8 || y > 8
        const lake = x >= 4 && x <= 6 && y >= 4 && y <= 6
        rgba.set([...(edge || lake ? OCEAN : LAND), 255], (y * size + x) * 4)
      }
    }
    return { rgba, size }
  }
  const alphaAt = (rgba: Uint8Array, size: number, x: number, y: number) => rgba[(y * size + x) * 4 + 3]

  it('clears the ocean reached from the edges and keeps an enclosed lake of the same colour', () => {
    const { rgba, size } = island()
    const out = keyBackground(rgba, size, size, oceanCoverage(OCEAN), { feather: 0, streak: 3 })
    expect(alphaAt(out, size, 0, 0)).toBe(0)
    expect(alphaAt(out, size, 1, 5)).toBe(0)
    expect(alphaAt(out, size, 5, 5)).toBe(255)
    expect(alphaAt(out, size, 4, 4)).toBe(255)
    expect(alphaAt(out, size, 3, 3)).toBe(255)
  })

  it('feathers the coastline inward without touching the lake', () => {
    const { rgba, size } = island()
    const out = keyBackground(rgba, size, size, oceanCoverage(OCEAN), { feather: 1, streak: 3 })
    expect(alphaAt(out, size, 0, 0)).toBe(0)
    const coast = alphaAt(out, size, 2, 5)
    expect(coast).toBeGreaterThan(0)
    expect(coast).toBeLessThan(255)
    expect(alphaAt(out, size, 5, 5)).toBe(255)
  })
})

describe('map background keying: streaks', () => {
  it('clears thin horizontal streaks the source leaves in the ocean off the coast', () => {
    const OCEAN = [73, 119, 153]
    const GREY = [70, 72, 67]
    const w = 12
    const h = 12
    const rgba = new Uint8Array(w * h * 4)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const land = x >= 2 && x <= 6 && y >= 2 && y <= 9
        const streak = y === 5 && x >= 7 && x <= 10
        rgba.set([...(land || streak ? GREY : OCEAN), 255], (y * w + x) * 4)
      }
    }
    const out = keyBackground(rgba, w, h, oceanCoverage(OCEAN), { feather: 0, streak: 3 })
    expect(out[(5 * w + 9) * 4 + 3]).toBe(0)
    expect(out[(5 * w + 4) * 4 + 3]).toBe(255)
  })
})
