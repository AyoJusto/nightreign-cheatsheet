export type Detent = 'peek' | 'half' | 'full'

/** What the Sheet measures on screen, in CSS px. pillBottom is 0 when no pill is showing. */
export interface SheetMeasure {
  frame: number // visible viewport height
  grab: number // the grab handle and header
  content: number // what the half detent should show below the header
  safeTop: number
  safeBottom: number
  pillBottom: number
}

// Half never covers much more than half the screen, so the map stays usable; longer content scrolls.
// 0.6, not 0.5: a six-row run card under the header needs about 58% of Safari's 659px iPhone 15 viewport.
export const HALF_MAX = 0.6
const PILL_GAP = 8

export function detentHeights(m: SheetMeasure): Record<Detent, number> {
  // The header clears the home indicator at peek.
  const peek = m.grab + m.safeBottom
  const top = m.pillBottom > 0 ? m.pillBottom : m.safeTop
  const full = Math.max(peek, m.frame - top - PILL_GAP)
  const fitted = m.grab + m.content + m.safeBottom
  const half = Math.min(full, Math.max(peek, Math.min(fitted, Math.round(m.frame * HALF_MAX))))
  return { peek, half, full }
}
