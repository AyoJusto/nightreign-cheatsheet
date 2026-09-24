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

/**
 * The pin closest to `point` within `radius` (all in image units). A `preferred` pin in reach wins
 * over any nearer other pin, so the pins the current step asks for are never out-tapped by a neighbour.
 */
export function nearestPin<P extends { x: number; y: number }>(
  pins: readonly P[], point: { x: number; y: number }, radius: number, preferred?: (pin: P) => boolean,
): P | null {
  return (preferred && closest(pins.filter(preferred), point, radius)) || closest(pins, point, radius)
}

function closest<P extends { x: number; y: number }>(pins: readonly P[], point: { x: number; y: number }, radius: number): P | null {
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

// iOS scroll views use this constant: the edge gives way less and less the further it is pulled.
const RUBBERBAND = 0.55
const resist = (overshoot: number, dimension: number) => (overshoot * dimension * RUBBERBAND) / (dimension + RUBBERBAND * overshoot)

/** `v` held to [min, max] with elastic give past either end; `dimension` is the visible length on that axis. */
export function rubberband(v: number, min: number, max: number, dimension: number): number {
  if (v < min) return min - resist(min - v, dimension)
  if (v > max) return max + resist(v - max, dimension)
  return v
}

export interface Rect { x0: number; y0: number; x1: number; y1: number }
/** An obstacle; `weight` scales how much covering it counts when no spot is free (default 1). */
export type Obstacle = Rect & { weight?: number }

/**
 * Where a label goes around a point, as its top-left corner in frame px: below, above, right or left of
 * the point, then the four diagonals, kept `edge` px inside the frame. The frame's visible band runs from
 * `top` (what covers the top of the screen, such as a pill) down to `h`. The point's own glyph (`mark` px
 * around it) is never covered: near an edge, keeping a spot inside the frame can push it back over the
 * point, so spots are judged after that clamp, and one over the point is dropped. Of the rest, the first
 * that covers none of `obstacles` wins; if every one covers something, the one covering the least area
 * (each obstacle's area scaled by its weight), with `clear: false`.
 */
export function placeLabel(
  point: { x: number; y: number },
  label: { w: number; h: number },
  frame: { w: number; h: number; top?: number },
  obstacles: Obstacle[],
  gap: number,
  edge: number,
  mark = 0,
): { x: number; y: number; clear: boolean } {
  const top = frame.top ?? 0
  const keepIn = (v: number, size: number, start: number, end: number) => Math.max(start + edge, Math.min(end - edge - size, v))
  const spots = [
    { x: point.x - label.w / 2, y: point.y + gap },
    { x: point.x - label.w / 2, y: point.y - gap - label.h },
    { x: point.x + gap, y: point.y - label.h / 2 },
    { x: point.x - gap - label.w, y: point.y - label.h / 2 },
    { x: point.x + gap * 0.7, y: point.y + gap * 0.7 },
    { x: point.x - gap * 0.7 - label.w, y: point.y + gap * 0.7 },
    { x: point.x + gap * 0.7, y: point.y - gap * 0.7 - label.h },
    { x: point.x - gap * 0.7 - label.w, y: point.y - gap * 0.7 - label.h },
  ].map((s) => ({ x: keepIn(s.x, label.w, 0, frame.w), y: keepIn(s.y, label.h, top, frame.h) }))
  const overlap = (s: { x: number; y: number }, o: Obstacle) => {
    const w = Math.min(s.x + label.w, o.x1) - Math.max(s.x, o.x0)
    const h = Math.min(s.y + label.h, o.y1) - Math.max(s.y, o.y0)
    return w > 0 && h > 0 ? w * h * (o.weight ?? 1) : 0
  }
  const glyph = { x0: point.x - mark, y0: point.y - mark, x1: point.x + mark, y1: point.y + mark }
  const overPoint = (s: { x: number; y: number }) =>
    s.x <= glyph.x1 && s.x + label.w >= glyph.x0 && s.y <= glyph.y1 && s.y + label.h >= glyph.y0
  const clearOfPoint = spots.filter((s) => !overPoint(s))
  // Only a frame too small for the label leaves no spot off the point; then the point loses.
  const candidates = clearOfPoint.length ? clearOfPoint : spots
  let best = candidates[0]
  let least = Infinity
  for (const spot of candidates) {
    const area = obstacles.reduce((sum, o) => sum + overlap(spot, o), 0)
    if (area === 0) return { ...spot, clear: true }
    if (area < least) { least = area; best = spot }
  }
  return { ...best, clear: false }
}

const MARKER_WEIGHT = 15

export interface LabelRequest {
  point: { x: number; y: number }
  label: { w: number; h: number }
  /** Placement order, lowest first: circles, then bosses, then the rest. Ties keep their input order. */
  rank: number
  /** Shown even with no free spot (a night's circle chip); every other label then hides, leaving its glyph. */
  keep: boolean
}

/**
 * Places every marker's label so none covers a pin, any marker's glyph (`mark` px around each point) or a
 * label placed before it, in `rank` order. A label is shown only when its glyph lies inside the visible band
 * and it found a free spot (or is `keep`); a shown label becomes an obstacle for the ones after it.
 * Returns one result per request, in input order, with the label's top-left corner in frame px.
 */
export function placeLabels(
  requests: readonly LabelRequest[],
  frame: { w: number; h: number; top?: number },
  pins: readonly Rect[],
  gap: number,
  edge: number,
  mark: number,
): { x: number; y: number; shown: boolean }[] {
  const top = frame.top ?? 0
  // A glyph is tiny but covering it hides a whole marker, and text over text is unreadable: when a kept label
  // has no free spot, covering either costs about as much as covering a whole pin, so a pin's edge loses first.
  const glyphs = requests.map(({ point: p }) => ({ x0: p.x - mark, y0: p.y - mark, x1: p.x + mark, y1: p.y + mark, weight: MARKER_WEIGHT }))
  const order = requests.map((_, i) => i).sort((a, b) => requests[a].rank - requests[b].rank || a - b)
  const placed: Obstacle[] = []
  const results: { x: number; y: number; shown: boolean }[] = new Array(requests.length)
  for (const i of order) {
    const { point, label, keep } = requests[i]
    const obstacles = [...pins, ...glyphs.filter((_, j) => j !== i), ...placed]
    const spot = placeLabel(point, label, frame, obstacles, gap, edge, mark)
    // A glyph partly under the pill or the sheet has no place for its label: clamped into the band, it would
    // float away from its glyph.
    const inBand = point.y - mark >= top && point.y + mark <= frame.h
    const shown = inBand && (spot.clear || keep)
    if (shown) placed.push({ x0: spot.x, y0: spot.y, x1: spot.x + label.w, y1: spot.y + label.h, weight: MARKER_WEIGHT })
    results[i] = { x: spot.x, y: spot.y, shown }
  }
  return results
}

/**
 * The translation that keeps the screen point `p` still while the layer zooms from `s0` to `s1`.
 * `t` and `p` are measured from the frame's centre, where the layer's transform origin sits at t = 0.
 */
export function zoomAbout(t: { x: number; y: number }, s0: number, s1: number, p: { x: number; y: number }): { x: number; y: number } {
  const ratio = s1 / s0
  return { x: p.x - (p.x - t.x) * ratio, y: p.y - (p.y - t.y) * ratio }
}

// A trackpad sends pixel deltas of a few px per event; a mouse wheel notch is tens to hundreds.
const TRACKPAD_MAX_DELTA = 50

/**
 * Whether a (non-pinch) wheel event is a trackpad's two-finger scroll, which pans, rather than a mouse
 * wheel, which zooms. Browsers do not say which device sent it, so this is a heuristic: only a trackpad
 * (or a tilt wheel) scrolls sideways, and a trackpad sends small, often fractional pixel deltas, where a
 * wheel notch is whole pixels, lines or pages.
 */
export function isTrackpadScroll(e: { deltaX: number; deltaY: number; deltaMode: number }): boolean {
  if (e.deltaX !== 0) return true
  const fractional = !Number.isInteger(e.deltaY)
  return e.deltaMode === 0 && fractional && Math.abs(e.deltaY) < TRACKPAD_MAX_DELTA
}
