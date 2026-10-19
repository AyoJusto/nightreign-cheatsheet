import { describe as group, expect, it } from 'vitest'
import { BUILDS, BY_CHARACTER, describe, groupSlots, isRelicEffect } from './builds'

const everyBuild = () => BUILDS.flatMap((character) => character.builds.map((build) => ({ character, build })))

group('every build line names a real relic effect', () => {
  it('has no orphaned effect or curse titles', () => {
    const orphans: string[] = []
    for (const { character, build } of everyBuild())
      for (const slot of [...build.relics, ...build.deep])
        for (const line of slot.lines) {
          if (!isRelicEffect(line.effect)) orphans.push(`${character.name} / ${build.name}: ${line.effect}`)
          for (const curse of line.curses ?? [])
            if (!isRelicEffect(curse)) orphans.push(`${character.name} / ${build.name} curse: ${curse}`)
        }
    expect(orphans).toEqual([])
  })

  it('describes a relic title with the relic row, never the weapon row', () => {
    expect(describe('Vigor +1/2/3')?.group).toBe('relics')
    expect(describe('no such effect')).toBeUndefined()
  })
})

group('every build is a complete loadout', () => {
  for (const { character, build } of everyBuild())
    it(`${character.name} / ${build.name}`, () => {
      for (const [side, slots] of [
        ['relics', build.relics],
        ['deep', build.deep],
      ] as const) {
        expect(groupSlots(slots).map((g) => g.n)).toEqual([1, 2, 3])
        for (const slot of slots) {
          const where = `${side} ${slot.n} ${slot.label ?? ''}`
          expect(slot.lines.length, where).toBeGreaterThanOrEqual(3)
          expect(slot.lines.length, where).toBeLessThanOrEqual(4)
        }
      }
    })
})

group('variants', () => {
  it('names every option when two slots share a number', () => {
    const unnamed: string[] = []
    for (const { character, build } of everyBuild())
      for (const slots of [build.relics, build.deep])
        for (const g of groupSlots(slots))
          if (g.options.length > 1 && g.options.some((o) => !o.label))
            unnamed.push(`${character.name} / ${build.name} slot ${g.n}`)
    expect(unnamed).toEqual([])
  })
})

group('BY_CHARACTER', () => {
  it('finds each character by slug', () => {
    for (const character of BUILDS) expect(BY_CHARACTER.get(character.slug)).toBe(character)
  })
})
