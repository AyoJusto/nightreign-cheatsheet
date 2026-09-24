// Map coordinates are image units: 0..1000 across the square map image on both axes.

export interface Box { x0: number; y0: number; x1: number; y1: number }

// Room around the outermost slots so their pins are not cut by the screen edge.
const PLAYABLE_MARGIN = 40

/** The part of the map a run takes place in: every slot, plus a small margin. */
export function playableBox(points: Iterable<{ x: number; y: number }>): Box {
  const box = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity }
  for (const { x, y } of points) {
    box.x0 = Math.min(box.x0, x)
    box.y0 = Math.min(box.y0, y)
    box.x1 = Math.max(box.x1, x)
    box.y1 = Math.max(box.y1, y)
  }
  return {
    x0: Math.max(0, box.x0 - PLAYABLE_MARGIN),
    y0: Math.max(0, box.y0 - PLAYABLE_MARGIN),
    x1: Math.min(1000, box.x1 + PLAYABLE_MARGIN),
    y1: Math.min(1000, box.y1 + PLAYABLE_MARGIN),
  }
}

/** The pin closest to `point`, if one lies within `radius` (all in image units). */
export function nearestPin<P extends { x: number; y: number }>(pins: readonly P[], point: { x: number; y: number }, radius: number): P | null {
  let best: P | null = null
  let bestDistance = Infinity
  for (const pin of pins) {
    const distance = Math.hypot(pin.x - point.x, pin.y - point.y)
    if (distance <= radius && distance < bestDistance) {
      best = pin
      bestDistance = distance
    }
  }
  return best
}
