import { readFileSync, readdirSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { toStructureKey, toNightlord, toEvent, hasCjk, toBossNotes, keyBackground, oceanCoverage, normalizeBossName, applyPerName, emblemSources, toInside, toWeakness, weaknessTable } from './import-seeds.ts'
import { EXPEDITIONS } from '../data/raw/weaknesses/data/nightlords.ts'
import { NIGHT_BOSSES } from '../data/raw/weaknesses/data/nightbosses.ts'

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

describe('boss weaknesses', () => {
  type Neg = Partial<Record<'standard' | 'slash' | 'strike' | 'pierce' | 'magic' | 'fire' | 'lightning' | 'holy', number>>
  const form = (neg: Neg) => {
    const n = { standard: 0, slash: 0, strike: 0, pierce: 0, magic: 0, fire: 0, lightning: 0, holy: 0, ...neg }
    const status = { bleed: 252, frost: 252, rot: 252, poison: 252, sleep: 252, madness: 'Immune' as const }
    return {
      label: null, hp: null, poise: null, status,
      phys: { standard: n.standard, slash: n.slash, strike: n.strike, pierce: n.pierce },
      elem: { magic: n.magic, fire: n.fire, lightning: n.lightning, holy: n.holy },
    }
  }

  it('is weak to the damage types tied at the lowest negation, and resists those tied at the highest', () => {
    expect(toWeakness([form({ holy: -35, pierce: -10, fire: 50, magic: 20 })])).toEqual({ weak: ['holy'], resist: ['fire'] })
    expect(toWeakness([form({ holy: -20, fire: -20, slash: 10, strike: 10 })])).toEqual({ weak: ['fire', 'holy'], resist: ['slash', 'strike'] })
  })
  it('names no weakness or resistance when nothing goes below or above zero', () => {
    expect(toWeakness([form({})])).toEqual({ weak: [], resist: [] })
  })
  it('scores a fight of several forms by its worst case, as the cheatsheet does', () => {
    // Fire is -40 on one form and +10 on the other: you carry one weapon into the arena, so it is not a weakness.
    expect(toWeakness([form({ fire: -40, holy: -10 }), form({ fire: 10, holy: -10 })])).toEqual({ weak: ['holy'], resist: ['fire'] })
  })
  it("leads with a Nightlord's listed weakness, which may be a status no negation shows", () => {
    expect(toWeakness([form({ strike: -10 })], 'sleep')).toEqual({ weak: ['sleep', 'strike'], resist: [] })
    expect(toWeakness([form({ holy: -35 })], 'holy')).toEqual({ weak: ['holy'], resist: [] })
  })

  describe('against the copied cheatsheet data', () => {
    const seeds = JSON.parse(readFileSync('src/data/seeds.json', 'utf8'))
    const nightNames = [...new Set<string>(seeds.seeds.flatMap((s: any) => [s.nights[1].boss, s.nights[2].boss]))]
    const table = weaknessTable(EXPEDITIONS, NIGHT_BOSSES, nightNames)

    it('covers every Nightlord, by our slug', () => {
      expect(Object.keys(table.nightlords).sort()).toEqual(Object.values<string>(aliases.nightlordByNumber).sort())
      for (const [slug, w] of Object.entries(table.nightlords)) expect(w.weak.length, slug).toBeGreaterThan(0)
    })
    it('matches what the game says of Tricephalos: weak to holy, resists fire', () => {
      expect(table.nightlords.tricephalos.weak[0]).toBe('holy')
      expect(table.nightlords.tricephalos.resist).toContain('fire')
    })
    it('finds every night boss we show, bar the one the cheatsheet has no trustworthy numbers for', () => {
      expect(nightNames).toHaveLength(41)
      expect(table.unmatched).toEqual(['Artorias'])
      expect(Object.keys(table.bosses)).toHaveLength(40)
    })
    it('keys only on night boss names, so castle and field bosses get none', () => {
      for (const name of Object.keys(table.bosses)) expect(nightNames).toContain(name)
    })
    it('has an alias table that points at real cheatsheet entries and at names we really show', () => {
      const cheatsheetNames = new Set(NIGHT_BOSSES.map((b) => b.name))
      for (const [ours, theirs] of Object.entries<string>(aliases.weaknessBossNames)) {
        if (ours === '_readme') continue
        expect(cheatsheetNames.has(theirs), theirs).toBe(true)
        expect(nightNames, ours).toContain(ours)
      }
    })
    it('fails loudly when a Nightlord has no entry', () => {
      expect(() => weaknessTable(EXPEDITIONS.slice(1), NIGHT_BOSSES, nightNames)).toThrow(/tricephalos/)
    })
  })
})
