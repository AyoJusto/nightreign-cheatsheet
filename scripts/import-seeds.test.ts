import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { toStructureKey, toNightlord, toEvent, hasCjk, keyBackground, islandBox, oceanCoverage, normalizeBossName, applyPerName, emblemSources, toInside } from './import-seeds.ts'

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

  describe('boss name normalization', () => {
    it('folds case, &-vs-and and hyphen-vs-space apart so the same fight has one key', () => {
      expect(normalizeBossName('Demihuman Queen & Swordmaster')).toBe(normalizeBossName('Demi-Human Queen and Swordmaster'))
    })
    it('leaves genuinely different names apart', () => {
      expect(normalizeBossName('Tree Sentinel')).not.toBe(normalizeBossName('Tree Sentinels'))
    })
    // The regression this catches: the source spelled one boss two ways, and both spellings shipped.
    // Great Hollow "stack" markers join several bosses in one label ("A, B, C"), so each label is
    // split on ", " first: otherwise a spelling that only ever appears inside a joined label (as
    // this one did) would never collide with its lone-boss spelling elsewhere.
    it('gives every distinct boss, castle and marker name in the shipped data its own key', () => {
      const seeds = JSON.parse(readFileSync('src/data/seeds.json', 'utf8'))
      const names = new Set<string>()
      const addAll = (label: string) => { for (const name of label.split(', ')) names.add(name) }
      for (const s of seeds.seeds) {
        if (s.nights[1].boss) addAll(s.nights[1].boss)
        if (s.nights[2].boss) addAll(s.nights[2].boss)
        if (s.castle?.basement) addAll(s.castle.basement)
        if (s.castle?.rooftop) addAll(s.castle.rooftop)
        for (const m of s.markers) if (m.layer === 'boss' || m.layer === 'evergaol') addAll(m.label)
        for (const label of Object.values<string>(s.inside)) addAll(label)
      }
      expect(names.has('Guardian Golem'), "the inside labels are part of the check").toBe(true)
      const byKey = new Map<string, string>()
      for (const name of names) {
        const key = normalizeBossName(name)
        expect(byKey.get(key), `"${name}" and "${byKey.get(key)}" normalize to the same key`).toBeUndefined()
        byKey.set(key, name)
      }
    })
  })

  describe("what's inside each site", () => {
    const slots = { '1': 'great-church', '2': 'ruined-rise', '3': null, '4': 'marsh:poison' }
    const same = (n: string) => n
    it('keeps the label of every built slot, by slot', () => {
      expect(toInside({ '1': 'Guardian Golem', '4': 'Spider Scorpions' }, slots, same).inside).toEqual({ '1': 'Guardian Golem', '4': 'Spider Scorpions' })
    })
    it('spells each name the canonical way, including every name in a joined label', () => {
      const resolve = (n: string) => (n === 'Windy Trees' ? 'Windy Tree' : n)
      expect(toInside({ '2': 'Imp Statue, Windy Trees, Second Floor' }, slots, resolve).inside).toEqual({ '2': 'Imp Statue, Windy Tree, Second Floor' })
    })
    it("drops the source's event sentinel, which is not a name", () => {
      expect(toInside({ '3': '@event', '1': '@event' }, slots, same)).toEqual({ inside: {}, skipped: [] })
    })
    it('keeps Caravans on open ground, where they stand with no building', () => {
      expect(toInside({ '3': 'Caravans' }, slots, same).inside).toEqual({ '3': 'Caravans' })
    })
    it('skips, and reports, any other label on a slot with nothing built or no place on the map', () => {
      expect(toInside({ '3': 'Mausoleum Knight', '99': 'Guardian Golem' }, slots, same)).toEqual({ inside: {}, skipped: ['3: Mausoleum Knight', '99: Guardian Golem'] })
    })
    it('treats a seed with no labels (Great Hollow) as nothing inside', () => {
      expect(toInside(undefined, slots, same)).toEqual({ inside: {}, skipped: [] })
    })
    it('rejects non-English labels', () => {
      expect(() => toInside({ '1': '教堂' }, slots, same)).toThrow(/non-English/)
    })
  })

  describe('applyPerName (comma-joined labels)', () => {
    it('resolves each name in a joined label and rejoins them', () => {
      const resolve = (n: string) => (n === 'A' ? 'Z' : n)
      expect(applyPerName('A, B, C', resolve)).toBe('Z, B, C')
    })
    it('is a no-op shape for a single, unjoined name', () => {
      expect(applyPerName('Solo Boss', (n) => n)).toBe('Solo Boss')
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

  it("finds the island's box in map units, from the keyed map's opaque pixels", () => {
    const { rgba, size } = island()
    const out = keyBackground(rgba, size, size, oceanCoverage(OCEAN), { feather: 0, streak: 3 })
    // Land runs from pixel 2 to 8 of 11: 2/11 to 9/11 of the map.
    expect(islandBox(out, size, size)).toEqual({ x0: 182, y0: 182, x1: 818, y1: 818 })
  })
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

describe('element emblems', () => {
  const icons = readdirSync('data/raw/assets/icons')
  const statuses = readdirSync('data/raw/assets/elements')
  const elements = [...new Set(Object.values<string>(aliases.elements))]

  it('finds an emblem for every element the app knows', () => {
    const sources = emblemSources(icons, statuses)
    expect(Object.keys(sources).sort()).toEqual(elements.sort())
    expect(elements).toHaveLength(11)
  })
  it('reads lightning from the source files spelled "eletric"', () => {
    expect(emblemSources(icons, statuses).lightning.file).toMatch(/_eletric\.webp$/)
  })
  it('takes rot, which no variant art carries, from its status icon', () => {
    expect(emblemSources(icons, statuses).rot.file).toBe('data/raw/assets/elements/rot.png')
  })
  it('crops every variant emblem with one box, and never uses spawn art', () => {
    const sources = Object.values(emblemSources(icons, statuses)).filter((s) => s.file.includes('/icons/'))
    expect(new Set(sources.map((s) => JSON.stringify(s.box))).size).toBe(1)
    expect(sources.every((s) => !s.file.includes('_spawn'))).toBe(true)
  })
  it('fails loudly when an element has no emblem', () => {
    expect(() => emblemSources(icons.filter((f) => !f.endsWith('_sleep.webp')), statuses)).toThrow(/sleep/)
    expect(() => emblemSources(icons, [])).toThrow(/rot/)
  })
})
