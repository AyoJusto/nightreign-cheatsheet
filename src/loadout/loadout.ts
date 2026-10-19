export type EffectGroup = 'relics' | 'weapons'

/** Deep of Night has its own relic and weapon pools; dormant powers are a third weapon pool. */
export type EffectPool = 'base' | 'deep' | 'dormant'

export interface Effect {
  group: EffectGroup
  pool: EffectPool
  /** A list because a few rows are filed as "Offensive/Defensive". */
  cats: string[]
  /** Verbatim "Stackable with self?" answer, ragged ones ("See Notes", "Yes?", "") included. */
  stack: string
  /** The text the game shows, and what search matches. */
  title: string
  /** What it actually does. Never searched: it is the answer, not the question. */
  effect: string
  notes?: string
  /** Never displayed. Words behind a [Status] template or a dormant power's opaque name. */
  keywords?: string
}

export interface BuildLine {
  /** The canonical relic effect title, the key into the effects data. */
  effect: string
  /** The sheet's own wording, when it says more than the canonical title. */
  as?: string
  /** Canonical titles of the drawbacks a deep effect drags along. */
  curses?: string[]
}

export interface BuildSlot {
  n: 1 | 2 | 3
  /** The relic's name, or the variant's name when two slots share `n`. */
  label?: string
  /** Four when the sheet offered a choice between two effects. */
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
