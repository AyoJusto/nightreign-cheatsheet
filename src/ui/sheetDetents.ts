export type Detent = 'peek' | 'half' | 'full'

export interface SheetMeasure {
  frame: number
  grab: number
  content: number
  safeTop: number
  safeBottom: number
  safeLeft: number
  safeRight: number
  pillBottom: number
}

export const HALF_MAX = 0.66
const PILL_GAP = 0

export function detentHeights(m: SheetMeasure): Record<Detent, number> {
  const peek = m.grab + m.safeBottom
  const top = m.pillBottom > 0 ? m.pillBottom : m.safeTop
  const full = Math.max(peek, m.frame - top - PILL_GAP)
  const fitted = m.grab + m.content + m.safeBottom
  const half = Math.min(full, Math.max(peek, Math.min(fitted, Math.round(m.frame * HALF_MAX))))
  return { peek, half, full }
}
