import data from '../data/enemies.json' with { type: 'json' }
import { assess } from './assess'
import { isStatus, type Affliction, type Enemy, type Nightlord } from './enemy'

const enemies = data.enemies as Enemy[]
const nightlords = data.nightlords as Nightlord[]
const byId = new Map(enemies.map((e) => [e.id, e]))
const nightNames = data.nightNames as Record<string, string>
const names = data.names as Record<string, string>

/** The short form a card shows: what to hit it with, what not to, and for a Nightlord the statuses that land. */
export interface Headline { weak: Affliction[]; resist: Affliction[]; status: Affliction[] }

export const bestiary = {
  all: enemies,
  nightlords,
  enemy: (id: string) => byId.get(id),
  /** A name as a seed's map, castle or camp writes it. */
  named: (seedName: string) => byId.get(names[seedName]),
  /** A night's boss, as a seed names the fight. */
  nightBoss: (seedName: string) => byId.get(nightNames[seedName]),
  nightlord: (id: string) => nightlords.find((n) => n.id === id),
}

export function headline(enemy: Enemy): Headline {
  const verdict = assess(enemy.forms)
  return { weak: verdict.weakTo, resist: verdict.resists, status: [] }
}

/** The game's named weakness leads; a Nightlord named for a damage type also lists the statuses that build fastest. */
export function nightlordHeadline(nightlord: Nightlord): Headline {
  const verdict = assess(nightlord.forms)
  return {
    weak: [nightlord.named, ...verdict.weakTo.filter((k) => k !== nightlord.named)],
    resist: verdict.resists,
    status: isStatus(nightlord.named) ? [] : verdict.fastest,
  }
}
