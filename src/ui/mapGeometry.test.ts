import { describe, expect, it } from 'vitest'
import { nearestPin, rubberband, placeLabel, placeLabels, fitInDisc, zoomAbout, isTrackpadScroll, labelRank, markSize, shortBossName, orbSize, minSpacing, artFootprint, ART_ASPECT, labelRequest, structureFootprint } from './mapGeometry'
import { catalog } from '../data/catalog'
import seedData from '../data/seeds.json'
// Per-character advances of 11px Cinzel, measured in WebKit on an iPhone 15.
import caption from './ringCaption.fixture.json'
import { readdirSync } from 'node:fs'

const gh = catalog.slotsOf('great-hollow')
const overlappingPins = [{ slot: '9', ...gh['9'] }, { slot: '18', ...gh['18'] }]

describe('a tap snaps to the nearest slot', () => {
  it('picks the slot closest to the touch point, whichever pin is on top', () => {
    const betweenButNearerEighteen = { x: gh['18'].x, y: gh['18'].y + 12 }
    expect(nearestPin(overlappingPins, betweenButNearerEighteen, 30)?.slot).toBe('18')
    expect(nearestPin([...overlappingPins].reverse(), betweenButNearerEighteen, 30)?.slot).toBe('18')
    const nearNine = { x: gh['9'].x, y: gh['9'].y - 12 }
    expect(nearestPin(overlappingPins, nearNine, 30)?.slot).toBe('9')
  })

  it('reaches a slot up to the radius away and no further', () => {
    const one = [overlappingPins[0]]
    expect(nearestPin(one, { x: gh['9'].x + 30, y: gh['9'].y }, 30)?.slot).toBe('9')
    expect(nearestPin(one, { x: gh['9'].x + 31, y: gh['9'].y }, 30)).toBeNull()
  })

  it('lets a preferred pin in reach win over a nearer other pin, and the nearest answer out of its reach', () => {
    const isEighteen = (p: { slot: string }) => p.slot === '18'
    const nearNineInReachOfEighteen = { x: gh['9'].x, y: gh['9'].y - 5 }
    expect(nearestPin(overlappingPins, nearNineInReachOfEighteen, 30, isEighteen)?.slot).toBe('18')
    const outOfEighteensReach = { x: gh['9'].x, y: gh['9'].y + 10 }
    expect(nearestPin(overlappingPins, outOfEighteensReach, 30, isEighteen)?.slot).toBe('9')
  })

  it('finds nothing when no pin can be tapped', () => {
    expect(nearestPin([], { x: 500, y: 500 }, 30)).toBeNull()
  })
})

describe('panning past the edge', () => {
  it('follows the finger inside the bounds', () => {
    expect(rubberband(-40, -100, 100, 400)).toBe(-40)
  })
  it('resists more the further it is pulled, on both sides', () => {
    const firstFiftyPx = rubberband(150, -100, 100, 400) - 100
    const nextFiftyPx = rubberband(200, -100, 100, 400) - 100 - firstFiftyPx
    expect(firstFiftyPx).toBeGreaterThan(0)
    expect(firstFiftyPx).toBeLessThan(50)
    expect(nextFiftyPx).toBeLessThan(firstFiftyPx)
    expect(rubberband(-150, -100, 100, 400)).toBe(-rubberband(150, -100, 100, 400))
  })
})

describe('placeLabel', () => {
  const frame = { w: 400, h: 600 }
  const label = { w: 100, h: 30 }

  it('hangs the label below the point when nothing is there', () => {
    expect(placeLabel({ x: 200, y: 300 }, label, frame, [], 9, 8)).toEqual({ x: 150, y: 309, clear: true, own: true })
  })

  it('moves the label to a side that covers no pin', () => {
    const pinBelow = { x0: 195, y0: 310, x1: 205, y1: 330 }
    const pinAbove = { x0: 195, y0: 270, x1: 205, y1: 290 }
    expect(placeLabel({ x: 200, y: 300 }, label, frame, [pinBelow], 9, 8)).toEqual({ x: 150, y: 261, clear: true, own: true })
    expect(placeLabel({ x: 200, y: 300 }, label, frame, [pinBelow, pinAbove], 9, 8)).toEqual({ x: 209, y: 285, clear: true, own: true })
  })

  it('says when no spot is clear, and takes the one covering least', () => {
    const everywhere = { x0: 0, y0: 0, x1: 400, y1: 600 }
    const nearly = { x0: 150, y0: 309, x1: 160, y1: 339 }
    expect(placeLabel({ x: 200, y: 300 }, label, frame, [everywhere, nearly], 9, 8)).toMatchObject({ clear: false })
  })

  it('prefers a side the frame edge need not push the label from', () => {
    expect(placeLabel({ x: 10, y: 300 }, label, frame, [], 9, 8)).toEqual({ x: 19, y: 285, clear: true, own: true })
  })

  const coversPoint = (s: { x: number; y: number }, p: { x: number; y: number }) =>
    s.x < p.x + 6 && s.x + label.w > p.x - 6 && s.y < p.y + 6 && s.y + label.h > p.y - 6

  it('never lets the clamp into the frame push a label back over its own point', () => {
    const point = { x: 20, y: 300 }
    const below = { x0: 0, y0: 309, x1: 120, y1: 345 }
    const above = { x0: 0, y0: 255, x1: 120, y1: 291 }
    const right = { x0: 29, y0: 280, x1: 140, y1: 320 }
    const spot = placeLabel(point, label, frame, [below, above, right], 9, 8, 6)
    expect(coversPoint(spot, point)).toBe(false)
    expect(spot.clear).toBe(false)
  })

  it('in a frame barely wider than the label, still hangs it below, off the point', () => {
    const point = { x: 60, y: 300 }
    const spot = placeLabel(point, label, { w: 116, h: 600 }, [], 9, 8, 6)
    expect(coversPoint(spot, point)).toBe(false)
    expect(spot).toEqual({ x: 8, y: 309, clear: true, own: true })
  })

  it('keeps the label inside a frame that stops above the bottom sheet', () => {
    const point = { x: 200, y: 185 }
    const spot = placeLabel(point, label, { w: 400, h: 200 }, [], 9, 8, 6)
    expect(spot.y + label.h).toBeLessThanOrEqual(200 - 8)
    expect(coversPoint(spot, point)).toBe(false)
  })

  it('keeps the label below a top pill that covers the frame top', () => {
    const point = { x: 200, y: 70 }
    const pinBelow = { x0: 150, y0: 75, x1: 250, y1: 120 }
    const spot = placeLabel(point, label, { w: 400, h: 600, top: 60 }, [pinBelow], 9, 8, 6)
    expect(spot.y).toBeGreaterThanOrEqual(60 + 8)
    expect(coversPoint(spot, point)).toBe(false)
  })

  it('in a band that leaves no room above, clamps every spot below the top inset', () => {
    const spot = placeLabel({ x: 200, y: 40 }, label, { w: 400, h: 600, top: 60 }, [], 9, 8, 6)
    expect(spot.y).toBeGreaterThanOrEqual(68)
  })

  it('in a corner, still finds a spot clear of the point', () => {
    const point = { x: 4, y: 4 }
    const spot = placeLabel(point, label, frame, [], 9, 8, 6)
    expect(coversPoint(spot, point)).toBe(false)
  })
})

describe('wheel zoom keeps the point under the pointer still', () => {
  const onScreen = (t: { x: number; y: number }, s: number, i: { x: number; y: number }) => ({ x: t.x + i.x * s, y: t.y + i.y * s })

  it('zooming in about a corner leaves the image point there in place', () => {
    const t = { x: -2, y: 45 }
    const nearTopLeftOf1440x900 = { x: -620, y: -350 }
    const pointer = nearTopLeftOf1440x900
    const s0 = 1.12
    const s1 = 1.79
    const image = { x: (pointer.x - t.x) / s0, y: (pointer.y - t.y) / s0 }
    const after = onScreen(zoomAbout(t, s0, s1, pointer), s1, image)
    expect(after.x).toBeCloseTo(pointer.x, 9)
    expect(after.y).toBeCloseTo(pointer.y, 9)
  })

  it('zooming about the layer centre does not move the layer', () => {
    const t = { x: 30, y: -12 }
    expect(zoomAbout(t, 1, 2.5, t)).toEqual(t)
  })

  it('an unchanged scale leaves the translation alone', () => {
    const t = { x: 30, y: -12 }
    expect(zoomAbout(t, 1.5, 1.5, { x: 400, y: 300 })).toEqual(t)
  })
})

describe('a wheel event pans for a trackpad and zooms for a mouse wheel', () => {
  it('pans on a sideways component', () => {
    expect(isTrackpadScroll({ deltaX: 3, deltaY: 0, deltaMode: 0 })).toBe(true)
    expect(isTrackpadScroll({ deltaX: -1, deltaY: 12, deltaMode: 0 })).toBe(true)
  })

  it('pans on the small fractional pixel deltas a trackpad sends', () => {
    expect(isTrackpadScroll({ deltaX: 0, deltaY: 2.5, deltaMode: 0 })).toBe(true)
    expect(isTrackpadScroll({ deltaX: 0, deltaY: -0.75, deltaMode: 0 })).toBe(true)
  })

  it('zooms on a mouse wheel notch: whole pixels, or lines or pages', () => {
    expect(isTrackpadScroll({ deltaX: 0, deltaY: 100, deltaMode: 0 })).toBe(false)
    expect(isTrackpadScroll({ deltaX: 0, deltaY: -300, deltaMode: 0 })).toBe(false)
    expect(isTrackpadScroll({ deltaX: 0, deltaY: 3, deltaMode: 1 })).toBe(false)
    expect(isTrackpadScroll({ deltaX: 0, deltaY: 1, deltaMode: 2 })).toBe(false)
  })

  it('zooms on a large fractional delta, which a fast mouse wheel with acceleration sends', () => {
    expect(isTrackpadScroll({ deltaX: 0, deltaY: 120.5, deltaMode: 0 })).toBe(false)
  })
})

describe('placeLabels: markers never cover each other', () => {
  const frame = { w: 400, h: 800 }
  const label = { w: 100, h: 30 }
  const at = (x: number, y: number, rank = 1, keep = false) => ({ point: { x, y }, label, rank, keep })
  const rectOf = (s: { x: number; y: number }) => ({ x0: s.x, y0: s.y, x1: s.x + label.w, y1: s.y + label.h })
  const hits = (r: { x0: number; y0: number; x1: number; y1: number }, p: { x: number; y: number }, mark: number) =>
    r.x0 < p.x + mark && r.x1 > p.x - mark && r.y0 < p.y + mark && r.y1 > p.y - mark
  const intersects = (a: ReturnType<typeof rectOf>, b: ReturnType<typeof rectOf>) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0

  it("moves a label off another marker's glyph", () => {
    const [a] = placeLabels([at(200, 300), at(200, 320)], frame, [], 9, 8, 6)
    expect(a.shown).toBe(true)
    expect(hits(rectOf(a), { x: 200, y: 320 }, 6)).toBe(false)
  })
  it('moves a label off a label already placed', () => {
    const [a, b] = placeLabels([at(200, 300), at(240, 300)], frame, [], 9, 8, 6)
    expect(a.shown && b.shown).toBe(true)
    expect(intersects(rectOf(a), rectOf(b))).toBe(false)
  })
  it('places circles first, then bosses, then the rest, whatever the input order', () => {
    const [chest, circle] = placeLabels([at(200, 280, 2), at(240, 300, 0, true)], frame, [], 9, 8, 6)
    expect(circle).toMatchObject({ x: 190, y: 309, shown: true })
    expect(intersects(rectOf(chest), rectOf(circle))).toBe(false)
  })
  it('keeps every name off a blocked corner (the Nightlord medallion), and hides the names of marks under it', () => {
    const medallion = { x0: 0, y0: 600, x1: 150, y1: 800 }
    const [beside, under, ring] = placeLabels([at(100, 580), at(60, 700), at(80, 690, 0, true)], frame, [], 9, 8, 6, [medallion])
    expect(beside.shown).toBe(true)
    expect(intersects(rectOf(beside), medallion)).toBe(false)
    expect(under.shown).toBe(false)
    expect(ring.shown).toBe(false)
  })
  it('hides a label with no free spot, but a circle keeps its chip', () => {
    const everywhere = { x0: 0, y0: 0, x1: 400, y1: 800 }
    const [boss, circle] = placeLabels([at(200, 300, 1), at(200, 600, 0, true)], frame, [everywhere], 9, 8, 6)
    expect(boss.shown).toBe(false)
    expect(circle.shown).toBe(true)
  })
  it('two markers on one point both find clear spots', () => {
    const [first, second] = placeLabels([at(200, 300), at(200, 300)], { w: 400, h: 800, top: 0 }, [], 9, 8, 6)
    expect(first.shown && second.shown).toBe(true)
    expect(intersects(rectOf(first), rectOf(second))).toBe(false)
  })
  it("a circle with no free spot clips a pin's edge rather than cover another marker's glyph", () => {
    // "below" clips 190 px² of a pin; "right" holds a 144 px² boss glyph: by area alone, the glyph would lose.
    const circle = at(200, 300, 0, true)
    const pins = [
      { x0: 80, y0: 250, x1: 320, y1: 280 },
      { x0: 80, y0: 282, x1: 149, y1: 340 },
      { x0: 262, y0: 318, x1: 320, y1: 340 },
      { x0: 240, y0: 320, x1: 260, y1: 340 },
    ]
    const boss = at(300, 300, 1)
    const [placed] = placeLabels([circle, boss], frame, pins, 9, 8, 6)
    expect(placed.shown).toBe(true)
    expect(hits(rectOf(placed), boss.point, 6)).toBe(false)
  })
  it('hides the label of a glyph outside the visible band', () => {
    const [off] = placeLabels([at(200, 790)], { w: 400, h: 700 }, [], 9, 8, 6)
    expect(off.shown).toBe(false)
  })
})

describe('placeLabels: names sized to the art they belong to', () => {
  const frame = { w: 400, h: 800 }
  const label = { w: 80, h: 30 }
  const rectOf = (s: { x: number; y: number }, l = label) => ({ x0: s.x, y0: s.y, x1: s.x + l.w, y1: s.y + l.h })
  const intersects = (a: { x0: number; y0: number; x1: number; y1: number }, b: typeof a) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0

  it('puts a name its own gap below its point, clear of its own large art', () => {
    const [site] = placeLabels([{ point: { x: 200, y: 300 }, label, rank: 2, keep: false, gap: 34, mark: 30 }], frame, [], 9, 8, 6)
    expect(site).toMatchObject({ x: 160, y: 334, shown: true })
  })
  it("keeps other names off a large art's whole box, not only a small glyph around its point", () => {
    const site = { point: { x: 200, y: 330 }, label, rank: 2, keep: false, gap: 34, mark: 30 }
    const boss = { point: { x: 200, y: 262 }, label, rank: 3, keep: false }
    const [, b] = placeLabels([site, boss], frame, [], 9, 8, 6)
    expect(b.shown).toBe(true)
    expect(intersects(rectOf(b), { x0: 170, y0: 300, x1: 230, y1: 360 })).toBe(false)
  })
  const ringAt = (x: number, y: number, r: number) => {
    const disc = { x0: x - r, y0: y - r, x1: x + r, y1: y + r }
    return { point: { x, y }, label, rank: 0, keep: true, ring: true, box: disc, body: [{ ...disc, round: true }], gap: 2, mark: 0, minScale: 0.5 }
  }
  const expectCentredInRing = (spot: { x: number; y: number; shown: boolean; scale?: number }, x: number, y: number, r: number, box = label) => {
    const w = box.w * (spot.scale ?? 1)
    const h = box.h * (spot.scale ?? 1)
    expect(spot.shown).toBe(true)
    expect(spot.x + w / 2).toBeCloseTo(x, 6)
    expect(spot.y + h / 2).toBeCloseTo(y, 6)
    expect(Math.hypot(w / 2, h / 2)).toBeLessThanOrEqual(r + 1e-9)
  }
  it("writes a night's name centred just above its ring, on phone and desktop alike", () => {
    const [ring] = placeLabels([ringAt(200, 300, 40)], frame, [], 9, 8, 6)
    expect(ring).toMatchObject({ x: 160, y: 228, shown: true })
  })
  it('writes it inside its ring, centred on the disc and shrunk to fit it, when art lies all round it', () => {
    const everywhere = { x0: 0, y0: 0, x1: 400, y1: 800 }
    const [ring] = placeLabels([ringAt(200, 300, 40)], frame, [everywhere], 9, 8, 6)
    expectCentredInRing(ring, 200, 300, 40)
  })
  it('writes it just below its ring when the pill leaves no room above', () => {
    const [ring] = placeLabels([ringAt(200, 100, 40)], { w: 400, h: 800, top: 60 }, [], 9, 8, 6)
    expect(ring).toMatchObject({ x: 160, y: 142, shown: true })
  })
  const crest = (x: number, y: number) => ({ point: { x, y }, label: { w: 0, h: 0 }, rank: 3, keep: false, mark: 12 })
  it("writes a night's name below its ring when a crest stands above it, never across the crest", () => {
    const [ring] = placeLabels([ringAt(200, 300, 40), crest(200, 245)], frame, [], 9, 8, 6)
    expect(ring).toMatchObject({ x: 160, y: 342, shown: true })
  })
  it('wraps a name that falls back inside its ring onto two lines centred on the disc, within its width', () => {
    const everywhere = { x0: 0, y0: 0, x1: 400, y1: 800 }
    const ring = { ...ringAt(200, 300, 30), wrap: { w: 50, h: 30 } }
    const [inside] = placeLabels([ring], frame, [everywhere], 9, 8, 6)
    expect(inside).toEqual({ x: 175, y: 285, shown: true, wrapped: true })
    expect(inside.x).toBeGreaterThanOrEqual(170)
    expect(inside.x + 50).toBeLessThanOrEqual(230)
    expect(placeLabels([ring], frame, [], 9, 8, 6)[0]).toEqual({ x: 160, y: 238, shown: true })
  })
  it('writes it beside its ring when crests stand above and below, and inside it, never on a diagonal, when the sides are taken too', () => {
    const [beside] = placeLabels([ringAt(200, 300, 40), crest(200, 245), crest(200, 355)], frame, [], 9, 8, 6)
    expect(beside).toMatchObject({ x: 242, y: 285, shown: true })
    const [inside] = placeLabels([ringAt(200, 300, 40), crest(200, 245), crest(200, 355), crest(280, 300), crest(120, 300)], frame, [], 9, 8, 6)
    expectCentredInRing(inside, 200, 300, 40)
  })
  it("never writes a night's name where it reads as another mark's: beside a bare art, the caption goes inside its ring", () => {
    const taken = [{ x0: 150, y0: 200, x1: 250, y1: 256 }, { x0: 150, y0: 344, x1: 250, y1: 400 }, { x0: 244, y0: 270, x1: 330, y1: 330 }]
    const township = { x0: 60, y0: 318, x1: 100, y1: 340 }
    const nearerTheTownship = [...taken, township]
    const [inside] = placeLabels([ringAt(200, 300, 40)], frame, nearerTheTownship, 9, 8, 6)
    expectCentredInRing(inside, 200, 300, 40)
    const nearerTheRing = [...taken, { ...township, y0: 345, y1: 367 }]
    const [left] = placeLabels([ringAt(200, 300, 40)], frame, nearerTheRing, 9, 8, 6)
    expect(left).toMatchObject({ x: 78, y: 285, shown: true })
  })
  it("keeps every other name off a night's name, as off any name placed before it", () => {
    const [ring, name] = placeLabels([ringAt(200, 300, 40), { point: { x: 200, y: 215 }, label, rank: 3, keep: false }], frame, [], 9, 8, 6)
    expect(name.shown).toBe(true)
    expect(intersects(rectOf(ring), rectOf(name))).toBe(false)
  })
  it("keeps every other name off a ring's disc, so no site's name reads as the night's", () => {
    const siteMidDisc = { point: { x: 200, y: 300 }, label, rank: 2, keep: false, gap: 12, mark: 10 }
    const [, name] = placeLabels([ringAt(200, 300, 40), siteMidDisc], frame, [], 9, 8, 6)
    expect(name.shown).toBe(false)
    const [, beside] = placeLabels([ringAt(200, 300, 40), { point: { x: 250, y: 300 }, label, rank: 3, keep: false }], frame, [], 9, 8, 6)
    expect(beside.shown).toBe(true)
    const nearestX = Math.max(beside.x, Math.min(200, beside.x + label.w))
    const nearestY = Math.max(beside.y, Math.min(300, beside.y + label.h))
    expect(Math.hypot(nearestX - 200, nearestY - 300)).toBeGreaterThanOrEqual(40)
  })
  it("never lies over another mark's art, not even its edge: the name moves, or hides", () => {
    const point = { x: 200, y: 300 }
    const onlyBelowVisible = { w: 400, h: 800, top: 290 }
    const left = { x0: 104, y0: 309, x1: 164, y1: 369 }
    const right = { x0: 236, y0: 309, x1: 296, y1: 369 }
    const [hidden] = placeLabels([{ point, label, rank: 3, keep: false }], onlyBelowVisible, [left, right], 9, 8, 6)
    expect(hidden.shown).toBe(false)
    const [moved] = placeLabels([{ point, label, rank: 3, keep: false }], onlyBelowVisible, [right], 9, 8, 6)
    expect(moved.shown).toBe(true)
    expect(moved.x).toBeCloseTo(113.7, 6)
    expect(moved.y).toBeCloseTo(306.3, 6)
  })
  it("lies over the edge of its own art, hugging the art's real footprint rather than a square", () => {
    const lowWideTownship = { x0: 160, y0: 282, x1: 240, y1: 318 }
    const [name] = placeLabels([{ point: { x: 200, y: 300 }, label, rank: 2, keep: false, box: lowWideTownship, body: [lowWideTownship], gap: -2 }], frame, [], 9, 8, 6)
    expect(name).toMatchObject({ x: 160, y: 316, shown: true })
  })
  it('never covers its own element badge: where the tuck under its art would, it moves, tucked elsewhere or clear of the whole mark', () => {
    const sprite = { x0: 160, y0: 282, x1: 240, y1: 318 }
    const badge = { x0: 208, y0: 308, x1: 240, y1: 340 }
    const box = { x0: 160, y0: 282, x1: 240, y1: 340 }
    const heart = { ...sprite, y0: sprite.y0 + 6, y1: sprite.y1 - 6 }
    const [name] = placeLabels([{ point: { x: 200, y: 300 }, label, rank: 2, keep: false, box, body: [sprite, badge], own: [heart, badge], gap: -6 }], frame, [], 9, 8, 6)
    expect(name.shown).toBe(true)
    expect(intersects(rectOf(name), badge)).toBe(false)
    expect(intersects(rectOf(name), heart)).toBe(false)
    const tuckedOverTop = { x: 160, y: 258 }
    expect(name).toMatchObject(tuckedOverTop)
    const topAndSidesTaken = [{ x0: 150, y0: 240, x1: 250, y1: 280 }, { x0: 241, y0: 250, x1: 400, y1: 340 }, { x0: 0, y0: 250, x1: 159, y1: 340 }]
    expect(placeLabel({ x: 200, y: 300 }, label, frame, [...topAndSidesTaken, heart, badge], -6, 8, 0, false, [], box)).toEqual({ x: 160, y: 341, clear: true, own: true })
  })
  it('tucks over the top or bottom of its own art, never its sides', () => {
    const sprite = { x0: 170, y0: 270, x1: 230, y1: 330 }
    const heart = { ...sprite, y0: 280, y1: 320 }
    const belowAndAboveTaken = [{ x0: 150, y0: 322, x1: 250, y1: 360 }, { x0: 150, y0: 240, x1: 250, y1: 278 }]
    expect(placeLabel({ x: 200, y: 300 }, label, frame, [...belowAndAboveTaken, heart], -10, 8, 0, false, [], sprite)).toEqual({ x: 231, y: 285, clear: true, own: true })
  })
  it('keeps at least 4px between names of different marks, above and below as well as side by side', () => {
    const a = { point: { x: 200, y: 300 }, label, rank: 2, keep: false }
    const b = { point: { x: 200, y: 380 }, label, rank: 2, keep: false }
    const [first, second] = placeLabels([a, b], frame, [], 9, 8, 6, [{ x0: 150, y0: 388, x1: 250, y1: 430 }])
    expect(first.shown && second.shown).toBe(true)
    const gapX = Math.max(second.x - (first.x + label.w), first.x - (second.x + label.w))
    const gapY = Math.max(second.y - (first.y + label.h), first.y - (second.y + label.h))
    expect(Math.max(gapX, gapY)).toBeGreaterThanOrEqual(4)
  })
  it('keeps half a line between names of different marks stacked one above the other, so they never read as one name', () => {
    const a = { point: { x: 200, y: 300 }, label, rank: 2, keep: false }
    const b = { point: { x: 200, y: 383 }, label, rank: 2, keep: false }
    const below = [{ x0: 150, y0: 391, x1: 250, y1: 430 }]
    const [, tight] = placeLabels([a, b], frame, [], 9, 8, 6, below)
    expect(tight).toMatchObject({ x: 160, y: 344 })
    const [first, second] = placeLabels([a, b], frame, [], 9, 8, 6, below, 15)
    expect(first.shown && second.shown).toBe(true)
    const overlapX = Math.min(first.x, second.x) + label.w > Math.max(first.x, second.x)
    const gapY = Math.max(second.y - (first.y + label.h), first.y - (second.y + label.h))
    if (overlapX) expect(gapY).toBeGreaterThanOrEqual(7.5)
    const [c, d] = placeLabels([a, { ...b, point: { x: 284, y: 300 } }], frame, [], 9, 8, 6, [], 15)
    expect(d).toMatchObject({ x: 244, y: 309, shown: true })
    expect(d.x - (c.x + label.w)).toBe(4)
  })
  it("on a phone, writes a crest's name on two narrow lines directly under it when the one-line name fits nowhere", () => {
    const crestAt = { point: { x: 200, y: 300 }, label: { w: 100, h: 13 }, rank: 3, keep: false, mark: 12, box: { x0: 188, y0: 288, x1: 212, y1: 312 }, gap: 1 }
    const artAllRoundButUnder = [
      { x0: 100, y0: 200, x1: 300, y1: 287 }, { x0: 213, y0: 250, x1: 400, y1: 312 }, { x0: 0, y0: 250, x1: 187, y1: 312 },
      { x0: 221, y0: 313, x1: 400, y1: 400 }, { x0: 0, y0: 313, x1: 179, y1: 400 },
    ]
    const [bare] = placeLabels([crestAt], frame, artAllRoundButUnder, 9, 8, 6)
    expect(bare.shown).toBe(false)
    const [wrapped] = placeLabels([{ ...crestAt, wrap: { w: 40, h: 26 } }], frame, artAllRoundButUnder, 9, 8, 6)
    expect(wrapped).toEqual({ x: 180, y: 313, shown: true, wrapped: true })
    const [none] = placeLabels([{ ...crestAt, wrap: { w: 40, h: 26 } }], frame, [...artAllRoundButUnder, { x0: 190, y0: 330, x1: 210, y1: 345 }], 9, 8, 6)
    expect(none.shown).toBe(false)
  })
  it("never lets a long name run on past its own mark over or under another mark, named or not", () => {
    const tower = { x0: 419, y0: 348, x1: 457, y1: 426 }
    const crestBox = { x0: 376, y0: 352, x1: 408, y1: 383 }
    const name = { w: 105, h: 15 }
    const taken = [{ x0: 380, y0: 427, x1: 520, y1: 460 }]
    const spot = placeLabel({ x: 438, y: 387 }, name, { w: 800, h: 800 }, [...taken, crestBox], 1, 8, 0, false, [crestBox], tower)
    expect(spot.own && spot.clear).toBe(true)
    const aboveWithLeftEndOverCrest = { x: 385.5, y: 332 }
    expect(spot).not.toMatchObject(aboveWithLeftEndOverCrest)
    const rect = { x0: spot.x, y0: spot.y, x1: spot.x + name.w, y1: spot.y + name.h }
    const crestMid = (crestBox.x0 + crestBox.x1) / 2
    const gapY = Math.max(crestBox.y0 - rect.y1, rect.y0 - crestBox.y1)
    expect(crestMid > rect.x0 && crestMid < rect.x1 && gapY < 12).toBe(false)
  })
  it('tries all eight spots round its mark before giving up: with below, above and both sides taken, a diagonal', () => {
    const block = (x0: number, y0: number, x1: number, y1: number) => ({ x0, y0, x1, y1 })
    const taken = [block(195, 315, 205, 335), block(195, 265, 205, 285), block(215, 295, 235, 305), block(165, 295, 185, 305)]
    expect(placeLabel({ x: 200, y: 300 }, label, frame, taken, 9, 8, 6)).toEqual({ x: 206.3, y: 306.3, clear: true, own: true })
  })
  it('reaches the eighth spot, the upper-left diagonal, when the other seven are taken', () => {
    const dot = (x: number, y: number) => ({ x0: x - 1, y0: y - 1, x1: x + 1, y1: y + 1 })
    const taken = [dot(200, 324), dot(200, 276), dot(249, 300), dot(151, 300), dot(246, 321), dot(154, 321), dot(246, 279)]
    const spot = placeLabel({ x: 200, y: 300 }, label, frame, taken, 9, 8, 6)
    expect(spot).toMatchObject({ clear: true, own: true })
    expect(spot.x).toBeCloseTo(113.7, 6)
    expect(spot.y).toBeCloseTo(263.7, 6)
  })
  it("reserves a night's name and ring no wider than drawn: its caption plus the 4px pad, and the disc's circle, not its square", () => {
    const [, beside] = placeLabels([ringAt(200, 300, 40), { point: { x: 284, y: 221 }, label, rank: 3, keep: false }], frame, [], 9, 8, 6)
    expect(beside).toMatchObject({ x: 244, y: 230, shown: true })
    const [, corner] = placeLabels([ringAt(200, 300, 40), { point: { x: 272, y: 323 }, label, rank: 3, keep: false }], frame, [], 9, 8, 6)
    expect(corner).toMatchObject({ x: 232, y: 332, shown: true })
  })
  it('never lets a name lie over another name, even a little, on a crowded map', () => {
    let seed = 7
    const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    const crowd = Array.from({ length: 80 }, (_, i) => ({
      point: { x: random() * 400, y: random() * 800 }, label: { w: 40 + random() * 60, h: 15 + (i % 2) * 15 }, rank: i % 6, keep: false, mark: 12,
    }))
    const art = Array.from({ length: 40 }, () => {
      const x = random() * 400, y = random() * 800
      return { x0: x - 18, y0: y - 18, x1: x + 18, y1: y + 18 }
    })
    const spots = placeLabels(crowd, frame, art, 9, 8, 6)
    const rects = spots.map((s, i) => ({ ...rectOf(s, crowd[i].label), shown: s.shown })).filter((r) => r.shown)
    expect(rects.length).toBeGreaterThan(10)
    for (const a of rects) for (const b of rects) if (a !== b) expect(intersects(a, b)).toBe(false)
  })
  it('never lets two shown names overlap, whatever their ranks', () => {
    const at = (x: number, y: number, rank: number) => ({ point: { x, y }, label, rank, keep: false, gap: 20, mark: 16 })
    const requests = [at(200, 300, 4), at(215, 305, 2), at(190, 290, 3), at(205, 320, 1), at(200, 300, 5)]
    const spots = placeLabels(requests, frame, [], 9, 8, 6)
    const shown = spots.filter((s) => s.shown)
    for (const a of shown) for (const b of shown) if (a !== b) expect(intersects(rectOf(a), rectOf(b))).toBe(false)
  })
})

describe('what gets named first when room is short', () => {
  it('orders night rings, the castle, site names, field bosses, evergaols, repeated site names, then chests and the rest', () => {
    const kinds = ['other', 'chest', 'repeat', 'evergaol', 'boss', 'site', 'castle', 'night'] as const
    const sorted = [...kinds].sort((a, b) => labelRank(a) - labelRank(b))
    expect(sorted).toEqual(['night', 'castle', 'site', 'boss', 'evergaol', 'repeat', 'chest', 'other'])
  })
})

describe('marks at game scale', () => {
  const IPHONE_15_MAP_WIDTH = 574
  const DESKTOP_MAP_WIDTH = 1209
  const share = (kind: Parameters<typeof markSize>[0], width: number) => markSize(kind, width) / width
  it('draws structure art at about 8% of the map width at the fitted zoom, phone and desktop', () => {
    expect(share('art', IPHONE_15_MAP_WIDTH)).toBeCloseTo(0.08, 3)
    expect(share('art', DESKTOP_MAP_WIDTH)).toBeCloseTo(0.08, 3)
  })
  it('scales crests and rings in proportion with the art', () => {
    const ratio = (kind: Parameters<typeof markSize>[0]) => markSize(kind, DESKTOP_MAP_WIDTH) / markSize('art', DESKTOP_MAP_WIDTH)
    expect(ratio('icon')).toBeCloseTo(0.45, 1)
    expect(ratio('ring')).toBeCloseTo(1.38, 1)
  })
  const fittedToIsland = (earth: 'default' | 'great-hollow') => {
    const island = catalog.islandOf(earth)
    const w = (island.x1 - island.x0) / 1000
    const h = (island.y1 - island.y0) / 1000
    return { phone: 393 / w, desktop: Math.min(1080 / w, (900 - 60) / h) }
  }
  it('draws the unknown-site glow as large as the two nearest sites allow, below its old size on phone and desktop', () => {
    const { phone, desktop } = fittedToIsland('default')
    const spacing = minSpacing(Object.values(catalog.slotsOf('default')))
    expect(orbSize(phone, spacing)).toBeCloseTo((spacing * phone) / 1000 - 0.5, 5)
    expect(orbSize(phone, spacing)).toBeGreaterThan(14)
    expect(orbSize(desktop, spacing)).toBeGreaterThan(28)
    const OLD_DESKTOP_ORB = 63
    expect(orbSize(desktop, spacing) / OLD_DESKTOP_ORB).toBeLessThanOrEqual(0.7)
  })
  it('never lets two orbs overlap at the default zoom, on either map, phone or desktop', () => {
    for (const earth of ['default', 'great-hollow'] as const) {
      const slots = Object.values(catalog.slotsOf(earth))
      const spacing = minSpacing(slots)
      for (const width of Object.values(fittedToIsland(earth))) {
        const disc = orbSize(width, spacing)
        for (const a of slots) for (const b of slots) {
          if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y) * (width / 1000), `${earth} at ${width}`).toBeGreaterThanOrEqual(disc)
        }
      }
    }
  })
  it('keeps a phone ring no smaller than 64 and a crest no smaller than 26', () => {
    expect(markSize('ring', IPHONE_15_MAP_WIDTH)).toBe(64)
    expect(markSize('icon', IPHONE_15_MAP_WIDTH)).toBe(26)
  })
  it('scales with zoom between a floor and a cap', () => {
    expect(markSize('art', 1000)).toBeGreaterThan(markSize('art', 800))
    expect(markSize('art', 100)).toBe(markSize('art', 50))
    expect(markSize('art', 5000)).toBe(markSize('art', 9000))
    expect(markSize('art', 1209)).toBeLessThan(markSize('art', 5000))
  })
})

describe('placeLabels: a name stays with its own mark', () => {
  const frame = { w: 400, h: 800 }
  const label = { w: 80, h: 30 }
  it('hides the name of a mark off the screen sideways instead of pinning it to the edge', () => {
    const [left, right] = placeLabels([
      { point: { x: -30, y: 300 }, label, rank: 2, keep: false },
      { point: { x: 430, y: 500 }, label, rank: 2, keep: false },
    ], frame, [], 9, 8, 6)
    expect(left.shown).toBe(false)
    expect(right.shown).toBe(false)
  })
  it('hides a name the frame edge would push away from its mark', () => {
    const [name] = placeLabels([{ point: { x: 398, y: 300 }, label: { w: 150, h: 30 }, rank: 2, keep: false, mark: 30, gap: 34 }], frame, [], 9, 8, 6)
    expect(name.shown).toBe(false)
  })
  it("counts a long name beside its crest as the crest's when it touches it and keeps 10px clear of every other mark", () => {
    const crest = { x0: 188, y0: 288, x1: 212, y1: 312 }
    const wide = { w: 120, h: 16 }
    const taken = [{ x0: 150, y0: 315, x1: 250, y1: 330 }, { x0: 150, y0: 270, x1: 250, y1: 285 }]
    const twentyPxFromFarEnd = { x0: 288, y0: 328, x1: 312, y1: 352 }
    expect(placeLabel({ x: 200, y: 300 }, wide, frame, [...taken, twentyPxFromFarEnd], 1, 8, 12, false, [twentyPxFromFarEnd], crest)).toEqual({ x: 213, y: 292, clear: true, own: true })
    const twoPxFromFarEnd = { x0: 288, y0: 310, x1: 312, y1: 334 }
    expect(placeLabel({ x: 200, y: 300 }, wide, frame, [...taken, twoPxFromFarEnd], 1, 8, 12, false, [twoPxFromFarEnd], crest)).toEqual({ x: 67, y: 292, clear: true, own: true })
  })
  it("never puts a name nearer another mark's point than its own", () => {
    const site = { point: { x: 200, y: 300 }, label, rank: 2, keep: false, gap: 34, mark: 20 }
    const namelessChestBelow = { point: { x: 200, y: 345 }, label: { w: 0, h: 0 }, rank: 5, keep: false, mark: 0 }
    const [name] = placeLabels([site, namelessChestBelow], frame, [], 9, 8, 6)
    expect(name.shown).toBe(true)
    const centre = { x: name.x + label.w / 2, y: name.y + label.h / 2 }
    const own = Math.hypot(centre.x - 200, centre.y - 300)
    expect(Math.hypot(centre.x - 200, centre.y - 345)).toBeGreaterThanOrEqual(own)
  })
  it('hides a name whose every free spot is nearer another mark', () => {
    const at = (x: number, y: number) => ({ point: { x, y }, label, rank: 3, keep: false, mark: 5, gap: 7 })
    const [middle] = placeLabels([at(200, 300), at(200, 270), at(200, 330), at(170, 300), at(230, 300)], frame, [], 9, 8, 6)
    expect(middle.shown).toBe(false)
  })
})

describe('night boss names on the ring', () => {
  it('keeps the lead boss of a named pair, as the game map does', () => {
    expect(shortBossName('Demi-Human Queen and Swordmaster')).toBe('Demi-Human Queen')
    expect(shortBossName('Tree Sentinel and Royal Cavalrymen')).toBe('Tree Sentinel')
    expect(shortBossName('DBW & Curseblade')).toBe('DBW & Curseblade')
    expect(shortBossName('Tree Sentinel')).toBe('Tree Sentinel')
    expect(shortBossName('Dancer of the Boreal Valley')).toBe('Dancer')
  })
})

describe('structure art footprints', () => {
  it("knows how much of its square box each kind's sprite fills, as the shipped art is drawn", async () => {
    const sharp = (await import('sharp')).default
    const kinds = readdirSync('public/structures').map((f) => f.replace('.webp', ''))
    expect(Object.keys(ART_ASPECT).sort()).toEqual(kinds.sort())
    for (const kind of kinds) {
      const { width, height } = await sharp(`public/structures/${kind}.webp`).metadata()
      expect(ART_ASPECT[kind], kind).toBeCloseTo(height! / width!, 1)
    }
  })
  it('sizes a low sprite by its width and a tall one by its height, with the badge where the game puts it', () => {
    expect(artFootprint({ x: 100, y: 100 }, 80, 0.44, true)).toEqual([
      { x0: 60, y0: 82.4, x1: 140, y1: 117.6 },
      { x0: 111.6, y0: 101.2, x1: 131.6, y1: 121.2 },
    ])
    const [rise] = artFootprint({ x: 100, y: 100 }, 80, 2.0, false)
    expect(rise).toEqual({ x0: 80, y0: 60, x1: 120, y1: 140 })
  })
})

describe("a night's name inside its ring on a phone", () => {
  const RING_RIM_RADIUS = 0.4
  const r = markSize('ring', 476) * RING_RIM_RADIUS
  const advances: Record<string, number> = caption.advances
  const width = (text: string) => [...text].reduce((sum, ch) => sum + (advances[ch] ?? advances.W), 0)
  const bosses = [...new Set(seedData.seeds.flatMap((seed) => seed.markers.filter((m) => m.layer === 'circle').map((m) => m.label.replace(/^Night \d: /, ''))))]

  const measuredLikeMapView = (boss: string) => {
    const words = shortBossName(boss).split(' ')
    const line = (from: number, to: number) => width(words.slice(from, to).join(' '))
    const one = { w: caption.prefix + advances[' '] + line(0, words.length), h: caption.lineHeight }
    let two = Infinity
    for (let k = 0; k < words.length; k++) two = Math.min(two, Math.max(caption.prefix + (k ? advances[' '] + line(0, k) : 0), line(k, words.length)))
    return { label: one, wrap: two < one.w ? { w: two, h: 2 * caption.lineHeight } : undefined }
  }

  it('fits every night boss in the data inside the disc: shrunk no smaller than 8px, else its number alone', () => {
    const everywhere = { x0: 0, y0: 0, x1: 400, y1: 800 }
    const disc = { x0: 200 - r, y0: 300 - r, x1: 200 + r, y1: 300 + r }
    const digit = { w: caption.digit, h: caption.lineHeight }
    expect(bosses.length).toBeGreaterThan(30)
    for (const boss of bosses) {
      const { label, wrap } = measuredLikeMapView(boss)
      const request = { point: { x: 200, y: 300 }, label, wrap, rank: 0, keep: true, ring: true, box: disc, body: [{ ...disc, round: true }], gap: 2, mark: 0, minScale: 8 / caption.font, digit }
      const [spot] = placeLabels([request], { w: 400, h: 800 }, [everywhere], 9, 8, 6)
      const shown = spot.numberOnly ? digit : { w: (spot.wrapped ? wrap! : label).w * (spot.scale ?? 1), h: (spot.wrapped ? wrap! : label).h * (spot.scale ?? 1) }
      expect(spot.shown, boss).toBe(true)
      expect(spot.scale ?? 1, boss).toBeGreaterThanOrEqual(8 / caption.font)
      expect(spot.x + shown.w / 2, boss).toBeCloseTo(200, 6)
      expect(spot.y + shown.h / 2, boss).toBeCloseTo(300, 6)
      expect(Math.hypot(shown.w / 2, shown.h / 2), boss).toBeLessThanOrEqual(r + 1e-9)
    }
  })
  it('shrinks a caption only as far as it must, and gives up below the floor', () => {
    expect(fitInDisc({ w: 30, h: 20 }, 25.6, 8 / 11)).toBe(1)
    expect(fitInDisc({ w: 60, h: 30 }, 25.6, 8 / 11)).toBeCloseTo(25.6 / Math.hypot(30, 15), 9)
    expect(fitInDisc({ w: 90, h: 30 }, 25.6, 8 / 11)).toBeNull()
  })
})

describe('a map name placement request', () => {
  const size = { art: 40, icon: 20, ring: 60 }
  const at = { x: 100, y: 100 }
  const name = { w: 50, h: 12, wrap: { w: 30, h: 24 }, font: 11, digit: { w: 6, h: 12 } }

  it("keeps a night's name, rounds its ring's disc into a body no name enters, and lets it shrink to the legible floor", () => {
    const r = labelRequest({ ...at, kind: 'night', mark: 'ring' }, at, name, size, false, undefined)
    expect(r).toMatchObject({ keep: true, ring: true, box: { x0: 76, y0: 76, x1: 124, y1: 124 }, wrap: name.wrap, digit: name.digit })
    expect(r.body).toEqual([{ x0: 76, y0: 76, x1: 124, y1: 124, round: true }])
    expect(r.minScale).toBeCloseTo(8 / 11)
  })

  it("lets a site's name tuck over its sprite's edge but never over its element badge", () => {
    const r = labelRequest({ ...at, kind: 'site', mark: 'art', structure: 'ruins:fire' }, at, name, size, false, undefined)
    const [sprite, badge] = structureFootprint(at, size.art, 'ruins:fire')
    expect(r.gap).toBeCloseTo(-size.art * 0.17)
    expect(r.body).toEqual([sprite, badge])
    expect(r.own).toContainEqual(badge)
  })

  it("gives a crest's name its two-line wrap on a phone only", () => {
    const boss = { ...at, kind: 'boss', mark: 'icon' } as const
    expect(labelRequest(boss, at, name, size, false, undefined).wrap).toEqual(name.wrap)
    expect(labelRequest(boss, at, name, size, true, undefined).wrap).toBeUndefined()
  })

  it("sends the castle guard's name round the castle's crests on a phone, and a silent name nowhere", () => {
    const crests = { x0: 90, y0: 90, x1: 110, y1: 110 }
    const guard = { ...at, kind: 'castle', mark: 'none' } as const
    expect(labelRequest(guard, at, name, size, false, crests).box).toEqual(crests)
    expect(labelRequest(guard, at, name, size, true, crests).box).toBeUndefined()
    expect(labelRequest({ ...at, kind: 'chest', mark: 'icon', silent: true }, at, name, size, false, undefined).label).toEqual({ w: 0, h: 0 })
  })
})
