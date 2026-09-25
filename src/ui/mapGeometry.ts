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
 * A spot must also read as this point's name: the frame's edge may not push it more than DRIFT px from where it
 * belongs, and its centre may not lie nearer any of `others` (the other marks' points) than this point. When no
 * spot qualifies the best of the rest is returned with `own: false`; only a name that must show uses it.
 */
export function placeLabel(
  point: { x: number; y: number },
  label: { w: number; h: number },
  frame: { w: number; h: number; top?: number },
  obstacles: Obstacle[],
  gap: number,
  edge: number,
  mark = 0,
  center = false,
  others: readonly { x: number; y: number }[] = [],
): { x: number; y: number; clear: boolean; own: boolean } {
  const top = frame.top ?? 0
  const keepIn = (v: number, size: number, start: number, end: number) => Math.max(start + edge, Math.min(end - edge - size, v))
  const overlap = (s: { x: number; y: number }, o: Obstacle) => {
    const w = Math.min(s.x + label.w, o.x1) - Math.max(s.x, o.x0)
    const h = Math.min(s.y + label.h, o.y1) - Math.max(s.y, o.y0)
    return w > 0 && h > 0 ? w * h * (o.weight ?? 1) : 0
  }
  // Whether a spot, before and after the frame clamp, still reads as this point's name.
  const belongs = (raw: { x: number; y: number }, s: { x: number; y: number }) => {
    if (Math.abs(s.x - raw.x) > DRIFT || Math.abs(s.y - raw.y) > DRIFT) return false
    const cx = s.x + label.w / 2
    const cy = s.y + label.h / 2
    const own = Math.hypot(cx - point.x, cy - point.y)
    return others.every((o) => Math.hypot(cx - o.x, cy - o.y) >= own)
  }
  // A name written across its own mark (a night's ring) has one spot, on the point, kept inside the frame.
  if (center) {
    const raw = { x: point.x - label.w / 2, y: point.y - label.h / 2 }
    const spot = { x: keepIn(raw.x, label.w, 0, frame.w), y: keepIn(raw.y, label.h, top, frame.h) }
    return { ...spot, clear: obstacles.every((o) => overlap(spot, o) === 0), own: belongs(raw, spot) }
  }
  const raws = [
    { x: point.x - label.w / 2, y: point.y + gap },
    { x: point.x - label.w / 2, y: point.y - gap - label.h },
    { x: point.x + gap, y: point.y - label.h / 2 },
    { x: point.x - gap - label.w, y: point.y - label.h / 2 },
    { x: point.x + gap * 0.7, y: point.y + gap * 0.7 },
    { x: point.x - gap * 0.7 - label.w, y: point.y + gap * 0.7 },
    { x: point.x + gap * 0.7, y: point.y - gap * 0.7 - label.h },
    { x: point.x - gap * 0.7 - label.w, y: point.y - gap * 0.7 - label.h },
  ]
  const spots = raws.map((s) => ({ x: keepIn(s.x, label.w, 0, frame.w), y: keepIn(s.y, label.h, top, frame.h) }))
  const glyph = { x0: point.x - mark, y0: point.y - mark, x1: point.x + mark, y1: point.y + mark }
  const overPoint = (s: { x: number; y: number }) =>
    s.x <= glyph.x1 && s.x + label.w >= glyph.x0 && s.y <= glyph.y1 && s.y + label.h >= glyph.y0
  const clearOfPoint = spots.filter((s) => !overPoint(s))
  // Only a frame too small for the label leaves no spot off the point; then the point loses.
  const fallback = clearOfPoint.length ? clearOfPoint : spots
  const faithful = fallback.filter((s) => belongs(raws[spots.indexOf(s)], s))
  const own = faithful.length > 0
  const candidates = own ? faithful : fallback
  let best = candidates[0]
  let least = Infinity
  for (const spot of candidates) {
    const area = obstacles.reduce((sum, o) => sum + overlap(spot, o), 0)
    if (area === 0) return { ...spot, clear: true, own }
    if (area < least) { least = area; best = spot }
  }
  return { ...best, clear: false, own }
}

// How far (px) the frame's edge may push a name from its spot before it stops reading as that mark's name.
const DRIFT = 4

const MARKER_WEIGHT = 15
// A label placed before is never covered, so spots over one cost far more than any mark's.
const LABEL_WEIGHT = 1000
// A name may lie over the edge of another mark, as the game's own names do, as long as it leaves most of that
// mark in sight (at most this share of the mark covered) and most of the name on clear ground (at most this
// share of the name over marks).
const SOFT_MARK = 0.3
const SOFT_NAME = 0.25
const overlapArea = (a: Rect, b: Rect) => {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)
  return w > 0 && h > 0 ? w * h : 0
}
const areaOf = (r: Rect) => (r.x1 - r.x0) * (r.y1 - r.y0)

export interface LabelRequest {
  point: { x: number; y: number }
  label: { w: number; h: number }
  /** Placement order, lowest first: circles, then bosses, then the rest. Ties keep their input order. */
  rank: number
  /** Shown even with no free spot (a night's ring name); every other label then hides, leaving its glyph. */
  keep: boolean
  /** Distance from the point to the label, when its mark is larger than a glyph (a structure's art). */
  gap?: number
  /** Half the size of the mark on the point, which no label covers, when it is not the default glyph. */
  mark?: number
  /** Written across the point (a night's ring, the castle's guard) instead of beside it. */
  center?: boolean
}

/**
 * Places every marker's label so none covers a label placed before it (in `rank` order) and none hides a pin or
 * any marker's glyph (`mark` px around each point): it may lie over a mark's edge, never across it (SOFT_MARK,
 * SOFT_NAME). A label is shown only when its glyph lies inside the visible band and it found such a spot (or is
 * `keep`); a shown label becomes an obstacle for the ones after it. `blocked` are screen areas drawn over the map
 * (the Nightlord's medallion and its card): no label crosses one, a kept one included, and a glyph under one gets
 * no label, since nobody can see the mark it would name.
 * Returns one result per request, in input order, with the label's top-left corner in frame px.
 */
export function placeLabels(
  requests: readonly LabelRequest[],
  frame: { w: number; h: number; top?: number },
  pins: readonly Rect[],
  gap: number,
  edge: number,
  mark: number,
  blocked: readonly Rect[] = [],
): { x: number; y: number; shown: boolean }[] {
  const top = frame.top ?? 0
  // A glyph is tiny but covering it hides a whole marker, and text over text is unreadable: when a kept label
  // has no free spot, covering either costs about as much as covering a whole pin, so a pin's edge loses first.
  const markOf = (r: LabelRequest) => r.mark ?? mark
  const glyphs = requests.map((r) => {
    const m = markOf(r)
    return { x0: r.point.x - m, y0: r.point.y - m, x1: r.point.x + m, y1: r.point.y + m, weight: MARKER_WEIGHT }
  })
  const order = requests.map((_, i) => i).sort((a, b) => requests[a].rank - requests[b].rank || a - b)
  // Every mark's point, which a name must not sit nearer than its own: the other requests and every pin.
  const pinPoints = pins.map((r) => ({ x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 }))
  const placed: Obstacle[] = blocked.map((b) => ({ ...b, weight: LABEL_WEIGHT }))
  const results: { x: number; y: number; shown: boolean }[] = new Array(requests.length)
  for (const i of order) {
    const request = requests[i]
    const { point, label, keep } = request
    const m = markOf(request)
    const marks = [...pins, ...glyphs.filter((_, j) => j !== i)]
    const others = [...pinPoints, ...requests.filter((_, j) => j !== i).map((r) => r.point)]
    const spot = placeLabel(point, label, frame, [...marks, ...placed], request.gap ?? gap, edge, m, request.center, others)
    const rect = { x0: spot.x, y0: spot.y, x1: spot.x + label.w, y1: spot.y + label.h }
    const soft = () => {
      if (placed.some((o) => overlapArea(rect, o) > 0)) return false
      let covered = 0
      for (const o of marks) {
        const a = overlapArea(rect, o)
        if (a > SOFT_MARK * areaOf(o)) return false
        covered += a
      }
      return covered <= SOFT_NAME * areaOf(rect)
    }
    // A glyph partly under the pill or the sheet, or past a side of the screen, has no place for its label:
    // clamped into the band, it would float away from its glyph.
    const inBand = point.y - m >= top && point.y + m <= frame.h && point.x - m >= 0 && point.x + m <= frame.w
    const underBlock = blocked.some((b) => point.x > b.x0 && point.x < b.x1 && point.y > b.y0 && point.y < b.y1)
    const acrossBlock = blocked.some((b) => overlapArea(rect, b) > 0)
    const shown = inBand && !underBlock && !acrossBlock && (keep || (spot.own && (spot.clear || soft())))
    if (shown) placed.push({ ...rect, weight: LABEL_WEIGHT })
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

/** What a name on the map belongs to; see labelRank. */
export type NameKind = 'night' | 'castle' | 'site' | 'boss' | 'evergaol' | 'chest' | 'other'
const NAME_ORDER: readonly NameKind[] = ['night', 'castle', 'site', 'boss', 'evergaol', 'chest', 'other']
/**
 * Which names get first pick of the free room: the nights' bosses, then the castle's, then what is inside each
 * site, then field bosses, evergaols and chests. A name placed later yields to every one placed before it.
 */
export const labelRank = (kind: NameKind) => NAME_ORDER.indexOf(kind)

/**
 * How big a mark is drawn, in screen px, for a map this many px wide on screen. It follows the map as it zooms,
 * like the game's own map, between a floor (still legible zoomed out on a phone) and a cap (zoomed in, it
 * would hide the ground it marks). `share` of the map's width is tuned to the reference's game-scale measure
 * (docs/specs/compare-2026-09-24.md): a fitted map is about 574px wide on a phone and 1209px on a desktop.
 */
const MARK_SIZES = {
  // Structure art, and the orb's visible disc (its image carries a halo around it).
  art: { share: 0.065, min: 28, max: 96 },
  orb: { share: 0.042, min: 22, max: 60 },
  // Boss crests, evergaols, chests.
  icon: { share: 0.029, min: 26, max: 48 },
  // A night's closing ring, with the boss's name written across it.
  ring: { share: 0.09, min: 64, max: 240 },
} as const
export type MarkKind = keyof typeof MARK_SIZES
export function markSize(kind: MarkKind, mapWidth: number): number {
  const { share, min, max } = MARK_SIZES[kind]
  return Math.min(max, Math.max(min, mapWidth * share))
}

/** A night boss as its ring names it: the lead of a named pair ("Tree Sentinel and Royal Cavalrymen"). */
export const shortBossName = (name: string) => name.split(' and ')[0]
