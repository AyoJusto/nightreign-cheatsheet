import { describe, expect, it } from 'vitest'
import { nearestPin, rubberband, placeLabel, placeLabels, zoomAbout, isTrackpadScroll, labelRank, markSize, shortBossName, orbSize, minSpacing, artFootprint, ART_ASPECT } from './mapGeometry'
import { catalog } from '../data/catalog'
import { readdirSync } from 'node:fs'

// Great Hollow slots 9 and 18 sit 32 units apart, so their 44px hit areas overlap at default zoom.
const gh = catalog.slotsOf('great-hollow')
const pins = [{ slot: '9', ...gh['9'] }, { slot: '18', ...gh['18'] }]

describe('a tap snaps to the nearest slot', () => {
  it('picks the slot closest to the touch point, whichever pin is on top', () => {
    const nearEighteen = { x: gh['18'].x, y: gh['18'].y + 12 } // between the two, closer to 18
    expect(nearestPin(pins, nearEighteen, 30)?.slot).toBe('18')
    expect(nearestPin([...pins].reverse(), nearEighteen, 30)?.slot).toBe('18')
    const nearNine = { x: gh['9'].x, y: gh['9'].y - 12 }
    expect(nearestPin(pins, nearNine, 30)?.slot).toBe('9')
  })

  it('reaches a slot up to the radius away and no further', () => {
    const one = [pins[0]]
    expect(nearestPin(one, { x: gh['9'].x + 30, y: gh['9'].y }, 30)?.slot).toBe('9')
    expect(nearestPin(one, { x: gh['9'].x + 31, y: gh['9'].y }, 30)).toBeNull()
  })

  it('lets the pins the current step asks for win over a nearer other pin within reach', () => {
    const isEighteen = (p: { slot: string }) => p.slot === '18'
    const nearNine = { x: gh['9'].x, y: gh['9'].y - 5 } // 5 from slot 9, 27 from slot 18
    expect(nearestPin(pins, nearNine, 30, isEighteen)?.slot).toBe('18')
    // Out of the preferred pin's reach, the nearest other pin still answers.
    const belowNine = { x: gh['9'].x, y: gh['9'].y + 10 } // 42 from slot 18
    expect(nearestPin(pins, belowNine, 30, isEighteen)?.slot).toBe('9')
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
    const first = rubberband(150, -100, 100, 400) - 100 // the first 50px past the edge
    const next = rubberband(200, -100, 100, 400) - 100 - first // the next 50px
    expect(first).toBeGreaterThan(0)
    expect(first).toBeLessThan(50)
    expect(next).toBeLessThan(first)
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

  it('keeps the label inside the frame, on a side the frame need not push it from', () => {
    // Below would be pushed 32px right by the edge, off its point; right of the point fits as is.
    expect(placeLabel({ x: 10, y: 300 }, label, frame, [], 9, 8)).toEqual({ x: 19, y: 285, clear: true, own: true })
  })

  // The point's own glyph (a 6px radius here) must stay visible: it is what the marker exists to show.
  const coversPoint = (s: { x: number; y: number }, p: { x: number; y: number }) =>
    s.x < p.x + 6 && s.x + label.w > p.x - 6 && s.y < p.y + 6 && s.y + label.h > p.y - 6

  it('never lets the clamp into the frame push a label back over its own point', () => {
    // Near the left edge, with pins below, above and right, only "left" is clear before clamping,
    // and clamping pulls it right over the point. Some spot that leaves the point visible must win.
    const point = { x: 20, y: 300 }
    const below = { x0: 0, y0: 309, x1: 120, y1: 345 }
    const above = { x0: 0, y0: 255, x1: 120, y1: 291 }
    const right = { x0: 29, y0: 280, x1: 140, y1: 320 }
    const spot = placeLabel(point, label, frame, [below, above, right], 9, 8, 6)
    expect(coversPoint(spot, point)).toBe(false)
    expect(spot.clear).toBe(false)
  })

  it('treats its own point as covered even with no pins around', () => {
    // In a frame barely wider than the label, "below" is still fine; the point is never under it.
    const point = { x: 60, y: 300 }
    const spot = placeLabel(point, label, { w: 116, h: 600 }, [], 9, 8, 6)
    expect(coversPoint(spot, point)).toBe(false)
    expect(spot).toEqual({ x: 8, y: 309, clear: true, own: true })
  })

  it('keeps the label inside a frame that stops above the bottom sheet', () => {
    // A point just above a 200px-tall visible frame: "below" would cross its bottom edge, so the label goes above.
    const point = { x: 200, y: 185 }
    const spot = placeLabel(point, label, { w: 400, h: 200 }, [], 9, 8, 6)
    expect(spot.y + label.h).toBeLessThanOrEqual(200 - 8)
    expect(coversPoint(spot, point)).toBe(false)
  })

  it('keeps the label below a top pill that covers the frame top', () => {
    // A point just under a pill whose bottom edge is at y=60: "above" would put the label under the pill.
    const point = { x: 200, y: 70 }
    const pinBelow = { x0: 150, y0: 75, x1: 250, y1: 120 }
    const spot = placeLabel(point, label, { w: 400, h: 600, top: 60 }, [pinBelow], 9, 8, 6)
    expect(spot.y).toBeGreaterThanOrEqual(60 + 8)
    expect(coversPoint(spot, point)).toBe(false)
  })

  it('in a band that leaves no room above, clamps every spot below the top inset', () => {
    // Fully open sheet: only the pill's own band would be free, so no spot may rise into it.
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
  // A point is on screen at t + i * s, with i its offset from the layer centre in image px at scale 1.
  const onScreen = (t: { x: number; y: number }, s: number, i: { x: number; y: number }) => ({ x: t.x + i.x * s, y: t.y + i.y * s })

  it('zooming in about a corner leaves the image point there in place', () => {
    const t = { x: -2, y: 45 }
    const pointer = { x: -620, y: -350 } // frame-centre relative, near the top-left corner of a 1440x900 frame
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
  it('pans on a sideways component, as only a trackpad (or tilt wheel) scrolls sideways', () => {
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
    // B sits right under A, where A's label would go first (below).
    const [a] = placeLabels([at(200, 300), at(200, 320)], frame, [], 9, 8, 6)
    expect(a.shown).toBe(true)
    expect(hits(rectOf(a), { x: 200, y: 320 }, 6)).toBe(false)
  })
  it('moves a label off a label already placed', () => {
    // Side by side, both would go below and overlap; the second steps aside.
    const [a, b] = placeLabels([at(200, 300), at(240, 300)], frame, [], 9, 8, 6)
    expect(a.shown && b.shown).toBe(true)
    expect(intersects(rectOf(a), rectOf(b))).toBe(false)
  })
  it('places circles first, then bosses, then the rest, whatever the input order', () => {
    // Same point pair, reversed ranks: the higher-priority marker keeps its first choice (below).
    const [chest, circle] = placeLabels([at(200, 300, 2), at(240, 300, 0, true)], frame, [], 9, 8, 6)
    expect(circle).toMatchObject({ x: 190, y: 309, shown: true })
    expect(intersects(rectOf(chest), rectOf(circle))).toBe(false)
  })
  it('keeps every name off a blocked corner (the Nightlord medallion), and hides the names of marks under it', () => {
    const medallion = { x0: 0, y0: 600, x1: 150, y1: 800 }
    // Below its point would run into the medallion; a free spot elsewhere wins.
    const [beside, under, ring] = placeLabels([at(100, 580), at(60, 700), at(80, 690, 0, true)], frame, [], 9, 8, 6, [medallion])
    expect(beside.shown).toBe(true)
    expect(intersects(rectOf(beside), medallion)).toBe(false)
    // A mark the medallion covers has nothing to name, even a kept one.
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
    // Same point: the second marker's glyph covers the first's point too, but both still get clear spots.
    expect(first.shown && second.shown).toBe(true)
    expect(intersects(rectOf(first), rectOf(second))).toBe(false)
  })
  it("a circle with no free spot clips a pin's edge rather than cover another marker's glyph", () => {
    // Pins block every spot around the circle but two: "below" clips 190 px² of one pin's corner, and "right"
    // is free of pins but holds a boss glyph (144 px²). By area alone, the glyph would lose.
    const circle = at(200, 300, 0, true)
    const pins = [
      { x0: 80, y0: 250, x1: 320, y1: 280 }, // above, and both upper diagonals
      { x0: 80, y0: 282, x1: 149, y1: 340 }, // left, and the lower-left diagonal
      { x0: 262, y0: 318, x1: 320, y1: 340 }, // the lower-right diagonal
      { x0: 240, y0: 320, x1: 260, y1: 340 }, // a corner of "below"
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
    // The boss's first choice (below its point) would lie across the site's art, 30px around (200, 330).
    const site = { point: { x: 200, y: 330 }, label, rank: 2, keep: false, gap: 34, mark: 30 }
    const boss = { point: { x: 200, y: 262 }, label, rank: 3, keep: false }
    const [, b] = placeLabels([site, boss], frame, [], 9, 8, 6)
    expect(b.shown).toBe(true)
    expect(intersects(rectOf(b), { x0: 170, y0: 300, x1: 230, y1: 360 })).toBe(false)
  })
  // A night's ring as MapView asks for it: its disc (a circle, `round`) is its box and its body.
  const ringAt = (x: number, y: number, r: number) => {
    const disc = { x0: x - r, y0: y - r, x1: x + r, y1: y + r }
    return { point: { x, y }, label, rank: 0, keep: true, ring: true, box: disc, body: [{ ...disc, round: true }], gap: 2, mark: 0 }
  }
  it("writes a night's name centred just above its ring, on phone and desktop alike", () => {
    const [ring] = placeLabels([ringAt(200, 300, 40)], frame, [], 9, 8, 6)
    expect(ring).toMatchObject({ x: 160, y: 228, shown: true })
  })
  it('writes it inside its ring, across the lower half of the disc, when art lies all round it', () => {
    const everywhere = { x0: 0, y0: 0, x1: 400, y1: 800 }
    const [ring] = placeLabels([ringAt(200, 300, 40)], frame, [everywhere], 9, 8, 6)
    // Centred on the lower half: its middle 20px (half the radius) below the ring's centre.
    expect(ring).toMatchObject({ x: 160, y: 305, shown: true })
  })
  it('writes it just below its ring when the pill leaves no room above', () => {
    const [ring] = placeLabels([ringAt(200, 100, 40)], { w: 400, h: 800, top: 60 }, [], 9, 8, 6)
    expect(ring).toMatchObject({ x: 160, y: 142, shown: true })
  })
  // A crest's drawn box, as MapView asks for it: another mark's art, which a night's name may not lie across.
  const crest = (x: number, y: number) => ({ point: { x, y }, label: { w: 0, h: 0 }, rank: 3, keep: false, mark: 12 })
  it("writes a night's name below its ring when a crest stands above it, never across the crest", () => {
    const [ring] = placeLabels([ringAt(200, 300, 40), crest(200, 245)], frame, [], 9, 8, 6)
    expect(ring).toMatchObject({ x: 160, y: 342, shown: true })
  })
  it('writes it beside its ring when crests stand above and below, and inside it, never on a diagonal, when the sides are taken too', () => {
    const [beside] = placeLabels([ringAt(200, 300, 40), crest(200, 245), crest(200, 355)], frame, [], 9, 8, 6)
    expect(beside).toMatchObject({ x: 242, y: 285, shown: true })
    // Every diagonal is free, but a caption there sits a corner's width off its ring: it goes inside instead.
    const [inside] = placeLabels([ringAt(200, 300, 40), crest(200, 245), crest(200, 355), crest(280, 300), crest(120, 300)], frame, [], 9, 8, 6)
    expect(inside).toMatchObject({ x: 160, y: 305, shown: true })
  })
  it("never writes a night's name where it reads as another mark's: beside a bare art, the caption goes inside its ring", () => {
    // Art over the spots above, below and right of the ring. Left is free, 78..158 x 285..315, but a township's bare
    // art lies under its left half (as on a phone's Night 2): the caption's middle would be nearer the township.
    const taken = [{ x0: 150, y0: 200, x1: 250, y1: 256 }, { x0: 150, y0: 344, x1: 250, y1: 400 }, { x0: 244, y0: 270, x1: 330, y1: 330 }]
    const township = { x0: 60, y0: 318, x1: 100, y1: 340 }
    const [inside] = placeLabels([ringAt(200, 300, 40)], frame, [...taken, township], 9, 8, 6)
    expect(inside).toMatchObject({ x: 160, y: 305, shown: true })
    // Further down, the ring is the nearer mark, and the left spot is the caption's own.
    const [left] = placeLabels([ringAt(200, 300, 40)], frame, [...taken, { ...township, y0: 345, y1: 367 }], 9, 8, 6)
    expect(left).toMatchObject({ x: 78, y: 285, shown: true })
  })
  it("keeps every other name off a night's name, as off any name placed before it", () => {
    const [ring, name] = placeLabels([ringAt(200, 300, 40), { point: { x: 200, y: 215 }, label, rank: 3, keep: false }], frame, [], 9, 8, 6)
    expect(name.shown).toBe(true)
    expect(intersects(rectOf(ring), rectOf(name))).toBe(false)
  })
  it("keeps every other name off a ring's disc, so no site's name reads as the night's", () => {
    // A site in the ring: its name would go just under its art, inside the disc. Only outside the disc will do.
    const site = { point: { x: 200, y: 300 }, label, rank: 2, keep: false, gap: 12, mark: 10 }
    const [, name] = placeLabels([ringAt(200, 300, 40), site], frame, [], 9, 8, 6)
    // Its mark sits mid-disc: every spot beside it lies inside the disc, so it hides.
    expect(name.shown).toBe(false)
    // A name beside the ring still shows, clear of the disc (the nearest point of its box is 40 or more away).
    const [, beside] = placeLabels([ringAt(200, 300, 40), { point: { x: 250, y: 300 }, label, rank: 3, keep: false }], frame, [], 9, 8, 6)
    expect(beside.shown).toBe(true)
    const nearestX = Math.max(beside.x, Math.min(200, beside.x + label.w))
    const nearestY = Math.max(beside.y, Math.min(300, beside.y + label.h))
    expect(Math.hypot(nearestX - 200, nearestY - 300)).toBeGreaterThanOrEqual(40)
  })
  it("never lies over another mark's art, not even its edge: the name moves, or hides", () => {
    const point = { x: 200, y: 300 }
    // A pill down to y 290 leaves only the spots below the point. Two sites' art either side reaches 4px into
    // "below" and across one lower diagonal each: every spot touches art, so the name hides.
    const band = { w: 400, h: 800, top: 290 }
    const left = { x0: 104, y0: 309, x1: 164, y1: 369 }
    const right = { x0: 236, y0: 309, x1: 296, y1: 369 }
    const [hidden] = placeLabels([{ point, label, rank: 3, keep: false }], band, [left, right], 9, 8, 6)
    expect(hidden.shown).toBe(false)
    // Without the art on the left, the lower-left diagonal is free, and the name goes there.
    const [moved] = placeLabels([{ point, label, rank: 3, keep: false }], band, [right], 9, 8, 6)
    expect(moved.shown).toBe(true)
    expect(moved.x).toBeCloseTo(113.7, 6)
    expect(moved.y).toBeCloseTo(306.3, 6)
  })
  it("lies over the edge of its own art, hugging the art's real footprint rather than a square", () => {
    // A low, wide sprite (a township): 80 wide but only 36 tall, so its name tucks just under the sprite, 2px into it.
    const own = { x0: 160, y0: 282, x1: 240, y1: 318 }
    const [name] = placeLabels([{ point: { x: 200, y: 300 }, label, rank: 2, keep: false, box: own, body: [own], gap: -2 }], frame, [], 9, 8, 6)
    expect(name).toMatchObject({ x: 160, y: 316, shown: true })
  })
  it('never covers its own element badge: where the tuck under its art would, it moves, tucked elsewhere or clear of the whole mark', () => {
    // A township's sprite (80 x 36) with its badge in the lower-right corner of its 80px square, reaching below it.
    const sprite = { x0: 160, y0: 282, x1: 240, y1: 318 }
    const badge = { x0: 208, y0: 308, x1: 240, y1: 340 }
    const box = { x0: 160, y0: 282, x1: 240, y1: 340 }
    const heart = { ...sprite, y0: sprite.y0 + 6, y1: sprite.y1 - 6 }
    const [name] = placeLabels([{ point: { x: 200, y: 300 }, label, rank: 2, keep: false, box, body: [sprite, badge], own: [heart, badge], gap: -6 }], frame, [], 9, 8, 6)
    expect(name.shown).toBe(true)
    expect(intersects(rectOf(name), badge)).toBe(false)
    expect(intersects(rectOf(name), heart)).toBe(false)
    // Below, the tuck would cover the badge; above, tucked over the top of the sprite, is clear of both.
    expect(name).toMatchObject({ x: 160, y: 258 })
    // With the top and both sides taken, the spot below comes back, 1px clear of the whole mark.
    const taken = [{ x0: 150, y0: 240, x1: 250, y1: 280 }, { x0: 241, y0: 250, x1: 400, y1: 340 }, { x0: 0, y0: 250, x1: 159, y1: 340 }]
    expect(placeLabel({ x: 200, y: 300 }, label, frame, [...taken, heart, badge], -6, 8, 0, false, [], box)).toEqual({ x: 160, y: 341, clear: true, own: true })
  })
  it('tucks over the top or bottom of its own art, never its sides', () => {
    const sprite = { x0: 170, y0: 270, x1: 230, y1: 330 }
    const heart = { ...sprite, y0: 280, y1: 320 }
    // Below and above are taken: the name goes beside the art, 1px clear of it, not tucked into it.
    const taken = [{ x0: 150, y0: 322, x1: 250, y1: 360 }, { x0: 150, y0: 240, x1: 250, y1: 278 }]
    expect(placeLabel({ x: 200, y: 300 }, label, frame, [...taken, heart], -10, 8, 0, false, [], sprite)).toEqual({ x: 231, y: 285, clear: true, own: true })
  })
  it('keeps at least 4px between names of different marks, above and below as well as side by side', () => {
    // A's name goes below its point (309 to 339). B's spot below is taken, and its spot above would sit 2px under A's.
    const a = { point: { x: 200, y: 300 }, label, rank: 2, keep: false }
    const b = { point: { x: 200, y: 380 }, label, rank: 2, keep: false }
    const [first, second] = placeLabels([a, b], frame, [], 9, 8, 6, [{ x0: 150, y0: 388, x1: 250, y1: 430 }])
    expect(first.shown && second.shown).toBe(true)
    const gapX = Math.max(second.x - (first.x + label.w), first.x - (second.x + label.w))
    const gapY = Math.max(second.y - (first.y + label.h), first.y - (second.y + label.h))
    expect(Math.max(gapX, gapY)).toBeGreaterThanOrEqual(4)
  })
  it('keeps half a line between names of different marks stacked one above the other, so they never read as one name', () => {
    // A's name goes below its point (309 to 339). B's spot below is taken, and its spot above would sit 5px under
    // A's: clear of the 4px pad, but on a 15px line, as close as the lines of one wrapped name.
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
    // Side by side, names still need only the 4px pad.
    const [c, d] = placeLabels([a, { ...b, point: { x: 284, y: 300 } }], frame, [], 9, 8, 6, [], 15)
    expect(d).toMatchObject({ x: 244, y: 309, shown: true })
    expect(d.x - (c.x + label.w)).toBe(4)
  })
  it("on a phone, writes a crest's name on two narrow lines directly under it when the one-line name fits nowhere", () => {
    const crestAt = { point: { x: 200, y: 300 }, label: { w: 100, h: 13 }, rank: 3, keep: false, mark: 12, box: { x0: 188, y0: 288, x1: 212, y1: 312 }, gap: 1 }
    // Art all round the crest, but for a 40px gap straight under it.
    const art = [
      { x0: 100, y0: 200, x1: 300, y1: 287 }, { x0: 213, y0: 250, x1: 400, y1: 312 }, { x0: 0, y0: 250, x1: 187, y1: 312 },
      { x0: 221, y0: 313, x1: 400, y1: 400 }, { x0: 0, y0: 313, x1: 179, y1: 400 },
    ]
    const [bare] = placeLabels([crestAt], frame, art, 9, 8, 6)
    expect(bare.shown).toBe(false)
    const [wrapped] = placeLabels([{ ...crestAt, wrap: { w: 40, h: 26 } }], frame, art, 9, 8, 6)
    expect(wrapped).toEqual({ x: 180, y: 313, shown: true, wrapped: true })
    // Only there: with that gap taken as well, it stays bare rather than wrap anywhere else.
    const [none] = placeLabels([{ ...crestAt, wrap: { w: 40, h: 26 } }], frame, [...art, { x0: 190, y0: 330, x1: 210, y1: 345 }], 9, 8, 6)
    expect(none.shown).toBe(false)
  })
  it('tries all eight spots round its mark before giving up: with below, above and both sides taken, a diagonal', () => {
    const block = (x0: number, y0: number, x1: number, y1: number) => ({ x0, y0, x1, y1 })
    // Names placed before fill the four straight spots, leaving the diagonals free.
    const taken = [block(195, 315, 205, 335), block(195, 265, 205, 285), block(215, 295, 235, 305), block(165, 295, 185, 305)]
    expect(placeLabel({ x: 200, y: 300 }, label, frame, taken, 9, 8, 6)).toEqual({ x: 206.3, y: 306.3, clear: true, own: true })
  })
  it('reaches the eighth spot, the upper-left diagonal, when the other seven are taken', () => {
    const dot = (x: number, y: number) => ({ x0: x - 1, y0: y - 1, x1: x + 1, y1: y + 1 })
    // One small block in the middle of each of the first seven spots: below, above, right, left, and three diagonals.
    const taken = [dot(200, 324), dot(200, 276), dot(249, 300), dot(151, 300), dot(246, 321), dot(154, 321), dot(246, 279)]
    const spot = placeLabel({ x: 200, y: 300 }, label, frame, taken, 9, 8, 6)
    expect(spot).toMatchObject({ clear: true, own: true })
    expect(spot.x).toBeCloseTo(113.7, 6)
    expect(spot.y).toBeCloseTo(263.7, 6)
  })
  it("reserves a night's name and ring no wider than drawn: its caption plus the 4px pad, and the disc's circle, not its square", () => {
    // The caption sits above the ring at 160..240 x 228..258. A name whose spot below its point starts 4px right of it shows there.
    const [, beside] = placeLabels([ringAt(200, 300, 40), { point: { x: 284, y: 221 }, label, rank: 3, keep: false }], frame, [], 9, 8, 6)
    expect(beside).toMatchObject({ x: 244, y: 230, shown: true })
    // A name in the corner of the disc's square but outside its circle keeps its first spot too.
    const [, corner] = placeLabels([ringAt(200, 300, 40), { point: { x: 272, y: 323 }, label, rank: 3, keep: false }], frame, [], 9, 8, 6)
    expect(corner).toMatchObject({ x: 232, y: 332, shown: true })
  })
  it('never lets a name lie over another name, even a little, on a crowded map', () => {
    // A fixed pseudo-random crowd of 80 marks among 40 art boxes, as on a busy phone map.
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
  // The fitted map is about 574px wide on an iPhone 15 and 1209px on a 1440x900 desktop. Marks are sized to the
  // map as drawn, not to fixed px: the user found them tiny, and our map is drawn wider than the reference's.
  const share = (kind: Parameters<typeof markSize>[0], width: number) => markSize(kind, width) / width
  it('draws structure art at about 8% of the map width at the fitted zoom, phone and desktop', () => {
    expect(share('art', 574)).toBeCloseTo(0.08, 3)
    expect(share('art', 1209)).toBeCloseTo(0.08, 3)
  })
  it('scales crests and rings in proportion with the art', () => {
    const ratio = (kind: Parameters<typeof markSize>[0]) => markSize(kind, 1209) / markSize('art', 1209)
    expect(ratio('icon')).toBeCloseTo(0.45, 1)
    expect(ratio('ring')).toBeCloseTo(1.38, 1)
  })
  // The finder's map, fitted as MapView fits it: the whole island, across a phone's width (393), and in a desktop's
  // map area (1080 x 900 under a 60px pill).
  const fitted = (earth: 'default' | 'great-hollow') => {
    const island = catalog.islandOf(earth)
    const w = (island.x1 - island.x0) / 1000
    const h = (island.y1 - island.y0) / 1000
    return { phone: 393 / w, desktop: Math.min(1080 / w, (900 - 60) / h) }
  }
  it('draws the unknown-site glow as large as the two nearest sites allow, below its old size on phone and desktop', () => {
    const { phone, desktop } = fitted('default')
    const spacing = minSpacing(Object.values(catalog.slotsOf('default')))
    // Framed on the whole island, a phone's map is about 476px wide, and the two nearest sites leave the glow 15px
    // (half its old 30); desktop's old 63px disc drops to about 31px the same way.
    expect(orbSize(phone, spacing)).toBeCloseTo((spacing * phone) / 1000 - 0.5, 5)
    expect(orbSize(phone, spacing)).toBeGreaterThan(14)
    expect(orbSize(desktop, spacing)).toBeGreaterThan(28)
    expect(orbSize(desktop, spacing) / 63).toBeLessThanOrEqual(0.7)
  })
  it('never lets two orbs overlap at the default zoom, on either map, phone or desktop', () => {
    for (const earth of ['default', 'great-hollow'] as const) {
      const slots = Object.values(catalog.slotsOf(earth))
      const spacing = minSpacing(slots)
      for (const width of Object.values(fitted(earth))) {
        const disc = orbSize(width, spacing)
        for (const a of slots) for (const b of slots) {
          if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y) * (width / 1000), `${earth} at ${width}`).toBeGreaterThanOrEqual(disc)
        }
      }
    }
  })
  it('keeps a phone ring no smaller than 64 and a crest no smaller than 26', () => {
    expect(markSize('ring', 574)).toBe(64)
    expect(markSize('icon', 574)).toBe(26)
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
    // On screen, but so near the right edge that every spot would be clamped far from the point.
    const [name] = placeLabels([{ point: { x: 398, y: 300 }, label: { w: 150, h: 30 }, rank: 2, keep: false, mark: 30, gap: 34 }], frame, [], 9, 8, 6)
    expect(name.shown).toBe(false)
  })
  it("counts a long name beside its crest as the crest's when it touches it and keeps 10px clear of every other mark", () => {
    const crest = { x0: 188, y0: 288, x1: 212, y1: 312 }
    const wide = { w: 120, h: 16 }
    const taken = [{ x0: 150, y0: 315, x1: 250, y1: 330 }, { x0: 150, y0: 270, x1: 250, y1: 285 }]
    // Right of the crest, the name's middle lies nearer a mark below its far end, but its edge is 20px from that mark.
    const far = { x0: 288, y0: 328, x1: 312, y1: 352 }
    expect(placeLabel({ x: 200, y: 300 }, wide, frame, [...taken, far], 1, 8, 12, false, [far], crest)).toEqual({ x: 213, y: 292, clear: true, own: true })
    // 2px from it, the name would read as that mark's: it goes to the crest's other side.
    const near = { x0: 288, y0: 310, x1: 312, y1: 334 }
    expect(placeLabel({ x: 200, y: 300 }, wide, frame, [...taken, near], 1, 8, 12, false, [near], crest)).toEqual({ x: 67, y: 292, clear: true, own: true })
  })
  it("never puts a name nearer another mark's point than its own", () => {
    // Below the site at (200, 300) is free of every box, but its centre would sit right on a nameless point
    // mark at (200, 345), such as a chest whose icon covers nothing there.
    const site = { point: { x: 200, y: 300 }, label, rank: 2, keep: false, gap: 34, mark: 20 }
    const chest = { point: { x: 200, y: 345 }, label: { w: 0, h: 0 }, rank: 5, keep: false, mark: 0 }
    const [name] = placeLabels([site, chest], frame, [], 9, 8, 6)
    expect(name.shown).toBe(true)
    const centre = { x: name.x + label.w / 2, y: name.y + label.h / 2 }
    const own = Math.hypot(centre.x - 200, centre.y - 300)
    expect(Math.hypot(centre.x - 200, centre.y - 345)).toBeGreaterThanOrEqual(own)
  })
  it('hides a name whose every free spot is nearer another mark', () => {
    // A crest boxed in by four other crests close around it: any spot for its name is nearer a neighbour.
    const at = (x: number, y: number) => ({ point: { x, y }, label, rank: 3, keep: false, mark: 5, gap: 7 })
    const [middle] = placeLabels([at(200, 300), at(200, 270), at(200, 330), at(170, 300), at(230, 300)], frame, [], 9, 8, 6)
    expect(middle.shown).toBe(false)
  })
})

describe('night boss names on the ring', () => {
  it('keeps the lead boss of a named pair, as the game map does', () => {
    expect(shortBossName('Demi-Human Queen and Swordmaster')).toBe('Demi-Human Queen')
    expect(shortBossName('Tree Sentinel and Royal Cavalrymen')).toBe('Tree Sentinel')
    // Names already written short keep both halves.
    expect(shortBossName('DBW & Curseblade')).toBe('DBW & Curseblade')
    expect(shortBossName('Tree Sentinel')).toBe('Tree Sentinel')
    // One line on a phone: a name too long for it by its short name.
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
  it('sizes a low sprite by its width and a tall one by its height, with the badge in the box corner', () => {
    // A township (0.44) and a sorcerer's rise (2.06), each drawn in an 80px box about (100, 100).
    expect(artFootprint({ x: 100, y: 100 }, 80, 0.44, true)).toEqual([
      { x0: 60, y0: 82.4, x1: 140, y1: 117.6 },
      { x0: 108, y0: 108, x1: 140, y1: 140 },
    ])
    const [rise] = artFootprint({ x: 100, y: 100 }, 80, 2.0, false)
    expect(rise).toEqual({ x0: 80, y0: 60, x1: 120, y1: 140 })
  })
})
