// Map coordinates are image units: 0..1000 across the square map image on both axes.

export interface Box { x0: number; y0: number; x1: number; y1: number }

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
/**
 * An obstacle; `weight` scales how much covering it counts when no spot is free (default 1). A `round` one is the
 * circle inscribed in its box (a night's ring): a label's box touches it only where it reaches inside the circle.
 */
export type Obstacle = Rect & { weight?: number; round?: boolean }

/**
 * Where a label goes around a mark, as its top-left corner in frame px: below, above, right or left of the mark,
 * then the four diagonals, `gap` px off the mark's `box` (by default the point itself, so `gap` is from the point),
 * kept `edge` px inside the frame. A negative gap tucks the label over the top or bottom edge of its own art. A
 * `ring`'s name goes centred above its ring, then below it or beside it, touching the ring, covering nothing and reading
 * as its own, not one of `others`, else inside the ring across the lower half of its disc (`inside`). For other names: the frame's
 * visible band runs from `top` (what covers the top of the screen, such as a pill) down to `h`. The point's own glyph
 * (`mark` px around it) is never covered: near an edge, keeping a spot inside the frame can push it back over the
 * point, so spots are judged after that clamp, and one over the point is dropped. Of the rest, the first that covers
 * none of `obstacles` wins; if every one covers something, the one covering the least area (each obstacle's area
 * scaled by its weight), with `clear: false`.
 * A spot must also read as this mark's name: the frame's edge may not push it more than DRIFT px from where it
 * belongs, and its centre may not lie nearer any of `others` (the other marks' boxes) than its own mark (its `box`,
 * or `mark` px around the point): measured to the boxes, so a large site's name just under its art still counts as its
 * own. A name whose centre fails that still counts when its box touches its own mark (within its gap) and every other
 * mark is CLEAR_OF_OTHERS px further from it. When no spot qualifies the best of the rest is returned with `own: false`; only a name that must show uses it.
 */
export function placeLabel(
  point: { x: number; y: number },
  label: { w: number; h: number },
  frame: { w: number; h: number; top?: number },
  obstacles: Obstacle[],
  gap: number,
  edge: number,
  mark = 0,
  ring = false,
  others: readonly Rect[] = [],
  box?: Rect,
): { x: number; y: number; clear: boolean; own: boolean; inside?: boolean } {
  const top = frame.top ?? 0
  const keepIn = (v: number, size: number, start: number, end: number) => Math.max(start + edge, Math.min(end - edge - size, v))
  const glyph = { x0: point.x - mark, y0: point.y - mark, x1: point.x + mark, y1: point.y + mark }
  const mine = box ?? glyph
  // Whether a spot, before and after the frame clamp, still reads as this mark's name.
  const belongs = (raw: { x: number; y: number }, s: { x: number; y: number }) => {
    if (Math.abs(s.x - raw.x) > DRIFT || Math.abs(s.y - raw.y) > DRIFT) return false
    const cx = s.x + label.w / 2
    const cy = s.y + label.h / 2
    const rect = { x0: s.x, y0: s.y, x1: s.x + label.w, y1: s.y + label.h }
    // A long name centred on its own mark can still run on past its sides, right over or under another mark, named
    // or not, and read as that mark's name there: no other mark whose middle lies under or over the name beyond its
    // own mark's sides may come within END_CLEAR px of it. A night's name is in the game's face and needs no such test.
    const overEnd = (o: Rect) => {
      const mid = (o.x0 + o.x1) / 2
      const beyond = mid < mine.x0 || mid > mine.x1
      return beyond && mid > rect.x0 && mid < rect.x1 && Math.max(o.y0 - rect.y1, rect.y0 - o.y1) < END_CLEAR
    }
    if (!ring && others.some(overEnd)) return false
    const own = distanceTo(mine, cx, cy)
    if (others.every((o) => distanceTo(o, cx, cy) >= own)) return true
    // A long name beside a small mark: its middle may lie nearer a neighbour, but it touches its own mark and keeps
    // well clear of every other one, so it still reads as its own.
    const touching = boxDistance(mine, rect)
    return touching <= Math.abs(gap) + 2 && others.every((o) => boxDistance(o, rect) >= touching + CLEAR_OF_OTHERS)
  }
  const around = box ?? { x0: point.x, y0: point.y, x1: point.x, y1: point.y }
  const cx = (around.x0 + around.x1) / 2
  const cy = (around.y0 + around.y1) / 2
  // Spots `v` px above or below the mark and `h` px beside it.
  const ringOf = (v: number, h: number) => [
    { x: cx - label.w / 2, y: around.y1 + v },
    { x: cx - label.w / 2, y: around.y0 - v - label.h },
    { x: around.x1 + h, y: cy - label.h / 2 },
    { x: around.x0 - h - label.w, y: cy - label.h / 2 },
    { x: around.x1 + h * 0.7, y: around.y1 + v * 0.7 },
    { x: around.x0 - h * 0.7 - label.w, y: around.y1 + v * 0.7 },
    { x: around.x1 + h * 0.7, y: around.y0 - v * 0.7 - label.h },
    { x: around.x0 - h * 0.7 - label.w, y: around.y0 - v * 0.7 - label.h },
    // Each side again, slid along it to line up with one end of the mark.
    { x: around.x1 - label.w, y: around.y1 + v },
    { x: around.x0, y: around.y1 + v },
    { x: around.x1 - label.w, y: around.y0 - v - label.h },
    { x: around.x0, y: around.y0 - v - label.h },
    { x: around.x1 + h, y: around.y1 - label.h },
    { x: around.x1 + h, y: around.y0 },
    { x: around.x0 - h - label.w, y: around.y1 - label.h },
    { x: around.x0 - h - label.w, y: around.y0 },
  ]
  const clamp = (s: { x: number; y: number }) => ({ x: keepIn(s.x, label.w, 0, frame.w), y: keepIn(s.y, label.h, top, frame.h) })
  const rectAt = (s: { x: number; y: number }) => ({ x0: s.x, y0: s.y, x1: s.x + label.w, y1: s.y + label.h })
  // Whole px²: a spot's float error must not beat an earlier spot covering just as much.
  const coverage = (s: { x: number; y: number }) => Math.round(obstacles.reduce((sum, o) => sum + covers(rectAt(s), o) * (o.weight ?? 1), 0))
  if (ring) {
    // A night's name: above its ring, below it, then beside it, where it touches the ring (RING_TOUCH px of its
    // circle), covers nothing and reads as the ring's, not a neighbour's (the test every name passes). Failing all
    // four, it goes inside the ring, across the lower half of its disc, as the game's reference map writes it.
    const r = (around.x1 - around.x0) / 2
    const [below, above, right, left] = ringOf(gap, gap)
    const fits = (raw: { x: number; y: number }) => {
      const s = clamp(raw)
      return belongs(raw, s) && distanceTo(rectAt(s), cx, cy) - r <= RING_TOUCH && coverage(s) === 0
    }
    const outside = [above, below, right, left].find(fits)
    if (outside) return { ...clamp(outside), clear: true, own: true }
    const inside = clamp({ x: cx - label.w / 2, y: cy + r / 2 - label.h / 2 })
    return { ...inside, clear: coverage(inside) === 0, own: true, inside: true }
  }
  // A negative gap tucks a name over the top or bottom edge of its own art, never its sides, where the art is dense.
  // Where the tuck is refused (it would cover the mark's own badge), the same spots clear of the mark come next.
  const raws = gap < 0 ? [...ringOf(gap, 1), ...ringOf(1, 1)] : ringOf(gap, gap)
  const spots = raws.map(clamp)
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
    const area = coverage(spot)
    if (area === 0) return { ...spot, clear: true, own }
    if (area < least) { least = area; best = spot }
  }
  return { ...best, clear: false, own }
}

// How far apart two boxes are (0 when they touch or overlap).
const boxDistance = (a: Rect, b: Rect) => Math.hypot(Math.max(a.x0 - b.x1, 0, b.x0 - a.x1), Math.max(a.y0 - b.y1, 0, b.y0 - a.y1))
// How far a point is from a box (0 inside it).
const distanceTo = (r: Rect, x: number, y: number) =>
  Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.y0 - y, 0, y - r.y1))

// How far (px) the frame's edge may push a name from its spot before it stops reading as that mark's name.
const DRIFT = 4
// How much further (px) than its own mark every other mark must be from a name that is judged by its edge.
const CLEAR_OF_OTHERS = 10
// How near (px, about a line of a name) another mark may come to a name before the end nearest it reads as its name.
const END_CLEAR = 12
// A night's name lies within this many px of its ring's circle.
const RING_TOUCH = 6

const MARKER_WEIGHT = 15
// A label placed before is never covered, so spots over one cost far more than any mark's.
const LABEL_WEIGHT = 1000
// The space (px) kept round a name placed before: two names of different marks never read as one caption.
const LABEL_PAD = 4
const overlapArea = (a: Rect, b: Rect) => {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)
  return w > 0 && h > 0 ? w * h : 0
}
/** How much of `o` the box `a` covers (px²); a round obstacle counts only when the box reaches inside its circle. */
function covers(a: Rect, o: Obstacle): number {
  const area = overlapArea(a, o)
  if (!area || !o.round) return area
  const r = (o.x1 - o.x0) / 2
  return distanceTo(a, o.x0 + r, o.y0 + r) < r ? area : 0
}

export interface LabelRequest {
  point: { x: number; y: number }
  label: { w: number; h: number }
  /** Placement order, lowest first: circles, then bosses, then the rest. Ties keep their input order. */
  rank: number
  /** Shown even with no free spot (a night's ring name); every other label then hides, leaving its glyph. */
  keep: boolean
  /** Distance from the mark (its `box`, or the point) to the label; negative lies over the edge of its own art. */
  gap?: number
  /** Half the size of the mark on the point, which no label covers, when it is not the default glyph. */
  mark?: number
  /** A night's ring: its name goes centred above the ring, below it or beside it, else inside it (placeLabel). */
  ring?: boolean
  /**
   * The name wrapped onto two lines as narrow as its words allow. A crest's name on a phone tries it directly under
   * the mark when no spot fits the one-line box, under every rule a name follows. A night's name that falls back
   * inside its ring takes it there, centred on the disc, so it stays within the ring rather than strike across it.
   */
  wrap?: { w: number; h: number }
  /** The mark's footprint (a structure's sprite and badge): its name goes around it, and it is the mark's own. */
  box?: Rect
  /** What the mark draws, which no other name may touch; by default its glyph (`mark` px around the point). */
  body?: Obstacle[]
  /** What of its own mark its name may not cover either: a structure's element badge, and its art short of the edge it tucks over. */
  own?: Rect[]
}

/**
 * Places every marker's label so none covers a label placed before it (in `rank` order), and none touches any other
 * mark's drawn body (its art and badge, a crest, a ring's disc) or a pin: a name may lie over terrain and the edge of
 * its own art, nothing else. A label is shown only when its glyph lies inside the visible band and it found such a
 * spot that reads as its own mark's name (or it is `keep`); a shown label becomes an obstacle for the ones after it.
 * `blocked` are screen areas drawn over the map (the Nightlord's medallion and its card): no label crosses one, a
 * kept one included, and a glyph under one gets no label, since nobody can see the mark it would name.
 * A name placed keeps LABEL_PAD px from the next beside it, and half a `line` (the names' line height) above and
 * below it, so two names of different marks never stack into what reads as one two-line name.
 * Returns one result per request, in input order, with the label's top-left corner in frame px; `wrapped` when it
 * is the request's `wrap` box that shows.
 */
export function placeLabels(
  requests: readonly LabelRequest[],
  frame: { w: number; h: number; top?: number },
  pins: readonly Rect[],
  gap: number,
  edge: number,
  mark: number,
  blocked: readonly Rect[] = [],
  line = 0,
): { x: number; y: number; shown: boolean; wrapped?: boolean }[] {
  const top = frame.top ?? 0
  // Covering a mark hides what it marks, and text over text is unreadable: when a kept label has no free spot,
  // covering either costs about as much as covering a whole pin, so a pin's edge loses first.
  const markOf = (r: LabelRequest) => r.mark ?? mark
  const bodies = requests.map((r): Obstacle[] => {
    if (r.body) return r.body.map((b) => ({ ...b, weight: MARKER_WEIGHT }))
    const m = markOf(r)
    return [{ x0: r.point.x - m, y0: r.point.y - m, x1: r.point.x + m, y1: r.point.y + m, weight: MARKER_WEIGHT }]
  })
  const order = requests.map((_, i) => i).sort((a, b) => requests[a].rank - requests[b].rank || a - b)
  const placed: Obstacle[] = blocked.map((b) => ({ ...b, weight: LABEL_WEIGHT }))
  const results: { x: number; y: number; shown: boolean; wrapped?: boolean }[] = new Array(requests.length)
  for (const i of order) {
    const request = requests[i]
    const { point, label, keep } = request
    const m = markOf(request)
    // Every other mark's body is in the way. A ring's disc is too, but no name reads as a ring's (the night's own
    // name is in the game's face), so it does not count when judging whose name a spot reads as.
    const marks: Obstacle[] = [...pins]
    const nearest: Rect[] = [...pins]
    bodies.forEach((body, j) => {
      if (j === i) return
      marks.push(...body)
      if (!requests[j].ring) nearest.push(...body)
    })
    const own = (request.own ?? []).map((o) => ({ ...o, weight: MARKER_WEIGHT }))
    const obstacles = [...marks, ...placed, ...own]
    const markGap = request.gap ?? gap
    let size = label
    let wrapped = false
    let spot = placeLabel(point, label, frame, obstacles, markGap, edge, m, request.ring, nearest, request.box)
    if (spot.inside && request.wrap && request.box) {
      const { x0, y0, x1, y1 } = request.box
      spot = { ...spot, x: (x0 + x1) / 2 - request.wrap.w / 2, y: (y0 + y1) / 2 - request.wrap.h / 2 }
      size = request.wrap
      wrapped = true
    }
    // The two-line wrap, directly under the mark and nowhere else: the spot placeLabel tries first, clamped by nothing.
    if (!(spot.own && spot.clear) && request.wrap) {
      const around = request.box ?? { x0: point.x - m, y0: point.y - m, x1: point.x + m, y1: point.y + m }
      const under = placeLabel(point, request.wrap, frame, obstacles, markGap, edge, m, false, nearest, request.box)
      const x = (around.x0 + around.x1) / 2 - request.wrap.w / 2
      const y = request.box ? around.y1 + markGap : point.y + markGap
      if (under.own && under.clear && under.x === x && under.y === y) {
        spot = under
        size = request.wrap
        wrapped = true
      }
    }
    const rect = { x0: spot.x, y0: spot.y, x1: spot.x + size.w, y1: spot.y + size.h }
    // A glyph partly under the pill or the sheet, or past a side of the screen, has no place for its label:
    // clamped into the band, it would float away from its glyph.
    const inBand = point.y - m >= top && point.y + m <= frame.h && point.x - m >= 0 && point.x + m <= frame.w
    const underBlock = blocked.some((b) => point.x > b.x0 && point.x < b.x1 && point.y > b.y0 && point.y < b.y1)
    const acrossBlock = blocked.some((b) => overlapArea(rect, b) > 0)
    const shown = inBand && !underBlock && !acrossBlock && (keep || (spot.own && spot.clear))
    // Kept apart from the next name, so two names never run together into one: a little side by side, and half a
    // line above and below, where the gap between a wrapped name's own lines would make two names read as one.
    const padY = Math.max(LABEL_PAD, line / 2)
    if (shown) placed.push({ x0: rect.x0 - LABEL_PAD, y0: rect.y0 - padY, x1: rect.x1 + LABEL_PAD, y1: rect.y1 + padY, weight: LABEL_WEIGHT })
    results[i] = { x: spot.x, y: spot.y, shown, ...(wrapped && { wrapped }) }
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

/** What a name on the map belongs to; see labelRank. `repeat` is a site's name already written at another site. */
export type NameKind = 'night' | 'castle' | 'site' | 'boss' | 'evergaol' | 'repeat' | 'chest' | 'other'
const NAME_ORDER: readonly NameKind[] = ['night', 'castle', 'site', 'boss', 'evergaol', 'repeat', 'chest', 'other']
/**
 * Which names get first pick of the free room: the nights' bosses, then the castle's, then what is inside each
 * site, then field bosses and evergaols, then a site's name the map already shows elsewhere (the fifth Spider
 * Scorpions tells less than an evergaol's boss), then chests. A name placed later yields to every one placed before it.
 */
export const labelRank = (kind: NameKind) => NAME_ORDER.indexOf(kind)

/**
 * How big a mark is drawn, in screen px, for a map this many px wide on screen. It follows the map as it zooms,
 * like the game's own map, between a floor (still legible zoomed out on a phone) and a cap (zoomed in, it
 * would hide the ground it marks). Sizes are a share of the map as drawn, not fixed px, so a wider map gets larger
 * marks: structure art is 8% of its width at the fitted zoom (about 46px on a phone's 574px map and 97px on a
 * desktop's 1209px one), close to the reference's 9%; crests and rings keep their proportion to the art.
 */
const MARK_SIZES = {
  art: { share: 0.08, min: 28, max: 140 },
  // The unknown-site glow's bright core (its image carries a softer halo around it); see orbSize.
  orb: { share: 0.033, min: 16, max: 60 },
  // Boss crests, evergaols, chests, and the player's own marker.
  icon: { share: 0.036, min: 26, max: 64 },
  // A night's closing ring.
  ring: { share: 0.11, min: 64, max: 300 },
} as const
export type MarkKind = keyof typeof MARK_SIZES
export function markSize(kind: MarkKind, mapWidth: number): number {
  const { share, min, max } = MARK_SIZES[kind]
  return Math.min(max, Math.max(min, mapWidth * share))
}

/**
 * The unknown-site glow's core, in screen px: about the footprint of a structure's sprite, as the game's own, and
 * never wider than the gap between the two nearest sites (`spacing`, in map units), so no two glows run together.
 */
export const orbSize = (mapWidth: number, spacing: number) =>
  Math.min(markSize('orb', mapWidth), (spacing * mapWidth) / 1000 - 0.5)

/** The distance between the two nearest of `points` (map units). */
export function minSpacing(points: readonly { x: number; y: number }[]): number {
  let least = Infinity
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) least = Math.min(least, Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y))
  }
  return least
}

/**
 * Each kind's sprite, height over width (public/structures, drawn to fit a square box): how much of the box it
 * really fills, so map names can sit close under a low township and beside a tall rise.
 */
export const ART_ASPECT: Record<string, number> = {
  'blacksmith-village': 0.58, church: 1.36, 'eastern-underground-fort': 0.66, fort: 0.77, 'great-church': 0.9,
  'main-encampment': 0.62, marsh: 0.86, 'ruined-rise': 1.87, ruins: 0.56, 'scale-bearing-merchant': 1.22,
  'sorcerers-rise': 2.06, township: 0.44, 'western-underground-fort': 0.68,
}

/**
 * What a structure's art really covers on screen, drawn `size` px square about `at`: its sprite (`aspect` is height
 * over width, fitted inside the square), and the element badge in the square's lower-right corner, 0.4 of its size.
 */
export function artFootprint(at: { x: number; y: number }, size: number, aspect: number, badge: boolean): Rect[] {
  const w = size * Math.min(1, 1 / aspect)
  const h = size * Math.min(1, aspect)
  const sprite = { x0: at.x - w / 2, y0: at.y - h / 2, x1: at.x + w / 2, y1: at.y + h / 2 }
  if (!badge) return [sprite]
  const corner = size / 2
  const b = size * 0.4
  return [sprite, { x0: at.x + corner - b, y0: at.y + corner - b, x1: at.x + corner, y1: at.y + corner }]
}

/**
 * A night boss as its ring names it, on one line: the lead of a named pair ("Tree Sentinel and Royal Cavalrymen"),
 * and a name too long for a phone's line by the short name the sheets also use.
 */
export const shortBossName = (name: string) => {
  const lead = name.split(' and ')[0]
  return RING_NAMES[lead] ?? lead
}
const RING_NAMES: Record<string, string> = { 'Dancer of the Boreal Valley': 'Dancer' }
