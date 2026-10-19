export const DAMAGE_TYPES = ['standard', 'slash', 'strike', 'pierce', 'magic', 'fire', 'lightning', 'holy'] as const
export const STATUSES = ['bleed', 'frost', 'rot', 'poison', 'sleep', 'madness'] as const

export type DamageType = (typeof DAMAGE_TYPES)[number]
export type Status = (typeof STATUSES)[number]
export type Affliction = DamageType | Status

/** Percent. Below zero, the enemy takes more of that damage. */
export type Negation = Record<DamageType, number>
/** The buildup it takes to proc. Lower procs faster. */
export type Buildup = Record<Status, number | 'immune'>

/** One phase of a fight, or one member of a group. `label` is null when the fight has a single form. */
export interface Form {
  label: string | null
  negation: Negation
  buildup: Buildup
}

/** An enemy with no forms has no trustworthy numbers anywhere. */
export interface Enemy {
  id: string
  name: string
  forms: Form[]
}

/** The weakness the game itself names, which can be a status no negation shows. */
export interface Nightlord extends Enemy {
  named: Affliction
}

export const isStatus = (a: Affliction): a is Status => (STATUSES as readonly string[]).includes(a)
