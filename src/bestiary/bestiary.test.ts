import { describe, expect, it } from 'vitest'
import { bestiary, headline, nightlordHeadline } from './bestiary'
import { assess } from './assess'
import { catalog } from '../data/catalog'
import { NIGHTLORDS } from '../domain/names'
import { NOT_ENEMIES } from '../../scripts/import-enemies'

const elsewhereNames = () => {
  const names = new Set<string>()
  const add = (label: string | null | undefined) => {
    for (const name of (label ?? '').split(', ')) if (name && !NOT_ENEMIES.has(name)) names.add(name)
  }
  for (const seed of catalog.all) {
    if (seed.castle) [seed.castle.crew, seed.castle.basement, seed.castle.rooftop].forEach(add)
    Object.values(seed.inside).forEach(add)
    for (const marker of seed.markers) if (marker.layer === 'boss' || marker.layer === 'evergaol') add(marker.label)
  }
  return names
}

describe('the bestiary', () => {
  it('has numbers for every night boss any seed names', () => {
    for (const seed of catalog.all) {
      for (const night of [1, 2] as const) {
        const fight = bestiary.nightBoss(seed.nights[night].boss)
        expect(fight?.forms.length, seed.nights[night].boss).toBeGreaterThan(0)
      }
    }
  })

  it('knows every enemy on every map, castle and camp, and has no numbers only where no source does', () => {
    const blank = new Set<string>()
    for (const name of elsewhereNames()) {
      const enemy = bestiary.named(name)
      expect(enemy, name).toBeDefined()
      if (!enemy!.forms.length) blank.add(enemy!.name)
    }
    expect([...blank].sort()).toEqual(['Ancestral Followers', 'Kindreds of Rot', 'Nomads', 'Spider Scorpions'])
  })

  it('gives every Nightlord a headline led by the weakness the game names', () => {
    for (const { id } of NIGHTLORDS) {
      const nightlord = bestiary.nightlord(id)!
      expect(nightlordHeadline(nightlord).weak[0], id).toBe(nightlord.named)
    }
  })

  it('shows a field Tree Sentinel alone, and the night fight with its cavalry', () => {
    expect(bestiary.named('Tree Sentinel')!.forms).toHaveLength(1)
    expect(bestiary.nightBoss('Tree Sentinel')!.forms.length).toBeGreaterThan(1)
  })

  it("follows the game's data where the wiki disagreed", () => {
    expect(bestiary.enemy('bell-bearing-hunter')!.forms[0].negation.pierce).toBe(10)
    expect(headline(bestiary.enemy('bell-bearing-hunter')!).weak).not.toContain('pierce')
    expect(bestiary.enemy('death-rite-bird')!.forms[0].buildup.rot).toBe(252)
    expect(bestiary.enemy('death-knight')!.forms[0].buildup.sleep).toBe(252)
    expect(bestiary.enemy('lord-of-blood')!.forms[0].buildup.bleed).toBe(112)
  })

  it('reads Golden Hippopotamus as weak to fire and lightning, with poison and rot fastest', () => {
    const verdict = assess(bestiary.named('Golden Hippopotamus')!.forms)
    expect(verdict.weakTo).toEqual(['fire', 'lightning'])
    expect(verdict.fastest).toEqual(['poison', 'rot'])
    expect(verdict.immuneTo).toEqual(['sleep', 'madness'])
  })
})
