export type EffectGroup = 'relics' | 'weapons'

/** Deep of Night has its own relic and weapon pools; dormant powers are a third weapon pool. */
export type EffectPool = 'base' | 'deep' | 'dormant'

export interface Effect {
  group: EffectGroup
  pool: EffectPool
  cats: string[]
  /** Verbatim "Stackable with self?" answer, ragged ones ("See Notes", "Yes?", "") included. */
  stack: string
  title: string
  /** What it actually does. Never searched: it is the answer, not the question. */
  effect: string
  notes?: string
  /** Never displayed. Words behind a [Status] template or a dormant power's opaque name. */
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
  /** Depth relics, which only apply in Deep of Night. */
  deep: BuildSlot[]
}

export interface CharacterBuilds {
  slug: string
  name: string
  builds: Build[]
}
