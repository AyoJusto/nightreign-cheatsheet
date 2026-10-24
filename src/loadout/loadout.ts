export type EffectGroup = 'relics' | 'weapons'

export type EffectPool = 'base' | 'deep' | 'dormant'

export interface Effect {
  group: EffectGroup
  pool: EffectPool
  cats: string[]
  stack: string
  title: string
  effect: string
  notes?: string
  keywords?: string
}

export interface BuildLine {
  effect: string
  as?: string
  curses?: string[]
}

export interface BuildSlot {
  n: 1 | 2 | 3
  label?: string
  lines: BuildLine[]
}

export interface Build {
  name: string
  relics: BuildSlot[]
  deep: BuildSlot[]
}

export interface CharacterBuilds {
  slug: string
  name: string
  builds: Build[]
}
