import { describe, expect, it } from 'vitest'
import { EFFECTS } from './data/effects'
import { GROUPS, applyFilter, byCategory, effectsIn, filtersFor, searchEffects, stackLabel } from './effects'

describe('the effects data', () => {
  it('holds every row of the five sheet tabs', () => {
    expect(EFFECTS).toHaveLength(378)
    expect(GROUPS.map((g) => g.count)).toEqual([194, 184])
  })

  it('gives every row a title and at least one category', () => {
    for (const e of EFFECTS) {
      expect(e.title.trim()).not.toBe('')
      expect(e.cats.length).toBeGreaterThan(0)
    }
  })

  it('has no row whose effect is just "self explanatory"', () => {
    const shrugs = EFFECTS.filter((e) => /self[\s-]*explanator/i.test(e.effect))
    expect(shrugs.map((e) => e.title)).toEqual([])
  })

  it('leaves blank only the five effects the source left blank', () => {
    expect(EFFECTS.filter((e) => !e.effect.trim())).toHaveLength(5)
  })

  it('keeps dormant powers in the weapons group', () => {
    expect(EFFECTS.filter((e) => e.pool === 'dormant').every((e) => e.group === 'weapons')).toBe(true)
  })

  it('splits each group into its pools', () => {
    const poolCounts = (group: 'relics' | 'weapons') =>
      Object.fromEntries(['base', 'deep', 'dormant'].map((pool) => [pool, effectsIn(group).filter((e) => e.pool === pool).length]))
    expect(poolCounts('relics')).toEqual({ base: 116, deep: 78, dormant: 0 })
    expect(poolCounts('weapons')).toEqual({ base: 78, deep: 54, dormant: 52 })
  })
})

describe('searchEffects', () => {
  it('matches the in-game "blood", since nothing in game says "bleed"', () => {
    expect(searchEffects('blood').some((e) => e.title === 'Power of the Blood Lord')).toBe(true)
  })

  it('does not match effect text, only titles and keywords', () => {
    expect(searchEffects('stack')).toEqual([])
  })

  it('finds a [Status] template row by the status it stands for', () => {
    expect(searchEffects('frostbite').some((e) => e.title.includes('[Status]'))).toBe(true)
  })

  it('finds a dormant power by what it does, not its flavour name', () => {
    expect(searchEffects('scarlet rot').some((e) => e.title === 'Favor of the Rotten Woods')).toBe(true)
  })

  it('ranks a title match above a keyword-only match', () => {
    const hits = searchEffects('blood')
    const lord = hits.findIndex((e) => e.title === 'Power of the Blood Lord')
    const template = hits.findIndex((e) => e.title.includes('[Status]'))
    expect(lord).toBeGreaterThanOrEqual(0)
    expect(template).toBeGreaterThan(lord)
    expect(hits.slice(0, 5)).toContain(hits[lord])
  })

  it('finds the row the sheet misspelled as "Stating armament"', () => {
    expect(searchEffects('starting armament').map((e) => e.title)).toEqual(['Starting armament inflicts [Status]'])
    expect(searchEffects('blood loss').some((e) => e.title === 'Starting armament inflicts [Status]')).toBe(true)
  })

  it('leads with the title that opens with the query', () => {
    expect(searchEffects('vigor')[0]!.title).toBe('Vigor +1/2/3')
    expect(searchEffects('blood')[0]!.title).toBe('Blood Loss in Vicinity Increases Attack Power')
  })

  it('breaks position ties alphabetically rather than by data order', () => {
    const hits = searchEffects('attack boost').map((e) => e.title)
    expect(hits).toEqual([...hits].sort((a, b) => a.localeCompare(b, 'en')))
  })

  it('is not plain alphabetical, which would put [Character] rows above "Vigor +1/2/3"', () => {
    const titles = searchEffects('vigor').map((e) => e.title)
    expect(titles).not.toEqual([...titles].sort((a, b) => a.localeCompare(b, 'en')))
  })

  it('returns nothing for a blank query', () => {
    expect(searchEffects('')).toEqual([])
    expect(searchEffects('   ')).toEqual([])
  })
})

describe('filters', () => {
  it('offers only the pools a group has, alongside its categories', () => {
    const keys = filtersFor('weapons').map((f) => f.key)
    expect(keys).toContain('pool:deep')
    expect(keys).toContain('pool:dormant')
    expect(filtersFor('relics').map((f) => f.key)).not.toContain('pool:dormant')
  })

  it('never offers a base chip, because base is everything untagged', () => {
    expect(filtersFor('relics').map((f) => f.key)).not.toContain('pool:base')
  })

  it('counts exactly what each filter returns', () => {
    for (const group of ['relics', 'weapons'] as const) {
      const list = effectsIn(group)
      for (const f of filtersFor(group)) expect(applyFilter(list, f.key)).toHaveLength(f.count)
    }
  })

  it('finds a row filed under two categories from either one', () => {
    const both = EFFECTS.find((e) => e.cats.length > 1)!
    const list = effectsIn(both.group)
    for (const cat of both.cats) expect(applyFilter(list, `cat:${cat}`)).toContain(both)
  })

  it('passes the list through when no filter is selected', () => {
    const list = effectsIn('relics')
    expect(applyFilter(list, null)).toHaveLength(list.length)
  })
})

describe('byCategory', () => {
  it('lists every row exactly once, under its first category', () => {
    for (const group of ['relics', 'weapons'] as const) {
      const list = effectsIn(group)
      const shown = byCategory(list).flatMap((g) => g.items)
      expect(shown).toHaveLength(list.length)
      expect(new Set(shown).size).toBe(list.length)
    }
  })
})

describe('stackLabel', () => {
  it('reads the two clean answers', () => {
    expect(stackLabel('Yes')).toEqual({ label: 'Stacks', tone: 'yes' })
    expect(stackLabel('No')).toEqual({ label: 'No stack', tone: 'no' })
  })

  it("repeats an uncertain answer in the sheet's own words", () => {
    expect(stackLabel('See Notes')).toEqual({ label: 'See Notes', tone: 'unknown' })
    expect(stackLabel('Yes?')).toEqual({ label: 'Yes?', tone: 'unknown' })
    expect(stackLabel('N/A')).toEqual({ label: 'N/A', tone: 'unknown' })
  })

  it('says Unknown for blanks and dashes', () => {
    expect(stackLabel('')).toEqual({ label: 'Unknown', tone: 'unknown' })
    expect(stackLabel('-')).toEqual({ label: 'Unknown', tone: 'unknown' })
  })

  it('never claims a row stacks unless the sheet said a plain Yes', () => {
    const stacking = EFFECTS.filter((e) => stackLabel(e.stack).tone === 'yes')
    expect(stacking.every((e) => e.stack === 'Yes')).toBe(true)
  })
})
