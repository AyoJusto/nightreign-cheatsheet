import { splitStructure, type StructureKey } from '../domain/names'
import type { NameBox } from './mapNames'

export type { Box } from '../domain/seed'

const MAP_UNITS = 1000

/** The pin closest to `point` within `radius`; a `preferred` pin in reach beats any nearer other pin. */
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

const IOS_RUBBERBAND_COEFFICIENT = 0.55
const resist = (overshoot: number, visibleLength: number) =>
  (overshoot * visibleLength * IOS_RUBBERBAND_COEFFICIENT) / (visibleLength + IOS_RUBBERBAND_COEFFICIENT * overshoot)

export function rubberband(v: number, min: number, max: number, visibleLength: number): number {
  if (v < min) return min - resist(min - v, visibleLength)
  if (v > max) return max + resist(v - max, visibleLength)
  return v
}

export interface Rect { x0: number; y0: number; x1: number; y1: number }
export type Obstacle = Rect & {
  /** Scales its covered area when no spot is free (default 1). */
  weight?: number
  /** The circle inscribed in its box: a label touches it only inside the circle. */
  round?: boolean
}

type Spot = { x: number; y: number }

const MAX_CLAMP_DRIFT = 4
const CLEAR_OF_OTHERS = 10
const END_CLEARANCE = 12
const TOUCH_SLACK = 2
const BESIDE_ART_GAP = 1

/**
 * A label's top-left corner around a mark: the first spot that covers no obstacle and reads as this mark's
 * name (`own`), else the one covering least (`clear: false`). `others` are the other marks' boxes.
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
  const rectAt = (s: Spot) => ({ x0: s.x, y0: s.y, x1: s.x + label.w, y1: s.y + label.h })

  const runsOverAnotherMark = (rect: Rect) => (o: Rect) => {
    const mid = (o.x0 + o.x1) / 2
    const beyondOwnMark = mid < mine.x0 || mid > mine.x1
    return beyondOwnMark && mid > rect.x0 && mid < rect.x1 && Math.max(o.y0 - rect.y1, rect.y0 - o.y1) < END_CLEARANCE
  }
  const belongs = (raw: Spot, s: Spot) => {
    if (Math.abs(s.x - raw.x) > MAX_CLAMP_DRIFT || Math.abs(s.y - raw.y) > MAX_CLAMP_DRIFT) return false
    const rect = rectAt(s)
    if (!ring && others.some(runsOverAnotherMark(rect))) return false
    const centreX = s.x + label.w / 2
    const centreY = s.y + label.h / 2
    const ownDistance = distanceFromBox(mine, centreX, centreY)
    if (others.every((o) => distanceFromBox(o, centreX, centreY) >= ownDistance)) return true
    const touchingDistance = gapBetweenBoxes(mine, rect)
    const touchesOwnMark = touchingDistance <= Math.abs(gap) + TOUCH_SLACK
    return touchesOwnMark && others.every((o) => gapBetweenBoxes(o, rect) >= touchingDistance + CLEAR_OF_OTHERS)
  }

  const around = box ?? { x0: point.x, y0: point.y, x1: point.x, y1: point.y }
  const cx = (around.x0 + around.x1) / 2
  const cy = (around.y0 + around.y1) / 2
  const spotsAround = (v: number, h: number): Spot[] => {
    const straight = [
      { x: cx - label.w / 2, y: around.y1 + v },
      { x: cx - label.w / 2, y: around.y0 - v - label.h },
      { x: around.x1 + h, y: cy - label.h / 2 },
      { x: around.x0 - h - label.w, y: cy - label.h / 2 },
    ]
    const alignedToEnds = [
      { x: around.x1 - label.w, y: around.y1 + v },
      { x: around.x0, y: around.y1 + v },
      { x: around.x1 - label.w, y: around.y0 - v - label.h },
      { x: around.x0, y: around.y0 - v - label.h },
      { x: around.x1 + h, y: around.y1 - label.h },
      { x: around.x1 + h, y: around.y0 },
      { x: around.x0 - h - label.w, y: around.y1 - label.h },
      { x: around.x0 - h - label.w, y: around.y0 },
    ]
    return [...straight, ...alignedToEnds]
  }
  const clamp = (s: Spot) => ({ x: keepIn(s.x, label.w, 0, frame.w), y: keepIn(s.y, label.h, top, frame.h) })
  // Rounded so float error never lets a later spot beat an earlier one covering just as much.
  const coverage = (s: Spot) => Math.round(obstacles.reduce((sum, o) => sum + coveredArea(rectAt(s), o) * (o.weight ?? 1), 0))

  if (ring) {
    // Inside, never beside: beside the ring, a night's name reads as the name of whatever stands next to it.
    const inside = clamp({ x: cx - label.w / 2, y: cy - label.h / 2 })
    return { ...inside, clear: coverage(inside) === 0, own: true, inside: true }
  }

  const tucksOverArt = gap < 0
  const raws = tucksOverArt ? [...spotsAround(gap, BESIDE_ART_GAP), ...spotsAround(BESIDE_ART_GAP, BESIDE_ART_GAP)] : spotsAround(gap, gap)
  const spots = raws.map(clamp)
  const overPoint = (s: Spot) =>
    s.x <= glyph.x1 && s.x + label.w >= glyph.x0 && s.y <= glyph.y1 && s.y + label.h >= glyph.y0
  const clearOfPoint = spots.filter((s) => !overPoint(s))
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

const gapBetweenBoxes = (a: Rect, b: Rect) => Math.hypot(Math.max(a.x0 - b.x1, 0, b.x0 - a.x1), Math.max(a.y0 - b.y1, 0, b.y0 - a.y1))
const distanceFromBox = (r: Rect, x: number, y: number) =>
  Math.hypot(Math.max(r.x0 - x, 0, x - r.x1), Math.max(r.y0 - y, 0, y - r.y1))

const MARKER_WEIGHT = 15
const PLACED_LABEL_WEIGHT = 1000
const LABEL_PAD = 4
const overlapArea = (a: Rect, b: Rect) => {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)
  const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)
  return w > 0 && h > 0 ? w * h : 0
}

/** The scale (at most 1) at which `box`, centred on a disc of radius `r`, has its corners inside it; null below `minScale`. */
export function fitInDisc(box: { w: number; h: number }, r: number, minScale: number): number | null {
  const scale = Math.min(1, r / Math.hypot(box.w / 2, box.h / 2))
  return scale >= minScale ? scale : null
}

function coveredArea(a: Rect, o: Obstacle): number {
  const area = overlapArea(a, o)
  if (!area || !o.round) return area
  const r = (o.x1 - o.x0) / 2
  return distanceFromBox(a, o.x0 + r, o.y0 + r) < r ? area : 0
}

export interface LabelRequest {
  point: { x: number; y: number }
  label: { w: number; h: number }
  /** Lowest placed first; ties keep their input order. */
  rank: number
  /** Shown even with no free spot. */
  keep: boolean
  /** Negative tucks the name over the edge of its own art. */
  gap?: number
  /** Half the size of the glyph on the point. */
  mark?: number
  ring?: boolean
  /** The name on two lines as narrow as its words allow. */
  wrap?: { w: number; h: number }
  /** The smallest a night's name may shrink to inside its ring. */
  minScale?: number
  /** The night's number alone, shown inside its ring when even `minScale` does not fit. */
  digit?: { w: number; h: number }
  /** The mark's footprint, which its name goes around. */
  box?: Rect
  /** What the mark draws, which no other name may touch; defaults to its glyph. */
  body?: Obstacle[]
  /** Parts of its own mark its name may not cover either. */
  own?: Rect[]
}

type PlacedLabel = { x: number; y: number; shown: boolean; wrapped?: boolean; scale?: number; numberOnly?: boolean }

/**
 * Places labels in `rank` order so none covers an earlier one or another mark's body. `blocked` areas are drawn
 * over the map: no label crosses one and marks under one go unnamed. `line` is the names' line height.
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
): PlacedLabel[] {
  const top = frame.top ?? 0
  const markOf = (r: LabelRequest) => r.mark ?? mark
  const bodies = requests.map((r): Obstacle[] => {
    if (r.body) return r.body.map((b) => ({ ...b, weight: MARKER_WEIGHT }))
    const m = markOf(r)
    return [{ x0: r.point.x - m, y0: r.point.y - m, x1: r.point.x + m, y1: r.point.y + m, weight: MARKER_WEIGHT }]
  })
  const order = requests.map((_, i) => i).sort((a, b) => requests[a].rank - requests[b].rank || a - b)
  const placed: Obstacle[] = blocked.map((b) => ({ ...b, weight: PLACED_LABEL_WEIGHT }))
  const results: PlacedLabel[] = new Array(requests.length)
  for (const i of order) {
    const request = requests[i]
    const { point, label, keep } = request
    const m = markOf(request)
    const marks: Obstacle[] = [...pins]
    const marksANameCanBelongTo: Rect[] = [...pins]
    bodies.forEach((body, j) => {
      if (j === i) return
      marks.push(...body)
      if (!requests[j].ring) marksANameCanBelongTo.push(...body)
    })
    const own = (request.own ?? []).map((o) => ({ ...o, weight: MARKER_WEIGHT }))
    const obstacles = [...marks, ...placed, ...own]
    const markGap = request.gap ?? gap
    let size = label
    let wrapped = false
    let scale: number | undefined
    let numberOnly = false
    let spot = placeLabel(point, label, frame, obstacles, markGap, edge, m, request.ring, marksANameCanBelongTo, request.box)
    if (spot.inside && request.box) {
      const { x0, y0, x1, y1 } = request.box
      const caption = request.wrap ?? label
      const fit = fitInDisc(caption, (x1 - x0) / 2, request.minScale ?? 1)
      wrapped = request.wrap !== undefined && fit !== null
      numberOnly = fit === null
      scale = fit ?? undefined
      const shown = fit === null ? request.digit ?? caption : { w: caption.w * fit, h: caption.h * fit }
      spot = { ...spot, x: (x0 + x1) / 2 - shown.w / 2, y: (y0 + y1) / 2 - shown.h / 2 }
      size = shown
    }
    if (!request.ring && !(spot.own && spot.clear) && request.wrap) {
      const around = request.box ?? { x0: point.x - m, y0: point.y - m, x1: point.x + m, y1: point.y + m }
      const under = placeLabel(point, request.wrap, frame, obstacles, markGap, edge, m, false, marksANameCanBelongTo, request.box)
      const underX = (around.x0 + around.x1) / 2 - request.wrap.w / 2
      const underY = request.box ? around.y1 + markGap : point.y + markGap
      const directlyUnder = under.x === underX && under.y === underY
      if (under.own && under.clear && directlyUnder) {
        spot = under
        size = request.wrap
        wrapped = true
      }
    }
    const rect = { x0: spot.x, y0: spot.y, x1: spot.x + size.w, y1: spot.y + size.h }
    const glyphFullyVisible = point.y - m >= top && point.y + m <= frame.h && point.x - m >= 0 && point.x + m <= frame.w
    const underBlock = blocked.some((b) => point.x > b.x0 && point.x < b.x1 && point.y > b.y0 && point.y < b.y1)
    const acrossBlock = blocked.some((b) => overlapArea(rect, b) > 0)
    const shown = glyphFullyVisible && !underBlock && !acrossBlock && (keep || (spot.own && spot.clear))
    // Half a line above and below, or two stacked names read as one wrapped name.
    const padY = Math.max(LABEL_PAD, line / 2)
    if (shown) placed.push({ x0: rect.x0 - LABEL_PAD, y0: rect.y0 - padY, x1: rect.x1 + LABEL_PAD, y1: rect.y1 + padY, weight: PLACED_LABEL_WEIGHT })
    results[i] = { x: spot.x, y: spot.y, shown, ...(wrapped && { wrapped }), ...(scale !== undefined && scale < 1 && { scale }), ...(numberOnly && { numberOnly }) }
  }
  return results
}

/** The translation that keeps screen point `p` still while zooming from `s0` to `s1`; `t` and `p` are from the frame's centre. */
export function zoomAbout(t: { x: number; y: number }, s0: number, s1: number, p: { x: number; y: number }): { x: number; y: number } {
  const ratio = s1 / s0
  return { x: p.x - (p.x - t.x) * ratio, y: p.y - (p.y - t.y) * ratio }
}

const TRACKPAD_MAX_DELTA = 50

/** A heuristic, as browsers do not say which device sent a wheel event: only trackpads scroll sideways or send small fractional px. */
export function isTrackpadScroll(e: { deltaX: number; deltaY: number; deltaMode: number }): boolean {
  if (e.deltaX !== 0) return true
  const fractional = !Number.isInteger(e.deltaY)
  return e.deltaMode === 0 && fractional && Math.abs(e.deltaY) < TRACKPAD_MAX_DELTA
}

/** `repeat` is a site's name already written at another site. */
export type NameKind = 'night' | 'castle' | 'site' | 'boss' | 'evergaol' | 'repeat' | 'chest' | 'other'
const NAME_ORDER: readonly NameKind[] = ['night', 'castle', 'site', 'boss', 'evergaol', 'repeat', 'chest', 'other']
export const labelRank = (kind: NameKind) => NAME_ORDER.indexOf(kind)

const MARK_SIZES = {
  art: { share: 0.08, min: 28, max: 140 },
  orb: { share: 0.033, min: 16, max: 60 },
  icon: { share: 0.036, min: 26, max: 64 },
  ring: { share: 0.11, min: 64, max: 300 },
} as const
export type MarkKind = keyof typeof MARK_SIZES
export function markSize(kind: MarkKind, mapWidth: number): number {
  const { share, min, max } = MARK_SIZES[kind]
  return Math.min(max, Math.max(min, mapWidth * share))
}

const ORB_SEPARATION = 0.5
/** Never wider than the gap between the two nearest sites (`spacing`, map units), so no two glows touch. */
export const orbSize = (mapWidth: number, spacing: number) =>
  Math.min(markSize('orb', mapWidth), (spacing * mapWidth) / MAP_UNITS - ORB_SEPARATION)

export function minSpacing(points: readonly { x: number; y: number }[]): number {
  let least = Infinity
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) least = Math.min(least, Math.hypot(points[i].x - points[j].x, points[i].y - points[j].y))
  }
  return least
}

/** Each sprite's height over width in public/structures, drawn to fit a square box. */
export const ART_ASPECT: Record<string, number> = {
  'blacksmith-village': 0.58, church: 1.36, 'eastern-underground-fort': 0.66, fort: 0.77, 'great-church': 0.9,
  'main-encampment': 0.62, marsh: 0.86, 'ruined-rise': 1.87, ruins: 0.56, 'scale-bearing-merchant': 1.22,
  'sorcerers-rise': 2.06, township: 0.44, 'western-underground-fort': 0.68,
}

/** The element badge as fractions of the art's square box, measured off the game's icons (data/raw/assets/icons). */
export const BADGE = { size: 0.25, x: 0.27, y: 0.14 }

export function artFootprint(at: { x: number; y: number }, size: number, heightOverWidth: number, badge: boolean): Rect[] {
  const w = size * Math.min(1, 1 / heightOverWidth)
  const h = size * Math.min(1, heightOverWidth)
  const sprite = { x0: at.x - w / 2, y0: at.y - h / 2, x1: at.x + w / 2, y1: at.y + h / 2 }
  if (!badge) return [sprite]
  const cx = at.x + size * BADGE.x
  const cy = at.y + size * BADGE.y
  const half = (size * BADGE.size) / 2
  return [sprite, { x0: cx - half, y0: cy - half, x1: cx + half, y1: cy + half }]
}

export const shortBossName = (name: string) => {
  const lead = name.split(' and ')[0]
  return SHORT_BOSS_NAMES[lead] ?? lead
}
const SHORT_BOSS_NAMES: Record<string, string> = { 'Dancer of the Boreal Valley': 'Dancer' }

const MIN_RING_FONT_PX = 8
const RING_RIM_RADIUS = 0.4
const ART_TUCK = 0.17
export const ICON_BODY = 0.45
// map.css draws an evergaol smaller than a crest.
const EVERGAOL_BODY = 0.39
const NAME_GAP = 2
const CREST_NAME_GAP = 1

export interface TagSpec { x: number; y: number; kind: NameKind; mark: 'art' | 'icon' | 'ring' | 'none'; silent?: boolean; structure?: StructureKey }

export const square = (c: { x: number; y: number }, halfSize: number): Rect =>
  ({ x0: c.x - halfSize, y0: c.y - halfSize, x1: c.x + halfSize, y1: c.y + halfSize })

export function structureFootprint(at: { x: number; y: number }, art: number, structure: StructureKey): Rect[] {
  const { kind, element } = splitStructure(structure)
  return artFootprint(at, art, ART_ASPECT[kind] ?? 1, element !== null)
}

/** `castle` is the box round the castle's crests, which its guard's name goes around on a phone. */
export function labelRequest(t: TagSpec, point: { x: number; y: number }, box: NameBox | undefined,
  size: { art: number; icon: number; ring: number }, wide: boolean, castle: Rect | undefined): LabelRequest {
  const label = t.silent ? { w: 0, h: 0 } : box ?? { w: 0, h: 0 }
  const rank = labelRank(t.kind)
  if (t.mark === 'ring') {
    const disc = square(point, size.ring * RING_RIM_RADIUS)
    return { point, label, rank, keep: true, ring: true, mark: 0, box: disc, body: [{ ...disc, round: true }], gap: NAME_GAP, wrap: box?.wrap,
      minScale: MIN_RING_FONT_PX / (box?.font ?? MIN_RING_FONT_PX), digit: box?.digit }
  }
  if (t.mark === 'none') {
    // On a phone the guard's point sits on the castle's crests, so every spot round the point runs into them.
    const goesRoundCastleCrests = t.kind === 'castle' && !wide
    return { point, label, rank, keep: false, mark: 0, gap: NAME_GAP, box: goesRoundCastleCrests ? castle : undefined }
  }
  if (t.mark === 'art') {
    const body = structureFootprint(point, size.art, t.structure!)
    const [sprite, ...badge] = body
    const whole = body.reduce((u, r) => ({ x0: Math.min(u.x0, r.x0), y0: Math.min(u.y0, r.y0), x1: Math.max(u.x1, r.x1), y1: Math.max(u.y1, r.y1) }))
    const tuck = size.art * ART_TUCK
    const spriteBeyondTuck = { ...sprite, y0: sprite.y0 + tuck, y1: sprite.y1 - tuck }
    const own = [...(spriteBeyondTuck.y1 > spriteBeyondTuck.y0 ? [spriteBeyondTuck] : []), ...badge]
    return { point, label, rank, keep: false, mark: 0, box: whole, body, own, gap: -tuck }
  }
  const r = size.icon * (t.kind === 'evergaol' ? EVERGAOL_BODY : ICON_BODY)
  const crest = t.kind === 'boss' || t.kind === 'castle'
  const wrap = crest && !wide ? box?.wrap : undefined
  return { point, label, rank, keep: false, mark: r, box: square(point, r), gap: CREST_NAME_GAP, wrap }
}
